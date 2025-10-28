# TripZip Flight Booking Application

A complete flight booking application using the Duffel API with Node.js/Express backend and modern frontend.

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose
- Duffel API test token

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd duffel-flight-booking
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your actual values
   ```

3. **Run with Docker**
   ```bash
   # Using helper script
   ./docker-run.sh

   # Or using docker-compose directly
   docker-compose up --build -d
   ```

4. **Access the application**
   ```
   http://localhost:9000
   ```

### Option 2: Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your actual values
   ```

3. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

4. **Access the application**
   ```
   http://localhost:3000
   ```

## Environment Variables

Required variables in `.env` file:

```env
# Duffel API Token (Get from https://duffel.com/dashboard)
DUFFEL_API_TOKEN=duffel_test_YOUR_TEST_TOKEN_HERE

# Server Configuration
PORT=3000
NODE_ENV=development
HOST_PORT=9000

# Stripe Keys (Get from https://stripe.com/dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# API Base URL
API_BASE_URL=https://api.example.com
```

## Docker Commands

```bash
# Start application
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Check status
docker-compose ps
```

## Production Deployment

1. **Set up git remote**
   ```bash
   git remote add upstream user@server:/path/to/git-repo
   ```

2. **Deploy to server**
   ```bash
   git push upstream main
   ```

3. **Server setup** (on production server)
   ```bash
   # Copy post-receive hook
   cp post-receive /path/to/git-repo/hooks/
   chmod +x /path/to/git-repo/hooks/post-receive
   ```

That's it! Your TripZip Flight Booking application is ready to use.