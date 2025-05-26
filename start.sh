#!/bin/bash

# Start the backend
cd backend
uvicorn main:app --reload &
BACKEND_PID=$!

# Start the frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to kill processes on exit
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to press Ctrl+C
echo "Both services are running. Press Ctrl+C to stop."
wait