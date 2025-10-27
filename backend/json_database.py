"""
JSON File-based Database Module
Replaces PostgreSQL/SQLite with JSON files for simple data persistence
All data stored in /data folder as JSON files
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import uuid

# Data directory path
DATA_DIR = Path(__file__).parent.parent / "data"

# JSON file paths
CASES_FILE = DATA_DIR / "cases.json"
WORKFLOWS_FILE = DATA_DIR / "workflows.json"
SHELTERS_FILE = DATA_DIR / "shelters.json"
TRANSPORT_FILE = DATA_DIR / "transport.json"
BENEFITS_FILE = DATA_DIR / "benefits.json"
RESOURCES_FILE = DATA_DIR / "resources.json"

class JSONDatabase:
    def __init__(self):
        """Initialize JSON database - create data directory and files if they don't exist"""
        self._ensure_data_directory()
        self._initialize_json_files()
    
    def _ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        DATA_DIR.mkdir(exist_ok=True)
        print(f"✅ Data directory ready: {DATA_DIR}")
    
    def _initialize_json_files(self):
        """Initialize JSON files with empty arrays if they don't exist"""
        files_to_init = [
            (CASES_FILE, []),
            (WORKFLOWS_FILE, []),
            (SHELTERS_FILE, []),
            (TRANSPORT_FILE, []),
            (BENEFITS_FILE, []),
            (RESOURCES_FILE, [])
        ]
        
        for file_path, default_data in files_to_init:
            if not file_path.exists():
                self._write_json_file(file_path, default_data)
                print(f"✅ Created {file_path.name}")
    
    def _read_json_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Read JSON file and return as list of dictionaries"""
        try:
            if not file_path.exists():
                return []
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"❌ Error reading {file_path.name}: {e}")
            return []
    
    def _write_json_file(self, file_path: Path, data: List[Dict[str, Any]]) -> bool:
        """Write data to JSON file"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            return True
        except Exception as e:
            print(f"❌ Error writing {file_path.name}: {e}")
            return False
    
    def _generate_id(self) -> str:
        """Generate a unique ID"""
        return str(uuid.uuid4())
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp as ISO string"""
        return datetime.now().isoformat()

# Initialize global database instance
json_db = JSONDatabase()
DATABASE_AVAILABLE = True
print("✅ JSON Database module initialized")

# ============================================
# FORM DRAFT OPERATIONS (Cases)
# ============================================

def save_form_draft(case_id: str, form_data: Dict[str, Any]) -> bool:
    """
    Save or update a form draft in JSON database
    """
    try:
        cases = json_db._read_json_file(CASES_FILE)
        
        # Check if case exists
        existing_case_index = None
        for i, case in enumerate(cases):
            if case.get('case_id') == case_id:
                existing_case_index = i
                break
        
        # Prepare case data
        case_data = {
            'id': cases[existing_case_index]['id'] if existing_case_index is not None else json_db._generate_id(),
            'case_id': case_id,
            'patient_name': form_data.get('name', ''),
            'medical_record_number': form_data.get('medicalRecordNumber', ''),
            'date_of_birth': form_data.get('dateOfBirth', ''),
            'phone_1': form_data.get('phone1', ''),
            'phone_2': form_data.get('phone2', ''),
            'address': form_data.get('address', ''),
            'city': form_data.get('city', ''),
            'state': form_data.get('state', ''),
            'zip': form_data.get('zip', ''),
            'emergency_contact_name': form_data.get('emergencyContactName', ''),
            'emergency_contact_relationship': form_data.get('emergencyContactRelationship', ''),
            'emergency_contact_phone': form_data.get('emergencyContactPhone', ''),
            'created_at': cases[existing_case_index]['created_at'] if existing_case_index is not None else json_db._get_current_timestamp(),
            'updated_at': json_db._get_current_timestamp()
        }
        
        if existing_case_index is not None:
            # Update existing case
            cases[existing_case_index] = case_data
        else:
            # Add new case
            cases.append(case_data)
        
        success = json_db._write_json_file(CASES_FILE, cases)
        if success:
            print(f"✅ Form draft saved to JSON database: {case_id}")
        return success
        
    except Exception as e:
        print(f"❌ Error saving form draft: {e}")
        return False

def get_form_draft(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get form draft from JSON database
    """
    try:
        cases = json_db._read_json_file(CASES_FILE)
        
        for case in cases:
            if case.get('case_id') == case_id:
                return case
        return None
        
    except Exception as e:
        print(f"❌ Error getting form draft: {e}")
        return None

