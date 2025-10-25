"""
Shelter Agent - Manages shelter capacity and availability
Handles shelter matching, availability verification, and bed reservations
"""

from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from .models import (
    ShelterMatch, ShelterAvailabilityRequest, ShelterAvailabilityResponse,
    WorkflowUpdate
)
from typing import Dict, Any
from datetime import datetime

# Initialize Shelter Agent
shelter_agent = Agent(
    name="shelter_agent",
    seed="czgeicav guntkjfl qplhzrks zphtwxkp pfdtknqt gxyanlsa scsvzouw mdxbajei hfndthta epuyehaq sqciimjr ctwxqyfq",
    port=8003,
    endpoint=["http://127.0.0.1:8003/submit"],
    mailbox=True,
)

@shelter_agent.on_message(model=ShelterMatch)
async def handle_shelter_matching(ctx: Context, sender: str, msg: ShelterMatch):
    """Shelter agent manages shelter capacity and availability"""
    ctx.logger.info(f"Processing shelter match for {msg.case_id}")
    
    try:
        # Step 1: Verify availability via Vapi call
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

@shelter_agent.on_message(model=ShelterAvailabilityRequest)
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
    """Verify shelter availability via Vapi voice call"""
    # This would integrate with Vapi API to make voice calls
    # For demo purposes, return True
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

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(shelter_agent.wallet.address())
    shelter_agent.run()
