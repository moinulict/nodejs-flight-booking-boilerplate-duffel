# Flight Booking Test Suite Documentation

This comprehensive test suite validates every step of the Duffel flight booking system.

## Quick Start

### Run All Tests
```bash
node tests/run-tests.js
# or
node tests/run-tests.js all
```

### Run Individual Tests
```bash
node tests/run-tests.js search      # Test flight search only
node tests/run-tests.js summary     # Test booking summary preparation
node tests/run-tests.js booking     # Test external backend booking API
node tests/run-tests.js details     # Test booking details verification  
node tests/run-tests.js duffel      # Test final Duffel validation
```

### Quick Health Check
```bash
node tests/health-check.js          # Verify server is running and APIs work
```

## Test Coverage

### 1. Flight Search Test (`search`)
**What it tests:**
- ✅ Search API endpoint functionality
- ✅ Response format validation 
- ✅ Offer structure verification
- ✅ Passenger ID generation
- ✅ Pricing and currency validation

**Key validations:**
- HTTP 200 response
- Success flag in response
- Offers array with data
- Valid offer IDs and pricing
- Passenger objects with Duffel IDs

### 2. Booking Summary Test (`summary`)  
**What it tests:**
- ✅ Payload preparation logic
- ✅ Passenger data merging
- ✅ ID preservation during transformation
- ✅ Required field validation

**Key validations:**
- Offer ID preservation
- Passenger ID continuity from search
- Personal details integration
- Complete payload structure

### 3. External Backend Booking Test (`booking`)
**What it tests:**
- ✅ Backend booking API call
- ✅ Duffel API integration
- ✅ Response processing
- ✅ Error handling

**Key validations:**
- Successful API response
- Duffel order creation
- Booking reference generation
- Payment processing
- Passenger data consistency

### 4. Booking Details Verification (`details`)
**What it tests:**
- ✅ Complete booking data structure
- ✅ Financial transaction details
- ✅ Flight information accuracy
- ✅ Airline references

**Key validations:**
- Payment status and timestamps
- Booking references and codes
- Flight slice and segment data
- Carrier information
- Pricing consistency

### 5. Duffel Booking Validation (`duffel`)
**What it tests:**
- ✅ Duffel-specific data formats
- ✅ API compliance verification
- ✅ Document (ticket) generation
- ✅ System state validation

**Key validations:**
- Valid Duffel order ID format
- Test mode safety checks
- Electronic ticket generation
- Passenger ID chain integrity
- Available booking actions
- Sync status with airlines

## Test Results

The test suite provides detailed pass/fail information:
- **Total tests:** 65 individual validations
- **Success rate:** Percentage of passed tests
- **Duration:** Total test execution time
- **Detailed logging:** Each assertion with data validation

## Example Output

```
================================================================================
🧪 COMPREHENSIVE FLIGHT BOOKING TEST SUITE
================================================================================
📅 Started at: 2025-10-23T19:59:27.311Z
🌐 Testing against: http://localhost:3000
================================================================================

🔹 Testing Flight Search API
✅ PASS: Search API returns 200 status
✅ PASS: Search response indicates success
✅ PASS: Offers data is an array
✅ PASS: At least one offer returned
   Data: { "count": 50 }

... (continuing through all tests)

================================================================================
📊 TEST SUITE RESULTS
================================================================================
⏱️  Duration: 6.40s
✅ Passed: 65/65
❌ Failed: 0/65
📈 Success Rate: 100.0%

🎉 ALL TESTS PASSED! Flight booking system is fully functional! 🎉
================================================================================
```

## Error Handling

The test suite will:
- **Stop on first failure** in full test mode
- **Show detailed error information** for debugging
- **Exit with appropriate codes** (0 = success, 1 = failure)
- **Log all API requests and responses** for troubleshooting

## Integration with Development

### Before Deployment
```bash
# Full system validation
node tests/run-tests.js

# Quick connectivity check  
node tests/health-check.js
```

### During Development
```bash
# Test specific component after changes
node tests/run-tests.js search     # After search changes
node tests/run-tests.js booking    # After booking logic changes
```

### Continuous Integration
The test suite can be integrated into CI/CD pipelines:
```bash
# In CI script
npm run dev &              # Start server in background
sleep 5                    # Wait for startup
node tests/run-tests.js    # Run tests
kill $!                    # Stop server
```

## Test Data

### Default Test Configuration
```javascript
{
  search: {
    origin: 'LHR',           // London Heathrow
    destination: 'JFK',       // New York JFK
    departureDate: '2025-11-30',
    returnDate: null,         // One-way flight
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
}
```

### Customization
Modify `tests/test-suite.js` to change:
- Test routes and airports
- Passenger details
- Date ranges
- Server endpoints

## Files Structure

```
tests/
├── test-suite.js       # Main test class with all validations
├── run-tests.js        # CLI test runner with argument parsing  
├── health-check.js     # Quick server connectivity verification
└── README.md           # Test folder documentation
```

## Requirements

- Node.js server running on `localhost:3000`
- Valid Duffel API token configured
- `colors` npm package for formatted output
- `axios` for HTTP requests

## Support

For issues or questions:
1. Check server logs for detailed API request/response data
2. Run individual tests to isolate problems
3. Use health check to verify basic connectivity
4. Review test assertions for specific validation failures