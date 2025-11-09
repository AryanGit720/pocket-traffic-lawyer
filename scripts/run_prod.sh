#!/bin/bash
# Production startup script using Docker

echo "Starting Pocket Traffic Lawyer in production mode..."

# Build and start containers
docker compose up --build -d

echo "Production servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Run 'docker compose logs -f' to view logs"
echo "Run 'docker compose down' to stop"