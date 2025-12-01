#!/bin/bash

# Function to kill all background jobs
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p)
}

trap cleanup EXIT

# Start the Flask Backend
echo "Starting Flask backend on port 8080..."
. venv/bin/activate
export FLASK_APP=src/main.py
flask run --port 8080 &

# Start the Next.js Frontend
echo "Starting Next.js frontend on port 3000..."
npm --prefix frontend/ run dev &

# Display a clear message
echo "-----------------------------------------"
echo "Dashboard running at http://localhost:3000"
echo "-----------------------------------------"

# Wait for all background jobs to complete
wait
