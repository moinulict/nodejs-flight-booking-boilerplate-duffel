const express = require('express');
const { duffelAPI } = require('../config/api');

const router = express.Router();

// Search flights
router.post('/search-flights', async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = req.body;
    
    const searchParams = {
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

    // Add return slice if return date is provided
    if (returnDate) {
      searchParams.data.slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate
      });
    }

    console.log('Search params:', JSON.stringify(searchParams, null, 2));

    // Create offer request using the correct v2 endpoint
    console.log('📤 Creating offer request...');
    const response = await duffelAPI.post('/air/offer_requests', searchParams);
    
    console.log('Offer request created:', response.data.data.id);
    
    // Get offers using the correct v2 endpoint
    console.log('📥 Fetching offers...');
    const offersResponse = await duffelAPI.get(`/air/offers?offer_request_id=${response.data.data.id}`);
    
    console.log(`✅ Found ${offersResponse.data.data.length} offers`);
    
    res.json({
      success: true,
      request_id: response.data.data.id,
      data: offersResponse.data.data
    });
  } catch (error) {
    console.error('Flight search error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search flights',
      details: error.response?.data || error.message 
    });
  }
});

// Create order (booking)
router.post('/book-flight', async (req, res) => {
  try {
    console.log('🚀 ===== DUFFEL BOOKING STARTED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', req.url);
    console.log('📍 Request method:', req.method);
    
    const { offer_id, passengers, total_amount, total_currency } = req.body;
    
    console.log('🎫 Booking request details:', {
      offer_id,
      passenger_count: passengers?.length || 0,
      total_amount,
      total_currency
    });
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    // Log passengers for debugging
    console.log('👥 Passengers data:', JSON.stringify(passengers, null, 2));
    
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
  } catch (error) {
    console.error('💥 ===== DUFFEL BOOKING ERROR =====');
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
