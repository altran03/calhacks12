#!/bin/bash

# Setup script for CareLink frontend environment variables
echo "Setting up CareLink frontend environment..."

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
# Frontend Environment Variables
# This file contains frontend-specific environment variables

# =============================================================================
# Application Configuration
# =============================================================================
NEXT_PUBLIC_APP_NAME=CareLink
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_DESCRIPTION=AI-powered hospital discharge coordination platform
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# API Configuration
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_API_TIMEOUT=30000

# =============================================================================
# Mapbox Configuration
# =============================================================================
# Get your free Mapbox token from https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12
NEXT_PUBLIC_MAPBOX_ZOOM=12
NEXT_PUBLIC_MAPBOX_CENTER_LAT=37.7749
NEXT_PUBLIC_MAPBOX_CENTER_LNG=-122.4194

# =============================================================================
# Feature Flags
# =============================================================================
NEXT_PUBLIC_ENABLE_MAP=true
NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=false

# =============================================================================
# UI Configuration
# =============================================================================
NEXT_PUBLIC_THEME=light
NEXT_PUBLIC_PRIMARY_COLOR=#3B82F6
NEXT_PUBLIC_SECONDARY_COLOR=#10B981
NEXT_PUBLIC_ACCENT_COLOR=#F59E0B

# =============================================================================
# Development Configuration
# =============================================================================
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_HOT_RELOAD=true
NEXT_PUBLIC_DEV_TOOLS=true
EOF
    echo "✅ .env.local file created successfully!"
else
    echo "⚠️  .env.local file already exists. Skipping creation."
fi

echo ""
echo "🔧 Next steps:"
echo "1. Get a free Mapbox token from: https://account.mapbox.com/access-tokens/"
echo "2. Replace the NEXT_PUBLIC_MAPBOX_TOKEN value in .env.local with your token"
echo "3. Restart your development server: npm run dev"
echo ""
echo "📝 Current Mapbox token (default): pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
echo "   This is a public token that should work for development, but you may want to get your own."
echo ""
echo "🎉 Setup complete! The map should now load properly."