def list_form_drafts() -> List[Dict[str, Any]]:
    """
    List all form drafts from JSON database (most recent first)
    """
    try:
        cases = json_db._read_json_file(CASES_FILE)
        # Sort by updated_at descending
        cases.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return cases
        
    except Exception as e:
        print(f"❌ Error listing form drafts: {e}")
        return []

def delete_form_draft(case_id: str) -> bool:
    """
    Delete form draft from JSON database
    """
    try:
        cases = json_db._read_json_file(CASES_FILE)
        
        # Find and remove case
        cases = [case for case in cases if case.get('case_id') != case_id]
        
        success = json_db._write_json_file(CASES_FILE, cases)
        if success:
            print(f"✅ Form draft deleted from JSON database: {case_id}")
        return success
        
    except Exception as e:
        print(f"❌ Error deleting form draft: {e}")
        return False

# ============================================
# WORKFLOW OPERATIONS
# ============================================

def save_workflow(case_id: str, workflow_data: Dict[str, Any]) -> bool:
    """
    Save workflow to JSON database
    """
    try:
        workflows = json_db._read_json_file(WORKFLOWS_FILE)
        
        # Check if workflow exists
        existing_workflow_index = None
        for i, workflow in enumerate(workflows):
            if workflow.get('case_id') == case_id:
                existing_workflow_index = i
                break
        
        # Prepare workflow data
        workflow_record = {
            'id': workflows[existing_workflow_index]['id'] if existing_workflow_index is not None else json_db._generate_id(),
            'case_id': case_id,
            'status': workflow_data.get('status', 'pending'),
            'current_step': workflow_data.get('current_step', ''),
            'progress': workflow_data.get('progress', 0),
            'shelter_id': workflow_data.get('shelter_id'),
            'transport_id': workflow_data.get('transport_id'),
            'social_worker_id': workflow_data.get('social_worker_id'),
            'workflow_data': workflow_data,
            'created_at': workflows[existing_workflow_index]['created_at'] if existing_workflow_index is not None else json_db._get_current_timestamp(),
            'updated_at': json_db._get_current_timestamp()
        }
        
        if existing_workflow_index is not None:
            # Update existing workflow
            workflows[existing_workflow_index] = workflow_record
        else:
            # Add new workflow
            workflows.append(workflow_record)
        
        success = json_db._write_json_file(WORKFLOWS_FILE, workflows)
        if success:
            print(f"✅ Workflow saved to JSON database: {case_id}")
        return success
        
    except Exception as e:
        print(f"❌ Error saving workflow: {e}")
        return False

