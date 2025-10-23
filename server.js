const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load local airports data
let localAirports = [];
try {
  const airportsData = fs.readFileSync(path.join(__dirname, 'airports.json'), 'utf8');
  localAirports = JSON.parse(airportsData).airports;
  console.log(`📍 Loaded ${localAirports.length} airports from local database`);
} catch (error) {
  console.error('❌ Failed to load local airports data:', error.message);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  // Only log API requests to avoid clutter from static files
  if (req.url.startsWith('/api/')) {
    console.log('🌐 ===== INCOMING API REQUEST =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📍 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    console.log('🏁 ===== REQUEST DETAILS END =====');
  }
  next();
});

// Duffel API configuration
const DUFFEL_API_BASE = 'https://api.duffel.com';
const API_TOKEN = process.env.DUFFEL_API_TOKEN;

const duffelAPI = axios.create({
  baseURL: DUFFEL_API_BASE,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'Duffel-Version': 'v2',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip'
  }
});

// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// External API configuration
const EXTERNAL_API_BASE = process.env.API_BASE_URL || 'https://api.tripzip.ai';

// Create TripZip booking endpoint
app.post('/api/create-tripzip-booking', async (req, res) => {
  try {
    const { passengers, flightDetails, amount, currency, offer_id } = req.body;
    
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
      provider_data: {
        passengers: passengers,
        flightDetails: flightDetails,
        amount: amount,
        currency: currency,
        offer_id: offer_id
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
app.get('/api/check-booking-status/:bookingId', async (req, res) => {
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

// Proxy endpoint for login to avoid CORS issues
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Proxying login request:', req.body.email);
    
    const response = await axios.post(`${EXTERNAL_API_BASE}/v1/auth/login`, {
      email: req.body.email,
      password: req.body.password
    });
    
    console.log('✅ Login successful:', response.data.data?.user?.email);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Login proxy error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: 'false',
        message: 'Network error: Unable to connect to authentication service'
      });
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Flights page
app.get('/flights', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Forgot password page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Booking summary page
app.get('/booking-summary', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking-summary.html'));
});

// Payment success page
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

// Payment cancel page
app.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

// Dashboard routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

// Dashboard sub-routes (for future sections)
app.get('/dashboard/:section', (req, res) => {
  const section = req.params.section;
  const allowedSections = ['travellers', 'bookings', 'change-password', 'support'];
  
  if (allowedSections.includes(section)) {
    const filePath = path.join(__dirname, 'public', 'dashboard', `${section}.html`);
    
    // Check if file exists, otherwise serve main dashboard
    if (require('fs').existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
    }
  } else {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
  }
});

// Search places (airports only) - Local fallback implementation
app.get('/api/places', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ data: [] });
    }

    const searchQuery = query.trim().toLowerCase();
    
    // Filter to only show airports (not cities)
    const matchedPlaces = localAirports.filter(place => {
      // Only include airports, exclude cities
      if (place.type !== 'airport') {
        return false;
      }
      
      const nameMatch = place.name.toLowerCase().includes(searchQuery);
      const cityMatch = place.city.toLowerCase().includes(searchQuery);
      const countryMatch = place.country.toLowerCase().includes(searchQuery);
      const codeMatch = place.iata_code.toLowerCase().includes(searchQuery);
      
      return nameMatch || cityMatch || countryMatch || codeMatch;
    });

    // Sort results: exact matches first, then alphabetically
    const sortedPlaces = matchedPlaces.sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      const aCityLower = a.city.toLowerCase();
      const bCityLower = b.city.toLowerCase();
      
      // Check for exact matches
      const aExact = aNameLower === searchQuery || a.iata_code.toLowerCase() === searchQuery || aCityLower === searchQuery;
      const bExact = bNameLower === searchQuery || b.iata_code.toLowerCase() === searchQuery || bCityLower === searchQuery;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Alphabetical order by airport name
      return a.name.localeCompare(b.name);
    });
    
    console.log(`🔍 Airport search query: "${query}" - Found ${sortedPlaces.length} airports`);
    res.json({ data: sortedPlaces.slice(0, 10) }); // Limit to 10 results
    
  } catch (error) {
    console.error('Places search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search places',
      details: error.message 
    });
  }
});

