#!/usr/bin/env python3
"""
Test script to verify Fetch.ai agents are working
"""

import os
import asyncio
from agents.shelter_agent import shelter_agent
from agents.models import ShelterMatch

async def test_shelter_agent():
    """Test the shelter agent with Vapi integration"""
    print("🧪 Testing Shelter Agent with Vapi Integration")
    print("=" * 50)
    
    # Set environment variables
    os.environ["VAPI_API_KEY"] = "demo_key"
    os.environ["DEMO_PHONE_NUMBER"] = "+11234567890"
    os.environ["DEMO_MODE"] = "True"
    
    # Create a test shelter match
    shelter_match = ShelterMatch(
        case_id="TEST_CASE_001",
        shelter_name="Harbor Light Center",
        address="1275 Howard St, San Francisco, CA 94103",
        phone="(415) 555-0000",
        available_beds=12,
        accessibility=True,
        services=["medical_respite", "wheelchair_access", "case_management"]
    )
    
    print(f"📋 Test Case ID: {shelter_match.case_id}")
    print(f"🏠 Shelter: {shelter_match.shelter_name}")
    print(f"📱 Phone: {shelter_match.phone}")
    print(f"🔑 Vapi API Key: {os.getenv('VAPI_API_KEY', 'NOT_SET')}")
    print(f"📞 Demo Phone: {os.getenv('DEMO_PHONE_NUMBER', 'NOT_SET')}")
    
    # Test Vapi integration directly
    try:
        from agents.shelter_agent import verify_shelter_availability_via_vapi
        
        print("\n🎯 Testing Vapi integration...")
        result = await verify_shelter_availability_via_vapi(shelter_match)
        
        if result:
            print("✅ Vapi integration test successful")
        else:
            print("❌ Vapi integration test failed")
            
    except Exception as e:
        print(f"❌ Error testing Vapi integration: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("🧪 Test completed")

if __name__ == "__main__":
    asyncio.run(test_shelter_agent())
