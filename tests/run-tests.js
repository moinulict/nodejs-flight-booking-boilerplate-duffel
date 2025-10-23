#!/usr/bin/env node
/**
 * Flight Booking Test Runner
 * Easy CLI interface for running flight booking tests
 */

const FlightBookingTestSuite = require('./test-suite');

async function main() {
    const args = process.argv.slice(2);
    
    // Help message
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🧪 Flight Booking Test Runner

Usage:
  node run-tests.js                    # Run all tests
  node run-tests.js all                # Run all tests  
  node run-tests.js search             # Test flight search only
  node run-tests.js summary            # Test booking summary only
  node run-tests.js booking            # Test external backend booking only
  node run-tests.js details            # Test booking details check only
  node run-tests.js duffel             # Test Duffel validation only
  node run-tests.js --help             # Show this help

Examples:
  node run-tests.js                    # Full test suite
  node run-tests.js search             # Quick search test
  node run-tests.js booking            # Test booking API
        `.trim());
        return;
    }
    
    const testSuite = new FlightBookingTestSuite();
    
    if (args.length === 0 || args[0] === 'all') {
        // Run all tests
        const success = await testSuite.runAllTests();
        process.exit(success ? 0 : 1);
    } else {
        // Run specific test
        const testName = args[0];
        const success = await testSuite.runSpecificTest(testName);
        process.exit(success ? 0 : 1);
    }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

main().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
});