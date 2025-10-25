from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from typing import List, Dict, Any, Optional
import asyncio
import json
from datetime import datetime

# Agent Models
class DischargeRequest(Model):
    case_id: str
    patient_name: str
    medical_condition: str
    accessibility_needs: Optional[str] = None
    dietary_needs: Optional[str] = None
    social_needs: Optional[str] = None
    hospital: str
    discharge_date: str

class ShelterMatch(Model):
    case_id: str
    shelter_name: str
    address: str
    available_beds: int
    accessibility: bool
    services: List[str]
    phone: str

class TransportRequest(Model):
    case_id: str
    pickup_location: str
    dropoff_location: str
    accessibility_required: bool
    urgency: str

class SocialWorkerAssignment(Model):
    case_id: str
    social_worker_name: str
    contact_phone: str
    department: str

class WorkflowUpdate(Model):
    case_id: str
    step: str
    status: str
    details: Dict[str, Any]
    timestamp: str

# Hospital Agent
hospital_agent = Agent(
    name="hospital_agent",
    seed="hospital_agent_seed_phrase_here",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"],
)

@hospital_agent.on_message(model=DischargeRequest)
async def handle_discharge_request(ctx: Context, sender: str, msg: DischargeRequest):
    """Hospital agent processes discharge requests"""
    ctx.logger.info(f"Processing discharge request for {msg.patient_name}")
    
    # Send to coordinator agent
    await ctx.send(
        "coordinator_agent_address",  # This would be the actual agent address
        DischargeRequest(
            case_id=msg.case_id,
            patient_name=msg.patient_name,
            medical_condition=msg.medical_condition,
            accessibility_needs=msg.accessibility_needs,
            dietary_needs=msg.dietary_needs,
            social_needs=msg.social_needs,
            hospital=msg.hospital,
            discharge_date=msg.discharge_date
        )
    )

# Coordinator Agent
coordinator_agent = Agent(
    name="coordinator_agent",
    seed="coordinator_agent_seed_phrase_here",
    port=8002,
    endpoint=["http://127.0.0.1:8002/submit"],
)

@coordinator_agent.on_message(model=DischargeRequest)
async def coordinate_discharge(ctx: Context, sender: str, msg: DischargeRequest):
    """Coordinator agent manages the entire workflow"""
    ctx.logger.info(f"Coordinating discharge workflow for {msg.case_id}")
    
    # Query Bright Data for shelter information
    shelter_data = await query_bright_data_for_shelters(msg)
    
    # Send shelter matching request
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
    
    # Send transport request
    await ctx.send(
        "transport_agent_address",
        TransportRequest(
            case_id=msg.case_id,
            pickup_location=msg.hospital,
            dropoff_location=shelter_data.get("address", ""),
            accessibility_required=bool(msg.accessibility_needs),
            urgency="high"
        )
    )
    
    # Send social worker assignment request
    await ctx.send(
        "social_worker_agent_address",
        SocialWorkerAssignment(
            case_id=msg.case_id,
            social_worker_name="Sarah Johnson",
            contact_phone="(415) 555-0123",
            department="SF Health Department"
        )
    )

# Shelter Agent
shelter_agent = Agent(
    name="shelter_agent",
    seed="shelter_agent_seed_phrase_here",
    port=8003,
    endpoint=["http://127.0.0.1:8003/submit"],
)

@shelter_agent.on_message(model=ShelterMatch)
async def handle_shelter_matching(ctx: Context, sender: str, msg: ShelterMatch):
    """Shelter agent manages shelter capacity and availability"""
    ctx.logger.info(f"Processing shelter match for {msg.case_id}")
    
    # Verify availability via Vapi call
    availability_confirmed = await verify_shelter_availability_via_vapi(msg)
    
    if availability_confirmed:
        # Update workflow status
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="shelter_confirmed",
                status="completed",
                details={"shelter": msg.shelter_name, "beds_available": msg.available_beds},
                timestamp=datetime.now().isoformat()
            )
        )

