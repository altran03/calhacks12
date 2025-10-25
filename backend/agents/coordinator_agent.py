"""
Coordinator Agent - Central workflow orchestrator
Manages the entire discharge workflow and coordinates between all agents
"""

from uagents import Agent, Context, Model, Protocol
from uagents.setup import fund_agent_if_low
from agents.models import (
    DischargeRequest, WorkflowUpdate, ShelterMatch, TransportRequest, 
    SocialWorkerAssignment, ResourceRequest, PharmacyRequest, EligibilityRequest
)
from typing import Dict, Any, Optional
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

# Define Coordinator Protocol for Agentverse deployment
coordinator_protocol = Protocol(name="CoordinatorProtocol", version="1.0.0")

# Model for HTTP endpoint (includes form_data)
class DischargeRequestWithFormData(Model):
    case_id: str
    patient_name: str
    patient_dob: str
    hospital: str
    discharge_date: str
    medical_condition: str
    medications: list
    accessibility_needs: str
    dietary_needs: str
    social_needs: str
    follow_up_instructions: str
    form_data: Dict[str, Any]  # Full form data from intake form

# Response model for HTTP endpoint
class DischargeResponse(Model):
    status: str
    case_id: str
    shelter: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None

async def coordinate_discharge_internal(ctx: Context, case_id: str, patient_name: str, hospital: str, 
                                        discharge_date: str, accessibility_needs: str, social_needs: str, 
                                        dietary_needs: str, medications: list, form_data: Dict[str, Any]):
    """Internal discharge coordination logic using form data"""
    ctx.logger.info(f"🏥 Coordinating discharge workflow for {case_id}")
    ctx.logger.info(f"👤 Patient: {patient_name}")
    ctx.logger.info(f"🏥 Hospital: {hospital}")
    ctx.logger.info(f"📋 Using filled intake form data (not raw PDF)")
    
    try:
        # Extract additional details from form_data
        contact_info = form_data.get("contact_info", {})
        discharge_info = form_data.get("discharge_info", {})
        follow_up = form_data.get("follow_up", {})
        treatment_info = form_data.get("treatment_info", {})
        
        # Step 1: Query Bright Data for shelter information using form data
        shelter_data = await query_bright_data_for_shelters_from_form(
            accessibility_needs=accessibility_needs,
            dietary_needs=dietary_needs,
            social_needs=social_needs,
            location=discharge_info.get("facility_city", "San Francisco")
        )
        
        ctx.logger.info(f"✅ Shelter matched: {shelter_data.get('name', 'Unknown')}")
        
        # Step 2: Send shelter matching request (simulated for now)
        # In production, this would send to actual shelter agent
        ctx.logger.info(f"📤 Notifying Shelter Agent: {shelter_data.get('name', '')}")
        
        # Step 3: Send transport request using form data
        ctx.logger.info(f"📤 Requesting transport from {hospital} to {shelter_data.get('address', '')}")
        
        # Step 4: Send social worker assignment request
        ctx.logger.info(f"📤 Assigning social worker for {patient_name}")
        
        # Step 5: Check eligibility for benefits using form data
        ctx.logger.info(f"📤 Checking benefit eligibility for {patient_name}")
        
        # Step 6: Request resources if needed
        if social_needs:
            ctx.logger.info(f"📤 Requesting resources: food, hygiene kit, clothing")
        
        # Step 7: Send medications to pharmacy agent if medications exist
        if medications and len(medications) > 0:
            ctx.logger.info(f"📤 Coordinating pharmacy for {len(medications)} medications")
        
        ctx.logger.info(f"✅ Discharge workflow successfully initiated for {case_id}")
        
        return {
            "status": "success",
            "case_id": case_id,
            "shelter": shelter_data,
            "message": f"Discharge workflow coordinated for {patient_name}"
        }
        
    except Exception as e:
        ctx.logger.error(f"❌ Error coordinating discharge for {case_id}: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "error",
            "case_id": case_id,
            "error": str(e)
        }

