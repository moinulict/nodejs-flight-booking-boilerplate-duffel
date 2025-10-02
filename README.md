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
├── README.md             # This file
└── public/               # Frontend files
    ├── index.html        # Main HTML page
    └── app.js           # Frontend JavaScript
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

## Support

This is a proof of concept for demonstration purposes. For production use, review Duffel's full API documentation and implement additional security and features as needed.