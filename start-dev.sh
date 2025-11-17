#!/bin/bash

# Start the backend server
echo "Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait a moment for the server to start
sleep 2

# Start the frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "Both servers are running!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
