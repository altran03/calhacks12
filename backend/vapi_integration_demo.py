# Vapi Integration with Demo Mode
# This file shows how to integrate Vapi voice calls with CareLink

import requests
import json
import os
import time
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class VapiIntegration:
    def __init__(self, api_key: str = None, demo_phone: str = None, demo_mode: bool = True):
        self.api_key = api_key or os.getenv("VAPI_API_KEY")
        self.base_url = "https://api.vapi.ai"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # Use demo phone for testing (calls your number instead of real shelter numbers)
        self.demo_phone = demo_phone or os.getenv("DEMO_PHONE_NUMBER")
        self.demo_mode = demo_mode

    def get_phone_numbers(self) -> Dict[str, Any]:
        """Get available phone numbers from Vapi"""
        try:
            response = requests.get(
                f"{self.base_url}/phone-number",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}

    def make_shelter_availability_call(self, shelter_phone: str, shelter_name: str) -> Dict[str, Any]:
        """Make a voice call to check shelter availability
        
        In DEMO_MODE: Always calls DEMO_PHONE_NUMBER (your personal number)
        In PRODUCTION: Calls the actual shelter phone number
        """
        
        # Use demo phone number if in demo mode
        phone_to_call = self.demo_phone if self.demo_mode else shelter_phone
        
        print(f"🎯 VAPI Call Configuration:")
        print(f"  Demo Mode: {self.demo_mode}")
        print(f"  Original Shelter Phone: {shelter_phone}")
        print(f"  Calling: {phone_to_call}")
        print(f"  Shelter Name: {shelter_name}")
        
        # In demo mode, we still make REAL Vapi calls but to your demo number
        print(f"🎯 DEMO MODE: Making REAL Vapi call to your demo number")
        print(f"📞 Calling: {phone_to_call}")
        print(f"🏠 Shelter: {shelter_name}")
        print(f"🔑 Using API Key: {self.api_key[:10]}...")
        
        # Make REAL Vapi call using the correct API format
        print(f"📞 Making REAL Vapi call to: {phone_to_call}")
        print(f"🏠 Shelter: {shelter_name}")
        
        # Use Vapi's native calling (no Twilio needed - Vapi provides the number)
        conversation = {
            "phoneNumberId": "b07a03cd-a423-480c-b47a-41b40420d8e9",  # Your actual Vapi phone number ID
            "customer": {
                "number": phone_to_call
            },
            "assistant": {
                "name": "CareLink Assistant",
                "model": {
                    "provider": "google",
                    "model": "gemini-1.5-pro"
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "Lily"
                },
                "firstMessage": f"Hello, this is CareLink calling to check bed availability at {shelter_name} for tonight. Do you have a moment to provide current availability?"
            },
            "maxDurationSeconds": 300,
            "name": "Shelter Check"  # Shorter name (max 40 chars)
        }

        try:
            response = requests.post(
                f"{self.base_url}/call",
                headers=self.headers,
                json=conversation
            )
            
            print(f"📊 Vapi API Response Status: {response.status_code}")
            print(f"📊 Vapi API Response Headers: {dict(response.headers)}")
            
            if response.status_code not in [200, 201]:
                print(f"❌ Vapi API Error Response: {response.text}")
                return {"error": f"HTTP {response.status_code}: {response.text}"}
            
            result = response.json()
            print(f"✅ Vapi call successful: {result}")
            
            # 201 means call was created and queued
            if response.status_code == 201:
                print(f"📞 Call ID: {result.get('id', 'Unknown')}")
                print(f"📞 Status: {result.get('status', 'Unknown')}")
                print(f"📞 Customer: {result.get('customer', {}).get('number', 'Unknown')}")
                print(f"📞 Monitor URL: {result.get('monitor', {}).get('listenUrl', 'No monitor URL')}")
            
            # Extract transcription from result if available
            transcription = "No transcription available"
            if "transcript" in result:
                transcription = result["transcript"]
            elif "transcription" in result:
                transcription = result["transcription"]
            elif "messages" in result:
                # Extract from messages array
                messages = result.get("messages", [])
                if messages:
                    transcription = " ".join([msg.get("content", "") for msg in messages if msg.get("content")])
            
            # Return result with transcription
            return {
                **result,
                "transcription": transcription,
                "call_successful": True
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error making Vapi call: {e}")
            return {"error": str(e), "call_successful": False}

    def make_social_worker_call(self, social_worker_phone: str, patient_name: str, case_id: str) -> Dict[str, Any]:
        """Make a voice call to confirm social worker assignment"""
        
        # Use demo phone for testing
        phone_to_call = self.demo_phone if self.demo_phone else social_worker_phone
        
        print(f"📞 Making REAL Vapi call to {phone_to_call}")
        print(f"👤 Patient: {patient_name}")
        print(f"📋 Case ID: {case_id}")
        print(f"🔑 Using API Key: {self.api_key[:10] if self.api_key else 'NOT_SET'}...")
        
        if not self.api_key:
            raise ValueError("VAPI_API_KEY environment variable is required")
        
        conversation = {
            "type": "outbound",
            "phoneNumber": phone_to_call,
            "assistant": {
                "name": "CareLink Coordinator",
                "model": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "systemMessage": f"""
                    You are calling to confirm social worker assignment for patient {patient_name} (Case ID: {case_id}).
                    Ask the social worker to confirm:
                    1. They can take on this case
                    2. Their availability for follow-up
                    3. Any specific requirements or notes
                    
                    Be professional and clear about the case details.
                    """
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "sarah"
                },
                "firstMessage": f"Hello, this is CareLink calling about a new case assignment for patient {patient_name}. Do you have a moment to confirm your availability for this case?"
            },
            "webhook": {
                "url": "https://your-ngrok-url.ngrok.io/api/vapi/webhook",
                "events": ["call-ended"]
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/call",
                headers=self.headers,
                json=conversation
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making Vapi call: {e}")
            return {"error": str(e)}

    def make_transport_coordination_call(self, transport_phone: str, pickup_location: str, dropoff_location: str) -> Dict[str, Any]:
        """Make a voice call to coordinate transport"""
        
        # Use demo phone for testing
        phone_to_call = self.demo_phone if self.demo_phone else transport_phone
        
        print(f"📞 Making REAL Vapi call to {phone_to_call}")
        print(f"📍 Pickup: {pickup_location}")
        print(f"📍 Dropoff: {dropoff_location}")
        print(f"🔑 Using API Key: {self.api_key[:10] if self.api_key else 'NOT_SET'}...")
        
        if not self.api_key:
            raise ValueError("VAPI_API_KEY environment variable is required")
        
        conversation = {
            "type": "outbound",
            "phoneNumber": phone_to_call,
            "assistant": {
                "name": "CareLink Transport Coordinator",
                "model": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "systemMessage": f"""
                    You are calling to coordinate patient transport.
                    Pickup: {pickup_location}
                    Dropoff: {dropoff_location}
                    
                    Ask about:
                    1. Available vehicles (especially wheelchair accessible)
                    2. Estimated pickup time
                    3. Confirmation of route and timing
                    
                    Be clear about the medical nature of the transport.
                    """
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "sarah"
                },
                "firstMessage": f"Hello, this is CareLink calling to coordinate patient transport from {pickup_location} to {dropoff_location}. Do you have availability for a medical transport today?"
            },
            "webhook": {
                "url": "https://your-ngrok-url.ngrok.io/api/vapi/webhook",
                "events": ["call-ended"]
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/call",
                headers=self.headers,
                json=conversation
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making Vapi call: {e}")
            return {"error": str(e)}

    def make_followup_call(self, patient_phone: str, patient_name: str, case_id: str) -> Dict[str, Any]:
        """Make a follow-up call to check on patient after discharge"""
        
        # Use demo phone for testing
        phone_to_call = self.demo_phone if self.demo_phone else patient_phone
        
        print(f"📞 Making REAL Vapi call to {phone_to_call}")
        print(f"👤 Patient: {patient_name}")
        print(f"📋 Case ID: {case_id}")
        print(f"🔑 Using API Key: {self.api_key[:10] if self.api_key else 'NOT_SET'}...")
        
        if not self.api_key:
            raise ValueError("VAPI_API_KEY environment variable is required")
        
        conversation = {
            "type": "outbound",
            "phoneNumber": phone_to_call,
            "assistant": {
                "name": "CareLink Follow-up Coordinator",
                "model": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "systemMessage": f"""
                    You are calling {patient_name} for a follow-up check after their hospital discharge.
                    Be warm, caring, and professional.
                    
                    Ask about:
                    1. How they're feeling
                    2. If they made it to their shelter safely
                    3. If they need any additional support
                    4. If they have their medications and follow-up appointments
                    
                    Keep the call supportive and brief.
                    """
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "sarah"
                },
                "firstMessage": f"Hello {patient_name}, this is CareLink calling to check on how you're doing after your hospital discharge. Do you have a moment to talk?"
            },
            "webhook": {
                "url": "https://your-ngrok-url.ngrok.io/api/vapi/webhook",
                "events": ["call-ended"]
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/call",
                headers=self.headers,
                json=conversation
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making Vapi call: {e}")
            return {"error": str(e)}

# Example usage in FastAPI webhook handler
def handle_vapi_webhook(webhook_data: Dict[str, Any]):
    """Process Vapi webhook data"""
    
    call_id = webhook_data.get("callId")
    status = webhook_data.get("status")
    transcript = webhook_data.get("transcript", "")
    
    if status == "ended":
        # Process the call transcript
        if "shelter" in transcript.lower():
            # Extract bed availability from transcript
            # Update shelter database
            pass
        elif "social worker" in transcript.lower():
            # Process social worker confirmation
            # Update case status
            pass
        elif "transport" in transcript.lower():
            # Process transport coordination
            # Update transport status
            pass
        elif "follow-up" in transcript.lower():
            # Process follow-up call results
            # Update patient status
            pass
    
    return {"status": "processed"}

# Integration with Fetch.ai agents
async def trigger_vapi_calls_for_case(case_id: str, case_data: Dict[str, Any]):
    """Trigger appropriate Vapi calls based on case data"""
    
    vapi = VapiIntegration(api_key="demo_key")
    
    # Call shelter for availability
    if case_data.get("shelter_phone"):
        shelter_result = vapi.make_shelter_availability_call(
            case_data["shelter_phone"],
            case_data["shelter_name"]
        )
    
    # Call social worker for confirmation
    if case_data.get("social_worker_phone"):
        social_worker_result = vapi.make_social_worker_call(
            case_data["social_worker_phone"],
            case_data["patient_name"],
            case_id
        )
    
    # Call transport provider
    if case_data.get("transport_phone"):
        transport_result = vapi.make_transport_coordination_call(
            case_data["transport_phone"],
            case_data["pickup_location"],
            case_data["dropoff_location"]
        )
    
    return {
        "shelter_call": shelter_result,
        "social_worker_call": social_worker_result,
        "transport_call": transport_result
    }
