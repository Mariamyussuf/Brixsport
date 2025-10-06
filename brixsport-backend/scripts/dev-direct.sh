#!/bin/bash

echo "Starting Brixsport services directly (without Docker)..."

# Function to clean up processes on exit
cleanup() {
    echo "Stopping services..."
    kill $API_PID $ANALYTICS_PID 2>/dev/null
    exit 0
}

# Trap exit signals to clean up
trap cleanup EXIT INT TERM

# Check and install Python dependencies if needed
echo ""
echo "Checking Python dependencies..."
cd "$(dirname "$0")/../apps/analytics"
python -c "import fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements-direct.txt
fi

# Start API service
echo ""
echo "Starting API service..."
cd "$(dirname "$0")/../apps/api"
npm run dev &
API_PID=$!

# Start Analytics service
echo ""
echo "Starting Analytics service..."
cd "$(dirname "$0")/../apps/analytics"
python -m uvicorn main:app --reload --port 8000 &
ANALYTICS_PID=$!

echo ""
echo "Both services started!"
echo "API service running on http://localhost:4000"
echo "Analytics service running on http://localhost:8000"
echo "Press Ctrl+C to stop both services..."

# Wait for both processes
wait $API_PID $ANALYTICS_PID