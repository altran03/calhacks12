#!/usr/bin/env python3
"""
Test script to verify Vapi integration with real environment variables
"""

import os
import asyncio
from vapi_integration_demo import VapiIntegration

async def test_vapi_integration():
    """Test the Vapi integration with real environment variables"""
    print("🧪 Testing Vapi Integration with Real Environment Variables")
    print("=" * 60)
    
    # Check environment variables
    api_key = os.getenv("VAPI_API_KEY")
    demo_phone = os.getenv("DEMO_PHONE_NUMBER")
    
    print(f"🔑 VAPI_API_KEY: {'SET' if api_key else 'NOT SET'}")
    print(f"📞 DEMO_PHONE_NUMBER: {demo_phone or 'NOT SET'}")
    
    if not api_key:
        print("❌ VAPI_API_KEY environment variable is required")
        print("Please set: export VAPI_API_KEY='your_real_vapi_api_key'")
        return False
    
    if not demo_phone:
        print("❌ DEMO_PHONE_NUMBER environment variable is required")
        print("Please set: export DEMO_PHONE_NUMBER='+1YOUR_PHONE_NUMBER'")
        return False
    
    try:
        # Initialize Vapi integration
        vapi = VapiIntegration()
        
        print(f"\n🎯 Testing shelter availability call...")
        result = vapi.make_shelter_availability_call(
            shelter_phone="(415) 555-0000",
            shelter_name="Harbor Light Center"
        )
        
        print(f"📊 Result: {result}")
        
        if result.get("error"):
            print(f"❌ Vapi call failed: {result['error']}")
            return False
        else:
            print("✅ Vapi call successful!")
            return True
            
    except Exception as e:
        print(f"❌ Error testing Vapi integration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_vapi_integration())
    if success:
        print("\n✅ Vapi integration test passed!")
    else:
        print("\n❌ Vapi integration test failed!")
