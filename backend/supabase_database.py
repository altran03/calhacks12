"""
Supabase Database Module - Replaces local SQLite database
All data (form drafts, workflows, patient data) stored in Supabase cloud database
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import json

# Import case_manager which has Supabase client
try:
    from case_manager import case_manager
    SUPABASE_AVAILABLE = case_manager.client is not None
    if SUPABASE_AVAILABLE:
        print("✅ Supabase Database module initialized")
    else:
        print("⚠️  Supabase not available - database operations will fail")
except ImportError as e:
    SUPABASE_AVAILABLE = False
    case_manager = None
    print(f"⚠️  Case Manager not available: {e}")


# ============================================
# FORM DRAFT OPERATIONS (Replacing SQLite)
# ============================================

def save_form_draft(case_id: str, form_data: Dict[str, Any]) -> bool:
    """
    Save or update a form draft in Supabase
    Replaces the old SQLite save_form_draft function
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot save form draft")
        return False
    
    try:
        # Check if case exists
        existing_case = case_manager.client.table('cases').select('id').eq('case_id', case_id).execute()
        
        # Map form data to Supabase case structure
        case_data = {
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
            'discharging_facility': form_data.get('dischargingFacility', ''),
            'discharging_facility_phone': form_data.get('dischargingFacilityPhone', ''),
            'planned_discharge_date': form_data.get('dischargeDateTime', ''),
            'discharged_to': form_data.get('plannedDestination', ''),
            'patient_data': form_data,  # Store full form data as JSONB
            'updated_at': datetime.now().isoformat()
        }
        
        if existing_case.data:
            # Update existing case
            case_manager.client.table('cases').update(case_data).eq('case_id', case_id).execute()
            print(f"✅ Form draft updated in Supabase for case {case_id}")
        else:
            # Insert new case
            case_data['workflow_status'] = 'draft'
            case_data['current_step'] = 'intake'
            case_data['created_at'] = datetime.now().isoformat()
            case_manager.client.table('cases').insert(case_data).execute()
            print(f"✅ Form draft created in Supabase for case {case_id}")
        
        return True
    except Exception as e:
        print(f"❌ Error saving form draft to Supabase: {e}")
        return False


