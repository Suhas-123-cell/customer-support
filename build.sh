#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Install frontend dependencies and build
echo "Installing frontend dependencies and building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Frontend build completed."

# Create necessary directories for static files
echo "Setting up static files..."
mkdir -p frontend/dist

# List the contents of the frontend/dist directory
echo "Contents of frontend/dist directory:"
ls -la frontend/dist || echo "frontend/dist directory not found or empty"

echo "Build process completed successfully!"