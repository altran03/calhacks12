"""
Resource Agent - Coordinates food, hygiene kits, clothing, and other necessities
Handles resource requests, provider matching, and reservation coordination
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    ResourceRequest, ResourceMatch, WorkflowUpdate, ShelterAddressResponse
)
from .agent_registry import get_agent_address, AgentNames
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    agent: str
    port: int

# Initialize Resource Agent
resource_agent = Agent(
    name="resource_agent",
    seed="nrqgbqsp igexeafn dsxqtgwl guwgwujc rbgskbbn zcfsqomh wfoanyda dnngnkfn slpmzcla vuvibdrl bsonztpr gixrivza",
    port=8007,
    endpoint=["http://127.0.0.1:8007/submit"],
    mailbox=True,
)

# Define Resource Protocol for Agentverse deployment
resource_protocol = Protocol(name="ResourceProtocol", version="1.0.0")

# Add handler to receive shelter address from Shelter Agent
@resource_protocol.on_message(model=ShelterAddressResponse)
async def handle_shelter_address(ctx: Context, sender: str, msg: ShelterAddressResponse):
    """Receive shelter address from Shelter Agent for resource delivery"""
    print(f"🏠 Resource Agent received shelter address: {msg.shelter_name} at {msg.address}")
    
    # Log the conversation
    conversation_log = {
        "timestamp": datetime.now().isoformat(),
        "agent": "resource_agent",
        "action": "shelter_address_received",
        "shelter_name": msg.shelter_name,
        "shelter_address": msg.address,
        "case_id": msg.case_id,
        "message": f"Received shelter address for resource delivery coordination"
    }
    print(f"📝 RESOURCE CONVERSATION LOG: {conversation_log}")
    
    # Store shelter address for resource delivery coordination
    print(f"📦 Resources will be delivered to {msg.address}")
    
    # Log resource coordination
    coordination_log = {
        "timestamp": datetime.now().isoformat(),
        "agent": "resource_agent",
        "action": "resource_coordination_started",
        "shelter_name": msg.shelter_name,
        "shelter_address": msg.address,
        "case_id": msg.case_id,
        "message": f"Starting resource delivery coordination for {msg.shelter_name}"
    }
    print(f"📝 RESOURCE COORDINATION LOG: {coordination_log}")
    
    # Confirm receipt to Social Worker
    await ctx.send(
        get_agent_address(AgentNames.SOCIAL_WORKER),
        WorkflowUpdate(
            case_id=msg.case_id,
            step="shelter_address_received",
            status="info",
            details={
                "message": f"Resource delivery address confirmed: {msg.address}",
                "shelter_name": msg.shelter_name,
                "coordinates": msg.coordinates
            },
            timestamp=datetime.now().isoformat(),
            conversation_logs=[conversation_log, coordination_log]
        )
    )

@resource_protocol.on_message(model=ResourceRequest, replies={WorkflowUpdate})
async def handle_resource_request(ctx: Context, sender: str, msg: ResourceRequest):
    """Resource agent coordinates post-discharge necessities"""
    ctx.logger.info(f"Processing resource request for {msg.case_id}")
    
    try:
        # Process each needed item
        confirmed_resources = []
        
        for item_type in msg.needed_items:
            # Step 1: Query Bright Data for local nonprofits, pantries, donation centers
            resource_data = await query_bright_data_for_resources(msg, item_type)
            
            if resource_data:
                # Step 2: Match patient needs with available resources
                if await match_patient_needs(resource_data, msg, item_type):
                    # Step 3: Make reservation via Vapi call
                    reservation_confirmed = await reserve_resource_via_vapi(resource_data, msg)
                    
                    if reservation_confirmed:
                        confirmed_resources.append({
                            "item_type": item_type,
                            "provider": resource_data.get("provider_name", ""),
                            "pickup_time": resource_data.get("pickup_time", "TBD"),
                            "dietary_match": bool(msg.dietary_restrictions)
                        })
                        
                        # Step 4: Update workflow status (report to Social Worker)
                        await ctx.send(
                            get_agent_address(AgentNames.SOCIAL_WORKER),
                            WorkflowUpdate(
                                case_id=msg.case_id,
                                step=f"resource_{item_type}_confirmed",
                                status="completed",
                                details={
                                    "resource_type": item_type,
                                    "provider": resource_data.get("provider_name", ""),
                                    "pickup_time": resource_data.get("pickup_time", "TBD"),
                                    "dietary_match": bool(msg.dietary_restrictions),
                                    "address": resource_data.get("address", ""),
                                    "phone": resource_data.get("phone", "")
                                },
                                timestamp=datetime.now().isoformat()
                            )
                        )
                    else:
                        # Reservation failed, try alternative providers
                        await find_alternative_resources(ctx, msg, item_type)
                else:
                    # No suitable match found
                    await find_alternative_resources(ctx, msg, item_type)
            else:
                # No resources found for this item type (report to Social Worker)
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step=f"resource_{item_type}_search",
                        status="failed",
                        details={"reason": f"No {item_type} resources available"},
                        timestamp=datetime.now().isoformat()
                    )
                )
        
        # Send summary of confirmed resources (to Social Worker)
        if confirmed_resources:
            await ctx.send(
                get_agent_address(AgentNames.SOCIAL_WORKER),
                WorkflowUpdate(
                    case_id=msg.case_id,
                    step="resources_summary",
                    status="completed",
                    details={
                        "confirmed_resources": confirmed_resources,
                        "total_items": len(confirmed_resources),
                        "patient_name": msg.patient_name
                    },
                    timestamp=datetime.now().isoformat()
                )
            )
            
        ctx.logger.info(f"Resource coordination completed for {msg.case_id}: {len(confirmed_resources)} items confirmed")
        
    except Exception as e:
        ctx.logger.error(f"Error processing resource request for {msg.case_id}: {e}")
        await ctx.send(
            get_agent_address(AgentNames.SOCIAL_WORKER),
            WorkflowUpdate(
                case_id=msg.case_id,
                step="resource_coordination",
                status="failed",
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
        )

async def query_bright_data_for_resources(request: ResourceRequest, item_type: str) -> Dict[str, Any]:
    """Query Bright Data for local nonprofits and resource centers"""
    # Mock data for demo - in production, use Bright Data API
    resource_map = {
        "food": {
            "provider_name": "SF-Marin Food Bank",
            "address": "900 Pennsylvania Ave, San Francisco, CA 94107",
            "phone": "(415) 282-1900",
            "available_items": ["groceries", "prepared meals", "dietary-specific meals"],
            "pickup_time": "Monday-Friday 9am-5pm",
            "dietary_accommodations": True
        },
        "hygiene_kit": {
            "provider_name": "Lava Mae",
            "address": "Mobile service - Mission District",
            "phone": "(415) 354-5282",
            "available_items": ["hygiene kits", "toiletries", "towels"],
            "pickup_time": "Daily 10am-4pm",
            "dietary_accommodations": False
        },
        "clothing": {
            "provider_name": "St. Anthony's Clothing Closet",
            "address": "150 Golden Gate Ave, San Francisco, CA 94102",
            "phone": "(415) 592-2700",
            "available_items": ["clothing", "shoes", "winter gear"],
            "pickup_time": "Monday-Saturday 8am-4pm",
            "dietary_accommodations": False
        }
    }
    return resource_map.get(item_type, {})

async def match_patient_needs(resource_data: Dict[str, Any], request: ResourceRequest, item_type: str) -> bool:
    """Match patient needs with available resources"""
    # Check if resource can accommodate dietary restrictions
    if request.dietary_restrictions and item_type == "food":
        return resource_data.get("dietary_accommodations", False)
    
    # Check if resource is available
    return bool(resource_data.get("available_items"))

async def reserve_resource_via_vapi(resource_data: Dict[str, Any], request: ResourceRequest) -> bool:
    """Reserve resources via Vapi voice call"""
    # In production, make Vapi call to resource provider
    return True

async def find_alternative_resources(ctx: Context, request: ResourceRequest, item_type: str):
    """Find alternative resources when primary match fails"""
    ctx.logger.info(f"Searching for alternative {item_type} resources for {request.case_id}")
    
    # Query for alternative resources
    alternatives = await query_alternative_resources(request, item_type)
    
    for alt_resource in alternatives:
        try:
            # Check availability for alternative
            availability = await check_resource_availability(alt_resource, request)
            
            if availability.get("available", False):
                # Send alternative match (to Social Worker)
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
                    WorkflowUpdate(
                        case_id=request.case_id,
                        step=f"alternative_{item_type}_found",
                        status="completed",
                        details={
                            "resource_type": item_type,
                            "alternative_provider": alt_resource.get("provider_name"),
                            "address": alt_resource.get("address"),
                            "pickup_time": alt_resource.get("pickup_time")
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
                return
                
        except Exception as e:
            ctx.logger.error(f"Error checking alternative resource: {e}")
    
    # No alternatives found (report to Social Worker)
    await ctx.send(
        get_agent_address(AgentNames.SOCIAL_WORKER),
        WorkflowUpdate(
            case_id=request.case_id,
            step=f"{item_type}_search",
            status="failed",
            details={"reason": f"No alternative {item_type} resources found"},
            timestamp=datetime.now().isoformat()
        )
    )

async def query_alternative_resources(request: ResourceRequest, item_type: str) -> List[Dict[str, Any]]:
    """Query for alternative resources"""
    # This would integrate with resource database
    alternatives = {
        "food": [
            {
                "provider_name": "Glide Memorial Church",
                "address": "330 Ellis St, San Francisco, CA 94102",
                "phone": "(415) 674-6000",
                "pickup_time": "Daily 6am-8am"
            }
        ],
        "hygiene_kit": [
            {
                "provider_name": "Project Homeless Connect",
                "address": "Various locations",
                "phone": "(415) 355-7400",
                "pickup_time": "Monthly events"
            }
        ],
        "clothing": [
            {
                "provider_name": "Goodwill Industries",
                "address": "Multiple locations",
                "phone": "(415) 575-2200",
                "pickup_time": "Daily 9am-9pm"
            }
        ]
    }
    return alternatives.get(item_type, [])

async def check_resource_availability(resource: Dict[str, Any], request: ResourceRequest) -> Dict[str, Any]:
    """Check availability for resource"""
    return {
        "available": True,
        "capacity": "high",
        "dietary_match": True
    }

# Health check endpoint
@resource_agent.on_rest_get("/health", HealthResponse)
async def health_check(ctx: Context):
    """Health check endpoint"""
    return HealthResponse(status="healthy", agent="resource_agent", port=8007)

# Include protocol with manifest publishing for Agentverse deployment
resource_agent.include(resource_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(resource_agent.wallet.address())
    resource_agent.run()
