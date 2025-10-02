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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    const { offer_id, passengers, total_amount, total_currency } = req.body;
    
    console.log('🎫 Received booking request:', {
      offer_id,
      passenger_count: passengers.length,
      total_amount,
      total_currency
    });
    
    // Log passengers for debugging
    console.log('👥 Passengers data:', JSON.stringify(passengers, null, 2));
    
    // Build booking data exactly as Duffel API expects
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

    console.log('📤 Sending to Duffel API:', JSON.stringify(bookingData, null, 2));
    
    const response = await duffelAPI.post('/air/orders', bookingData);
    
    console.log('✅ Duffel booking successful:', response.data.data.id);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Booking error:', error.response?.data || error.message);
    
    // Log detailed error info
    if (error.response?.data?.errors) {
      console.error('❌ Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Soft Flight Booking running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Token configured: ${API_TOKEN ? 'Yes' : 'No'}`);
});