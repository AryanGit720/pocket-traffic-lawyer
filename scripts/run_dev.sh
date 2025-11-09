#!/bin/bash
# Development startup script

echo "Starting Pocket Traffic Lawyer in development mode..."

# Check if virtual environment exists
if [ ! -d "backend/.venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python -m venv .venv
    cd ..
fi

# Activate virtual environment
source backend/.venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -e .
cd ..

# Build initial index if not exists
if [ ! -f "backend/app/data/index/index.faiss" ]; then
    echo "Building initial index..."
    python scripts/build_index.py
fi

# Start backend
echo "Starting backend server..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Start frontend
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait