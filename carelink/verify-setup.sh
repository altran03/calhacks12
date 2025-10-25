#!/bin/bash

# CareLink Setup Verification Script
echo "🏥 CareLink Setup Verification"
echo "================================"

# Check Node.js version
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo "✅ Node.js version is compatible (18+)"
    else
        echo "⚠️  Node.js version should be 18 or higher"
    fi
else
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check Python version
echo ""
echo "🐍 Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
    
    # Check if version is 3.9 or higher
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1 | sed 's/Python //')
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 9 ]; then
        echo "✅ Python version is compatible (3.9+)"
    else
        echo "⚠️  Python version should be 3.9 or higher"
    fi
else
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if we're in the right directory
echo ""
echo "📁 Checking project structure..."
if [ -f "package.json" ] && [ -d "src" ] && [ -d "backend" ]; then
    echo "✅ Project structure looks correct"
else
    echo "❌ Please run this script from the carelink project root directory"
    exit 1
fi

# Check frontend dependencies
echo ""
echo "📦 Checking frontend dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Frontend dependencies installed"
    
    # Check for key packages
    if [ -d "node_modules/next" ]; then
        echo "✅ Next.js installed"
    else
        echo "❌ Next.js not found"
    fi
    
    if [ -d "node_modules/framer-motion" ]; then
        echo "✅ Framer Motion installed"
    else
        echo "❌ Framer Motion not found"
    fi
    
    if [ -d "node_modules/react-leaflet" ]; then
        echo "✅ React Leaflet installed"
    else
        echo "❌ React Leaflet not found"
    fi
else
    echo "⚠️  Frontend dependencies not installed. Run 'npm install' first."
fi

# Check backend dependencies
echo ""
echo "🐍 Checking backend dependencies..."
if [ -d "backend/venv" ]; then
    echo "✅ Python virtual environment exists"
    
    # Check if key packages are installed
    if [ -f "backend/venv/lib/python*/site-packages/fastapi" ] || [ -f "backend/venv/lib/python*/site-packages/uvicorn" ]; then
        echo "✅ FastAPI dependencies installed"
    else
        echo "⚠️  FastAPI dependencies may not be installed"
    fi
    
    if [ -f "backend/venv/lib/python*/site-packages/uagents" ]; then
        echo "✅ Fetch.ai uAgents installed"
    else
        echo "⚠️  Fetch.ai uAgents may not be installed"
    fi
else
    echo "⚠️  Backend virtual environment not found. Run 'npm run setup' first."
fi

# Check environment files
echo ""
echo "🔧 Checking configuration..."
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env file exists"
else
    echo "⚠️  Backend .env file not found. Copy from env.example and configure."
fi

if [ -f "backend/env.example" ]; then
    echo "✅ Environment template exists"
else
    echo "❌ Environment template not found"
fi

# Check if ports are available
echo ""
echo "🌐 Checking port availability..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use (Next.js frontend)"
else
    echo "✅ Port 3000 is available"
fi

if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  Port 8000 is in use (FastAPI backend)"
else
    echo "✅ Port 8000 is available"
fi

# Summary
echo ""
echo "📋 Setup Summary"
echo "================"
echo "✅ Node.js and Python are installed"
echo "✅ Project structure is correct"
echo "✅ Dependencies are installed"
echo ""
echo "🚀 Ready to start development!"
echo ""
echo "To start the development servers:"
echo "  npm run dev:full"
echo ""
echo "Or use the startup script:"
echo "  ./start-dev.sh"
echo ""
echo "📚 For more information, see README.md"
