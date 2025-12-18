#!/bin/bash
# Production startup script for backend

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start uvicorn server
uvicorn main:app --host 0.0.0.0 --port ${PORT:-4000} --workers 4

