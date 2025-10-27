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
        self.demo_phone = demo_phone or os.getenv("DEMO_PHONE_NUMBER") or os.getenv("TEST_PHONE_NUMBER")
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
        
        # Use Vapi's basic calling - the issue might be that we need a pre-configured assistant
        phone_number_id = os.getenv("VAPI_PHONE_NUMBER_ID", "b07a03cd-a423-480c-b47a-41b40420d8e9")
        
        # Use pre-configured assistant from Vapi dashboard
        assistant_id = os.getenv("VAPI_ASSISTANT_ID")
        if not assistant_id:
            raise ValueError("VAPI_ASSISTANT_ID environment variable is required for pre-configured assistant")
        
        conversation = {
            "phoneNumberId": phone_number_id,  # Use your Vapi phone number ID from environment
            "customer": {
                "number": phone_to_call
            },
            "assistantId": assistant_id,  # Use pre-configured assistant from dashboard
            "maxDurationSeconds": 600,  # 10 minutes to allow full conversation
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
            
            # Start real-time transcription monitoring
            call_id = result.get('id', 'Unknown')
            print(f"\n🎙️ STARTING REAL-TIME TRANSCRIPTION MONITORING...")
            print("=" * 60)
            
            # Monitor call status and transcription in real-time
            transcription_result = self.monitor_call_realtime(call_id)
            
            # Extract transcription from result if available
            transcription = transcription_result.get('transcription', 'No transcription available')
            
            # Return result with transcription
            return {
                **result,
                "transcription": transcription,
                "call_successful": True,
                "full_transcript": transcription_result.get('full_transcript', ''),
                "conversation_log": transcription_result.get('conversation_log', [])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error making Vapi call: {e}")
            return {"error": str(e), "call_successful": False}

    def monitor_call_realtime(self, call_id: str) -> Dict[str, Any]:
        """Monitor call status and transcription in real-time"""
        import time
        import json
        
        print(f"🎙️ Monitoring call {call_id} for real-time transcription...")
        
        conversation_log = []
        full_transcript = ""
        last_status = None
        start_time = time.time()
        max_wait_time = 600  # 10 minutes max
        
        failed_calls = set()  # Track failed call IDs to avoid repeated errors
        
        while time.time() - start_time < max_wait_time:
            try:
                # Skip if we already know this call ID fails
                if call_id in failed_calls:
                    time.sleep(5)
                    continue
                    
                # Get call details
                call_details = self.get_call_details(call_id)
                if not call_details or call_details.get('error'):
                    if call_details and call_details.get('error'):
                        failed_calls.add(call_id)
                    time.sleep(5)
                    continue
                
                current_status = call_details.get('status', 'unknown')
                
                # Print status changes
                if current_status != last_status:
                    print(f"📞 Call Status: {current_status.upper()}")
                    last_status = current_status
                
                # Check for transcription updates
                if 'transcript' in call_details and call_details['transcript']:
                    transcript = call_details['transcript']
                    if transcript != full_transcript:
                        new_content = transcript[len(full_transcript):]
                        if new_content.strip():
                            print(f"🎙️ NEW TRANSCRIPTION: {new_content}")
                            conversation_log.append({
                                'timestamp': time.time(),
                                'content': new_content,
                                'type': 'transcript'
                            })
                        full_transcript = transcript
                
                # Check for messages/utterances
                if 'messages' in call_details:
                    messages = call_details.get('messages', [])
                    for message in messages:
                        if message.get('content') and message.get('content') not in [log.get('content') for log in conversation_log]:
                            role = message.get('role', 'unknown')
                            content = message.get('content', '')
                            print(f"💬 {role.upper()}: {content}")
                            conversation_log.append({
                                'timestamp': time.time(),
                                'content': f"{role.upper()}: {content}",
                                'type': 'message',
                                'role': role
                            })
                
                # Check if call is ended
                if current_status in ['ended', 'completed', 'failed']:
                    print(f"📞 Call {current_status.upper()}")
                    break
                
                time.sleep(3)  # Check every 3 seconds
                
            except Exception as e:
                print(f"⚠️ Error monitoring call: {e}")
                time.sleep(5)
        
        # Get final call details to extract complete transcript
        final_call_details = self.get_call_details(call_id)
        final_transcript = ""
        
        if final_call_details and not final_call_details.get('error'):
            # Try to get transcript from final call details - check multiple possible locations
            final_transcript = (
                final_call_details.get('transcript', '') or 
                final_call_details.get('transcription', '') or
                final_call_details.get('artifact', {}).get('transcript', '') or
                final_call_details.get('artifact', {}).get('transcription', '')
            )
            
            # If we have an artifact with transcript array, convert it to readable text
            if not final_transcript and final_call_details.get('artifact', {}).get('transcript'):
                transcript_array = final_call_details.get('artifact', {}).get('transcript', [])
                if isinstance(transcript_array, list):
                    readable_transcript = []
                    for entry in transcript_array:
                        if isinstance(entry, dict):
                            role = entry.get('role', 'unknown')
                            message = entry.get('message', '')
                            if message:
                                readable_transcript.append(f"{role.upper()}: {message}")
                    final_transcript = '\n'.join(readable_transcript)
            
            if final_transcript:
                print(f"\n📝 FINAL TRANSCRIPTION FROM API:")
                print("=" * 50)
                print(final_transcript)
                print("=" * 50)
            else:
                # Fallback to monitoring transcript
                final_transcript = full_transcript or "No transcription captured"
                print(f"\n📝 FINAL TRANSCRIPTION FROM MONITORING:")
                print("=" * 50)
                print(final_transcript)
                print("=" * 50)
        else:
            # Fallback to monitoring transcript
            final_transcript = full_transcript or "No transcription captured"
            print(f"\n📝 FINAL TRANSCRIPTION (FALLBACK):")
            print("=" * 50)
            print(final_transcript)
            print("=" * 50)
        
        return {
            'transcription': final_transcript,
            'full_transcript': final_transcript,
            'conversation_log': conversation_log,
            'successful': current_status in ['ended', 'completed']
        }

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
    
    def get_call_details(self, call_id: str) -> Dict[str, Any]:
        """Get call details and real-time transcription from Vapi"""
        try:
            print(f"🔍 Getting call details for: {call_id}")
            
            # Make request to Vapi API to get call details
            response = requests.get(
                f"{self.base_url}/call/{call_id}",
                headers=self.headers
            )
            response.raise_for_status()
            
            call_data = response.json()
            print(f"📊 Call data: {call_data}")
            
            # Extract transcription and status
            transcription = call_data.get("transcript", "")
            status = call_data.get("status", "unknown")
            
            return {
                "call_id": call_id,
                "status": status,
                "transcription": transcription,
                "duration": call_data.get("duration", 0),
                "cost": call_data.get("cost", 0),
                "created_at": call_data.get("createdAt", ""),
                "ended_at": call_data.get("endedAt", ""),
                "full_data": call_data
            }
            
        except requests.exceptions.RequestException as e:
            # Don't print error for 404s as calls might not exist yet
            if "404" not in str(e):
                print(f"❌ Error getting call details: {e}")
            return {
                "call_id": call_id,
                "error": str(e),
                "status": "error"
            }
        except Exception as e:
            # Handle JSON parsing errors silently
            if "Expecting value" not in str(e):
                print(f"❌ Error parsing call details: {e}")
            return {
                "call_id": call_id,
                "error": str(e),
                "status": "error"
            }

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
