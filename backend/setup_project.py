#!/usr/bin/env python3
"""
CareLink Project Setup Script
This script helps you set up the project with all necessary configurations
"""

import os
import sys
import subprocess
from pathlib import Path

def setup_environment():
    """Set up environment variables"""
    print("🔧 Setting up environment variables...")
    
    # Create .env file if it doesn't exist
    env_file = Path(".env")
    if not env_file.exists():
        print("📝 Creating .env file from template...")
        subprocess.run(["cp", "env.example", ".env"])
        print("✅ .env file created")
    else:
        print("✅ .env file already exists")
    
    # Set default values for demo
    env_content = """# CareLink Environment Configuration
# Copy this to .env and fill in your actual values

# =============================================================================
# API Configuration
# =============================================================================
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# =============================================================================
# Supabase Configuration (REQUIRED)
# =============================================================================
# Get your credentials from https://supabase.com/ -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here

# =============================================================================
# Vapi Voice AI Configuration (REQUIRED)
# =============================================================================
VAPI_API_KEY=your_vapi_api_key_here
VAPI_BASE_URL=https://api.vapi.ai
DEMO_PHONE_NUMBER=+14089167303
DEMO_MODE=True

# =============================================================================
# Google Gemini (REQUIRED)
# =============================================================================
GEMINI_API_KEY=your_gemini_api_key_here

# =============================================================================
# FetchAI Agent Configuration
# =============================================================================
FETCHAI_NETWORK=testnet
AGENT_FRAMEWORK=uagent
AGENT_DISCOVERY=True
AGENT_MESSAGING=True

# =============================================================================
# Feature Flags
# =============================================================================
ENABLE_VOICE_CALLS=True
ENABLE_AGENT_COORDINATION=True
ENABLE_REAL_TIME_UPDATES=True
"""
    
    with open(".env", "w") as f:
        f.write(env_content)
    
    print("✅ Environment configuration ready")
    print("⚠️  Please edit .env file with your actual API keys:")

def check_dependencies():
    """Check if all dependencies are installed"""
    print("\n🔍 Checking dependencies...")
    
    required_packages = [
        "fastapi", "uvicorn", "supabase", "httpx", "python-dotenv",
        "pydantic", "asyncio", "requests", "google-generativeai"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        subprocess.run([sys.executable, "-m", "pip", "install"] + missing_packages)
        print("✅ All dependencies installed")
    else:
        print("✅ All dependencies are installed")

def create_startup_scripts():
    """Create startup scripts for easy running"""
    print("\n📝 Creating startup scripts...")
    
    # Backend startup script
    backend_script = """#!/bin/bash
echo "🚀 Starting CareLink Backend..."
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
    
    with open("start_backend.sh", "w") as f:
        f.write(backend_script)
    
    os.chmod("start_backend.sh", 0o755)
    
    # Frontend startup script
    frontend_script = """#!/bin/bash
echo "🚀 Starting CareLink Frontend..."
cd /Users/amybihag/Calhacks12.0/calhacks12/frontend
npm run dev
"""
    
    with open("start_frontend.sh", "w") as f:
        f.write(frontend_script)
    
    os.chmod("start_frontend.sh", 0o755)
    
    # Agents startup script
    agents_script = """#!/bin/bash
echo "🤖 Starting CareLink Agents..."
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
python3 agents/run_all.py
"""
    
    with open("start_agents.sh", "w") as f:
        f.write(agents_script)
    
    os.chmod("start_agents.sh", 0o755)
    
    print("✅ Startup scripts created")

def main():
    """Main setup function"""
    print("🎯 CareLink Project Setup")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir("/Users/amybihag/Calhacks12.0/calhacks12/backend")
    
    setup_environment()
    check_dependencies()
    create_startup_scripts()
    
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("📋 Next Steps:")
    print("1. Edit .env file with your API keys")
    print("2. Run: ./start_backend.sh (Terminal 1)")
    print("3. Run: ./start_frontend.sh (Terminal 2)")
    print("4. Run: ./start_agents.sh (Terminal 3)")
    print("5. Open: http://localhost:3000")
    print("\n🔑 Required API Keys:")
    print("• Supabase: https://supabase.com/")
    print("• Vapi: https://vapi.ai/")
    print("• Google Gemini: https://makersuite.google.com/")

if __name__ == "__main__":
    main()