# Transport Agent
transport_agent = Agent(
    name="transport_agent",
    seed="transport_agent_seed_phrase_here",
    port=8004,
    endpoint=["http://127.0.0.1:8004/submit"],
)

@transport_agent.on_message(model=TransportRequest)
async def handle_transport_request(ctx: Context, sender: str, msg: TransportRequest):
    """Transport agent schedules and tracks transportation"""
    ctx.logger.info(f"Processing transport request for {msg.case_id}")
    
    # Schedule transport via Vapi call
    transport_scheduled = await schedule_transport_via_vapi(msg)
    
    if transport_scheduled:
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="transport_scheduled",
                status="completed",
                details={"provider": "SF Paratransit", "eta": "30 minutes"},
                timestamp=datetime.now().isoformat()
            )
        )

# Social Worker Agent
social_worker_agent = Agent(
    name="social_worker_agent",
    seed="social_worker_agent_seed_phrase_here",
    port=8005,
    endpoint=["http://127.0.0.1:8005/submit"],
)

@social_worker_agent.on_message(model=SocialWorkerAssignment)
async def handle_social_worker_assignment(ctx: Context, sender: str, msg: SocialWorkerAssignment):
    """Social worker agent manages follow-up care"""
    ctx.logger.info(f"Processing social worker assignment for {msg.case_id}")
    
    # Confirm assignment via Vapi call
    assignment_confirmed = await confirm_social_worker_assignment_via_vapi(msg)
    
    if assignment_confirmed:
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="social_worker_assigned",
                status="completed",
                details={"social_worker": msg.social_worker_name, "department": msg.department},
                timestamp=datetime.now().isoformat()
            )
        )

# Follow-up Care Agent
followup_agent = Agent(
    name="followup_agent",
    seed="followup_agent_seed_phrase_here",
    port=8006,
    endpoint=["http://127.0.0.1:8006/submit"],
)

@followup_agent.on_message(model=WorkflowUpdate)
async def schedule_followup(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Follow-up agent schedules post-discharge check-ins"""
    if msg.step == "social_worker_assigned" and msg.status == "completed":
        ctx.logger.info(f"Scheduling follow-up for {msg.case_id}")
        
        # Schedule follow-up call via Vapi
        await schedule_followup_call_via_vapi(msg.case_id)

# Helper functions for external integrations
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

async def verify_shelter_availability_via_vapi(shelter_match: ShelterMatch) -> bool:
    """Verify shelter availability via Vapi voice call"""
    # This would integrate with Vapi API to make voice calls
    # For demo purposes, return True
    return True

async def schedule_transport_via_vapi(transport_request: TransportRequest) -> bool:
    """Schedule transport via Vapi voice call"""
    # This would integrate with Vapi API
    return True

async def confirm_social_worker_assignment_via_vapi(assignment: SocialWorkerAssignment) -> bool:
    """Confirm social worker assignment via Vapi voice call"""
    # This would integrate with Vapi API
    return True

async def schedule_followup_call_via_vapi(case_id: str) -> bool:
    """Schedule follow-up call via Vapi"""
    # This would integrate with Vapi API
    return True

# Fund agents if needed
if __name__ == "__main__":
    # Fund agents (this would be done with actual Fetch.ai tokens)
    fund_agent_if_low(hospital_agent.wallet.address())
    fund_agent_if_low(coordinator_agent.wallet.address())
    fund_agent_if_low(shelter_agent.wallet.address())
    fund_agent_if_low(transport_agent.wallet.address())
    fund_agent_if_low(social_worker_agent.wallet.address())
    fund_agent_if_low(followup_agent.wallet.address())
    
    # Run agents
    hospital_agent.run()
    coordinator_agent.run()
    shelter_agent.run()
    transport_agent.run()
    social_worker_agent.run()
    followup_agent.run()
