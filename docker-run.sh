#!/bin/bash

# TripZip Booking Docker Setup
echo "🐳 Setting up TripZip Booking Docker Container..."

# Build and run the container
echo "📦 Building Docker image..."
docker-compose up --build -d

echo "✅ TripZip Booking is now running!"
echo "🌐 Access your application at: http://localhost:9000"
echo "📋 Container name: tripzip_booking"
echo ""
echo "🔧 Useful commands:"
echo "  Stop:    docker-compose down"
echo "  Logs:    docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Status:  docker-compose ps"