"""
SQLite database for form draft persistence
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# Database file location
DB_PATH = Path(__file__).parent / "discharge_forms.db"

def init_database():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create form_drafts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS form_drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT UNIQUE NOT NULL,
            form_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index on case_id for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_case_id ON form_drafts(case_id)
    """)
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")

def save_form_draft(case_id: str, form_data: Dict[str, Any]) -> bool:
    """Save or update a form draft"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        form_data_json = json.dumps(form_data)
        current_time = datetime.now().isoformat()
        
        # Insert or replace
        cursor.execute("""
            INSERT INTO form_drafts (case_id, form_data, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(case_id) DO UPDATE SET
                form_data = excluded.form_data,
                updated_at = excluded.updated_at
        """, (case_id, form_data_json, current_time, current_time))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving form draft: {e}")
        return False

def get_form_draft(case_id: str) -> Optional[Dict[str, Any]]:
    """Get a form draft by case_id"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT form_data, updated_at FROM form_drafts WHERE case_id = ?
        """, (case_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            form_data = json.loads(result[0])
            form_data['_last_saved'] = result[1]
            return form_data
        return None
    except Exception as e:
        print(f"Error getting form draft: {e}")
        return None

def list_form_drafts(limit: int = 50) -> list:
    """List all form drafts (most recent first)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT case_id, updated_at FROM form_drafts 
            ORDER BY updated_at DESC 
            LIMIT ?
        """, (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [{"case_id": r[0], "updated_at": r[1]} for r in results]
    except Exception as e:
        print(f"Error listing form drafts: {e}")
        return []

def delete_form_draft(case_id: str) -> bool:
    """Delete a form draft"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM form_drafts WHERE case_id = ?", (case_id,))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting form draft: {e}")
        return False

# Initialize database on import
init_database()