def get_workflow(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get workflow from JSON database
    """
    try:
        workflows = json_db._read_json_file(WORKFLOWS_FILE)
        
        for workflow in workflows:
            if workflow.get('case_id') == case_id:
                return workflow
        return None
        
    except Exception as e:
        print(f"❌ Error getting workflow: {e}")
        return None

def list_workflows() -> List[Dict[str, Any]]:
    """
    List all workflows from JSON database (most recent first)
    """
    try:
        workflows = json_db._read_json_file(WORKFLOWS_FILE)
        # Sort by created_at descending
        workflows.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return workflows
        
    except Exception as e:
        print(f"❌ Error listing workflows: {e}")
        return []

# ============================================
# SHELTER OPERATIONS
# ============================================

def get_shelters() -> List[Dict[str, Any]]:
    """
    Get all shelters from JSON database
    """
    try:
        shelters = json_db._read_json_file(SHELTERS_FILE)
        return shelters
        
    except Exception as e:
        print(f"❌ Error getting shelters: {e}")
        return []

def add_shelter(shelter_data: Dict[str, Any]) -> bool:
    """
    Add a new shelter to JSON database
    """
    try:
        shelters = json_db._read_json_file(SHELTERS_FILE)
        
        shelter_record = {
            'id': json_db._generate_id(),
            'name': shelter_data.get('name', ''),
            'address': shelter_data.get('address', ''),
            'capacity': shelter_data.get('capacity', 0),
            'available_beds': shelter_data.get('available_beds', 0),
            'accessibility': shelter_data.get('accessibility', False),
            'phone': shelter_data.get('phone', ''),
            'services': shelter_data.get('services', []),
            'latitude': shelter_data.get('latitude'),
            'longitude': shelter_data.get('longitude'),
            'created_at': json_db._get_current_timestamp()
        }
        
        shelters.append(shelter_record)
        success = json_db._write_json_file(SHELTERS_FILE, shelters)
        if success:
            print(f"✅ Shelter added to JSON database: {shelter_data.get('name')}")
        return success
        
    except Exception as e:
        print(f"❌ Error adding shelter: {e}")
        return False

def update_shelter_availability(shelter_id: str, available_beds: int) -> bool:
    """
    Update shelter availability in JSON database
    """
    try:
        shelters = json_db._read_json_file(SHELTERS_FILE)
        
        for shelter in shelters:
            if shelter.get('id') == shelter_id:
                shelter['available_beds'] = available_beds
                break
        
        success = json_db._write_json_file(SHELTERS_FILE, shelters)
        if success:
            print(f"✅ Shelter availability updated: {shelter_id}")
        return success
        
    except Exception as e:
        print(f"❌ Error updating shelter availability: {e}")
        return False

# ============================================
# TRANSPORT OPERATIONS
# ============================================

def get_transport_options() -> List[Dict[str, Any]]:
    """
    Get all transport options from JSON database
    """
    try:
        transport = json_db._read_json_file(TRANSPORT_FILE)
        return transport
        
    except Exception as e:
        print(f"❌ Error getting transport options: {e}")
        return []

def add_transport_option(transport_data: Dict[str, Any]) -> bool:
    """
    Add a new transport option to JSON database
    """
    try:
        transport = json_db._read_json_file(TRANSPORT_FILE)
        
        transport_record = {
            'id': json_db._generate_id(),
            'name': transport_data.get('name', ''),
            'type': transport_data.get('type', ''),
            'phone': transport_data.get('phone', ''),
            'availability': transport_data.get('availability', ''),
            'cost': transport_data.get('cost', 0.0),
            'accessibility': transport_data.get('accessibility', False),
            'created_at': json_db._get_current_timestamp()
        }
        
        transport.append(transport_record)
        success = json_db._write_json_file(TRANSPORT_FILE, transport)
        if success:
            print(f"✅ Transport option added to JSON database: {transport_data.get('name')}")
        return success
        
    except Exception as e:
        print(f"❌ Error adding transport option: {e}")
        return False

# ============================================
# BENEFITS OPERATIONS
# ============================================

def get_benefits_programs() -> List[Dict[str, Any]]:
    """
    Get all benefits programs from JSON database
    """
    try:
        benefits = json_db._read_json_file(BENEFITS_FILE)
        return benefits
        
    except Exception as e:
        print(f"❌ Error getting benefits programs: {e}")
        return []

def add_benefits_program(benefits_data: Dict[str, Any]) -> bool:
    """
    Add a new benefits program to JSON database
    """
    try:
        benefits = json_db._read_json_file(BENEFITS_FILE)
        
        benefits_record = {
            'id': json_db._generate_id(),
            'name': benefits_data.get('name', ''),
            'type': benefits_data.get('type', ''),
            'eligibility': benefits_data.get('eligibility', ''),
            'application_url': benefits_data.get('application_url', ''),
            'phone': benefits_data.get('phone', ''),
            'created_at': json_db._get_current_timestamp()
        }
        
        benefits.append(benefits_record)
        success = json_db._write_json_file(BENEFITS_FILE, benefits)
        if success:
            print(f"✅ Benefits program added to JSON database: {benefits_data.get('name')}")
        return success
        
    except Exception as e:
        print(f"❌ Error adding benefits program: {e}")
        return False

# ============================================
# RESOURCES OPERATIONS
# ============================================

def get_community_resources() -> List[Dict[str, Any]]:
    """
    Get all community resources from JSON database
    """
    try:
        resources = json_db._read_json_file(RESOURCES_FILE)
        return resources
        
    except Exception as e:
        print(f"❌ Error getting community resources: {e}")
        return []

def add_community_resource(resource_data: Dict[str, Any]) -> bool:
    """
    Add a new community resource to JSON database
    """
    try:
        resources = json_db._read_json_file(RESOURCES_FILE)
        
        resource_record = {
            'id': json_db._generate_id(),
            'name': resource_data.get('name', ''),
            'type': resource_data.get('type', ''),
            'address': resource_data.get('address', ''),
            'phone': resource_data.get('phone', ''),
            'services': resource_data.get('services', []),
            'latitude': resource_data.get('latitude'),
            'longitude': resource_data.get('longitude'),
            'created_at': json_db._get_current_timestamp()
        }
        
        resources.append(resource_record)
        success = json_db._write_json_file(RESOURCES_FILE, resources)
        if success:
            print(f"✅ Community resource added to JSON database: {resource_data.get('name')}")
        return success
        
    except Exception as e:
        print(f"❌ Error adding community resource: {e}")
        return False
