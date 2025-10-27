"""
Local PostgreSQL Database Module
Replaces Supabase with local PostgreSQL database
All data (form drafts, workflows, patient data) stored in local PostgreSQL
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

load_dotenv()

class LocalDatabase:
    def __init__(self):
        self.connection_pool = None
        self.db_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'carelink'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password')
        }
        self._initialize_connection()
        self._create_tables()
    
    def _initialize_connection(self):
        """Initialize PostgreSQL connection pool"""
        try:
            self.connection_pool = SimpleConnectionPool(
                minconn=1,
                maxconn=10,
                **self.db_config
            )
            print("✅ Local PostgreSQL database connected")
        except Exception as e:
            print(f"❌ Error connecting to PostgreSQL: {e}")
            self.connection_pool = None
    
    def _create_tables(self):
        """Create necessary tables if they don't exist"""
        if not self.connection_pool:
            return
        
        create_tables_sql = """
        -- Cases table
        CREATE TABLE IF NOT EXISTS cases (
            id SERIAL PRIMARY KEY,
            case_id VARCHAR(255) UNIQUE NOT NULL,
            patient_name VARCHAR(255),
            medical_record_number VARCHAR(255),
            date_of_birth DATE,
            phone_1 VARCHAR(50),
            phone_2 VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(50),
            zip VARCHAR(20),
            emergency_contact_name VARCHAR(255),
            emergency_contact_relationship VARCHAR(100),
            emergency_contact_phone VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Workflows table
        CREATE TABLE IF NOT EXISTS workflows (
            id SERIAL PRIMARY KEY,
            case_id VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(100) DEFAULT 'pending',
            current_step VARCHAR(100),
            progress INTEGER DEFAULT 0,
            shelter_id INTEGER,
            transport_id INTEGER,
            social_worker_id INTEGER,
            workflow_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Shelters table
        CREATE TABLE IF NOT EXISTS shelters (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            capacity INTEGER,
            available_beds INTEGER,
            accessibility BOOLEAN DEFAULT FALSE,
            phone VARCHAR(50),
            services TEXT[],
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transport table
        CREATE TABLE IF NOT EXISTS transport (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            phone VARCHAR(50),
            availability VARCHAR(100),
            cost DECIMAL(10, 2),
            accessibility BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Benefits table
        CREATE TABLE IF NOT EXISTS benefits (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            eligibility TEXT,
            application_url TEXT,
            phone VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Resources table
        CREATE TABLE IF NOT EXISTS resources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            address TEXT,
            phone VARCHAR(50),
            services TEXT[],
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
        CREATE INDEX IF NOT EXISTS idx_workflows_case_id ON workflows(case_id);
        CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
        """
        
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            cursor.execute(create_tables_sql)
            conn.commit()
            cursor.close()
            self.connection_pool.putconn(conn)
            print("✅ Database tables created/verified")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
    
    def get_connection(self):
        """Get a connection from the pool"""
        if not self.connection_pool:
            return None
        return self.connection_pool.getconn()
    
    def return_connection(self, conn):
        """Return a connection to the pool"""
        if self.connection_pool and conn:
            self.connection_pool.putconn(conn)

# Initialize global database instance
try:
    local_db = LocalDatabase()
    DATABASE_AVAILABLE = local_db.connection_pool is not None
    if DATABASE_AVAILABLE:
        print("✅ Local PostgreSQL Database module initialized")
    else:
        print("⚠️  Local PostgreSQL not available - database operations will fail")
except Exception as e:
    DATABASE_AVAILABLE = False
    local_db = None
    print(f"⚠️  Local Database not available: {e}")


# ============================================
# FORM DRAFT OPERATIONS
# ============================================

