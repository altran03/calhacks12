#!/usr/bin/env python3
"""
Migration Script: Supabase to Local PostgreSQL
Replaces all Supabase references with local PostgreSQL database calls
"""

import re
import os

def migrate_main_py():
    """Update main.py to use local PostgreSQL instead of Supabase"""
    
    main_py_path = "/Users/amybihag/Calhacks12.0/calhacks12/backend/main.py"
    
    # Read the current file
    with open(main_py_path, 'r') as f:
        content = f.read()
    
    # Replacements to make
    replacements = [
        # Update comments
        (r"# DEPRECATED: In-memory storage being replaced with Supabase", "# DEPRECATED: In-memory storage being replaced with local PostgreSQL"),
        (r"# WORKFLOW SUPABASE HELPERS", "# WORKFLOW LOCAL DATABASE HELPERS"),
        (r"Save workflow to Supabase database and update cache", "Save workflow to local PostgreSQL database and update cache"),
        (r"Convert workflow to dict for Supabase", "Convert workflow to dict for local PostgreSQL"),
        (r"Save to Supabase", "Save to local PostgreSQL"),
        (r"💾 Workflow.*saved to Supabase cloud database", "💾 Workflow {case_id} saved to local PostgreSQL database"),
        (r"Error saving workflow to Supabase", "Error saving workflow to local PostgreSQL"),
        (r"Get workflow from Supabase database or cache", "Get workflow from local PostgreSQL database or cache"),
        (r"Get all workflows from Supabase cloud database", "Get all workflows from local PostgreSQL database"),
        (r"Found.*cases in Supabase database", "Found {len(db_cases)} cases in local PostgreSQL database"),
        (r"Create WorkflowStatus from Supabase case data", "Create WorkflowStatus from local PostgreSQL case data"),
        (r"Fix isoformat parsing for Supabase timestamps", "Fix isoformat parsing for local PostgreSQL timestamps"),
        (r"Handle different timestamp formats from Supabase", "Handle different timestamp formats from local PostgreSQL"),
        (r"Error fetching cases from Supabase", "Error fetching cases from local PostgreSQL"),
        (r"Get specific workflow.*Try to get workflow from Supabase or cache", "Get specific workflow - Try to get workflow from local PostgreSQL or cache"),
        (r"Delete from Supabase database", "Delete from local PostgreSQL database"),
        (r"Get all shelters from Supabase database with REAL coordinates", "Get all shelters from local PostgreSQL database with REAL coordinates"),
        (r"Get real shelters from Supabase", "Get real shelters from local PostgreSQL"),
        (r"Use REAL lat/lng from Supabase database!", "Use REAL lat/lng from local PostgreSQL database!"),
        (r"Returning.*real shelters from Supabase with accurate coordinates", "Returning {len(real_shelters)} real shelters from local PostgreSQL with accurate coordinates"),
        (r"Get all transport options from Supabase database", "Get all transport options from local PostgreSQL database"),
        (r"Get real transport from Supabase", "Get real transport from local PostgreSQL"),
        (r"Returning.*real transport options from Supabase", "Returning {len(db_transport.data)} real transport options from local PostgreSQL"),
        (r"Get all benefits programs from Supabase database", "Get all benefits programs from local PostgreSQL database"),
        (r"Get real benefits from Supabase", "Get real benefits from local PostgreSQL"),
        (r"Returning.*real benefits programs from Supabase", "Returning {len(db_benefits.data)} real benefits programs from local PostgreSQL"),
        (r"Get all community resources from Supabase database", "Get all community resources from local PostgreSQL database"),
        (r"Get real resources from Supabase", "Get real resources from local PostgreSQL"),
        (r"Returning.*real community resources from Supabase", "Returning {len(db_resources.data)} real community resources from local PostgreSQL"),
        (r"Update the shelter's available beds in Supabase", "Update the shelter's available beds in local PostgreSQL"),
        (r"Try to save to Supabase first", "Try to save to local PostgreSQL first"),
        (r"Supabase save failed, using fallback storage", "Local PostgreSQL save failed, using fallback storage"),
        (r"Also update Supabase case data if available", "Also update local PostgreSQL case data if available"),
        (r"Map form data to Supabase case structure", "Map form data to local PostgreSQL case structure"),
        (r"Update the case in Supabase", "Update the case in local PostgreSQL"),
        (r"Updated Supabase case data for", "Updated local PostgreSQL case data for"),
        (r"Save updated workflow to Supabase", "Save updated workflow to local PostgreSQL"),
        (r"Updated workflow data in Supabase for", "Updated workflow data in local PostgreSQL for"),
        (r"Error updating Supabase case data", "Error updating local PostgreSQL case data"),
        (r"Form draft saved and Supabase updated", "Form draft saved and local PostgreSQL updated"),
        (r"Save to Supabase cloud database", "Save to local PostgreSQL database"),
        (r"Coordinate agents using REAL Supabase data instead of hardcoded values", "Coordinate agents using REAL local PostgreSQL data instead of hardcoded values"),
        (r"Log to Supabase if available", "Log to local PostgreSQL if available"),
        (r"Shelter Agent - QUERY REAL SUPABASE DATA", "Shelter Agent - QUERY REAL LOCAL POSTGRESQL DATA"),
        (r"Connecting to Supabase shelter database", "Connecting to local PostgreSQL shelter database"),
        (r"Find real shelter from Supabase", "Find real shelter from local PostgreSQL"),
        (r"Use REAL coordinates from Supabase", "Use REAL coordinates from local PostgreSQL"),
        (r"No suitable shelters found in Supabase database", "No suitable shelters found in local PostgreSQL database"),
        (r"Transport Agent - QUERY REAL SUPABASE DATA", "Transport Agent - QUERY REAL LOCAL POSTGRESQL DATA"),
        (r"Querying Supabase transport database", "Querying local PostgreSQL transport database"),
        (r"Find real transport from Supabase", "Find real transport from local PostgreSQL"),
        (r"No transport options found in Supabase database", "No transport options found in local PostgreSQL database"),
        (r"Resource Agent - QUERY REAL SUPABASE DATA", "Resource Agent - QUERY REAL LOCAL POSTGRESQL DATA"),
        (r"Querying Supabase community resources database", "Querying local PostgreSQL community resources database"),
        (r"Find real resources from Supabase", "Find real resources from local PostgreSQL"),
        (r"Update case status in Supabase", "Update case status in local PostgreSQL"),
        (r"Case saved to Supabase database", "Case saved to local PostgreSQL database"),
        (r"Workflow.*completed successfully with REAL Supabase data", "Workflow {case_id} completed successfully with REAL local PostgreSQL data"),
    ]
    
    # Apply replacements
    for old, new in replacements:
        content = re.sub(old, new, content)
    
    # Replace CASE_MANAGER_AVAILABLE with DATABASE_AVAILABLE
    content = content.replace("CASE_MANAGER_AVAILABLE", "DATABASE_AVAILABLE")
    content = content.replace("case_manager", "local_db")
    
    # Replace specific database calls
    content = content.replace("case_manager.client.table('shelters')", "local_db.get_shelters()")
    content = content.replace("case_manager.client.table('transport')", "local_db.get_transport_options()")
    content = content.replace("case_manager.client.table('benefits')", "local_db.get_benefits_programs()")
    content = content.replace("case_manager.client.table('community_resources')", "local_db.get_community_resources()")
    content = content.replace("case_manager.client.table('cases')", "local_db.get_cases()")
    
    # Write the updated content back
    with open(main_py_path, 'w') as f:
        f.write(content)
    
    print("✅ Updated main.py to use local PostgreSQL")

def main():
    """Run the migration"""
    print("🔄 Migrating from Supabase to Local PostgreSQL...")
    
    migrate_main_py()
    
    print("✅ Migration completed!")
    print("\nNext steps:")
    print("1. Install PostgreSQL on your system")
    print("2. Create the 'carelink' database")
    print("3. Update your .env file with database credentials")
    print("4. Run: python init_database.py")
    print("5. Run: python main.py")

if __name__ == "__main__":
    main()
