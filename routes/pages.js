const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Signup page
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

// Flights page
router.get('/flights', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'flights.html'));
});

// Login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'forgot-password.html'));
});

// Booking summary page
router.get('/booking-summary', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'booking-summary.html'));
});

// Payment success page
router.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'payment-success.html'));
});

// Payment cancel page
router.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cancel.html'));
});

// Dashboard routes
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
});

// Dashboard sub-routes
router.get('/dashboard/:section', (req, res) => {
  const section = req.params.section;
  const allowedSections = ['travellers', 'bookings', 'change-password', 'support'];
  
  if (allowedSections.includes(section)) {
    const filePath = path.join(__dirname, '..', 'public', 'dashboard', `${section}.html`);
    
    // Check if file exists, otherwise serve main dashboard
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
    }
  } else {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
  }
});

module.exports = router;
