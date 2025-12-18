#!/bin/bash
# Build script for Render deployment

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Creating uploads directory if it doesn't exist..."
mkdir -p uploads

echo "Build complete!"

