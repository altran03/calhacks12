#!/usr/bin/env python3
"""
JSON Database Initialization Script
Sets up JSON database with sample data for CareLink
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Main initialization function"""
    print("🚀 Initializing CareLink JSON Database...")
    
    try:
        # Import JSON database module to initialize files
        from json_database import json_db, DATABASE_AVAILABLE
        
        if not DATABASE_AVAILABLE:
            print("❌ Failed to initialize JSON database")
            sys.exit(1)
        
        print("✅ JSON database files created successfully!")
        print("📁 Data directory: /data")
        print("📄 JSON files created:")
        print("   - cases.json")
        print("   - workflows.json") 
        print("   - shelters.json")
        print("   - transport.json")
        print("   - benefits.json")
        print("   - resources.json")
        
        print("\n🎉 CareLink JSON database setup completed successfully!")
        print("\nNext steps:")
        print("1. Run: python main.py")
        print("2. The application will use JSON files for data storage")
        print("3. No database server required - everything is file-based!")
        
    except Exception as e:
        print(f"❌ Failed to initialize JSON database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
