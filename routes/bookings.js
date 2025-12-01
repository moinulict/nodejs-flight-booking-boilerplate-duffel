const express = require('express');
const axios = require('axios');
const { EXTERNAL_API_BASE } = require('../config/api');

const router = express.Router();

// Create TripZip booking endpoint
router.post('/create-tripzip-booking', async (req, res) => {
  try {
    const { passengers, flightDetails, amount, currency, offer_id, data_source } = req.body;
    
    // Get authorization token from request headers
    const authToken = req.headers.authorization;
    if (!authToken) {
      return res.status(401).json({
        status: 'false',
        message: 'Authorization token required. Please login first.'
      });
    }
    
    console.log('🎫 Creating TripZip booking - Request received:');
    console.log('🔑 Auth token found:', authToken ? 'Yes' : 'No');
    console.log('🔍 Data source:', data_source || 'duffel');
    console.log('📥 Incoming data:', JSON.stringify(req.body, null, 2));
    
    // Create product name and description from flight details
    const product_name = flightDetails.route || `${flightDetails.departure_city} → ${flightDetails.arrival_city}`;
    const product_description = `${product_name}, ${flightDetails.airline}`;
    
    // Convert amount to cents and ensure it's an integer
    const amount_cents = Math.ceil(amount * 100);
    console.log(`💰 Amount conversion: ${amount} ${currency} → ${amount_cents} cents`);
    
    // Build the exact payload structure as specified
    const bookingPayload = {
      amount_cents: amount_cents,
      plan_id: "",
      currency: currency.toLowerCase(),
      booking_type: "flight",
      data_source: data_source || 'duffel', // Track the data source (duffel, amadeus, etc.)
      provider_data: {
        passengers: passengers,
        flightDetails: flightDetails,
        amount: amount,
        currency: currency,
        offer_id: offer_id,
        data_source: data_source || 'duffel' // Also include in provider_data for detailed tracking
      },
      booking_details: {
        "key_0": "Test"
      },
      success_url: `${req.protocol}://${req.get('host')}/payment-success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
      product_name: product_name,
      product_description: product_description
    };

    console.log('🌐 TripZip API URL:', `${EXTERNAL_API_BASE}/v1/bookings/tripzip`);
    console.log('📤 Payload being sent to TripZip API:');
    console.log(JSON.stringify(bookingPayload, null, 2));
    console.log('🔑 Authorization header:', authToken);

    const response = await axios.post(`${EXTERNAL_API_BASE}/v1/bookings/tripzip`, bookingPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });
    
    console.log('📨 TripZip API Response Status:', response.status);
    console.log('📨 TripZip API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.booking && response.data.data.booking.id) {
      console.log('✅ TripZip booking created successfully:', response.data.data.booking.id);
    } else {
      console.log('⚠️ TripZip booking response structure unexpected');
    }
    
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ TripZip booking error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: 'false',
        message: 'Failed to create booking'
      });
    }
  }
});

// Check TripZip booking status endpoint
router.get('/check-booking-status/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('🚀 ===== BOOKING STATUS CHECK STARTED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🆔 Booking ID:', bookingId);
    console.log('🌐 Request URL:', req.url);
    console.log('📍 Request method:', req.method);
    
    // Get authorization token from request headers
    const authToken = req.headers.authorization;
    console.log('🔐 Authorization header:', authToken ? `Bearer token found (${authToken.substring(0, 20)}...)` : 'Missing');
    console.log('📋 All headers:', JSON.stringify(req.headers, null, 2));
    
    if (!authToken) {
      console.log('❌ No auth token provided - returning 401');
      return res.status(401).json({
        status: 'false',
        message: 'Authorization token required. Please login first.'
      });
    }
    
    console.log('🔍 Making request to TripZip API...');
    console.log('🎯 Target URL:', `${EXTERNAL_API_BASE}/v1/bookings/${bookingId}`);
    
    const response = await axios.get(`${EXTERNAL_API_BASE}/v1/bookings/${bookingId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });
    
    console.log('✅ TripZip API response received');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    console.log('🎫 Booking status:', response.data?.data?.status);
    console.log('🏁 ===== BOOKING STATUS CHECK COMPLETED =====');
    
    res.json(response.data);
    
  } catch (error) {
    console.error('💥 ===== BOOKING STATUS CHECK ERROR =====');
    console.error('❌ Error message:', error.message);
    console.error('📊 Error status:', error.response?.status);
    console.error('📋 Error data:', error.response?.data);
    console.error('🔍 Full error:', error);
    console.error('🏁 ===== ERROR DETAILS END =====');
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: 'false',
        message: 'Failed to check booking status'
      });
    }
  }
});

// Bookings API endpoints
router.get('/bookings', async (req, res) => {
  try {
    console.log('🌐 ===== BOOKINGS API REQUEST =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📊 Query params:', req.query);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return res.status(401).json({
        status: 'false',
        status_code: 401,
        message: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Bearer token extracted:', token.substring(0, 20) + '...');

    // Extract query parameters
    const { skip = 0, limit = 100 } = req.query;
    
    console.log('📤 Calling TripZip API for bookings...');
    console.log('🎯 API URL:', `${EXTERNAL_API_BASE}/v1/bookings`);
    console.log('📊 Parameters: skip=' + skip + ', limit=' + limit);

    const response = await axios.get(`${EXTERNAL_API_BASE}/v1/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });

    console.log('📥 TripZip API Response Status:', response.status);
    console.log('📊 TripZip API Response:', JSON.stringify(response.data, null, 2));

    // Forward the response from TripZip API
    res.json(response.data);

  } catch (error) {
    console.error('❌ Bookings API Error:', error.message);
    if (error.response) {
      console.error('❌ Error Response Status:', error.response.status);
      console.error('❌ Error Response Data:', JSON.stringify(error.response.data, null, 2));
      
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('❌ Network/Other Error:', error);
      res.status(500).json({
        status: 'false',
        status_code: 500,
        message: 'Failed to fetch bookings',
        error: error.message
      });
    }
  }
});

module.exports = router;
