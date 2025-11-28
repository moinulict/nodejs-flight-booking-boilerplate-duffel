const express = require('express');
const { STRIPE_PUBLISHABLE_KEY, EXTERNAL_API_BASE } = require('../config/api');

const router = express.Router();

// Config endpoint for frontend
router.get('/config', (req, res) => {
  res.json({
    apiBaseUrl: EXTERNAL_API_BASE,
    environment: process.env.NODE_ENV || 'development',
    stripe_publishable_key: STRIPE_PUBLISHABLE_KEY,
    booking_timer_minutes: parseInt(process.env.BOOKING_TIMER_MINUTES) || 15
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.1'
  });
});

module.exports = router;
