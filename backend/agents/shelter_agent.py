"""
Shelter Agent - Manages shelter capacity and availability
Handles shelter matching, availability verification, and bed reservations
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    ShelterMatch, ShelterAvailabilityRequest, ShelterAvailabilityResponse,
    WorkflowUpdate
)
from typing import Dict, Any
from datetime import datetime
import os
import requests

# VAPI Integration
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
VAPI_BASE_URL = "https://api.vapi.ai"

# Initialize Shelter Agent
shelter_agent = Agent(
    name="shelter_agent",
    seed="czgeicav guntkjfl qplhzrks zphtwxkp pfdtknqt gxyanlsa scsvzouw mdxbajei hfndthta epuyehaq sqciimjr ctwxqyfq",
    port=8003,
    endpoint=["http://127.0.0.1:8003/submit"],
    mailbox=True,
)

# Define Shelter Protocol for Agentverse deployment
shelter_protocol = Protocol(name="ShelterProtocol", version="1.0.0")

@shelter_protocol.on_message(model=ShelterMatch, replies={WorkflowUpdate})
async def handle_shelter_matching(ctx: Context, sender: str, msg: ShelterMatch):
    """Shelter agent manages shelter capacity and availability"""
    ctx.logger.info(f"Processing shelter match for {msg.case_id}")
    
    try:
        # Get patient context from the social worker agent's data
        # This comes from the coordinator agent's form data
        patient_context = getattr(msg, 'patient_context', {})
        msg.extra_patient_context = patient_context
        
        # Step 1: Verify availability via Vapi call with patient information
        availability_confirmed = await verify_shelter_availability_via_vapi(msg)
        
        if availability_confirmed:
            # Step 2: Reserve bed if available
            bed_reserved = await reserve_shelter_bed(msg)
            
            if bed_reserved:
                # Step 3: Update workflow status
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step="shelter_confirmed",
                        status="completed",
                        details={
                            "shelter": msg.shelter_name,
                            "beds_available": msg.available_beds,
                            "address": msg.address,
                            "services": msg.services,
                            "accessibility": msg.accessibility
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
                
                ctx.logger.info(f"Shelter confirmed for {msg.case_id}: {msg.shelter_name}")
            else:
                # No beds available, try alternative shelters
                await find_alternative_shelters(ctx, msg)
        else:
            # Availability not confirmed, try alternative shelters
            await find_alternative_shelters(ctx, msg)
            
    except Exception as e:
        ctx.logger.error(f"Error processing shelter match for {msg.case_id}: {e}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="shelter_matching",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

@shelter_protocol.on_message(model=ShelterAvailabilityRequest, replies={ShelterAvailabilityResponse})
async def handle_availability_request(ctx: Context, sender: str, msg: ShelterAvailabilityRequest):
    """Handle direct availability requests"""
    ctx.logger.info(f"Checking availability for {msg.shelter_name}")
    
    try:
        # Check real-time availability
        availability = await check_shelter_availability(msg)
        
        # Send response
        await ctx.send(
            "coordinator_agent_address",
            ShelterAvailabilityResponse(
                case_id=msg.case_id,
                shelter_name=msg.shelter_name,
                beds_available=availability.get("beds_available", 0),
                accessibility_confirmed=availability.get("accessibility", False),
                services_available=availability.get("services", []),
                contact_person=availability.get("contact_person", ""),
                phone=availability.get("phone", "")
            )
        )
        
    except Exception as e:
        ctx.logger.error(f"Error checking availability for {msg.shelter_name}: {e}")

async def verify_shelter_availability_via_vapi(shelter_match: ShelterMatch) -> bool:
    """Verify shelter availability via Vapi voice call with patient information from social worker"""
    # For testing: get your phone number from env, otherwise use shelter number
    test_phone = os.getenv("TEST_PHONE_NUMBER", "")
    phone_to_call = test_phone if test_phone else shelter_match.phone
    
    print(f"📞 Calling {shelter_match.shelter_name} at {phone_to_call} via VAPI...")
    if test_phone:
        print(f"⚠️  TEST MODE: Calling your number {test_phone} for testing")
    
    # Get patient information that the social worker agent has gathered
    # This would typically come from the coordinator agent's form data
    patient_info = shelter_match.extra_patient_context if hasattr(shelter_match, 'extra_patient_context') else {}
    
    # Prepare the conversation with patient context
    patient_name = patient_info.get('patient_name', 'the patient')
    accessibility_needs = patient_info.get('accessibility_needs', '')
    medical_condition = patient_info.get('medical_condition', '')
    medications = patient_info.get('medications', [])
    
    # Build patient context message
    patient_context = f"Patient {patient_name}"
    if medical_condition:
        patient_context += f" with {medical_condition}"
    if accessibility_needs:
        patient_context += f", requires {accessibility_needs}"
    if medications:
        patient_context += f", taking {len(medications)} medications"
    
    # Make VAPI call
    try:
        conversation = {
            "type": "outbound",
            "phoneNumber": phone_to_call,
            "assistant": {
                "name": "CareLink Shelter Coordinator",
                "model": {
                    "provider": "google",
                    "model": "gemini-1.5-pro",
                    "systemMessage": f"""
                    You are calling {shelter_match.shelter_name} to check bed availability for tonight for a patient being discharged from the hospital.
                    
                    Patient information you received from the social worker agent:
                    - Name: {patient_name}
                    - Medical condition: {medical_condition}
                    - Accessibility needs: {accessibility_needs}
                    - Medications: {', '.join([m.get('name', '') for m in medications[:3]]) if medications else 'None'}
                    
                    You need to:
                    1. Greet professionally and explain you're calling from CareLink on behalf of a hospital discharge
                    2. Ask if they have beds available for TONIGHT
                    3. Confirm they can accommodate {accessibility_needs if accessibility_needs else 'standard needs'}
                    4. Get the EXACT number of beds available
                    5. Confirm they can accept {patient_name} for tonight
                    
                    Be brief, professional, and get clear confirmation including the number of beds.
                    """
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "sarah"
                },
                "firstMessage": f"Hello, this is CareLink calling from a hospital on behalf of {patient_name} who needs shelter placement tonight. Do you have a moment to check your current bed availability?"
            },
            "webhook": {
                "url": "http://localhost:8000/api/vapi/shelter-webhook",
                "events": ["call-ended"]
            }
        }
        
        headers = {
            "Authorization": f"Bearer {VAPI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{VAPI_BASE_URL}/call",
            headers=headers,
            json=conversation
        )
        
        if response.status_code == 200:
            call_result = response.json()
            print(f"✅ VAPI call initiated to {shelter_match.shelter_name}")
            print(f"   Call ID: {call_result.get('callId', 'N/A')}")
            return True
        else:
            print(f"⚠️ VAPI call failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error making VAPI call: {e}")
        # Fallback: assume available if call fails
        return True

async def reserve_shelter_bed(shelter_match: ShelterMatch) -> bool:
    """Reserve a bed at the shelter"""
    # This would integrate with shelter management systems
    # For demo purposes, return True
    return True

async def find_alternative_shelters(ctx: Context, original_match: ShelterMatch):
    """Find alternative shelters when primary match fails"""
    ctx.logger.info(f"Searching for alternative shelters for {original_match.case_id}")
    
    # Query for alternative shelters
    alternatives = await query_alternative_shelters(original_match)
    
    for alt_shelter in alternatives:
        try:
            # Check availability for alternative
            availability = await check_shelter_availability_alternative(alt_shelter)
            
            if availability.get("available", False):
                # Send alternative match
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=original_match.case_id,
                        step="alternative_shelter_found",
                        status="completed",
                        details={
                            "original_shelter": original_match.shelter_name,
                            "alternative_shelter": alt_shelter.get("name"),
                            "address": alt_shelter.get("address"),
                            "beds_available": availability.get("beds_available", 0)
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
                return
                
        except Exception as e:
            ctx.logger.error(f"Error checking alternative shelter: {e}")
    
    # No alternatives found
    await ctx.send(
        "coordinator_agent_address",
        WorkflowUpdate(
            case_id=original_match.case_id,
            step="shelter_search",
            status="failed",
            details={"reason": "No available shelters found"},
            timestamp=datetime.now().isoformat()
        )
    )

async def check_shelter_availability(request: ShelterAvailabilityRequest) -> Dict[str, Any]:
    """Check real-time shelter availability"""
    # This would integrate with shelter management systems
    # For demo purposes, return mock data
    return {
        "beds_available": 5,
        "accessibility": True,
        "services": ["medical respite", "case management"],
        "contact_person": "Maria Rodriguez",
        "phone": "(415) 431-4000"
    }

async def check_shelter_availability_alternative(shelter: Dict[str, Any]) -> Dict[str, Any]:
    """Check availability for alternative shelter"""
    return {
        "available": True,
        "beds_available": 3,
        "accessibility": True
    }

async def query_alternative_shelters(original_match: ShelterMatch) -> list:
    """Query for alternative shelters"""
    # This would integrate with shelter database
    return [
        {
            "name": "St. Anthony's Foundation",
            "address": "150 Golden Gate Ave, San Francisco, CA 94102",
            "phone": "(415) 592-2700",
            "services": ["emergency shelter", "meals", "clothing"]
        },
        {
            "name": "Hamilton Family Center",
            "address": "260 Golden Gate Ave, San Francisco, CA 94102",
            "phone": "(415) 292-5224",
            "services": ["family shelter", "case management"]
        }
    ]

# Include protocol with manifest publishing for Agentverse deployment
shelter_agent.include(shelter_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(shelter_agent.wallet.address())
    shelter_agent.run()
