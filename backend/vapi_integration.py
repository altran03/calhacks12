# Vapi Integration Example
# This file shows how to integrate Vapi voice calls with CareLink

import requests
import json
from typing import Dict, Any

class VapiIntegration:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.vapi.ai"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def make_shelter_availability_call(self, shelter_phone: str, shelter_name: str) -> Dict[str, Any]:
        """Make a voice call to check shelter availability"""
        
        # Define the conversation flow
        conversation = {
            "type": "outbound",
            "phoneNumber": shelter_phone,
            "assistant": {
                "name": "CareLink Assistant",
                "model": {
                    "provider": "google",
                    "model": "gemini-1.5-pro",
                    "systemMessage": f"""
                    You are calling {shelter_name} to check bed availability for tonight.
                    Be polite and professional. Ask:
                    1. How many beds are available tonight?
                    2. Are there any accessibility accommodations?
                    3. What services are currently available?
                    
                    Keep the call brief and focused.
                    """
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "sarah"  # Vapi's professional female voice
                },
                "firstMessage": f"Hello, this is CareLink calling to check bed availability at {shelter_name} for tonight. Do you have a moment to provide current availability?"
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

    def make_social_worker_call(self, social_worker_phone: str, patient_name: str, case_id: str) -> Dict[str, Any]:
        """Make a voice call to confirm social worker assignment"""
        
        conversation = {
            "type": "outbound",
            "phoneNumber": social_worker_phone,
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
        
        conversation = {
            "type": "outbound",
            "phoneNumber": transport_phone,
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
        
        conversation = {
            "type": "outbound",
            "phoneNumber": patient_phone,
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
    
    vapi = VapiIntegration(api_key="your_vapi_api_key")
    
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