def save_form_draft(case_id: str, form_data: Dict[str, Any]) -> bool:
    """
    Save or update a form draft in local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        print("⚠️  Local PostgreSQL not available, cannot save form draft")
        return False
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor()
        
        # Handle date conversion
        date_of_birth = form_data.get('dateOfBirth', None)
        if date_of_birth:
            if hasattr(date_of_birth, 'strftime'):
                date_of_birth = date_of_birth.strftime('%Y-%m-%d')
            else:
                date_of_birth = str(date_of_birth)
        
        # Check if case exists
        cursor.execute("SELECT id FROM cases WHERE case_id = %s", (case_id,))
        existing_case = cursor.fetchone()
        
        if existing_case:
            # Update existing case
            update_sql = """
            UPDATE cases SET 
                patient_name = %s, medical_record_number = %s, date_of_birth = %s,
                phone_1 = %s, phone_2 = %s, address = %s, city = %s, state = %s, zip = %s,
                emergency_contact_name = %s, emergency_contact_relationship = %s, 
                emergency_contact_phone = %s, updated_at = CURRENT_TIMESTAMP
            WHERE case_id = %s
            """
            cursor.execute(update_sql, (
                form_data.get('name', ''),
                form_data.get('medicalRecordNumber', ''),
                date_of_birth,
                form_data.get('phone1', ''),
                form_data.get('phone2', ''),
                form_data.get('address', ''),
                form_data.get('city', ''),
                form_data.get('state', ''),
                form_data.get('zip', ''),
                form_data.get('emergencyContactName', ''),
                form_data.get('emergencyContactRelationship', ''),
                form_data.get('emergencyContactPhone', ''),
                case_id
            ))
        else:
            # Insert new case
            insert_sql = """
            INSERT INTO cases (case_id, patient_name, medical_record_number, date_of_birth,
                             phone_1, phone_2, address, city, state, zip,
                             emergency_contact_name, emergency_contact_relationship, emergency_contact_phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (
                case_id,
                form_data.get('name', ''),
                form_data.get('medicalRecordNumber', ''),
                date_of_birth,
                form_data.get('phone1', ''),
                form_data.get('phone2', ''),
                form_data.get('address', ''),
                form_data.get('city', ''),
                form_data.get('state', ''),
                form_data.get('zip', ''),
                form_data.get('emergencyContactName', ''),
                form_data.get('emergencyContactRelationship', ''),
                form_data.get('emergencyContactPhone', '')
            ))
        
        conn.commit()
        cursor.close()
        local_db.return_connection(conn)
        print(f"✅ Form draft saved to local PostgreSQL: {case_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving form draft: {e}")
        return False

