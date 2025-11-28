const express = require('express');
const axios = require('axios');
const { EXTERNAL_API_BASE } = require('../config/api');

const router = express.Router();

// Proxy endpoint for login to avoid CORS issues
router.post('/login', async (req, res) => {
  try {
    const loginUrl = `${EXTERNAL_API_BASE}/v1/auth/login`;
    console.log('🌐 CALLING API:', loginUrl);
    console.log('📤 LOGIN REQUEST:', { email: req.body.email, password: '[HIDDEN]' });
    
    const response = await axios.post(loginUrl, {
      email: req.body.email,
      password: req.body.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 LOGIN RESPONSE:', JSON.stringify(response.data, null, 2));
    
    res.json(response.data);
    
  } catch (error) {
    console.log('❌ LOGIN ERROR:', error.response?.data || error.message);
    
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

// Registration API proxy for debugging
router.post('/register-with-otp', async (req, res) => {
  console.log('\n=== REGISTRATION API CALL (SERVER SIDE) ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('API URL:', `${EXTERNAL_API_BASE}/v1/auth/register-with-otp`);
  console.log('Request Headers:', {
    'Content-Type': req.headers['content-type'],
    'User-Agent': req.headers['user-agent'],
    'Origin': req.headers.origin
  });
  console.log('Request Body (Payload):', JSON.stringify(req.body, null, 2));
  console.log('==========================================');

  try {
    const response = await axios.post(`${EXTERNAL_API_BASE}/v1/auth/register-with-otp`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    console.log('\n=== REGISTRATION API RESPONSE (SERVER SIDE) ===');
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));
    console.log('===============================================\n');

    res.json(response.data);

  } catch (error) {
    console.log('\n=== REGISTRATION API ERROR (SERVER SIDE) ===');
    console.log('Error Status:', error.response?.status);
    console.log('Error Headers:', error.response?.headers);
    console.log('Error Response Body:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Message:', error.message);
    console.log('============================================\n');

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        status: 'false',
        message: 'Network error occurred',
        error: error.message 
      });
    }
  }
});

module.exports = router;
