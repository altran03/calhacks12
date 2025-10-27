#!/usr/bin/env python3
"""
Simple test to verify agent communication is working
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_agent_communication():
    """Test if agents can communicate"""
    print("🧪 Testing agent communication...")
    
    try:
        # Import the agent communication system
        from agents.fetchai_agent_communication import send_agent_message, log_agent_response
        
        print("✅ Agent communication system imported successfully")
        
        # Test sending a message
        conv_id = await send_agent_message(
            "test_agent",
            "coordinator_agent", 
            "TestMessage",
            {"test": "Hello from test agent"}
        )
        
        print(f"✅ Message sent with conversation ID: {conv_id}")
        
        # Test logging a response
        await log_agent_response(
            conv_id,
            {"response": "Hello back from coordinator"},
            "completed"
        )
        
        print("✅ Response logged successfully")
        
        # Test getting conversations
        from agents.fetchai_agent_communication import get_agent_conversations
        conversations = get_agent_conversations()
        print(f"✅ Found {len(conversations)} conversations")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent communication test failed: {e}")
        return False

async def test_vapi_integration():
    """Test if Vapi integration is working"""
    print("🧪 Testing Vapi integration...")
    
    try:
        # Check environment variables
        vapi_key = os.getenv("VAPI_API_KEY")
        demo_phone = os.getenv("DEMO_PHONE_NUMBER") or os.getenv("TEST_PHONE_NUMBER")
        
        print(f"🔑 Vapi API Key: {'SET' if vapi_key else 'NOT SET'}")
        print(f"📞 Demo Phone: {'SET' if demo_phone else 'NOT SET'}")
        
        if not vapi_key:
            print("❌ VAPI_API_KEY not set")
            return False
            
        if not demo_phone:
            print("❌ DEMO_PHONE_NUMBER not set")
            return False
            
        # Test Vapi integration import
        from vapi_integration_demo import VapiIntegration
        
        vapi = VapiIntegration(
            api_key=vapi_key,
            demo_phone=demo_phone,
            demo_mode=True
        )
        
        print("✅ Vapi integration imported successfully")
        return True
        
    except Exception as e:
        print(f"❌ Vapi integration test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting agent communication tests...")
    print("=" * 60)
    
    # Test agent communication
    comm_success = await test_agent_communication()
    
    print("\n" + "=" * 60)
    
    # Test Vapi integration
    vapi_success = await test_vapi_integration()
    
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print(f"Agent Communication: {'✅ PASS' if comm_success else '❌ FAIL'}")
    print(f"Vapi Integration: {'✅ PASS' if vapi_success else '❌ FAIL'}")
    
    if comm_success and vapi_success:
        print("\n🎉 All tests passed! Agents should be working.")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
