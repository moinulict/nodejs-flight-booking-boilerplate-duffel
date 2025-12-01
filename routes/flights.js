const express = require('express');
const { duffelAPI, amadeusAPI, AMADEUS_API_KEY, AMADEUS_API_SECRET } = require('../config/api');
const { normalizeAllOffers, sortOffersByPrice } = require('../utils/flight-normalizer');

const router = express.Router();

// Amadeus: Get access token
async function getAmadeusAccessToken() {
  try {
    const response = await amadeusAPI.post('/v1/security/oauth2/token', 
      `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`
    );
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Amadeus token error:', error.response?.data || error.message);
    throw error;
  }
}

// Search Duffel flights
async function searchDuffelFlights(searchParams) {
  try {
    console.log('🔵 Searching Duffel...');
    const response = await duffelAPI.post('/air/offer_requests', searchParams);
    const offersResponse = await duffelAPI.get(`/air/offers?offer_request_id=${response.data.data.id}`);
    console.log(`✅ Duffel returned ${offersResponse.data.data.length} offers`);
    return offersResponse.data.data;
  } catch (error) {
    console.error('❌ Duffel search error:', error.response?.data || error.message);
    return [];
  }
}

// Search Amadeus flights
async function searchAmadeusFlights(params, accessToken) {
  try {
    console.log('🟠 Searching Amadeus...');
    console.log('🔍 Amadeus request params:', JSON.stringify(params, null, 2));
    
    const searchResponse = await amadeusAPI.get('/v2/shopping/flight-offers', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: params
    });
    
    const offers = searchResponse.data.data || [];
    console.log(`✅ Amadeus returned ${offers.length} offers`);
    
    // Log currency information from Amadeus response
    if (offers.length > 0) {
      const firstOffer = offers[0];
      const currency = firstOffer.price?.currency;
      const total = firstOffer.price?.total || firstOffer.price?.grandTotal;
      console.log(`💰 Amadeus Currency: ${currency}`);
      console.log(`💵 First offer price: ${currency} ${total}`);
      console.log(`📋 First offer price object:`, JSON.stringify(firstOffer.price, null, 2));
      
      // Check if all offers have the same currency
      const currencies = new Set(offers.map(o => o.price?.currency));
      if (currencies.size > 1) {
        console.log(`⚠️  WARNING: Multiple currencies detected:`, Array.from(currencies));
      } else {
        console.log(`✅ All ${offers.length} offers are in ${currency}`);
      }
    }
    
    return {
      offers: offers,
      dictionaries: searchResponse.data.dictionaries || {}
    };
  } catch (error) {
    console.error('❌ Amadeus search error:', error.response?.data || error.message);
    return { offers: [], dictionaries: {} };
  }
}

// TEST API: Amadeus flight search (for testing only)
router.post('/test-amadeus-search', async (req, res) => {
  try {
    console.log('\n🔵 ===== AMADEUS FLIGHT SEARCH TEST =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = req.body;
    
    // Step 1: Get access token
    console.log('🔑 Getting Amadeus access token...');
    const accessToken = await getAmadeusAccessToken();
    console.log('✅ Access token obtained');
    
    // Step 2: Search flights
    console.log('🔍 Searching flights on Amadeus...');
    
    // Build search parameters
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: passengers?.filter(p => p.type === 'adult')?.length || 1,
      travelClass: cabinClass?.toUpperCase() || 'ECONOMY',
      currencyCode: 'USD' // Force USD currency instead of EUR default
    };
    
    // Add return date if provided
    if (returnDate) {
      searchParams.returnDate = returnDate;
    }
    
    // Add children and infants if provided
    const children = passengers?.filter(p => p.type === 'child')?.length || 0;
    const infants = passengers?.filter(p => p.type === 'infant_without_seat')?.length || 0;
    
    if (children > 0) searchParams.children = children;
    if (infants > 0) searchParams.infants = infants;
    
    console.log('🔍 Search parameters:', searchParams);
    
    const searchResponse = await amadeusAPI.get('/v2/shopping/flight-offers', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: searchParams
    });
    
    console.log('✅ Amadeus API responded');
    console.log('📊 Found offers:', searchResponse.data.data?.length || 0);
    console.log('\n📦 ===== AMADEUS RESPONSE DATA =====');
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log('===== END AMADEUS RESPONSE =====\n');
    
    res.json({
      success: true,
      source: 'amadeus',
      count: searchResponse.data.data?.length || 0,
      data: searchResponse.data
    });
    
  } catch (error) {
    console.error('\n❌ ===== AMADEUS SEARCH ERROR =====');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('===== END ERROR =====\n');
    
    res.status(500).json({ 
      success: false,
      error: 'Amadeus flight search failed',
      details: error.response?.data || error.message 
    });
  }
});