@coordinator_protocol.on_message(model=DischargeRequest, replies={WorkflowUpdate})
async def coordinate_discharge(ctx: Context, sender: str, msg: DischargeRequest):
    """Coordinator agent manages the entire discharge workflow (via Fetch.ai message)"""
    ctx.logger.info(f"Coordinating discharge workflow for {msg.case_id}")
    
    try:
        # Use internal coordination function
        result = await coordinate_discharge_internal(
            ctx=ctx,
            case_id=msg.case_id,
            patient_name=msg.patient_name,
            hospital=msg.hospital,
            discharge_date=msg.discharge_date,
            accessibility_needs=msg.accessibility_needs,
            social_needs=msg.social_needs,
            dietary_needs=msg.dietary_needs,
            medications=msg.medications,
            form_data={}  # No form_data in basic DischargeRequest
        )
        
        ctx.logger.info(f"Discharge workflow initiated for {msg.case_id}")
        
    except Exception as e:
        ctx.logger.error(f"Error coordinating discharge for {msg.case_id}: {e}")

@coordinator_agent.on_rest_post("/discharge", DischargeRequestWithFormData, DischargeResponse)
async def handle_discharge_via_http(ctx: Context, req: DischargeRequestWithFormData) -> DischargeResponse:
    """HTTP REST endpoint for receiving discharge requests with filled form data"""
    print(f"\n{'='*60}")
    print(f"🤖 COORDINATOR AGENT RECEIVED DISCHARGE REQUEST")
    print(f"{'='*60}")
    print(f"📋 Case ID: {req.case_id}")
    print(f"👤 Patient: {req.patient_name}")
    print(f"🏥 Hospital: {req.hospital}")
    print(f"📅 Discharge Date: {req.discharge_date}")
    print(f"📋 Form Data Sections: {list(req.form_data.keys())}")
    print(f"{'='*60}\n")
    
    try:
        # Use internal coordination function with form data
        result = await coordinate_discharge_internal(
            ctx=ctx,
            case_id=req.case_id,
            patient_name=req.patient_name,
            hospital=req.hospital,
            discharge_date=req.discharge_date,
            accessibility_needs=req.accessibility_needs,
            social_needs=req.social_needs,
            dietary_needs=req.dietary_needs,
            medications=req.medications,
            form_data=req.form_data
        )
        
        print(f"\n{'='*60}")
        print(f"✅ COORDINATOR AGENT COMPLETED SUCCESSFULLY")
        print(f"📤 Returning result")
        print(f"{'='*60}\n")
        
        # Convert dict result to DischargeResponse (Fetch.ai Model)
        return DischargeResponse(
            status=result.get("status", "success"),
            case_id=result.get("case_id", req.case_id),
            shelter=result.get("shelter"),
            message=result.get("message"),
            error=result.get("error")
        )
        
    except Exception as e:
        print(f"\n❌ ERROR IN COORDINATOR AGENT: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        return DischargeResponse(
            status="error",
            case_id=req.case_id,
            shelter=None,
            message=None,
            error=str(e)
        )

@coordinator_protocol.on_message(model=WorkflowUpdate)
async def handle_workflow_update(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Handle updates from other agents"""
    ctx.logger.info(f"Received workflow update: {msg.step} - {msg.status}")
    
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
async def query_bright_data_for_shelters_from_form(
    accessibility_needs: str,
    dietary_needs: str,
    social_needs: str,
    location: str
) -> Dict[str, Any]:
    """Query Bright Data for real-time shelter information using form data"""
    print(f"🔍 Searching for shelters with:")
    print(f"   - Accessibility: {accessibility_needs}")
    print(f"   - Dietary needs: {dietary_needs}")
    print(f"   - Social needs: {social_needs}")
    print(f"   - Location: {location}")
    
    # This would integrate with Bright Data API
    # For demo purposes, return mock data based on form data
    return {
        "name": "Mission Neighborhood Resource Center",
        "address": "165 Capp St, San Francisco, CA 94110",
        "available_beds": 12,
        "accessibility": True if accessibility_needs else False,
        "services": ["medical respite", "case management", "meals"],
        "phone": "(415) 431-4000"
    }

# Include protocol with manifest publishing for Agentverse deployment
coordinator_agent.include(coordinator_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(coordinator_agent.wallet.address())
    coordinator_agent.run()
