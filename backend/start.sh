#!/bin/bash
# Start script for Render deployment

echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 4
