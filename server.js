const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import middleware
const { requestLogger } = require('./middleware/logger');

// Import routes
const pagesRouter = require('./routes/pages');
const flightsRouter = require('./routes/flights');
const placesRouter = require('./routes/places');
const paymentsRouter = require('./routes/payments');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');
const systemRouter = require('./routes/system');
const countriesRouter = require('./routes/countries');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(requestLogger);

// API Routes
app.use('/api', flightsRouter);
app.use('/api', placesRouter);
app.use('/api', paymentsRouter);
app.use('/api', bookingsRouter);
app.use('/api', authRouter);
app.use('/api', systemRouter);
app.use('/api', countriesRouter);

// Legacy v1 API routes (for backward compatibility)
// Note: These routes are deprecated and will be removed in future versions
const legacyBookingsRouter = express.Router();

legacyBookingsRouter.get('/bookings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    // Forward to new API endpoint
    res.redirect(307, '/api/bookings');

  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

legacyBookingsRouter.get('/bookings/:bookingId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const { bookingId } = req.params;

    // Forward to new API endpoint
    res.redirect(307, `/api/check-booking-status/${bookingId}`);

  } catch (error) {
    console.error('Failed to fetch booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      details: error.message
    });
  }
});

legacyBookingsRouter.delete('/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    res.status(501).json({
      success: false,
      error: 'Booking cancellation is not yet implemented. Please contact support.'
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

legacyBookingsRouter.get('/bookings/:bookingId/ticket', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    res.status(501).json({
      success: false,
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

app.use('/v1', legacyBookingsRouter);

// Page Routes (must be after API routes to avoid conflicts)
app.use('/', pagesRouter);

// Health check at root level
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
  console.log(`🔑 API Token configured: ${process.env.DUFFEL_API_TOKEN ? 'Yes' : 'No'}`);
});
