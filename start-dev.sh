#!/bin/bash

# CareLink Development Startup Script
echo "🏥 Starting CareLink Development Environment..."
echo "📁 Project Structure:"
echo "   ├── frontend/ (Next.js)"
echo "   └── backend/ (FastAPI + Python)"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure: frontend/ and backend/ directories"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Setup backend virtual environment if needed
if [ ! -d "backend/venv" ]; then
    echo "🐍 Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from template..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your API keys before running the backend"
fi

echo ""
echo "🚀 Starting CareLink servers..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:8000"
echo "Fetch.ai Agents will run on ports: 8001-8006"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in a separate terminal/process
echo "🚀 Starting backend (FastAPI)..."
(cd backend && source venv/bin/activate && python main.py) &
BACKEND_PID=$!
echo "   Backend started with PID: $BACKEND_PID"

# Start frontend
echo "🎨 Starting frontend (Next.js)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!
echo "   Frontend started with PID: $FRONTEND_PID"

echo ""
echo "✅ CareLink is starting up. Please wait for both servers to be ready."
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down CareLink servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers shut down."
}

# Trap SIGINT (Ctrl+C) and call cleanup function
trap cleanup SIGINT

wait $FRONTEND_PID
wait $BACKEND_PID
