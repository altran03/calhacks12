"""
Transport Agent - Manages transportation scheduling and tracking
Handles transport requests, driver assignment, and route optimization
"""

from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from .models import (
    TransportRequest, TransportConfirmation, WorkflowUpdate
)
from typing import Dict, Any
from datetime import datetime, timedelta

# Initialize Transport Agent
transport_agent = Agent(
    name="transport_agent",
    seed="jdnvgybq vcvusmwd rggxhraj stwbydtc yfyogaea daoqjctt ojiytyza cidzumga wrmzcgmf ghianydm jgtchmbo smsawdqk",
    port=8004,
    endpoint=["http://127.0.0.1:8004/submit"],
    mailbox=True,
)

@transport_agent.on_message(model=TransportRequest)
async def handle_transport_request(ctx: Context, sender: str, msg: TransportRequest):
    """Transport agent schedules and tracks transportation"""
    ctx.logger.info(f"Processing transport request for {msg.case_id}")
    
    try:
        # Step 1: Find available transport providers
        transport_providers = await find_transport_providers(msg)
        
        # Step 2: Select best provider based on requirements
        selected_provider = await select_best_provider(transport_providers, msg)
        
        if selected_provider:
            # Step 3: Schedule transport via Vapi call
            transport_scheduled = await schedule_transport_via_vapi(msg, selected_provider)
            
            if transport_scheduled:
                # Step 4: Send confirmation
                await ctx.send(
                    "coordinator_agent_address",
                    TransportConfirmation(
                        case_id=msg.case_id,
                        transport_provider=selected_provider.get("name", ""),
                        pickup_time=transport_scheduled.get("pickup_time", ""),
                        estimated_duration=transport_scheduled.get("duration", ""),
                        driver_name=transport_scheduled.get("driver_name", ""),
                        driver_phone=transport_scheduled.get("driver_phone", ""),
                        vehicle_type=selected_provider.get("vehicle_type", ""),
                        accessibility_features=selected_provider.get("accessibility_features", [])
                    )
                )
                
                # Step 5: Update workflow status
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step="transport_scheduled",
                        status="completed",
                        details={
                            "provider": selected_provider.get("name", ""),
                            "pickup_time": transport_scheduled.get("pickup_time", ""),
                            "estimated_duration": transport_scheduled.get("duration", ""),
                            "driver": transport_scheduled.get("driver_name", ""),
                            "vehicle_type": selected_provider.get("vehicle_type", "")
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
                
                ctx.logger.info(f"Transport scheduled for {msg.case_id}")
            else:
                # Scheduling failed
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step="transport_scheduling",
                        status="failed",
                        details={"reason": "Unable to schedule transport"},
                        timestamp=datetime.now().isoformat()
                    )
                )
        else:
            # No suitable provider found
            await ctx.send(
                "coordinator_agent_address",
                WorkflowUpdate(
                    case_id=msg.case_id,
                    step="transport_search",
                    status="failed",
                    details={"reason": "No suitable transport providers available"},
                    timestamp=datetime.now().isoformat()
                )
            )
            
    except Exception as e:
        ctx.logger.error(f"Error processing transport request for {msg.case_id}: {e}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="transport_error",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

async def find_transport_providers(request: TransportRequest) -> list:
    """Find available transport providers"""
    # This would integrate with transport provider APIs
    # For demo purposes, return mock data
    providers = [
        {
            "name": "SF Paratransit",
            "vehicle_type": "wheelchair_accessible_van",
            "accessibility_features": ["wheelchair_ramp", "seatbelts", "oxygen_support"],
            "availability": True,
            "estimated_cost": 15.00,
            "phone": "(415) 923-6000"
        },
        {
            "name": "Lyft Access",
            "vehicle_type": "wheelchair_accessible_suv",
            "accessibility_features": ["wheelchair_ramp", "assistance_available"],
            "availability": True,
            "estimated_cost": 25.00,
            "phone": "(415) 555-0123"
        },
        {
            "name": "Uber WAV",
            "vehicle_type": "wheelchair_accessible_vehicle",
            "accessibility_features": ["wheelchair_ramp", "driver_assistance"],
            "availability": True,
            "estimated_cost": 20.00,
            "phone": "(415) 555-0124"
        }
    ]
    
    # Filter based on accessibility requirements
    if request.accessibility_required:
        providers = [p for p in providers if "wheelchair" in p["vehicle_type"]]
    
    return providers

async def select_best_provider(providers: list, request: TransportRequest) -> Dict[str, Any]:
    """Select the best transport provider based on requirements"""
    if not providers:
        return None
    
    # For demo purposes, select the first available provider
    # In production, this would use more sophisticated matching
    return providers[0]

async def schedule_transport_via_vapi(request: TransportRequest, provider: Dict[str, Any]) -> Dict[str, Any]:
    """Schedule transport via Vapi voice call"""
    # This would integrate with Vapi API
    # For demo purposes, return mock scheduling data
    pickup_time = datetime.now() + timedelta(minutes=30)
    
    return {
        "pickup_time": pickup_time.strftime("%Y-%m-%d %H:%M"),
        "duration": "45 minutes",
        "driver_name": "John Smith",
        "driver_phone": "(415) 555-0125",
        "confirmation_number": "TR" + str(datetime.now().timestamp())[-6:]
    }

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(transport_agent.wallet.address())
    transport_agent.run()
