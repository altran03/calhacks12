"""
Supabase Client for CareLink
Handles caching of scraped data to reduce Bright Data costs
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseCache:
    """Manages caching of scraped data in Supabase"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            print("⚠️  Supabase credentials not found. Caching disabled.")
            self.client = None
        else:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            print("✅ Supabase client initialized")
    
    # =========================================================================
    # CACHE STATUS CHECKS
    # =========================================================================
    
    def is_cache_stale(self, category: str) -> bool:
        """Check if cached data needs to be refreshed"""
        if not self.client:
            return True  # Always scrape if no cache available
        
        try:
            response = self.client.rpc('is_cache_stale', {'p_category': category}).execute()
            return response.data if response.data is not None else True
        except Exception as e:
            print(f"❌ Error checking cache status: {e}")
            return True  # Default to stale if error
    
    def get_cache_status(self) -> List[Dict[str, Any]]:
        """Get status of all caches"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('cache_status').select('*').execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting cache status: {e}")
            return []
    
    # =========================================================================
    # SHELTERS
    # =========================================================================
    
    def get_shelters(self, only_available: bool = False) -> List[Dict[str, Any]]:
        """Get shelters from cache"""
        if not self.client:
            return []
        
        try:
            query = self.client.table('shelters').select('*')
            
            if only_available:
                query = query.gt('available_beds', 0)
            
            response = query.order('available_beds', desc=True).execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting shelters: {e}")
            return []
    
    def save_shelters(self, shelters: List[Dict[str, Any]]) -> bool:
        """Save shelters to cache"""
        if not self.client:
            return False
        
        try:
            # Delete old data
            self.client.table('shelters').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Insert new data
            for shelter in shelters:
                # Remove fields that don't exist in DB
                db_shelter = {
                    'name': shelter.get('name'),
                    'address': shelter.get('address'),
                    'phone': shelter.get('phone'),
                    'capacity': shelter.get('capacity'),
                    'available_beds': shelter.get('available_beds'),
                    'services': shelter.get('services', []),
                    'accessibility': shelter.get('accessibility', False),
                    'hours': shelter.get('hours'),
                    'eligibility': shelter.get('eligibility'),
                    'website': shelter.get('website'),
                    'source': shelter.get('source', 'web_scraping'),
                    'last_updated': datetime.now().isoformat()
                }
                
                self.client.table('shelters').upsert(db_shelter, on_conflict='name').execute()
            
            # Update cache metadata
            self.client.rpc('update_cache_metadata', {
                'p_category': 'shelters',
                'p_items_count': len(shelters)
            }).execute()
            
            print(f"✅ Saved {len(shelters)} shelters to cache")
            return True
            
        except Exception as e:
            print(f"❌ Error saving shelters: {e}")
            return False
    
    # =========================================================================
    # TRANSPORT
    # =========================================================================
    
    def get_transport(self, accessible_only: bool = False) -> List[Dict[str, Any]]:
        """Get transport options from cache"""
        if not self.client:
            return []
        
        try:
            if accessible_only:
                response = self.client.table('accessible_transport').select('*').execute()
            else:
                response = self.client.table('transport').select('*').order('provider').execute()
            
            return response.data
        except Exception as e:
            print(f"❌ Error getting transport: {e}")
            return []
    
    def save_transport(self, transport_options: List[Dict[str, Any]]) -> bool:
        """Save transport options to cache"""
        if not self.client:
            return False
        
        try:
            # Delete old data
            self.client.table('transport').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Insert new data
            for transport in transport_options:
                db_transport = {
                    'provider': transport.get('provider'),
                    'service_name': transport.get('service_name'),
                    'service_type': transport.get('service_type'),
                    'availability': transport.get('availability'),
                    'phone': transport.get('phone'),
                    'vehicle_types': transport.get('vehicle_types', []),
                    'hours': transport.get('hours'),
                    'coverage_area': transport.get('coverage_area'),
                    'eligibility': transport.get('eligibility'),
                    'features': transport.get('features', []),
                    'booking': transport.get('booking'),
                    'pricing': transport.get('pricing'),
                    'website': transport.get('website'),
                    'source': transport.get('source', 'web_scraping'),
                    'last_updated': datetime.now().isoformat()
                }
                
                self.client.table('transport').upsert(db_transport, on_conflict='provider,service_name').execute()
            
            # Update cache metadata
            self.client.rpc('update_cache_metadata', {
                'p_category': 'transport',
                'p_items_count': len(transport_options)
            }).execute()
            
            print(f"✅ Saved {len(transport_options)} transport options to cache")
            return True
            
        except Exception as e:
            print(f"❌ Error saving transport: {e}")
            return False
    
    # =========================================================================
    # BENEFITS
    # =========================================================================
    
    def get_benefits(self) -> Dict[str, Any]:
        """Get benefits from cache"""
        if not self.client:
            return {}
        
        try:
            response = self.client.table('benefits').select('*').execute()
            
            # Convert list to dict keyed by program_name
            benefits_dict = {}
            for benefit in response.data:
                program_name = benefit.pop('program_name')
                benefit.pop('id', None)
                benefit.pop('created_at', None)
                benefits_dict[program_name] = benefit
            
            return benefits_dict
        except Exception as e:
            print(f"❌ Error getting benefits: {e}")
            return {}
    
    def save_benefits(self, benefits: Dict[str, Any]) -> bool:
        """Save benefits to cache"""
        if not self.client:
            return False
        
        try:
            # Delete old data
            self.client.table('benefits').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Insert new data
            for program_name, program_data in benefits.items():
                db_benefit = {
                    'program_name': program_name,
                    'eligibility_criteria': program_data.get('eligibility_criteria', []),
                    'income_limits': program_data.get('income_limits', []),
                    'benefits': program_data.get('benefits', []),
                    'application_process': program_data.get('application_process', []),
                    'expedited_processing': program_data.get('expedited_processing', []),
                    'benefit_amount': program_data.get('benefit_amount'),
                    'required_documents': program_data.get('required_documents', []),
                    'contact_info': program_data.get('contact_info', []),
                    'website': program_data.get('website'),
                    'source': program_data.get('source', 'web_scraping'),
                    'last_updated': datetime.now().isoformat()
                }
                
                self.client.table('benefits').upsert(db_benefit, on_conflict='program_name').execute()
            
            # Update cache metadata
            self.client.rpc('update_cache_metadata', {
                'p_category': 'benefits',
                'p_items_count': len(benefits)
            }).execute()
            
            print(f"✅ Saved {len(benefits)} benefit programs to cache")
            return True
            
        except Exception as e:
            print(f"❌ Error saving benefits: {e}")
            return False
    
    # =========================================================================
    # COMMUNITY RESOURCES
    # =========================================================================
    
    def get_resources(self, resource_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get community resources from cache"""
        if not self.client:
            return []
        
        try:
            query = self.client.table('community_resources').select('*')
            
            if resource_type:
                query = query.eq('type', resource_type)
            
            response = query.order('name').execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting resources: {e}")
            return []
    
    def save_resources(self, resources: List[Dict[str, Any]]) -> bool:
        """Save community resources to cache"""
        if not self.client:
            return False
        
        try:
            # Delete old data
            self.client.table('community_resources').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Insert new data
            for resource in resources:
                db_resource = {
                    'name': resource.get('name'),
                    'type': resource.get('type'),
                    'address': resource.get('address'),
                    'phone': resource.get('phone'),
                    'services': resource.get('services', []),
                    'accessibility': resource.get('accessibility', False),
                    'hours': resource.get('hours'),
                    'eligibility': resource.get('eligibility'),
                    'website': resource.get('website'),
                    'description': resource.get('description'),
                    'source': resource.get('source', 'web_scraping'),
                    'last_updated': datetime.now().isoformat()
                }
                
                self.client.table('community_resources').upsert(db_resource, on_conflict='name').execute()
            
            # Update cache metadata
            self.client.rpc('update_cache_metadata', {
                'p_category': 'resources',
                'p_items_count': len(resources)
            }).execute()
            
            print(f"✅ Saved {len(resources)} resources to cache")
            return True
            
        except Exception as e:
            print(f"❌ Error saving resources: {e}")
            return False
    
    # =========================================================================
    # SCRAPING LOGS
    # =========================================================================
    
    def log_scraping(self, category: str, url: str, status: str, 
                     items_scraped: int = 0, error_message: str = None,
                     duration_seconds: float = 0) -> bool:
        """Log a scraping operation"""
        if not self.client:
            return False
        
        try:
            log_entry = {
                'category': category,
                'url': url,
                'status': status,
                'items_scraped': items_scraped,
                'error_message': error_message,
                'duration_seconds': duration_seconds,
                'scraped_at': datetime.now().isoformat()
            }
            
            self.client.table('scraping_logs').insert(log_entry).execute()
            return True
            
        except Exception as e:
            print(f"❌ Error logging scraping: {e}")
            return False
    
    def get_scraping_logs(self, category: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent scraping logs"""
        if not self.client:
            return []
        
        try:
            query = self.client.table('scraping_logs').select('*')
            
            if category:
                query = query.eq('category', category)
            
            response = query.order('scraped_at', desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"❌ Error getting scraping logs: {e}")
            return []

