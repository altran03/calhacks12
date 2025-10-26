#!/usr/bin/env python3
"""Test VAPI call directly"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
TEST_PHONE = os.getenv("TEST_PHONE_NUMBER", "")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID", "")
VAPI_BASE_URL = "https://api.vapi.ai"

if not VAPI_API_KEY:
    print("❌ VAPI_API_KEY not set in .env")
    sys.exit(1)

if not TEST_PHONE:
    print("❌ TEST_PHONE_NUMBER not set in .env")
    print("   Add: TEST_PHONE_NUMBER=+14155551234")
    sys.exit(1)

if not VAPI_PHONE_NUMBER_ID:
    print("❌ VAPI_PHONE_NUMBER_ID not set in .env")
    print("   1. Go to VAPI Dashboard → Phone Numbers")
    print("   2. Copy the phone number ID")
    print("   3. Add to .env: VAPI_PHONE_NUMBER_ID=your_id_here")
    sys.exit(1)

print(f"📞 Testing VAPI call to: {TEST_PHONE}")
print(f"🔑 Using API key: {VAPI_API_KEY[:10]}...")
print(f"\n⚠️  Note: You need to first:")
print(f"1. Get a phone number ID from VAPI Dashboard → Phone Numbers")
print(f"2. Use phoneNumberId instead of customer.number")
print(f"\nUsing VAPI API format from: https://docs.vapi.ai/api-reference/calls/create\n")

# VAPI API format from https://docs.vapi.ai/api-reference/calls/create
# First, you need a phoneNumberId from your VAPI dashboard
conversation = {
    "phoneNumberId": VAPI_PHONE_NUMBER_ID,
    "customer": {
        "number": TEST_PHONE
    },
    "name": "CareLink Patient Discharge",
    "assistant": {
        "name": "CareLink Shelter Coordinator",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": """You are calling a homeless shelter to check bed availability for a patient being discharged from the hospital tonight.

Patient Information:
- Name: John Doe
- Medical Condition: Diabetic
- Accessibility Needs: Wheelchair user
- Medications: Insulin

Your task:
1. Greet and introduce yourself as calling from CareLink healthcare
2. Ask: "Do you have beds available for tonight for a patient being discharged from the hospital?"
3. Ask: "How many beds do you have available?"
4. Ask: "Can you accommodate wheelchair access?"
5. Confirm: "Can you hold a bed for John Doe arriving tonight?"

Be brief (under 2 minutes), professional, and get exact numbers."""
                }
            ]
        },
        "voice": {
            "provider": "vapi",
            "voiceId": "Savannah"
        },
        "firstMessage": "Hello, this is CareLink calling on behalf of a hospital patient who needs shelter placement tonight. Do you have a moment to check your current bed availability?"
    }
}

headers = {
    "Authorization": f"Bearer {VAPI_API_KEY}",
    "Content-Type": "application/json"
}

print(f"\n🚀 Making VAPI call...")
print(f"📱 To: {TEST_PHONE}")
print(f"🔗 Webhook: http://localhost:8000/api/vapi/shelter-webhook")

try:
    response = requests.post(
        f"{VAPI_BASE_URL}/call",
        headers=headers,
        json=conversation
    )
    
    if response.status_code in [200, 201]:
        result = response.json()
        call_id = result.get("id", result.get("callId", "unknown"))
        print(f"\n✅ VAPI call initiated successfully!")
        print(f"📞 Call ID: {call_id}")
        print(f"\n📳 You should receive a call at {TEST_PHONE} shortly...")
        print(f"\n💬 Answer the call and the AI will ask about bed availability.")
        print(f"📝 The conversation will be transcribed and sent to your webhook.")
    else:
        print(f"\n❌ VAPI call failed: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