// Search flights
app.post('/api/search-flights', async (req, res) => {
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
app.post('/api/book-flight', async (req, res) => {
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
    console.log('🎯 Target URL:', `${DUFFEL_API_BASE}/air/orders`);
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
app.get('/api/order/:orderId', async (req, res) => {
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

// Stripe Payment Endpoints

// Create payment intent for flight booking
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { offer_id, amount, currency, passengers, flightDetails } = req.body;
    
    console.log('💳 Creating payment intent:', {
      offer_id,
      amount,
      currency,
      passengers: passengers.length
    });
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        offer_id: offer_id,
        passenger_count: passengers.length,
        flight_route: flightDetails?.route || 'Unknown',
        booking_type: 'flight_booking'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
    
  } catch (error) {
    console.error('❌ Payment intent creation failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Confirm payment and process booking
app.post('/api/confirm-payment-and-book', async (req, res) => {
  try {
    const { payment_intent_id, offer_id, passengers, total_amount, total_currency } = req.body;
    
    console.log('✅ Processing payment confirmation and booking:', {
      payment_intent_id,
      offer_id,
      passenger_count: passengers.length
    });
    
    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        payment_status: paymentIntent.status
      });
    }
    
    // Payment successful, now book with Duffel
    const bookingData = {
      data: {
        selected_offers: [offer_id],
        passengers: passengers,
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

    console.log('📤 Creating Duffel booking after successful payment...');
    const duffelResponse = await duffelAPI.post('/air/orders', bookingData);
    
    console.log('✅ Duffel booking successful:', duffelResponse.data.data.id);
    
    // Return both payment and booking information
    res.json({
      success: true,
      payment_intent_id: payment_intent_id,
      payment_status: paymentIntent.status,
      booking_data: duffelResponse.data,
      message: 'Payment processed and flight booked successfully'
    });
    
  } catch (error) {
    console.error('❌ Payment confirmation or booking failed:', error);
    
    // If Duffel booking failed but payment succeeded, we need to handle this
    if (error.response?.data) {
      console.error('❌ Duffel booking error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process booking after payment',
      details: error.response?.data || error.message 
    });
  }
});

// Get payment details
app.get('/api/payment-status/:payment_intent_id', async (req, res) => {
  try {
    const { payment_intent_id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    res.json({
      success: true,
      payment_status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      metadata: paymentIntent.metadata
    });
    
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check payment status',
      details: error.message 
    });
  }
});

// Bookings API endpoints
app.get('/v1/bookings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.split(' ')[1];
    const userEmail = getUserEmailFromToken(token); // You'll need to implement this

    // For now, we'll simulate fetching bookings from a database
    // In a real application, you would fetch from your database based on userEmail
    const mockBookings = await getBookingsForUser(userEmail);

    res.json({
      success: true,
      data: mockBookings
    });

  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

// Get specific booking details
app.get('/v1/bookings/:bookingId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const { bookingId } = req.params;
    const token = authHeader.split(' ')[1];
    const userEmail = getUserEmailFromToken(token);

    // Fetch specific booking details
    const booking = await getBookingById(bookingId, userEmail);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Failed to fetch booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      details: error.message
    });
  }
});

// Cancel booking
app.delete('/v1/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const { bookingId } = req.params;
    const token = authHeader.split(' ')[1];
    const userEmail = getUserEmailFromToken(token);

    // In a real app, you would cancel with Duffel API
    // For now, we'll just update the local booking status
    const result = await cancelBooking(bookingId, userEmail);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to cancel booking'
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Failed to cancel booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      details: error.message
    });
  }
});

// Download ticket
app.get('/v1/bookings/:bookingId/ticket', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const { bookingId } = req.params;
    const token = authHeader.split(' ')[1];
    const userEmail = getUserEmailFromToken(token);

    // In a real app, you would generate or fetch the ticket PDF
    // For now, we'll return a simple response
    res.json({
      success: true,
      message: 'Ticket download functionality will be implemented with PDF generation'
    });

  } catch (error) {
    console.error('Failed to generate ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ticket',
      details: error.message
    });
  }
});

// Helper functions for booking management
function getUserEmailFromToken(token) {
  // In a real app, you would decode the JWT token to get user info
  // For now, we'll return a mock email
  return 'user@example.com';
}

async function getBookingsForUser(userEmail) {
  // In a real app, this would fetch from your database
  // For now, return mock data
  return [
    {
      id: 'booking_001',
      booking_reference: 'ABC123',
      status: 'confirmed',
      departure_city: 'New York',
      arrival_city: 'London',
      departure_date: '2024-02-15',
      departure_time: '14:30',
      arrival_date: '2024-02-16',
      arrival_time: '02:45',
      departure_airport: 'JFK',
      arrival_airport: 'LHR',
      airline: 'British Airways',
      flight_number: 'BA115',
      duration: '7h 15m',
      total_amount: 850.00,
      currency: 'USD',
      passengers: [
        {
          first_name: 'John',
          last_name: 'Doe',
          type: 'adult',
          seat_number: '12A'
        }
      ],
      created_at: '2024-01-20T10:30:00Z'
    },
    {
      id: 'booking_002',
      booking_reference: 'XYZ789',
      status: 'pending',
      departure_city: 'Los Angeles',
      arrival_city: 'Tokyo',
      departure_date: '2024-03-10',
      departure_time: '11:20',
      arrival_date: '2024-03-11',
      arrival_time: '16:35',
      departure_airport: 'LAX',
      arrival_airport: 'NRT',
      airline: 'All Nippon Airways',
      flight_number: 'NH175',
      duration: '11h 15m',
      total_amount: 1250.00,
      currency: 'USD',
      passengers: [
        {
          first_name: 'Jane',
          last_name: 'Smith',
          type: 'adult',
          seat_number: '8C'
        }
      ],
      created_at: '2024-01-25T15:45:00Z'
    }
  ];
}

async function getBookingById(bookingId, userEmail) {
  const bookings = await getBookingsForUser(userEmail);
  return bookings.find(booking => booking.id === bookingId) || null;
}

async function cancelBooking(bookingId, userEmail) {
  // In a real app, you would:
  // 1. Check if booking exists and belongs to user
  // 2. Check if booking is cancellable
  // 3. Call Duffel API to cancel the order
  // 4. Update booking status in database
  
  const booking = await getBookingById(bookingId, userEmail);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Only confirmed bookings can be cancelled' };
  }

  // Mock cancellation logic
  return { success: true };
}

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.tripzip.ai',
    environment: process.env.NODE_ENV || 'development',
    stripe_publishable_key: STRIPE_PUBLISHABLE_KEY
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.1'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Soft Flight Booking running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Token configured: ${API_TOKEN ? 'Yes' : 'No'}`);
});