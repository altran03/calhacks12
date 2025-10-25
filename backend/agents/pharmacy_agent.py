"""
Pharmacy Agent - Ensures medication continuity and access
Handles pharmacy requests, medication availability, and prescription coordination
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    PharmacyRequest, PharmacyMatch, WorkflowUpdate
)
from typing import Dict, Any, List
from datetime import datetime

# Initialize Pharmacy Agent
pharmacy_agent = Agent(
    name="pharmacy_agent",
    seed="gqzmllxo xqnxshut jkdqjwkq wzgrofch zlzxclid zfzpipsb udjiwbiy brbfivwl ddfjkgxv jmdrfnbq iaqpvflw xtryujng",
    port=8008,
    endpoint=["http://127.0.0.1:8008/submit"],
    mailbox=True,
)

# Define Pharmacy Protocol for Agentverse deployment
pharmacy_protocol = Protocol(name="PharmacyProtocol", version="1.0.0")

@pharmacy_protocol.on_message(model=PharmacyRequest, replies={PharmacyMatch, WorkflowUpdate})
async def handle_pharmacy_request(ctx: Context, sender: str, msg: PharmacyRequest):
    """Pharmacy agent ensures post-discharge medication access"""
    ctx.logger.info(f"Processing pharmacy request for {msg.case_id}")
    
    try:
        # Step 1: Query Bright Data for 24/7 or low-cost pharmacies near patient location
        pharmacies = await query_bright_data_for_pharmacies(msg.location)
        
        # Step 2: Try each pharmacy until we find one with all medications
        for pharmacy in pharmacies[:3]:  # Try top 3 pharmacies
            try:
                # Step 3: Call pharmacy via Vapi to confirm medication availability
                availability = await check_medication_availability_via_vapi(
                    pharmacy, 
                    msg.medications
                )
                
                if availability.get("all_available", False):
                    # Step 4: Send pharmacy match
                    await ctx.send(
                        "coordinator_agent_address",
                        PharmacyMatch(
                            case_id=msg.case_id,
                            pharmacy_name=pharmacy.get("name", ""),
                            address=pharmacy.get("address", ""),
                            phone=pharmacy.get("phone", ""),
                            hours=pharmacy.get("hours", "24/7"),
                            medications_available=True,
                            cost_estimate=availability.get("cost_estimate", 0),
                            ready_time=availability.get("ready_time", "30 minutes")
                        )
                    )
                    
                    # Step 5: Update workflow status
                    await ctx.send(
                        "coordinator_agent_address",
                        WorkflowUpdate(
                            case_id=msg.case_id,
                            step="pharmacy_confirmed",
                            status="completed",
                            details={
                                "pharmacy_name": pharmacy.get("name", ""),
                                "address": pharmacy.get("address", ""),
                                "phone": pharmacy.get("phone", ""),
                                "hours": pharmacy.get("hours", "24/7"),
                                "cost_estimate": availability.get("cost_estimate", 0),
                                "medications_ready": True,
                                "ready_time": availability.get("ready_time", "30 minutes"),
                                "patient_name": msg.patient_name
                            },
                            timestamp=datetime.now().isoformat()
                        )
                    )
                    
                    ctx.logger.info(f"Pharmacy confirmed for {msg.case_id}: {pharmacy.get('name', '')}")
                    return  # Found a pharmacy, exit loop
                    
            except Exception as e:
                ctx.logger.error(f"Error checking pharmacy {pharmacy.get('name', '')}: {e}")
                continue
        
        # No pharmacy found with all medications
        ctx.logger.warning(f"Could not find pharmacy with all medications for {msg.case_id}")
        await ctx.send(
            "social_worker_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="pharmacy_search",
                status="needs_manual_intervention",
                details={
                    "reason": "medications not available at nearby pharmacies",
                    "medications_requested": [med.get("name", "") for med in msg.medications],
                    "patient_name": msg.patient_name
                },
                timestamp=datetime.now().isoformat()
            )
        )
        
    except Exception as e:
        ctx.logger.error(f"Error processing pharmacy request for {msg.case_id}: {e}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="pharmacy_coordination",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

async def query_bright_data_for_pharmacies(location: str) -> List[Dict[str, Any]]:
    """Query Bright Data for nearby pharmacies"""
    # Mock data - in production, use Bright Data web scraping
    return [
        {
            "name": "Walgreens - Mission District",
            "address": "2690 Mission St, San Francisco, CA 94110",
            "phone": "(415) 826-1211",
            "hours": "24/7",
            "type": "retail_pharmacy",
            "low_cost": False
        },
        {
            "name": "SF General Hospital Outpatient Pharmacy",
            "address": "1001 Potrero Ave, San Francisco, CA 94110",
            "phone": "(415) 206-8387",
            "hours": "Mon-Fri 8am-6pm",
            "type": "hospital_pharmacy",
            "low_cost": True
        },
        {
            "name": "CVS Pharmacy",
            "address": "2300 16th St, San Francisco, CA 94103",
            "phone": "(415) 861-3136",
            "hours": "24/7",
            "type": "retail_pharmacy",
            "low_cost": False
        },
        {
            "name": "Rite Aid Pharmacy",
            "address": "2400 Mission St, San Francisco, CA 94110",
            "phone": "(415) 824-2000",
            "hours": "24/7",
            "type": "retail_pharmacy",
            "low_cost": False
        }
    ]

async def check_medication_availability_via_vapi(pharmacy: Dict[str, Any], medications: List[Dict[str, str]]) -> Dict[str, Any]:
    """Check medication availability via Vapi call"""
    # In production, call pharmacy via Vapi API
    # Mock response based on pharmacy type and medications
    all_available = True
    cost_estimate = 0.0
    
    for med in medications:
        med_name = med.get("name", "").lower()
        # Mock availability logic
        if "controlled" in med_name or "narcotic" in med_name:
            all_available = False
            break
        cost_estimate += 15.00  # Mock cost per medication
    
    return {
        "all_available": all_available,
        "cost_estimate": cost_estimate,
        "ready_time": "30 minutes" if all_available else "unavailable",
        "pharmacy_notes": "All medications available" if all_available else "Some medications require prior authorization"
    }

# Include protocol with manifest publishing for Agentverse deployment
pharmacy_agent.include(pharmacy_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(pharmacy_agent.wallet.address())
    pharmacy_agent.run()
