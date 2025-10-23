/**
 * Comprehensive Flight Booking Test Suite
 * Tests all steps of the Duffel flight booking flow
 */

const axios = require('axios');
const colors = require('colors'); // You might need to install: npm install colors

class FlightBookingTestSuite {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.testData = {
            search: {
                origin: 'LHR',
                destination: 'JFK',
                departureDate: '2025-11-30',
                returnDate: null,
                passengers: [{ type: 'adult' }],
                cabinClass: 'economy'
            },
            passenger: {
                title: 'mr',
                given_name: 'Moinul',
                family_name: 'Islam',
                born_on: '1987-01-01',
                email: 'a@y.com',
                phone_number: '+8801616848425',
                gender: 'm'
            }
        };
        
        // Store test results
        this.results = {
            searchResults: null,
            selectedOffer: null,
            bookingPayload: null,
            bookingResponse: null,
            orderDetails: null
        };
        
        this.stats = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Utility method to log test results
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        switch (type) {
            case 'success':
                console.log(`✅ [${timestamp}] ${message}`.green);
                break;
            case 'error':
                console.log(`❌ [${timestamp}] ${message}`.red);
                break;
            case 'info':
                console.log(`ℹ️  [${timestamp}] ${message}`.blue);
                break;
            case 'warning':
                console.log(`⚠️  [${timestamp}] ${message}`.yellow);
                break;
            case 'step':
                console.log(`\n🔹 [${timestamp}] ${message}`.cyan.bold);
                break;
        }
    }

    /**
     * Assert function for test validation
     */
    assert(condition, message, data = null) {
        this.stats.total++;
        if (condition) {
            this.log(`PASS: ${message}`, 'success');
            this.stats.passed++;
            if (data) {
                console.log(`   Data: ${JSON.stringify(data, null, 2)}`.gray);
            }
            return true;
        } else {
            this.log(`FAIL: ${message}`, 'error');
            this.stats.failed++;
            if (data) {
                console.log(`   Data: ${JSON.stringify(data, null, 2)}`.gray);
            }
            return false;
        }
    }

    /**
     * Test 1: Flight Search
     */
    async testFlightSearch() {
        this.log('Testing Flight Search API', 'step');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/search-flights`, this.testData.search);
            
            // Store results for next tests
            this.results.searchResults = response.data;
            
            // Validate response
            this.assert(response.status === 200, 'Search API returns 200 status');
            this.assert(response.data.success === true, 'Search response indicates success');
            this.assert(Array.isArray(response.data.data), 'Offers data is an array');
            this.assert(response.data.data.length > 0, 'At least one offer returned', { count: response.data.data.length });
            this.assert(response.data.request_id, 'Offer request ID provided', { id: response.data.request_id });
            
            // Validate offer structure
            const firstOffer = response.data.data[0];
            this.assert(firstOffer.id, 'First offer has ID', { id: firstOffer.id });
            this.assert(firstOffer.total_amount, 'First offer has total amount', { amount: firstOffer.total_amount });
            this.assert(firstOffer.total_currency, 'First offer has currency', { currency: firstOffer.total_currency });
            this.assert(Array.isArray(firstOffer.slices), 'Offer has slices array');
            this.assert(Array.isArray(firstOffer.passengers), 'Offer has passengers array');
            
            // Validate passenger data in offer
            const passenger = firstOffer.passengers[0];
            this.assert(passenger.id, 'Passenger has Duffel ID', { passenger_id: passenger.id });
            this.assert(passenger.type === 'adult', 'Passenger type is correct');
            
            // Select offer for next tests
            this.results.selectedOffer = firstOffer;
            
            this.log(`Flight search completed successfully. Found ${response.data.data.length} offers`, 'success');
            return true;
            
        } catch (error) {
            this.log(`Flight search failed: ${error.message}`, 'error');
            this.assert(false, 'Flight search API call succeeded');
            return false;
        }
    }

    /**
     * Test 2: Booking Summary Preparation
     */
    async testBookingSummary() {
        this.log('Testing Booking Summary Preparation', 'step');
        
        if (!this.results.selectedOffer) {
            this.log('No offer available for booking summary test', 'error');
            return false;
        }
        
        try {
            // Prepare booking payload (simulating frontend logic)
            const offer = this.results.selectedOffer;
            const passengerWithDetails = {
                ...offer.passengers[0], // Start with Duffel passenger (includes ID)
                ...this.testData.passenger  // Add personal details
            };
            
            const bookingPayload = {
                offer_id: offer.id,
                passengers: [passengerWithDetails],
                total_amount: offer.total_amount,
                total_currency: offer.total_currency
            };
            
            // Store for next tests
            this.results.bookingPayload = bookingPayload;
            
            // Validate payload structure
            this.assert(bookingPayload.offer_id, 'Booking payload has offer ID', { offer_id: bookingPayload.offer_id });
            this.assert(Array.isArray(bookingPayload.passengers), 'Passengers is array');
            this.assert(bookingPayload.passengers.length === 1, 'Correct number of passengers');
            
            const passenger = bookingPayload.passengers[0];
            this.assert(passenger.id, 'Passenger retains Duffel ID', { passenger_id: passenger.id });
            this.assert(passenger.given_name, 'Passenger has given name', { name: passenger.given_name });
            this.assert(passenger.family_name, 'Passenger has family name', { name: passenger.family_name });
            this.assert(passenger.email, 'Passenger has email', { email: passenger.email });
            this.assert(passenger.phone_number, 'Passenger has phone', { phone: passenger.phone_number });
            this.assert(passenger.born_on, 'Passenger has birth date', { born_on: passenger.born_on });
            
            this.log('Booking summary preparation completed successfully', 'success');
            return true;
            
        } catch (error) {
            this.log(`Booking summary preparation failed: ${error.message}`, 'error');
            this.assert(false, 'Booking summary preparation succeeded');
            return false;
        }
    }

    /**
     * Test 3: External Backend Booking Test
     */
    async testExternalBackendBooking() {
        this.log('Testing External Backend Booking API', 'step');
        
        if (!this.results.bookingPayload) {
            this.log('No booking payload available for backend test', 'error');
            return false;
        }
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/book-flight`, this.results.bookingPayload);
            
            // Store results
            this.results.bookingResponse = response.data;
            
            // Validate response (Duffel API response format)
            this.assert(response.status === 200, 'Backend booking API returns 200 status');
            this.assert(response.data.data, 'Response contains data object');
            this.assert(response.data.data.id, 'Booking ID returned', { booking_id: response.data.data.id });
            this.assert(response.data.data.booking_reference, 'Booking reference returned', { reference: response.data.data.booking_reference });
            
            // Validate booking data structure (direct Duffel response)
            const booking = response.data.data;
            this.assert(booking, 'Booking data object exists');
            this.assert(booking.id, 'Booking has Duffel order ID', { order_id: booking.id });
            this.assert(booking.total_amount, 'Booking has total amount', { amount: booking.total_amount });
            this.assert(booking.payment_status, 'Booking has payment status', { status: booking.payment_status });
            this.assert(Array.isArray(booking.passengers), 'Booking has passengers array');
            
            // Validate passenger in booking
            const passenger = booking.passengers[0];
            this.assert(passenger.id, 'Booked passenger has ID', { passenger_id: passenger.id });
            this.assert(passenger.given_name === this.testData.passenger.given_name, 'Passenger name matches');
            this.assert(passenger.family_name === this.testData.passenger.family_name, 'Passenger surname matches');
            
            this.log('External backend booking completed successfully', 'success');
            return true;
            
        } catch (error) {
            this.log(`External backend booking failed: ${error.message}`, 'error');
            if (error.response && error.response.data) {
                console.log('Error details:', JSON.stringify(error.response.data, null, 2));
            }
            this.assert(false, 'External backend booking API call succeeded');
            return false;
        }
    }

    /**
     * Test 4: Booking Details Checking
     */
    async testBookingDetailsCheck() {
        this.log('Testing Booking Details Verification', 'step');
        
        if (!this.results.bookingResponse) {
            this.log('No booking response available for details check', 'error');
            return false;
        }
        
        try {
            const booking = this.results.bookingResponse.data;
            
            // Verify all expected fields are present and valid
            this.assert(typeof booking.total_amount === 'string', 'Total amount is string format');
            this.assert(parseFloat(booking.total_amount) > 0, 'Total amount is positive', { amount: booking.total_amount });
            this.assert(booking.total_currency === 'USD', 'Currency is USD as expected');
            
            // Verify payment status
            this.assert(booking.payment_status && booking.payment_status.awaiting_payment === false, 'Payment completed');
            this.assert(booking.payment_status.paid_at, 'Payment timestamp exists', { paid_at: booking.payment_status.paid_at });
            
            // Verify booking references
            this.assert(Array.isArray(booking.booking_references), 'Booking references is array');
            this.assert(booking.booking_references.length > 0, 'At least one booking reference exists');
            
            const reference = booking.booking_references[0];
            this.assert(reference.booking_reference, 'Booking reference code exists', { code: reference.booking_reference });
            this.assert(reference.carrier, 'Carrier information exists', { carrier: reference.carrier.name });
            
            // Verify flight details
            this.assert(Array.isArray(booking.slices), 'Flight slices array exists');
            this.assert(booking.slices.length > 0, 'At least one flight slice exists');
            
            const slice = booking.slices[0];
            this.assert(slice.origin, 'Flight origin exists', { origin: slice.origin.iata_code });
            this.assert(slice.destination, 'Flight destination exists', { destination: slice.destination.iata_code });
            this.assert(Array.isArray(slice.segments), 'Flight segments exist');
            
            // Store order details for final test
            this.results.orderDetails = booking;
            
            this.log('Booking details verification completed successfully', 'success');
            return true;
            
        } catch (error) {
            this.log(`Booking details check failed: ${error.message}`, 'error');
            this.assert(false, 'Booking details verification succeeded');
            return false;
        }
    }

    /**
     * Test 5: Final Duffel Booking Validation
     */
    async testDuffelBookingValidation() {
        this.log('Testing Final Duffel Booking Validation', 'step');
        
        if (!this.results.orderDetails) {
            this.log('No order details available for Duffel validation', 'error');
            return false;
        }
        
        try {
            const order = this.results.orderDetails;
            
            // Validate Duffel-specific fields
            this.assert(order.id && order.id.startsWith('ord_'), 'Valid Duffel order ID format', { order_id: order.id });
            this.assert(order.live_mode === false, 'Order is in test mode (safe)');
            this.assert(order.type === 'instant', 'Order type is instant');
            this.assert(order.content === 'managed', 'Order content is managed');
            
            // Validate offer connection
            this.assert(order.offer_id, 'Order connected to original offer', { offer_id: order.offer_id });
            this.assert(order.offer_id === this.results.selectedOffer.id, 'Offer ID matches original selection');
            
            // Validate documents (tickets)
            this.assert(Array.isArray(order.documents), 'Documents array exists');
            this.assert(order.documents.length > 0, 'At least one document (ticket) exists');
            
            const ticket = order.documents[0];
            this.assert(ticket.type === 'electronic_ticket', 'Document is electronic ticket');
            this.assert(Array.isArray(ticket.passenger_ids), 'Ticket has passenger IDs');
            this.assert(ticket.passenger_ids.length === 1, 'Ticket covers correct number of passengers');
            
            // Validate passenger ID continuity
            const ticketPassengerId = ticket.passenger_ids[0];
            const orderPassengerId = order.passengers[0].id;
            const originalPassengerId = this.results.selectedOffer.passengers[0].id;
            
            this.assert(ticketPassengerId === orderPassengerId, 'Ticket passenger ID matches order passenger ID');
            this.assert(orderPassengerId === originalPassengerId, 'Order passenger ID matches original offer passenger ID');
            
            // Validate available actions
            this.assert(Array.isArray(order.available_actions), 'Available actions array exists');
            this.assert(order.available_actions.includes('cancel'), 'Booking can be cancelled');
            this.assert(order.available_actions.includes('update'), 'Booking can be updated');
            
            // Final validation - booking is complete and valid
            this.assert(order.cancelled_at === null, 'Booking is not cancelled');
            this.assert(order.synced_at, 'Booking is synced with airline', { synced_at: order.synced_at });
            
            this.log('Duffel booking validation completed successfully', 'success');
            return true;
            
        } catch (error) {
            this.log(`Duffel booking validation failed: ${error.message}`, 'error');
            this.assert(false, 'Duffel booking validation succeeded');
            return false;
        }
    }

    /**
     * Run all tests in sequence
     */
    async runAllTests() {
        console.log('\n' + '='.repeat(80).blue);
        console.log('🧪 COMPREHENSIVE FLIGHT BOOKING TEST SUITE'.blue.bold);
        console.log('='.repeat(80).blue);
        console.log(`📅 Started at: ${new Date().toISOString()}`.gray);
        console.log(`🌐 Testing against: ${this.baseUrl}`.gray);
        console.log('='.repeat(80).blue + '\n');

        const startTime = Date.now();
        let allPassed = true;

        // Run tests in sequence
        const tests = [
            { name: 'Flight Search', method: 'testFlightSearch' },
            { name: 'Booking Summary', method: 'testBookingSummary' },
            { name: 'External Backend Booking', method: 'testExternalBackendBooking' },
            { name: 'Booking Details Check', method: 'testBookingDetailsCheck' },
            { name: 'Duffel Booking Validation', method: 'testDuffelBookingValidation' }
        ];

        for (const test of tests) {
            const testPassed = await this[test.method]();
            if (!testPassed) {
                allPassed = false;
                this.log(`❌ ${test.name} test failed - stopping test suite`, 'error');
                break;
            }
            console.log(''); // Add spacing between tests
        }

        // Print final results
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(80).blue);
        console.log('📊 TEST SUITE RESULTS'.blue.bold);
        console.log('='.repeat(80).blue);
        console.log(`⏱️  Duration: ${duration}s`.gray);
        console.log(`✅ Passed: ${this.stats.passed}/${this.stats.total}`.green);
        console.log(`❌ Failed: ${this.stats.failed}/${this.stats.total}`.red);
        console.log(`📈 Success Rate: ${((this.stats.passed / this.stats.total) * 100).toFixed(1)}%`.cyan);
        
        if (allPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Flight booking system is fully functional! 🎉'.green.bold);
        } else {
            console.log('\n💥 SOME TESTS FAILED! Please check the errors above. 💥'.red.bold);
        }
        
        console.log('='.repeat(80).blue + '\n');

        return allPassed;
    }

    /**
     * Run a specific test by name
     */
    async runSpecificTest(testName) {
        const testMethods = {
            'search': 'testFlightSearch',
            'summary': 'testBookingSummary',
            'booking': 'testExternalBackendBooking',
            'details': 'testBookingDetailsCheck',
            'duffel': 'testDuffelBookingValidation'
        };

        const method = testMethods[testName.toLowerCase()];
        if (!method) {
            this.log(`Unknown test: ${testName}. Available tests: ${Object.keys(testMethods).join(', ')}`, 'error');
            return false;
        }

        console.log(`\n🧪 Running specific test: ${testName.toUpperCase()}\n`.cyan.bold);
        const result = await this[method]();
        
        console.log(`\n📊 Test Result: ${result ? 'PASSED ✅' : 'FAILED ❌'}\n`);
        return result;
    }
}

// Export for use in other files
module.exports = FlightBookingTestSuite;

// If run directly, execute all tests
if (require.main === module) {
    const testSuite = new FlightBookingTestSuite();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    if (args.length > 0 && args[0] === 'test' && args[1]) {
        // Run specific test: node test-suite.js test search
        testSuite.runSpecificTest(args[1]);
    } else {
        // Run all tests: node test-suite.js
        testSuite.runAllTests();
    }
}