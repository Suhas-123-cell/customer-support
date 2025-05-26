#!/bin/bash

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# Create a static directory in the backend if it doesn't exist
mkdir -p backend/static

# Copy the frontend build to the backend static directory
cp -r frontend/dist/* backend/static/

echo "Build completed successfully!"