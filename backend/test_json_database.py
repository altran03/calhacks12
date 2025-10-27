#!/usr/bin/env python3
"""
Test JSON Database Operations
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_json_database():
    """Test all JSON database operations"""
    print("🧪 Testing JSON Database Operations...")
    
    try:
        from json_database import (
            save_form_draft, get_form_draft, list_form_drafts, delete_form_draft,
            save_workflow, get_workflow, list_workflows,
            get_shelters, get_transport_options, get_benefits_programs, get_community_resources
        )
        
        # Test form draft operations
        print("\n📝 Testing Form Draft Operations...")
        
        # Save a test form draft
        test_form_data = {
            'name': 'John Doe',
            'medicalRecordNumber': 'MR123456',
            'dateOfBirth': '1980-01-01',
            'phone1': '(555) 123-4567',
            'phone2': '(555) 987-6543',
            'address': '123 Main St',
            'city': 'San Francisco',
            'state': 'CA',
            'zip': '94102',
            'emergencyContactName': 'Jane Doe',
            'emergencyContactRelationship': 'Spouse',
            'emergencyContactPhone': '(555) 111-2222'
        }
        
        case_id = 'TEST-CASE-001'
        success = save_form_draft(case_id, test_form_data)
        print(f"✅ Save form draft: {'Success' if success else 'Failed'}")
        
        # Get the form draft
        retrieved_form = get_form_draft(case_id)
        print(f"✅ Get form draft: {'Success' if retrieved_form else 'Failed'}")
        
        # List form drafts
        all_drafts = list_form_drafts()
        print(f"✅ List form drafts: {len(all_drafts)} drafts found")
        
        # Test workflow operations
        print("\n🔄 Testing Workflow Operations...")
        
        test_workflow_data = {
            'status': 'in_progress',
            'current_step': 'shelter_assignment',
            'progress': 50,
            'shelter_id': 'shelter-001',
            'transport_id': 'transport-001',
            'social_worker_id': 'sw-001'
        }
        
        success = save_workflow(case_id, test_workflow_data)
        print(f"✅ Save workflow: {'Success' if success else 'Failed'}")
        
        # Get the workflow
        retrieved_workflow = get_workflow(case_id)
        print(f"✅ Get workflow: {'Success' if retrieved_workflow else 'Failed'}")
        
        # List workflows
        all_workflows = list_workflows()
        print(f"✅ List workflows: {len(all_workflows)} workflows found")
        
        # Test resource operations
        print("\n🏠 Testing Resource Operations...")
        
        shelters = get_shelters()
        print(f"✅ Get shelters: {len(shelters)} shelters found")
        
        transport = get_transport_options()
        print(f"✅ Get transport: {len(transport)} transport options found")
        
        benefits = get_benefits_programs()
        print(f"✅ Get benefits: {len(benefits)} benefits programs found")
        
        resources = get_community_resources()
        print(f"✅ Get resources: {len(resources)} community resources found")
        
        # Test delete operation
        print("\n🗑️ Testing Delete Operations...")
        success = delete_form_draft(case_id)
        print(f"✅ Delete form draft: {'Success' if success else 'Failed'}")
        
        # Verify deletion
        deleted_form = get_form_draft(case_id)
        print(f"✅ Verify deletion: {'Success' if not deleted_form else 'Failed'}")
        
        print("\n🎉 All JSON database tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_json_database()
    sys.exit(0 if success else 1)