def get_form_draft(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a form draft from Supabase by case_id
    Replaces the old SQLite get_form_draft function
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot get form draft")
        return None
    
    try:
        response = case_manager.client.table('cases').select('patient_data, updated_at').eq('case_id', case_id).single().execute()
        
        if response.data:
            form_data = response.data.get('patient_data', {})
            form_data['_last_saved'] = response.data.get('updated_at')
            print(f"✅ Loaded form draft from Supabase for case {case_id}")
            return form_data
        return None
    except Exception as e:
        print(f"❌ Error getting form draft from Supabase: {e}")
        return None


def list_form_drafts(limit: int = 50) -> List[Dict[str, Any]]:
    """
    List all form drafts from Supabase (most recent first)
    Replaces the old SQLite list_form_drafts function
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot list form drafts")
        return []
    
    try:
        response = case_manager.client.table('cases').select('case_id, updated_at').order('updated_at', desc=True).limit(limit).execute()
        
        drafts = [{"case_id": case['case_id'], "updated_at": case['updated_at']} for case in response.data]
        print(f"✅ Loaded {len(drafts)} form drafts from Supabase")
        return drafts
    except Exception as e:
        print(f"❌ Error listing form drafts from Supabase: {e}")
        return []


def delete_form_draft(case_id: str) -> bool:
    """
    Delete a form draft from Supabase
    Replaces the old SQLite delete_form_draft function
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot delete form draft")
        return False
    
    try:
        case_manager.client.table('cases').delete().eq('case_id', case_id).execute()
        print(f"✅ Deleted form draft from Supabase for case {case_id}")
        return True
    except Exception as e:
        print(f"❌ Error deleting form draft from Supabase: {e}")
        return False


# ============================================
# WORKFLOW DATA OPERATIONS
# ============================================

def save_workflow(case_id: str, workflow_data: Dict[str, Any]) -> bool:
    """
    Save workflow status and timeline to Supabase
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot save workflow")
        return False
    
    try:
        # Update case with workflow status
        case_update = {
            'workflow_status': workflow_data.get('status', 'initiated'),
            'current_step': workflow_data.get('current_step', ''),
            'updated_at': datetime.now().isoformat()
        }
        
        # Add assigned resources if available
        if 'shelter' in workflow_data and workflow_data['shelter']:
            # Find shelter ID by name
            shelter_response = case_manager.client.table('shelters').select('id').eq('name', workflow_data['shelter']['name']).execute()
            if shelter_response.data:
                case_update['assigned_shelter_id'] = shelter_response.data[0]['id']
        
        if 'transport' in workflow_data and workflow_data['transport']:
            case_update['assigned_transport_provider'] = workflow_data['transport'].get('provider', '')
        
        case_manager.client.table('cases').update(case_update).eq('case_id', case_id).execute()
        
        # Save workflow timeline events
        if 'timeline' in workflow_data:
            for event in workflow_data['timeline']:
                try:
                    event_data = {
                        'case_id': case_id,
                        'step': event.get('step', ''),
                        'agent': event.get('agent', ''),
                        'status': event.get('status', 'in_progress'),
                        'description': event.get('description', ''),
                        'logs': event.get('logs', []),
                        'timestamp': event.get('timestamp', datetime.now().isoformat())
                    }
                    case_manager.client.table('workflow_events').insert(event_data).execute()
                except Exception as event_error:
                    print(f"⚠️  Error saving timeline event: {event_error}")
        
        print(f"✅ Workflow saved to Supabase for case {case_id}")
        return True
    except Exception as e:
        print(f"❌ Error saving workflow to Supabase: {e}")
        return False


def get_workflow(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Get workflow status and timeline from Supabase
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot get workflow")
        return None
    
    try:
        # Get case data
        case_response = case_manager.client.table('cases').select('*').eq('case_id', case_id).single().execute()
        
        if not case_response.data:
            return None
        
        case_data = case_response.data
        
        # Get workflow events
        events_response = case_manager.client.table('workflow_events').select('*').eq('case_id', case_id).order('timestamp').execute()
        
        # Get assigned shelter details if available
        shelter_data = None
        if case_data.get('assigned_shelter_id'):
            shelter_response = case_manager.client.table('shelters').select('*').eq('id', case_data['assigned_shelter_id']).single().execute()
            if shelter_response.data:
                shelter = shelter_response.data
                shelter_data = {
                    'name': shelter['name'],
                    'address': shelter['address'],
                    'capacity': shelter['capacity'],
                    'available_beds': shelter['available_beds'],
                    'accessibility': shelter['accessibility'],
                    'phone': shelter['phone'],
                    'services': shelter['services'],
                    'location': {
                        'lat': float(shelter.get('latitude', 37.7749)) if shelter.get('latitude') else 37.7749,
                        'lng': float(shelter.get('longitude', -122.4194)) if shelter.get('longitude') else -122.4194
                    }
                }
        
        # Construct workflow object
        workflow = {
            'case_id': case_id,
            'patient': case_data.get('patient_data', {}),
            'status': case_data.get('workflow_status', 'initiated'),
            'current_step': case_data.get('current_step', ''),
            'shelter': shelter_data,
            'transport': None,  # TODO: Parse from workflow events if needed
            'timeline': events_response.data,
            'created_at': case_data.get('created_at'),
            'updated_at': case_data.get('updated_at')
        }
        
        print(f"✅ Loaded workflow from Supabase for case {case_id}")
        return workflow
    except Exception as e:
        print(f"❌ Error getting workflow from Supabase: {e}")
        return None


def list_workflows(limit: int = 50) -> List[Dict[str, Any]]:
    """
    List all workflows from Supabase (most recent first)
    """
    if not SUPABASE_AVAILABLE:
        print("⚠️  Supabase not available, cannot list workflows")
        return []
    
    try:
        response = case_manager.client.table('cases').select('case_id, patient_name, workflow_status, current_step, created_at, updated_at').order('updated_at', desc=True).limit(limit).execute()
        
        workflows = response.data
        print(f"✅ Loaded {len(workflows)} workflows from Supabase")
        return workflows
    except Exception as e:
        print(f"❌ Error listing workflows from Supabase: {e}")
        return []


# ============================================
# INITIALIZATION
# ============================================

def init_database():
    """
    Initialize Supabase database (no-op, tables are created via SQL schema)
    Kept for backwards compatibility with old database.py
    """
    if SUPABASE_AVAILABLE:
        print("✅ Supabase database is ready (schema managed via SQL)")
    else:
        print("⚠️  Supabase not available - please configure SUPABASE_URL and SUPABASE_KEY")


# Call init on import (for backwards compatibility)
init_database()

