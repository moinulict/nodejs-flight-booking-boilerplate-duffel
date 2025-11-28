const axios = require('axios');

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

module.exports = {
  duffelAPI,
  DUFFEL_API_BASE,
  API_TOKEN,
  stripe,
  STRIPE_PUBLISHABLE_KEY,
  EXTERNAL_API_BASE
};
