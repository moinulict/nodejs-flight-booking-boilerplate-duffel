const express = require('express');
const { stripe, STRIPE_PUBLISHABLE_KEY } = require('../config/api');
const { duffelAPI } = require('../config/api');

const router = express.Router();

// Create payment intent for flight booking
router.post('/create-payment-intent', async (req, res) => {
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
router.post('/confirm-payment-and-book', async (req, res) => {
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
router.get('/payment-status/:payment_intent_id', async (req, res) => {
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

module.exports = router;
