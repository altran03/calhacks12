#!/bin/bash

# CareLink Development Startup Script
echo "🏥 Starting CareLink Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the carelink project root directory"
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
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
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

# Start both frontend and backend
npm run dev:full
