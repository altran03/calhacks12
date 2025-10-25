"""
Coordinator Agent - Central workflow orchestrator
Manages the entire discharge workflow and coordinates between all agents
"""

from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from agents.models import (
    DischargeRequest, WorkflowUpdate, ShelterMatch, TransportRequest, 
    SocialWorkerAssignment, ResourceRequest, PharmacyRequest, EligibilityRequest
)
from typing import Dict, Any
import asyncio
from datetime import datetime

# Initialize Coordinator Agent
coordinator_agent = Agent(
    name="coordinator_agent",
    seed="llsvfztc crhqgpqz nrueewem lsvnlbtq sxrofbhn tpogetuo jomglifp hqttyqzd cbscbvrk dryrwsce thqsvbxx wvbhelap",
    port=8002,
    endpoint=["http://127.0.0.1:8002/submit"],
    mailbox=True,
)

@coordinator_agent.on_message(model=DischargeRequest)
async def coordinate_discharge(ctx: Context, sender: str, msg: DischargeRequest):
    """Coordinator agent manages the entire discharge workflow"""
    ctx.logger.info(f"Coordinating discharge workflow for {msg.case_id}")
    
    try:
        # Step 1: Query Bright Data for shelter information
        shelter_data = await query_bright_data_for_shelters(msg)
        
        # Step 2: Send shelter matching request
        await ctx.send(
            "shelter_agent_address",
            ShelterMatch(
                case_id=msg.case_id,
                shelter_name=shelter_data.get("name", ""),
                address=shelter_data.get("address", ""),
                available_beds=shelter_data.get("available_beds", 0),
                accessibility=shelter_data.get("accessibility", False),
                services=shelter_data.get("services", []),
                phone=shelter_data.get("phone", "")
            )
        )
        
        # Step 3: Send transport request
        await ctx.send(
            "transport_agent_address",
            TransportRequest(
                case_id=msg.case_id,
                pickup_location=msg.hospital,
                dropoff_location=shelter_data.get("address", ""),
                accessibility_required=bool(msg.accessibility_needs),
                urgency="high",
                patient_name=msg.patient_name
            )
        )
        
        # Step 4: Send social worker assignment request
        await ctx.send(
            "social_worker_agent_address",
            SocialWorkerAssignment(
                case_id=msg.case_id,
                social_worker_name="Sarah Johnson",
                contact_phone="(415) 555-0123",
                department="SF Health Department",
                specialization="homeless_services"
            )
        )
        
        # Step 5: Check eligibility for benefits
        await ctx.send(
            "eligibility_agent_address",
            EligibilityRequest(
                case_id=msg.case_id,
                patient_name=msg.patient_name,
                dob="",  # Would be extracted from patient data
                income_level="low",
                current_benefits=[],
                location="San Francisco, CA"
            )
        )
        
        # Step 6: Request resources if needed
        if msg.social_needs:
            await ctx.send(
                "resource_agent_address",
                ResourceRequest(
                    case_id=msg.case_id,
                    patient_name=msg.patient_name,
                    dietary_restrictions=msg.dietary_needs,
                    needed_items=["food", "hygiene_kit", "clothing"],
                    location=shelter_data.get("address", ""),
                    urgency="high"
                )
            )
        
        # Step 7: Update workflow status
        await ctx.send(
            "analytics_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="workflow_initiated",
                status="in_progress",
                details={
                    "patient_name": msg.patient_name,
                    "hospital": msg.hospital,
                    "discharge_date": msg.discharge_date,
                    "complexity": "high" if msg.accessibility_needs or msg.social_needs else "standard"
                },
                timestamp=datetime.now().isoformat()
            )
        )
        
        ctx.logger.info(f"Discharge workflow initiated for {msg.case_id}")
        
    except Exception as e:
        ctx.logger.error(f"Error coordinating discharge for {msg.case_id}: {e}")
        await ctx.send(
            "analytics_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="coordination_error",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

@coordinator_agent.on_message(model=WorkflowUpdate)
async def handle_workflow_update(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Handle updates from other agents"""
    ctx.logger.info(f"Received workflow update: {msg.step} - {msg.status}")
    
    # Forward to analytics agent for tracking
    await ctx.send("analytics_agent_address", msg)
    
    # Handle specific workflow steps
    if msg.step == "shelter_confirmed" and msg.status == "completed":
        ctx.logger.info(f"Shelter confirmed for {msg.case_id}")
        
    elif msg.step == "transport_scheduled" and msg.status == "completed":
        ctx.logger.info(f"Transport scheduled for {msg.case_id}")
        
    elif msg.step == "social_worker_assigned" and msg.status == "completed":
        ctx.logger.info(f"Social worker assigned for {msg.case_id}")
        
    elif msg.step == "eligibility_checked" and msg.status == "completed":
        ctx.logger.info(f"Eligibility checked for {msg.case_id}")
        
    elif msg.step == "resources_confirmed" and msg.status == "completed":
        ctx.logger.info(f"Resources confirmed for {msg.case_id}")

# Helper functions
async def query_bright_data_for_shelters(discharge_request: DischargeRequest) -> Dict[str, Any]:
    """Query Bright Data for real-time shelter information"""
    # This would integrate with Bright Data API
    # For demo purposes, return mock data
    return {
        "name": "Mission Neighborhood Resource Center",
        "address": "165 Capp St, San Francisco, CA 94110",
        "available_beds": 12,
        "accessibility": True,
        "services": ["medical respite", "case management", "meals"],
        "phone": "(415) 431-4000"
    }

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(coordinator_agent.wallet.address())
    coordinator_agent.run()
