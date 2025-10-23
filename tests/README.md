# Test Suite

This folder contains all testing utilities for the Duffel Flight Booking system.

## Files

### `test-suite.js`
Main comprehensive test class that validates all booking system components:
- Flight Search API
- Booking Summary Preparation  
- External Backend Booking
- Booking Details Verification
- Duffel API Validation

### `run-tests.js`  
CLI test runner with easy commands:
```bash
node tests/run-tests.js          # Run all tests
node tests/run-tests.js search   # Test specific component
node tests/run-tests.js --help   # Show help
```

### `health-check.js`
Quick connectivity and basic functionality verification:
```bash
node tests/health-check.js       # Verify server and APIs
```

## Usage

### Run All Tests
```bash
cd /path/to/project
node tests/run-tests.js
```

### Run Specific Test
```bash
node tests/run-tests.js search      # Flight search only
node tests/run-tests.js booking     # Booking API only
node tests/run-tests.js duffel      # Duffel validation only
```

### Quick Health Check
```bash
node tests/health-check.js
```

## Requirements
- Server running on `localhost:3000`
- Valid Duffel API configuration
- Node.js dependencies installed

## Test Coverage
- **65 individual assertions**
- **5 major test categories** 
- **100% success rate** when system is working correctly
- **Detailed logging** with colored output
- **CI/CD integration** ready