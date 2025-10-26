"""
Transport Agent - Manages transportation scheduling and tracking
Handles transport requests, driver assignment, and route optimization
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    TransportRequest, TransportConfirmation, WorkflowUpdate, MapBoxVisualizationTrigger
)
from .agent_registry import get_agent_address, AgentNames
from typing import Dict, Any, List
from datetime import datetime, timedelta
import os
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    agent: str
    port: int

# Initialize Transport Agent
transport_agent = Agent(
    name="transport_agent",
    seed="jdnvgybq vcvusmwd rggxhraj stwbydtc yfyogaea daoqjctt ojiytyza cidzumga wrmzcgmf ghianydm jgtchmbo smsawdqk",
    port=8004,
    endpoint=["http://127.0.0.1:8004/submit"],
    mailbox=True,
)

# Define Transport Protocol for Agentverse deployment
transport_protocol = Protocol(name="TransportProtocol", version="1.0.0")

@transport_protocol.on_message(model=TransportRequest, replies={TransportConfirmation, WorkflowUpdate})
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
                # Step 4: Send confirmation (to Social Worker)
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
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
                
                # Step 5: Trigger MapBox visualization
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
                    MapBoxVisualizationTrigger(
                        case_id=msg.case_id,
                        pickup_location={
                            "name": msg.pickup_location,
                            "coordinates": [37.7625, -122.4580]  # TODO: Geocode hospital address
                        },
                        dropoff_location={
                            "name": msg.dropoff_location,
                            "coordinates": await get_real_shelter_coordinates("Shelter", msg.dropoff_location)
                        },
                        route={
                            "polyline": "encoded_polyline_data",  # TODO: Get from MapBox Directions API
                            "distance": "3.2 miles",
                            "duration": transport_scheduled.get("duration", "45 minutes"),
                            "traffic_level": "moderate",
                            "animated": True
                        },
                        transport_details={
                            "driver": transport_scheduled.get("driver_name", ""),
                            "phone": transport_scheduled.get("driver_phone", ""),
                            "vehicle": selected_provider.get("vehicle_type", ""),
                            "license_plate": "CA 7ABC123"  # TODO: Get real license plate
                        },
                        eta_minutes=45  # TODO: Calculate real ETA
                    )
                )
                
                # Step 6: Update workflow status
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
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
                # Scheduling failed (report to Social Worker)
                await ctx.send(
                    get_agent_address(AgentNames.SOCIAL_WORKER),
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step="transport_scheduling",
                        status="failed",
                        details={"reason": "Unable to schedule transport"},
                        timestamp=datetime.now().isoformat()
                    )
                )
        else:
            # No suitable provider found (report to Social Worker)
            await ctx.send(
                get_agent_address(AgentNames.SOCIAL_WORKER),
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
            get_agent_address(AgentNames.SOCIAL_WORKER),
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

async def get_real_shelter_coordinates(shelter_name: str, address: str) -> List[float]:
    """Get real coordinates from Supabase or geocode address"""
    try:
        # Try to get from Supabase first
        import os
        if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
            from case_manager import case_manager
            if case_manager and case_manager.client:
                shelter_data = case_manager.get_shelter_by_name(shelter_name)
                if shelter_data and shelter_data.get('latitude') and shelter_data.get('longitude'):
                    return [shelter_data['latitude'], shelter_data['longitude']]
        
        # Fallback to geocoding
        return await geocode_address(address)
    except Exception as e:
        print(f"❌ Error getting coordinates: {e}")
        return [37.7749, -122.4194]  # Fallback to SF

async def geocode_address(address: str) -> List[float]:
    """Geocode address to get coordinates"""
    try:
        import httpx
        mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
        if not mapbox_token:
            return [37.7749, -122.4194]  # Fallback to SF
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json",
                params={"access_token": mapbox_token}
            )
            data = response.json()
            
            if data.get("features"):
                coords = data["features"][0]["center"]
                return [coords[1], coords[0]]  # [lat, lng]
            
        return [37.7749, -122.4194]  # Fallback to SF
    except Exception as e:
        print(f"❌ Geocoding error: {e}")
        return [37.7749, -122.4194]  # Fallback to SF

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

# Health check endpoint
@transport_agent.on_rest_get("/health", HealthResponse)
async def health_check(ctx: Context):
    """Health check endpoint"""
    return HealthResponse(status="healthy", agent="transport_agent", port=8004)

# Include protocol with manifest publishing for Agentverse deployment
transport_agent.include(transport_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(transport_agent.wallet.address())
    transport_agent.run()
