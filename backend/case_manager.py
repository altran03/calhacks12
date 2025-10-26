"""
Case Manager - Handles case storage and retrieval from Supabase
Integrates with scraped data (shelters, transport, benefits, resources)
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class CaseManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.client: Optional[Client] = None
        
        if self.supabase_url and self.supabase_key:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("✅ CaseManager initialized with Supabase")
            except Exception as e:
                print(f"❌ Error initializing CaseManager: {e}")
                self.client = None
        else:
            print("⚠️  Supabase credentials not found. Case management disabled.")
    
    # ============================================
    # CASE OPERATIONS
    # ============================================
    
    def create_case(self, case_data: Dict[str, Any]) -> Optional[str]:
        """Create a new case in Supabase"""
        if not self.client:
            return None
        
        try:
            case_record = {
                'case_id': case_data.get('case_id'),
                'patient_name': case_data.get('patient_name'),
                'medical_record_number': case_data.get('medical_record_number'),
                'date_of_birth': case_data.get('date_of_birth'),
                'phone_1': case_data.get('phone_1'),
                'phone_2': case_data.get('phone_2'),
                'address': case_data.get('address'),
                'city': case_data.get('city'),
                'state': case_data.get('state'),
                'zip': case_data.get('zip'),
                'discharging_facility': case_data.get('discharging_facility'),
                'discharging_facility_phone': case_data.get('discharging_facility_phone'),
                'planned_discharge_date': case_data.get('planned_discharge_date'),
                'discharged_to': case_data.get('discharged_to'),
                'workflow_status': 'initiated',
                'current_step': 'intake',
                'patient_data': case_data  # Store full data as JSON
            }
            
            response = self.client.table('cases').insert(case_record).execute()
            print(f"✅ Case {case_data.get('case_id')} created in Supabase")
            return case_data.get('case_id')
        except Exception as e:
            print(f"❌ Error creating case: {e}")
            return None
    
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Get case by case_id"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('cases').select('*').eq('case_id', case_id).single().execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting case {case_id}: {e}")
            return None
    
    def update_case_status(self, case_id: str, status: str, current_step: str = None):
        """Update case workflow status"""
        if not self.client:
            return False
        
        try:
            update_data = {'workflow_status': status}
            if current_step:
                update_data['current_step'] = current_step
            if status in ['coordinated', 'completed']:
                update_data['completed_at'] = datetime.now().isoformat()
            
            self.client.table('cases').update(update_data).eq('case_id', case_id).execute()
            print(f"✅ Case {case_id} status updated to {status}")
            return True
        except Exception as e:
            print(f"❌ Error updating case status: {e}")
            return False
    
    def assign_resources_to_case(self, case_id: str, shelter_id: str = None, 
                                 transport: str = None, benefits: List[str] = None):
        """Assign resources (shelter, transport, benefits) to a case"""
        if not self.client:
            return False
        
        try:
            update_data = {}
            if shelter_id:
                update_data['assigned_shelter_id'] = shelter_id
            if transport:
                update_data['assigned_transport_provider'] = transport
            if benefits:
                update_data['assigned_benefits'] = benefits
            
            self.client.table('cases').update(update_data).eq('case_id', case_id).execute()
            print(f"✅ Resources assigned to case {case_id}")
            return True
        except Exception as e:
            print(f"❌ Error assigning resources: {e}")
            return False
    
    def list_cases(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List all cases (most recent first)"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('cases').select('*').order('created_at', desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"❌ Error listing cases: {e}")
            return []
    
    # ============================================
    # FILE OPERATIONS
    # ============================================
    
    def add_file_to_case(self, case_id: str, filename: str, file_type: str, 
                        file_size: int, file_url: str = None) -> Optional[str]:
        """Add a file record to a case"""
        if not self.client:
            return None
        
        try:
            file_record = {
                'case_id': case_id,
                'filename': filename,
                'file_type': file_type,
                'file_size': file_size,
                'file_url': file_url,
                'processing_status': 'pending'
            }
            
            response = self.client.table('case_files').insert(file_record).execute()
            file_id = response.data[0]['id']
            print(f"✅ File {filename} added to case {case_id}")
            return file_id
        except Exception as e:
            print(f"❌ Error adding file: {e}")
            return None
    
    def update_file_processing(self, file_id: str, status: str, 
                              extracted_data: Dict = None, confidence: float = None):
        """Update file processing status"""
        if not self.client:
            return False
        
        try:
            update_data = {
                'processing_status': status,
                'processed_at': datetime.now().isoformat()
            }
            if extracted_data:
                update_data['extracted_data'] = extracted_data
            if confidence:
                update_data['confidence_score'] = confidence
            
            self.client.table('case_files').update(update_data).eq('id', file_id).execute()
            print(f"✅ File {file_id} processing updated")
            return True
        except Exception as e:
            print(f"❌ Error updating file: {e}")
            return False
    
    # ============================================
    # WORKFLOW EVENT OPERATIONS
    # ============================================
    
    def log_workflow_event(self, case_id: str, step: str, agent: str, 
                          status: str, description: str, logs: List[str]):
        """Log a workflow event"""
        if not self.client:
            return False
        
        try:
            event = {
                'case_id': case_id,
                'step': step,
                'agent': agent,
                'status': status,
                'description': description,
                'logs': logs
            }
            
            self.client.table('workflow_events').insert(event).execute()
            return True
        except Exception as e:
            print(f"❌ Error logging workflow event: {e}")
            return False
    
    def get_workflow_events(self, case_id: str) -> List[Dict[str, Any]]:
        """Get all workflow events for a case"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('workflow_events').select('*').eq('case_id', case_id).order('timestamp').execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting workflow events: {e}")
            return []
    
    # ============================================
    # AGENT ACTION LOGGING
    # ============================================
    
    def log_agent_action(self, case_id: str, agent_name: str, action_type: str,
                        target: str, request_data: Dict = None, response_data: Dict = None,
                        success: bool = True, error_message: str = None):
        """Log an agent action (for real agent interactions)"""
        if not self.client:
            return False
        
        try:
            action = {
                'case_id': case_id,
                'agent_name': agent_name,
                'action_type': action_type,
                'target': target,
                'request_data': request_data,
                'response_data': response_data,
                'success': success,
                'error_message': error_message
            }
            
            self.client.table('agent_actions').insert(action).execute()
            return True
        except Exception as e:
            print(f"❌ Error logging agent action: {e}")
            return False
    
    def get_agent_actions(self, case_id: str) -> List[Dict[str, Any]]:
        """Get all agent actions for a case"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('agent_actions').select('*').eq('case_id', case_id).order('timestamp').execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting agent actions: {e}")
            return []
    
    # ============================================
    # INTEGRATION WITH SCRAPED DATA
    # ============================================
    
    def find_suitable_shelter(self, case_id: str, accessibility_needed: bool = False,
                             min_beds: int = 1) -> Optional[Dict[str, Any]]:
        """Find a suitable shelter from scraped data"""
        if not self.client:
            return None
        
        try:
            query = self.client.table('shelters').select('*').gte('available_beds', min_beds)
            
            if accessibility_needed:
                query = query.eq('accessibility', True)
            
            response = query.limit(1).execute()
            
            if response.data:
                shelter = response.data[0]
                # Log the agent action
                self.log_agent_action(
                    case_id=case_id,
                    agent_name='shelter_agent',
                    action_type='query',
                    target='shelters_database',
                    request_data={'accessibility': accessibility_needed, 'min_beds': min_beds},
                    response_data=shelter,
                    success=True
                )
                return shelter
            return None
        except Exception as e:
            print(f"❌ Error finding shelter: {e}")
            return None
    
    def find_transport_options(self, case_id: str, accessible: bool = False) -> List[Dict[str, Any]]:
        """Find transport options from scraped data"""
        if not self.client:
            return []
        
        try:
            query = self.client.table('transport').select('*')
            
            # Note: Transport table uses 'features' array instead of 'accessibility' boolean
            # We'll filter in Python since Supabase doesn't have easy array contains for boolean logic
            
            response = query.execute()
            
            # Filter for accessible transport if requested
            filtered_data = response.data
            if accessible:
                filtered_data = [
                    t for t in response.data 
                    if t.get('features') and any('wheelchair' in str(f).lower() or 'accessible' in str(f).lower() 
                                               for f in t.get('features', []))
                ]
            
            # Log the agent action
            self.log_agent_action(
                case_id=case_id,
                agent_name='transport_agent',
                action_type='query',
                target='transport_database',
                request_data={'accessible': accessible},
                response_data={'count': len(filtered_data)},
                success=True
            )
            
            return filtered_data
        except Exception as e:
            print(f"❌ Error finding transport: {e}")
            return []
    
    def get_benefits_info(self, case_id: str) -> List[Dict[str, Any]]:
        """Get benefits information from scraped data"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('benefits').select('*').execute()
            
            # Log the agent action
            self.log_agent_action(
                case_id=case_id,
                agent_name='eligibility_agent',
                action_type='query',
                target='benefits_database',
                response_data={'count': len(response.data)},
                success=True
            )
            
            return response.data
        except Exception as e:
            print(f"❌ Error getting benefits: {e}")
            return []
    
    def get_community_resources(self, case_id: str, service_type: str = None) -> List[Dict[str, Any]]:
        """Get community resources from scraped data"""
        if not self.client:
            return []
        
        try:
            query = self.client.table('community_resources').select('*')
            
            # Filter by service type if specified
            # Note: This would require JSONB querying for the services array
            
            response = query.execute()
            
            # Log the agent action
            self.log_agent_action(
                case_id=case_id,
                agent_name='resource_agent',
                action_type='query',
                target='resources_database',
                request_data={'service_type': service_type},
                response_data={'count': len(response.data)},
                success=True
            )
            
            return response.data
        except Exception as e:
            print(f"❌ Error getting resources: {e}")
            return []

# Initialize global instance
case_manager = CaseManager()