// Search flights - Combined search from both Duffel and Amadeus
router.post('/search-flights', async (req, res) => {
  try {
    console.log('\n🔍 ===== MULTI-SOURCE FLIGHT SEARCH =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = req.body;
    
    console.log('📋 Search params:', { origin, destination, departureDate, returnDate, passengers: passengers?.length, cabinClass });
    
    // Prepare search parameters for both sources
    
    // 1. Duffel search parameters
    const duffelParams = {
      data: {
        slices: [
          {
            origin: origin,
            destination: destination,
            departure_date: departureDate
          }
        ],
        passengers: passengers || [{ type: 'adult' }],
        cabin_class: cabinClass || 'economy'
      }
    };

    if (returnDate) {
      duffelParams.data.slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate
      });
    }

    // 2. Amadeus search parameters
    const amadeusParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: passengers?.filter(p => p.type === 'adult')?.length || 1,
      travelClass: (cabinClass || 'economy').toUpperCase(),
      currencyCode: 'USD', // Force USD currency instead of EUR default
      max: 10 // Limit results
    };

    if (returnDate) {
      amadeusParams.returnDate = returnDate;
    }

    const children = passengers?.filter(p => p.type === 'child')?.length || 0;
    const infants = passengers?.filter(p => p.type === 'infant_without_seat')?.length || 0;
    
    if (children > 0) amadeusParams.children = children;
    if (infants > 0) amadeusParams.infants = infants;

    // Search both sources in parallel
    console.log('� Searching both sources in parallel...');
    
    const [duffelOffers, amadeusData, amadeusToken] = await Promise.all([
      searchDuffelFlights(duffelParams),
      getAmadeusAccessToken().then(token => 
        searchAmadeusFlights(amadeusParams, token).then(data => data)
      ).catch(err => {
        console.error('Amadeus search failed:', err.message);
        return { offers: [], dictionaries: {} };
      }),
      getAmadeusAccessToken().catch(() => null)
    ]);

    // Normalize and combine offers
    console.log('\n� Normalizing offers...');
    const normalizedOffers = normalizeAllOffers(
      duffelOffers,
      amadeusData.offers || [],
      amadeusData.dictionaries || {}
    );

    // Sort by price
    const sortedOffers = sortOffersByPrice(normalizedOffers);

    // Count airlines by source for detailed logging
    const duffelAirlines = new Set();
    const amadeusAirlines = new Set();
    const allAirlines = new Set();
    const airlineCounts = {};
    
    sortedOffers.forEach(offer => {
      const airline = offer.slices[0]?.segments[0]?.airline?.name || 
                     offer.slices[0]?.segments[0]?.marketing_carrier?.name || 
                     'Unknown';
      allAirlines.add(airline);
      
      // Count by airline
      if (!airlineCounts[airline]) {
        airlineCounts[airline] = { total: 0, duffel: 0, amadeus: 0 };
      }
      airlineCounts[airline].total++;
      
      if (offer.source === 'duffel') {
        duffelAirlines.add(airline);
        airlineCounts[airline].duffel++;
      } else if (offer.source === 'amadeus') {
        amadeusAirlines.add(airline);
        airlineCounts[airline].amadeus++;
      }
    });

    console.log('\n✅ ===== SEARCH COMPLETE =====');
    console.log(`📊 Total offers: ${sortedOffers.length}`);
    console.log(`   - Duffel: ${duffelOffers.length} offers`);
    console.log(`   - Amadeus: ${amadeusData.offers?.length || 0} offers`);
    console.log(`\n✈️  Unique Airlines: ${allAirlines.size} total`);
    console.log(`   - From Duffel: ${duffelAirlines.size} airlines`);
    console.log(`   - From Amadeus: ${amadeusAirlines.size} airlines`);
    console.log(`\n📋 Duffel Airlines:`, Array.from(duffelAirlines).sort().join(', ') || 'None');
    console.log(`📋 Amadeus Airlines:`, Array.from(amadeusAirlines).sort().join(', ') || 'None');
    console.log(`\n📊 Airline Breakdown:`);
    Object.entries(airlineCounts).sort((a, b) => b[1].total - a[1].total).forEach(([airline, counts]) => {
      console.log(`   ${airline}: ${counts.total} offers (Duffel: ${counts.duffel}, Amadeus: ${counts.amadeus})`);
    });
    
    if (sortedOffers.length > 0) {
      const firstOffer = sortedOffers[0];
      const lastOffer = sortedOffers[sortedOffers.length - 1];
      const minPrice = firstOffer.price?.total || firstOffer.total_amount;
      const maxPrice = lastOffer.price?.total || lastOffer.total_amount;
      const currency = firstOffer.price?.currency || firstOffer.total_currency;
      console.log(`\n💰 Price range: ${currency} ${minPrice} - ${maxPrice}`);
    }
    console.log('================================\n');
    
    res.json({
      success: true,
      sources: {
        duffel: duffelOffers.length,
        amadeus: amadeusData.offers?.length || 0
      },
      total_offers: sortedOffers.length,
      duffel_count: duffelOffers.length,
      amadeus_count: amadeusData.offers?.length || 0,
      unique_airlines: allAirlines.size,
      data: sortedOffers
    });
    
  } catch (error) {
    console.error('\n❌ Flight search error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search flights',
      details: error.response?.data || error.message 
    });
  }
});

