#!/usr/bin/env python3
"""
Database Initialization Script
Sets up local PostgreSQL database with sample data for CareLink
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

def create_database():
    """Create the carelink database if it doesn't exist"""
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'password')
    }
    
    # Connect to default postgres database to create carelink database
    try:
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database='postgres'  # Connect to default postgres database
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'carelink'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE carelink")
            print("✅ Created 'carelink' database")
        else:
            print("✅ Database 'carelink' already exists")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def populate_sample_data():
    """Populate database with sample data"""
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'carelink'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'password')
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Sample shelters data
        shelters_data = [
            ("Mission Neighborhood Resource Center", "165 Capp St, San Francisco, CA 94110", 50, 12, True, "(415) 431-4000", ["medical respite", "case management", "meals"], 37.7749, -122.4194),
            ("Hamilton Family Center", "260 Golden Gate Ave, San Francisco, CA 94102", 30, 8, True, "(415) 292-5222", ["family shelter", "childcare", "counseling"], 37.7849, -122.4094),
            ("St. Anthony's Foundation", "150 Golden Gate Ave, San Francisco, CA 94102", 100, 25, True, "(415) 241-2600", ["emergency shelter", "medical clinic", "dining room"], 37.7849, -122.4094),
            ("Glide Memorial Church", "330 Ellis St, San Francisco, CA 94102", 75, 15, True, "(415) 674-6000", ["emergency shelter", "meals", "counseling"], 37.7849, -122.4094),
            ("Larkin Street Youth Services", "1346 Mission St, San Francisco, CA 94103", 40, 10, True, "(415) 673-0911", ["youth shelter", "education", "job training"], 37.7749, -122.4194)
        ]
        
        # Insert sample shelters
        cursor.execute("SELECT COUNT(*) FROM shelters")
        shelter_count = cursor.fetchone()[0]
        
        if shelter_count == 0:
            cursor.executemany(
                "INSERT INTO shelters (name, address, capacity, available_beds, accessibility, phone, services, latitude, longitude) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                shelters_data
            )
            print(f"✅ Inserted {len(shelters_data)} sample shelters")
        else:
            print(f"✅ Shelters already populated ({shelter_count} records)")
        
        # Sample transport data
        transport_data = [
            ("SFMTA Paratransit", "accessible", "(415) 701-4485", "available", 0.00, True),
            ("Lyft Healthcare", "rideshare", "(415) 555-0123", "available", 15.00, True),
            ("Uber Health", "rideshare", "(415) 555-0124", "available", 12.00, True),
            ("Nonprofit Transport", "van", "(415) 555-0125", "available", 0.00, True),
            ("Taxi Service", "taxi", "(415) 555-0126", "available", 25.00, False)
        ]
        
        cursor.execute("SELECT COUNT(*) FROM transport")
        transport_count = cursor.fetchone()[0]
        
        if transport_count == 0:
            cursor.executemany(
                "INSERT INTO transport (name, type, phone, availability, cost, accessibility) VALUES (%s, %s, %s, %s, %s, %s)",
                transport_data
            )
            print(f"✅ Inserted {len(transport_data)} sample transport options")
        else:
            print(f"✅ Transport already populated ({transport_count} records)")
        
        # Sample benefits data
        benefits_data = [
            ("Medi-Cal", "healthcare", "Low-income individuals and families", "https://www.dhcs.ca.gov/medi-cal", "(800) 541-5555"),
            ("General Assistance", "cash", "Unemployed adults without dependents", "https://www.sfhsa.org/", "(415) 557-5000"),
            ("SNAP (Food Stamps)", "food", "Low-income households", "https://www.sfhsa.org/", "(415) 557-5000"),
            ("SSI", "disability", "Disabled individuals", "https://www.ssa.gov/", "(800) 772-1213"),
            ("Housing Choice Voucher", "housing", "Low-income families", "https://www.sfhsa.org/", "(415) 557-5000")
        ]
        
        cursor.execute("SELECT COUNT(*) FROM benefits")
        benefits_count = cursor.fetchone()[0]
        
        if benefits_count == 0:
            cursor.executemany(
                "INSERT INTO benefits (name, type, eligibility, application_url, phone) VALUES (%s, %s, %s, %s, %s)",
                benefits_data
            )
            print(f"✅ Inserted {len(benefits_data)} sample benefits programs")
        else:
            print(f"✅ Benefits already populated ({benefits_count} records)")
        
        # Sample resources data
        resources_data = [
            ("SF Food Bank", "food", "900 Pennsylvania Ave, San Francisco, CA 94107", "(415) 282-1900", ["food distribution", "nutrition education"], 37.7749, -122.4194),
            ("Project Homeless Connect", "services", "150 Golden Gate Ave, San Francisco, CA 94102", "(415) 241-2600", ["medical", "dental", "housing"], 37.7849, -122.4094),
            ("Larkin Street Youth", "youth", "1346 Mission St, San Francisco, CA 94103", "(415) 673-0911", ["housing", "education", "employment"], 37.7749, -122.4194),
            ("SF General Hospital", "medical", "1001 Potrero Ave, San Francisco, CA 94110", "(415) 206-8000", ["emergency care", "primary care"], 37.7749, -122.4194),
            ("Mission Neighborhood Centers", "community", "165 Capp St, San Francisco, CA 94110", "(415) 431-4000", ["case management", "housing", "benefits"], 37.7749, -122.4194)
        ]
        
        cursor.execute("SELECT COUNT(*) FROM resources")
        resources_count = cursor.fetchone()[0]
        
        if resources_count == 0:
            cursor.executemany(
                "INSERT INTO resources (name, type, address, phone, services, latitude, longitude) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                resources_data
            )
            print(f"✅ Inserted {len(resources_data)} sample community resources")
        else:
            print(f"✅ Resources already populated ({resources_count} records)")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Database initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error populating sample data: {e}")
        return False

def main():
    """Main initialization function"""
    print("🚀 Initializing CareLink Local PostgreSQL Database...")
    
    # Create database
    if not create_database():
        print("❌ Failed to create database")
        sys.exit(1)
    
    # Initialize local database module to create tables
    try:
        from local_database import local_db
        if not local_db.connection_pool:
            print("❌ Failed to connect to database")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to initialize database module: {e}")
        sys.exit(1)
    
    # Populate sample data
    if not populate_sample_data():
        print("❌ Failed to populate sample data")
        sys.exit(1)
    
    print("🎉 CareLink database setup completed successfully!")
    print("\nNext steps:")
    print("1. Make sure PostgreSQL is running on your system")
    print("2. Update your .env file with database credentials")
    print("3. Run: python main.py")

if __name__ == "__main__":
    main()