def get_form_draft(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get form draft from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return None
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM cases WHERE case_id = %s", (case_id,))
        case = cursor.fetchone()
        
        cursor.close()
        local_db.return_connection(conn)
        
        if case:
            case_dict = dict(case)
            # Convert date objects to strings for Pydantic compatibility
            if case_dict.get('date_of_birth'):
                if hasattr(case_dict['date_of_birth'], 'strftime'):
                    case_dict['date_of_birth'] = case_dict['date_of_birth'].strftime('%Y-%m-%d')
                else:
                    case_dict['date_of_birth'] = str(case_dict['date_of_birth'])
            return case_dict
        return None
        
    except Exception as e:
        print(f"❌ Error getting form draft: {e}")
        return None

def list_form_drafts() -> List[Dict[str, Any]]:
    """
    List all form drafts from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM cases ORDER BY created_at DESC")
        cases = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        result = []
        for case in cases:
            case_dict = dict(case)
            # Convert date objects to strings for Pydantic compatibility
            if case_dict.get('date_of_birth'):
                if hasattr(case_dict['date_of_birth'], 'strftime'):
                    case_dict['date_of_birth'] = case_dict['date_of_birth'].strftime('%Y-%m-%d')
                else:
                    case_dict['date_of_birth'] = str(case_dict['date_of_birth'])
            result.append(case_dict)
        return result
        
    except Exception as e:
        print(f"❌ Error listing form drafts: {e}")
        return []

def delete_form_draft(case_id: str) -> bool:
    """
    Delete form draft from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return False
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM cases WHERE case_id = %s", (case_id,))
        conn.commit()
        
        cursor.close()
        local_db.return_connection(conn)
        
        print(f"✅ Form draft deleted from local PostgreSQL: {case_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error deleting form draft: {e}")
        return False


# ============================================
# WORKFLOW OPERATIONS
# ============================================

def save_workflow(case_id: str, workflow_data: Dict[str, Any]) -> bool:
    """
    Save workflow to local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return False
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor()
        
        # Check if workflow exists
        cursor.execute("SELECT id FROM workflows WHERE case_id = %s", (case_id,))
        existing_workflow = cursor.fetchone()
        
        if existing_workflow:
            # Update existing workflow
            update_sql = """
            UPDATE workflows SET 
                status = %s, current_step = %s, progress = %s,
                shelter_id = %s, transport_id = %s, social_worker_id = %s,
                workflow_data = %s, updated_at = CURRENT_TIMESTAMP
            WHERE case_id = %s
            """
            cursor.execute(update_sql, (
                workflow_data.get('status', 'pending'),
                workflow_data.get('current_step', ''),
                workflow_data.get('progress', 0),
                workflow_data.get('shelter_id'),
                workflow_data.get('transport_id'),
                workflow_data.get('social_worker_id'),
                json.dumps(workflow_data),
                case_id
            ))
        else:
            # Insert new workflow
            insert_sql = """
            INSERT INTO workflows (case_id, status, current_step, progress, 
                                 shelter_id, transport_id, social_worker_id, workflow_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (
                case_id,
                workflow_data.get('status', 'pending'),
                workflow_data.get('current_step', ''),
                workflow_data.get('progress', 0),
                workflow_data.get('shelter_id'),
                workflow_data.get('transport_id'),
                workflow_data.get('social_worker_id'),
                json.dumps(workflow_data)
            ))
        
        conn.commit()
        cursor.close()
        local_db.return_connection(conn)
        print(f"✅ Workflow saved to local PostgreSQL: {case_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving workflow: {e}")
        return False

def get_workflow(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get workflow from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return None
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM workflows WHERE case_id = %s", (case_id,))
        workflow = cursor.fetchone()
        
        cursor.close()
        local_db.return_connection(conn)
        
        if workflow:
            workflow_dict = dict(workflow)
            # Parse JSON workflow_data if it exists
            if workflow_dict.get('workflow_data'):
                workflow_dict['workflow_data'] = json.loads(workflow_dict['workflow_data'])
            return workflow_dict
        return None
        
    except Exception as e:
        print(f"❌ Error getting workflow: {e}")
        return None

def list_workflows() -> List[Dict[str, Any]]:
    """
    List all workflows from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM workflows ORDER BY created_at DESC")
        workflows = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        result = []
        for workflow in workflows:
            workflow_dict = dict(workflow)
            # Parse JSON workflow_data if it exists
            if workflow_dict.get('workflow_data'):
                workflow_dict['workflow_data'] = json.loads(workflow_dict['workflow_data'])
            result.append(workflow_dict)
        
        return result
        
    except Exception as e:
        print(f"❌ Error listing workflows: {e}")
        return []


# ============================================
# SHELTER OPERATIONS
# ============================================

def get_shelters() -> List[Dict[str, Any]]:
    """
    Get all shelters from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM shelters ORDER BY name")
        shelters = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        return [dict(shelter) for shelter in shelters]
        
    except Exception as e:
        print(f"❌ Error getting shelters: {e}")
        return []

def update_shelter_availability(shelter_id: int, available_beds: int) -> bool:
    """
    Update shelter availability in local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return False
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE shelters SET available_beds = %s WHERE id = %s",
            (available_beds, shelter_id)
        )
        conn.commit()
        
        cursor.close()
        local_db.return_connection(conn)
        return True
        
    except Exception as e:
        print(f"❌ Error updating shelter availability: {e}")
        return False


# ============================================
# TRANSPORT OPERATIONS
# ============================================

def get_transport_options() -> List[Dict[str, Any]]:
    """
    Get all transport options from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM transport ORDER BY name")
        transport = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        return [dict(t) for t in transport]
        
    except Exception as e:
        print(f"❌ Error getting transport options: {e}")
        return []


# ============================================
# BENEFITS OPERATIONS
# ============================================

def get_benefits_programs() -> List[Dict[str, Any]]:
    """
    Get all benefits programs from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM benefits ORDER BY name")
        benefits = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        return [dict(benefit) for benefit in benefits]
        
    except Exception as e:
        print(f"❌ Error getting benefits programs: {e}")
        return []


# ============================================
# RESOURCES OPERATIONS
# ============================================

def get_community_resources() -> List[Dict[str, Any]]:
    """
    Get all community resources from local PostgreSQL
    """
    if not DATABASE_AVAILABLE:
        return []
    
    try:
        conn = local_db.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM resources ORDER BY name")
        resources = cursor.fetchall()
        
        cursor.close()
        local_db.return_connection(conn)
        
        return [dict(resource) for resource in resources]
        
    except Exception as e:
        print(f"❌ Error getting community resources: {e}")
        return []
