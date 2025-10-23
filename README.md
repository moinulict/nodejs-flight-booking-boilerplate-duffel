# Duffel Flight Booking POC

A comprehensive flight booking proof of concept using the Duffel API with Node.js/Express backend and modern frontend with Tailwind CSS.

## Features

- **Flight Search**: Search for flights between any two destinations
- **Real-time Place Search**: Autocomplete for airports and cities
- **Flight Results**: Display available flights with detailed information
- **Booking System**: Complete passenger information form and booking process
- **Responsive Design**: Modern UI with Tailwind CSS
- **Test Mode**: Safe testing environment using Duffel test API

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, JavaScript (ES6+), Tailwind CSS
- **API**: Duffel Flight API v1
- **Libraries**: Axios, Moment.js, Font Awesome

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Duffel API test token

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if exists) or use the existing `.env` file
   - Update the `DUFFEL_API_TOKEN` with your test token

4. Start the development server:
   ```bash
   npm run dev
   ```
   or for production:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### GET `/api/places`
Search for airports and cities
- Query parameter: `query` - search term
- Returns: List of matching places with IATA codes

### POST `/api/search-flights`
Search for available flights
- Body: `{ origin, destination, departureDate, returnDate?, passengers }`
- Returns: List of flight offers

### POST `/api/book-flight`
Create a flight booking
- Body: `{ offer_id, passengers }`
- Returns: Booking confirmation with reference

### GET `/api/order/:orderId`
Get booking details
- Returns: Complete order information

## Usage

1. **Search Flights**:
   - Enter origin and destination (autocomplete will help)
   - Select departure date and optional return date
   - Choose number of passengers
   - Click "Search Flights"

2. **Select Flight**:
   - Browse available flights
   - Click "Select Flight" on your preferred option

3. **Complete Booking**:
   - Fill in passenger details for all travelers
   - Submit the booking form
   - Receive booking confirmation

## Environment Variables

```env
DUFFEL_API_TOKEN=your_duffel_test_token_here
PORT=3000
NODE_ENV=development
```

## Project Structure

```
duffel-flight-booking/
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── airports.json          # Airport data for autocomplete
├── README.md             # This file
├── docs/                 # 📚 Documentation
│   ├── README.md         #   Documentation index
│   ├── DUFFEL_API_REFERENCE.md     #   Complete API guide
│   └── TEST_SUITE_DOCUMENTATION.md #   Testing framework docs
├── tests/                # 🧪 Test Suite
│   ├── test-suite.js     #   Main test class (65 assertions)
│   ├── run-tests.js      #   CLI test runner
│   ├── health-check.js   #   Quick connectivity check
│   └── README.md         #   Test documentation
└── public/               # 🎨 Frontend
    ├── index.html        #   Main application page
    ├── app.js           #   Main application logic
    ├── flights.js       #   Flight search functionality
    └── booking-summary.html #   Booking confirmation page
```

## Testing

This POC uses Duffel's test environment, so all bookings are simulated and no real charges occur. The test token provided allows you to:

- Search real flight data
- Make test bookings
- Receive booking confirmations
- Test the complete flow safely

## Features Implemented

✅ Flight search with flexible date options  
✅ Real-time airport/city autocomplete  
✅ Responsive flight results display  
✅ Complete passenger information forms  
✅ Booking confirmation system  
✅ Error handling and loading states  
✅ Modern, professional UI design  
✅ Mobile-responsive layout  

## Known Limitations

- Test mode only (no real bookings)
- Basic error handling
- No payment processing (test environment)
- No user authentication
- No booking management/cancellation

## Security Notes

- API token is stored in environment variables
- All requests are server-side to protect credentials
- Input validation on both frontend and backend
- No sensitive data stored in local storage

## Development Notes

- Uses modern JavaScript (ES6+)
- Responsive design with Tailwind CSS
- Axios for HTTP requests
- Moment.js for date formatting
- Font Awesome for icons

## Production Considerations

For production deployment:
1. Use production Duffel API token
2. Implement proper authentication
3. Add comprehensive error logging
4. Set up monitoring and alerts
5. Implement rate limiting
6. Add input sanitization
7. Use HTTPS
8. Add booking management features

## Documentation

📚 **Comprehensive Documentation**: See the [`docs/`](./docs/) folder for detailed guides:

- **[API Integration Guide](./docs/DUFFEL_API_REFERENCE.md)**: Complete Duffel API reference with examples
- **[Testing Documentation](./docs/TEST_SUITE_DOCUMENTATION.md)**: Comprehensive test suite guide  
- **[Documentation Index](./docs/README.md)**: Quick access to all documentation

## Testing

🧪 **Comprehensive Test Suite**: Run the complete test suite to validate all functionality:

```bash
# Quick health check
node tests/health-check.js

# Run all tests (65 assertions)
node tests/run-tests.js

# Run specific test components
node tests/run-tests.js search
node tests/run-tests.js booking
```

For detailed testing information, see [Testing Documentation](./docs/TEST_SUITE_DOCUMENTATION.md).

## Support

This is a proof of concept for demonstration purposes. For production use:

1. Review the [API Integration Guide](./docs/DUFFEL_API_REFERENCE.md)
2. Run the [comprehensive test suite](./docs/TEST_SUITE_DOCUMENTATION.md)
3. Check Duffel's full API documentation
4. Implement additional security and features as needed