// Create order (booking) - Supports both Duffel and Amadeus
router.post('/book-flight', async (req, res) => {
  try {
    console.log('🚀 ===== FLIGHT BOOKING STARTED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', req.url);
    console.log('📍 Request method:', req.method);
    
    const { offer_id, passengers, total_amount, total_currency, data_source } = req.body;
    
    console.log('🎫 Booking request details:', {
      offer_id,
      passenger_count: passengers?.length || 0,
      total_amount,
      total_currency,
      data_source: data_source || 'duffel'
    });
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    // Route to appropriate booking handler based on data source
    const source = data_source || 'duffel';
    
    if (source === 'amadeus') {
      // Amadeus booking flow
      console.log('🟠 ===== PROCESSING AMADEUS BOOKING =====');
      console.log('⚠️  Note: Amadeus booking requires Flight Create Orders API');
      console.log('📋 For now, returning mock success for Amadeus bookings');
      
      // TODO: Implement actual Amadeus Flight Create Orders API
      // Reference: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-create-orders
      
      const mockAmadeusBooking = {
        success: true,
        source: 'amadeus',
        data: {
          id: `amadeus_booking_${Date.now()}`,
          type: 'flight-order',
          queuingOfficeId: 'AMADEUS_OFFICE',
          associatedRecords: [{
            reference: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            creationDate: new Date().toISOString(),
            originSystemCode: 'GDS',
            flightOfferId: offer_id
          }],
          travelers: passengers.map((p, index) => ({
            id: index + 1,
            ...p
          })),
          flightOffers: [{
            type: 'flight-offer',
            id: offer_id,
            price: {
              currency: total_currency,
              total: total_amount,
              base: total_amount
            }
          }],
          ticketingAgreement: {
            option: 'CONFIRM',
            delay: '6D'
          }
        }
      };
      
      console.log('✅ Amadeus mock booking created');
      console.log('� Mock response:', JSON.stringify(mockAmadeusBooking, null, 2));
      console.log('🏁 ===== AMADEUS BOOKING COMPLETED =====');
      
      return res.json(mockAmadeusBooking);
    } else {
      // Duffel booking flow (existing code)
      console.log('🔵 ===== PROCESSING DUFFEL BOOKING =====');
      console.log('�👥 Passengers data:', JSON.stringify(passengers, null, 2));
      
      // CRITICAL: DO NOT remove passenger IDs! They are required by Duffel API
      // The IDs come from the offer request and must be preserved for booking
      console.log('✅ Using passengers with original IDs (required by Duffel):', JSON.stringify(passengers, null, 2));

      // Build booking data exactly as Duffel API expects
      const bookingData = {
        data: {
          selected_offers: [offer_id],
          passengers: passengers, // Use original passengers with their IDs
          payments: [
            {
              type: 'balance',
              currency: total_currency,
              amount: total_amount
            }
          ],
          type: 'instant'
        }
      };

      console.log('📤 Sending to Duffel API...');
      console.log('📋 Payload:', JSON.stringify(bookingData, null, 2));
      
      const response = await duffelAPI.post('/air/orders', bookingData);
      
      console.log('✅ Duffel API response received');
      console.log('📊 Response status:', response.status);
      console.log('🎫 Booking ID:', response.data?.data?.id);
      console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
      console.log('🏁 ===== DUFFEL BOOKING COMPLETED =====');
      
      res.json(response.data);
    }
  } catch (error) {
    console.error('💥 ===== BOOKING ERROR =====');
    console.error('❌ Error message:', error.message);
    console.error('📊 Error status:', error.response?.status);
    console.error('📋 Error data:', error.response?.data);
    
    // Log detailed error info
    if (error.response?.data?.errors) {
      console.error('❌ Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    
    console.error('🔍 Full error object:', error);
    console.error('🏁 ===== DUFFEL ERROR DETAILS END =====');
    
    res.status(500).json({ 
      error: 'Failed to book flight',
      details: error.response?.data || error.message 
    });
  }
});

// Get order details
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const response = await duffelAPI.get(`/air/orders/${orderId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Order fetch error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
