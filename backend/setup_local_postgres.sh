#!/bin/bash

# CareLink Local PostgreSQL Setup Script
# This script helps set up PostgreSQL for local development

echo "🚀 Setting up CareLink with Local PostgreSQL..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo ""
    echo "On macOS (using Homebrew):"
    echo "  brew install postgresql"
    echo "  brew services start postgresql"
    echo ""
    echo "On Ubuntu/Debian:"
    echo "  sudo apt update"
    echo "  sudo apt install postgresql postgresql-contrib"
    echo "  sudo systemctl start postgresql"
    echo "  sudo systemctl enable postgresql"
    echo ""
    echo "On Windows:"
    echo "  Download from https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Starting it..."
    
    # Try to start PostgreSQL
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start postgresql
    else
        echo "❌ Please start PostgreSQL manually"
        exit 1
    fi
    
    # Wait a moment for PostgreSQL to start
    sleep 3
    
    if ! pg_isready -q; then
        echo "❌ Failed to start PostgreSQL"
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.local.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python3 init_database.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CareLink setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure your .env file has the correct database credentials"
    echo "2. Run: python3 main.py"
    echo "3. Open http://localhost:8000 in your browser"
    echo ""
    echo "Database credentials in .env:"
    echo "  POSTGRES_HOST=localhost"
    echo "  POSTGRES_PORT=5432"
    echo "  POSTGRES_DB=carelink"
    echo "  POSTGRES_USER=postgres"
    echo "  POSTGRES_PASSWORD=password"
else
    echo "❌ Database initialization failed"
    exit 1
fi
