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

class ResourceRequest(Model):
    case_id: str
    patient_name: str
    dietary_restrictions: Optional[str] = None
    allergies: Optional[str] = None
    needed_items: List[str]  # ["food", "hygiene_kit", "clothing"]
    location: str

class ResourceMatch(Model):
    case_id: str
    resource_type: str
    provider_name: str
    address: str
    available_items: List[str]
    phone: str
    pickup_time: Optional[str] = None

class PharmacyRequest(Model):
    case_id: str
    patient_name: str
    medications: List[Dict[str, str]]  # [{"name": "Lisinopril", "dosage": "10mg", "quantity": "30"}]
    insurance_info: Optional[str] = None
    location: str

class PharmacyMatch(Model):
    case_id: str
    pharmacy_name: str
    address: str
    phone: str
    hours: str
    medications_available: bool
    cost_estimate: Optional[float] = None

class EligibilityRequest(Model):
    case_id: str
    patient_name: str
    dob: str
    ssn_last4: Optional[str] = None
    income_level: Optional[str] = None
    current_benefits: List[str]

class EligibilityResult(Model):
    case_id: str
    eligible_programs: List[Dict[str, Any]]
    requires_manual_review: bool
    next_steps: List[str]

class AnalyticsData(Model):
    metric_type: str
    timestamp: str
    value: Any
    metadata: Dict[str, Any]

class DocumentParseRequest(Model):
    case_id: str
    document_url: str  # URL or path to uploaded document
    document_type: str  # "discharge_summary", "medical_record", "prescription", etc.
    
class ParsedDischargeData(Model):
    case_id: str
    patient_name: str
    patient_dob: Optional[str] = None
    medical_condition: str
    diagnosis: Optional[str] = None
    medications: List[Dict[str, str]]
    allergies: Optional[str] = None
    accessibility_needs: Optional[str] = None
    dietary_needs: Optional[str] = None
    social_needs: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    discharge_date: str
    hospital: str
    confidence_score: float  # 0-1 indicating parsing confidence

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

# ============================================
# NEW AGENTS - Phase 1 Implementation
# ============================================

# Resource Agent - Coordinates food, hygiene kits, clothing
resource_agent = Agent(
    name="resource_agent",
    seed="resource_agent_seed_phrase_here",
    port=8007,
    endpoint=["http://127.0.0.1:8007/submit"],
)

@resource_agent.on_message(model=ResourceRequest)
async def handle_resource_request(ctx: Context, sender: str, msg: ResourceRequest):
    """Resource agent coordinates post-discharge necessities"""
    ctx.logger.info(f"Processing resource request for {msg.case_id}")
    
    # Query Bright Data for local nonprofits, pantries, donation centers
    for item_type in msg.needed_items:
        resource_data = await query_bright_data_for_resources(msg, item_type)
        
        # Match patient needs with available resources
        if resource_data:
            # Make reservation via Vapi call
            reservation_confirmed = await reserve_resource_via_vapi(resource_data, msg)
            
            if reservation_confirmed:
                await ctx.send(
                    "coordinator_agent_address",
                    WorkflowUpdate(
                        case_id=msg.case_id,
                        step=f"resource_{item_type}_confirmed",
                        status="completed",
                        details={
                            "resource_type": item_type,
                            "provider": resource_data.get("provider_name", ""),
                            "pickup_time": resource_data.get("pickup_time", "TBD"),
                            "dietary_match": bool(msg.dietary_restrictions),
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )

# Pharmacy Agent - Ensures medication continuity
pharmacy_agent = Agent(
    name="pharmacy_agent",
    seed="pharmacy_agent_seed_phrase_here",
    port=8008,
    endpoint=["http://127.0.0.1:8008/submit"],
)

@pharmacy_agent.on_message(model=PharmacyRequest)
async def handle_pharmacy_request(ctx: Context, sender: str, msg: PharmacyRequest):
    """Pharmacy agent ensures post-discharge medication access"""
    ctx.logger.info(f"Processing pharmacy request for {msg.case_id}")
    
    # Query Bright Data for 24/7 or low-cost pharmacies near patient location
    pharmacies = await query_bright_data_for_pharmacies(msg.location)
    
    for pharmacy in pharmacies[:3]:  # Try top 3 pharmacies
        # Call pharmacy via Vapi to confirm medication availability
        availability = await check_medication_availability_via_vapi(
            pharmacy, 
            msg.medications
        )
        
        if availability.get("all_available", False):
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
                    },
                    timestamp=datetime.now().isoformat()
                )
            )
            break  # Found a pharmacy, exit loop
    else:
        # No pharmacy found with all medications
        ctx.logger.warning(f"Could not find pharmacy with all medications for {msg.case_id}")
        await ctx.send(
            "social_worker_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="pharmacy_search",
                status="needs_manual_intervention",
                details={"reason": "medications not available at nearby pharmacies"},
                timestamp=datetime.now().isoformat()
            )
        )

# Eligibility Agent - Automates benefit verification
eligibility_agent = Agent(
    name="eligibility_agent",
    seed="eligibility_agent_seed_phrase_here",
    port=8009,
    endpoint=["http://127.0.0.1:8009/submit"],
)

@eligibility_agent.on_message(model=EligibilityRequest)
async def handle_eligibility_check(ctx: Context, sender: str, msg: EligibilityRequest):
    """Eligibility agent verifies public benefit eligibility"""
    ctx.logger.info(f"Processing eligibility check for {msg.case_id}")
    
    # Query public benefit APIs (Medi-Cal, General Assistance, SNAP, etc.)
    eligible_programs = []
    requires_manual = False
    
    # Check Medi-Cal eligibility
    medi_cal_eligible = await check_medi_cal_eligibility(msg)
    if medi_cal_eligible.get("eligible"):
        eligible_programs.append({
            "program": "Medi-Cal",
            "status": "eligible",
            "coverage_start": medi_cal_eligible.get("start_date"),
            "benefits": medi_cal_eligible.get("benefits", [])
        })
    
    # Check General Assistance
    ga_eligible = await check_general_assistance_eligibility(msg)
    if ga_eligible.get("eligible"):
        eligible_programs.append({
            "program": "General Assistance",
            "status": "eligible",
            "monthly_amount": ga_eligible.get("amount"),
        })
    elif ga_eligible.get("needs_review"):
        requires_manual = True
    
    # Check SNAP (CalFresh)
    snap_eligible = await check_snap_eligibility(msg)
    if snap_eligible.get("eligible"):
        eligible_programs.append({
            "program": "CalFresh (SNAP)",
            "status": "eligible",
            "monthly_amount": snap_eligible.get("amount"),
        })
    
    # Send results back to coordinator
    await ctx.send(
        "coordinator_agent_address",
        WorkflowUpdate(
            case_id=msg.case_id,
            step="eligibility_checked",
            status="completed" if not requires_manual else "needs_review",
            details={
                "eligible_programs": eligible_programs,
                "requires_manual_review": requires_manual,
                "total_monthly_benefits": sum(
                    p.get("monthly_amount", 0) for p in eligible_programs
                ),
            },
            timestamp=datetime.now().isoformat()
        )
    )
    
    # If expedited benefits available, notify social worker
    if any(p.get("program") == "Medi-Cal" for p in eligible_programs):
        await ctx.send(
            "social_worker_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="benefits_expedited",
                status="info",
                details={"message": "Patient eligible for immediate Medi-Cal coverage"},
                timestamp=datetime.now().isoformat()
            )
        )

# Analytics Agent - System metrics and reporting
analytics_agent = Agent(
    name="analytics_agent",
    seed="analytics_agent_seed_phrase_here",
    port=8010,
    endpoint=["http://127.0.0.1:8010/submit"],
)

# Analytics agent listens to all WorkflowUpdate messages
@analytics_agent.on_message(model=WorkflowUpdate)
async def collect_analytics(ctx: Context, sender: str, msg: WorkflowUpdate):
    """Analytics agent collects non-PII metrics"""
    # Anonymize and aggregate data
    metric_data = {
        "step": msg.step,
        "status": msg.status,
        "timestamp": msg.timestamp,
        "case_id_hash": hash(msg.case_id),  # Anonymized
    }
    
    # Store metrics (in production, this would go to a database or analytics service)
    await store_metric(metric_data)
    
    ctx.logger.info(f"Analytics: Recorded {msg.step} - {msg.status}")

# Helper functions for new agents
async def query_bright_data_for_resources(request: ResourceRequest, item_type: str) -> Dict[str, Any]:
    """Query Bright Data for local nonprofits and resource centers"""
    # Mock data for demo - in production, use Bright Data API
    resource_map = {
        "food": {
            "provider_name": "SF-Marin Food Bank",
            "address": "900 Pennsylvania Ave, San Francisco, CA 94107",
            "phone": "(415) 282-1900",
            "available_items": ["groceries", "prepared meals", "dietary-specific meals"],
            "pickup_time": "Monday-Friday 9am-5pm"
        },
        "hygiene_kit": {
            "provider_name": "Lava Mae",
            "address": "Mobile service - Mission District",
            "phone": "(415) 354-5282",
            "available_items": ["hygiene kits", "toiletries", "towels"],
            "pickup_time": "Daily 10am-4pm"
        },
        "clothing": {
            "provider_name": "St. Anthony's Clothing Closet",
            "address": "150 Golden Gate Ave, San Francisco, CA 94102",
            "phone": "(415) 592-2700",
            "available_items": ["clothing", "shoes", "winter gear"],
            "pickup_time": "Monday-Saturday 8am-4pm"
        }
    }
    return resource_map.get(item_type, {})

async def reserve_resource_via_vapi(resource_data: Dict[str, Any], request: ResourceRequest) -> bool:
    """Reserve resources via Vapi voice call"""
    # In production, make Vapi call to resource provider
    return True

async def query_bright_data_for_pharmacies(location: str) -> List[Dict[str, Any]]:
    """Query Bright Data for nearby pharmacies"""
    # Mock data - in production, use Bright Data web scraping
    return [
        {
            "name": "Walgreens - Mission District",
            "address": "2690 Mission St, San Francisco, CA 94110",
            "phone": "(415) 826-1211",
            "hours": "24/7",
            "type": "retail_pharmacy"
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
            "type": "retail_pharmacy"
        }
    ]

async def check_medication_availability_via_vapi(pharmacy: Dict[str, Any], medications: List[Dict[str, str]]) -> Dict[str, Any]:
    """Check medication availability via Vapi call"""
    # In production, call pharmacy via Vapi API
    # Mock response
    return {
        "all_available": True,
        "cost_estimate": 25.50,
        "ready_time": "30 minutes"
    }

async def check_medi_cal_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check Medi-Cal eligibility via public API"""
    # In production, integrate with CA DHCS API or county eligibility systems
    # Mock response based on income level
    if request.income_level and request.income_level.lower() in ["low", "very_low", "none"]:
        return {
            "eligible": True,
            "start_date": datetime.now().isoformat(),
            "benefits": ["medical", "dental", "vision", "prescriptions"]
        }
    return {"eligible": False}

async def check_general_assistance_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check General Assistance eligibility"""
    # Mock response
    return {
        "eligible": True,
        "amount": 588.00,  # SF GA monthly amount (example)
        "needs_review": False
    }

async def check_snap_eligibility(request: EligibilityRequest) -> Dict[str, Any]:
    """Check SNAP/CalFresh eligibility"""
    # Mock response
    return {
        "eligible": True,
        "amount": 281.00,  # Average monthly SNAP benefit
    }

async def store_metric(metric_data: Dict[str, Any]) -> None:
    """Store analytics metric (non-PII)"""
    # In production, write to database or analytics service
    # For demo, just log
    pass

# ============================================
# PARSER AGENT - Document Intelligence
# ============================================

# Parser Agent - Uses LlamaParse + Gemini for document parsing
parser_agent = Agent(
    name="parser_agent",
    seed="parser_agent_seed_phrase_here",
    port=8011,
    endpoint=["http://127.0.0.1:8011/submit"],
)

@parser_agent.on_message(model=DocumentParseRequest)
async def handle_document_parse(ctx: Context, sender: str, msg: DocumentParseRequest):
    """Parser agent processes uploaded discharge documents using LlamaParse + Gemini"""
    ctx.logger.info(f"Processing document parse request for {msg.case_id}")
    
    try:
        # Step 1: Parse document with LlamaParse
        parsed_text = await parse_document_with_llamaparse(msg.document_url, msg.document_type)
        
        # Step 2: Extract structured data with Gemini
        extracted_data = await extract_data_with_gemini(parsed_text, msg.document_type)
        
        # Step 3: Create structured discharge data
        parsed_data = ParsedDischargeData(
            case_id=msg.case_id,
            patient_name=extracted_data.get("patient_name", "Unknown"),
            patient_dob=extracted_data.get("dob"),
            medical_condition=extracted_data.get("medical_condition", ""),
            diagnosis=extracted_data.get("diagnosis"),
            medications=extracted_data.get("medications", []),
            allergies=extracted_data.get("allergies"),
            accessibility_needs=extracted_data.get("accessibility_needs"),
            dietary_needs=extracted_data.get("dietary_needs"),
            social_needs=extracted_data.get("social_needs"),
            follow_up_instructions=extracted_data.get("follow_up_instructions"),
            discharge_date=extracted_data.get("discharge_date", datetime.now().strftime("%Y-%m-%d")),
            hospital=extracted_data.get("hospital", "Unknown Hospital"),
            confidence_score=extracted_data.get("confidence_score", 0.85)
        )
        
        # Step 4: Send parsed data to coordinator for autofill
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="document_parsed",
                status="completed",
                details={
                    "parsed_data": {
                        "patient_name": parsed_data.patient_name,
                        "medical_condition": parsed_data.medical_condition,
                        "medications": parsed_data.medications,
                        "accessibility_needs": parsed_data.accessibility_needs,
                        "dietary_needs": parsed_data.dietary_needs,
                        "social_needs": parsed_data.social_needs,
                        "discharge_date": parsed_data.discharge_date,
                        "hospital": parsed_data.hospital,
                    },
                    "confidence_score": parsed_data.confidence_score,
                    "requires_review": parsed_data.confidence_score < 0.8
                },
                timestamp=datetime.now().isoformat()
            )
        )
        
        ctx.logger.info(f"Document parsing completed for {msg.case_id} with confidence {parsed_data.confidence_score}")
        
    except Exception as e:
        ctx.logger.error(f"Error parsing document for {msg.case_id}: {str(e)}")
        await ctx.send(
            "coordinator_agent_address",
            WorkflowUpdate(
                case_id=msg.case_id,
                step="document_parse",
                status="error",
                details={"error": str(e), "requires_manual_entry": True},
                timestamp=datetime.now().isoformat()
            )
        )

# Helper functions for ParserAgent
async def parse_document_with_llamaparse(document_url: str, document_type: str) -> str:
    """Parse document using LlamaParse API"""
    # In production, use actual LlamaParse API
    # from llama_parse import LlamaParse
    # parser = LlamaParse(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))
    # documents = parser.load_data(document_url)
    # return documents[0].text
    
    # Mock response for demo
    mock_discharge_summary = """
    DISCHARGE SUMMARY
    
    Patient Name: John Doe
    Date of Birth: 01/15/1970
    MRN: 123456789
    
    Admission Date: 10/20/2025
    Discharge Date: 10/24/2025
    
    Hospital: San Francisco General Hospital
    Attending Physician: Dr. Sarah Johnson
    
    PRIMARY DIAGNOSIS:
    Acute exacerbation of chronic obstructive pulmonary disease (COPD)
    
    MEDICAL HISTORY:
    - COPD (chronic)
    - Type 2 Diabetes Mellitus
    - Hypertension
    
    MEDICATIONS ON DISCHARGE:
    1. Albuterol inhaler 90mcg, 2 puffs every 4-6 hours as needed
    2. Lisinopril 10mg, once daily
    3. Metformin 500mg, twice daily with meals
    4. Prednisone 20mg, once daily for 5 days (taper)
    
    ALLERGIES:
    Penicillin (rash)
    
    ACCESSIBILITY NEEDS:
    Patient uses wheelchair for mobility due to severe COPD and limited exercise tolerance.
    Requires wheelchair-accessible housing.
    
    DIETARY RECOMMENDATIONS:
    - Diabetic diet (ADA guidelines)
    - Low sodium (2g/day) for hypertension management
    - Small, frequent meals to manage breathing difficulty
    
    SOCIAL NEEDS:
    Patient is currently unhoused. Requires shelter placement with medical respite capacity.
    Would benefit from connection to social worker for ongoing case management.
    Mental health support recommended for anxiety related to housing instability.
    
    FOLLOW-UP INSTRUCTIONS:
    - Follow up with primary care physician within 7 days
    - Pulmonology appointment in 2 weeks
    - Continue COPD action plan
    - Seek emergency care if shortness of breath worsens
    
    DISCHARGE DISPOSITION:
    Discharged to shelter (pending placement)
    """
    
    return mock_discharge_summary

async def extract_data_with_gemini(parsed_text: str, document_type: str) -> Dict[str, Any]:
    """Extract structured data from parsed text using Gemini"""
    # In production, use actual Gemini API
    # import google.generativeai as genai
    # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    # model = genai.GenerativeModel('gemini-pro')
    # 
    # prompt = f"""
    # Extract the following information from this discharge summary:
    # - Patient name
    # - Date of birth
    # - Medical condition/diagnosis
    # - Medications (name, dosage, quantity)
    # - Allergies
    # - Accessibility needs
    # - Dietary needs
    # - Social needs
    # - Follow-up instructions
    # - Discharge date
    # - Hospital name
    # 
    # Return as JSON.
    # 
    # Document:
    # {parsed_text}
    # """
    # 
    # response = model.generate_content(prompt)
    # return json.loads(response.text)
    
    # Mock extracted data for demo
    return {
        "patient_name": "John Doe",
        "dob": "01/15/1970",
        "medical_condition": "Acute exacerbation of chronic obstructive pulmonary disease (COPD)",
        "diagnosis": "COPD exacerbation, Type 2 Diabetes, Hypertension",
        "medications": [
            {"name": "Albuterol inhaler", "dosage": "90mcg", "quantity": "2 puffs every 4-6 hours"},
            {"name": "Lisinopril", "dosage": "10mg", "quantity": "once daily"},
            {"name": "Metformin", "dosage": "500mg", "quantity": "twice daily with meals"},
            {"name": "Prednisone", "dosage": "20mg", "quantity": "once daily for 5 days"}
        ],
        "allergies": "Penicillin (rash)",
        "accessibility_needs": "Wheelchair required for mobility. Requires wheelchair-accessible housing.",
        "dietary_needs": "Diabetic diet (ADA guidelines), Low sodium (2g/day), Small frequent meals",
        "social_needs": "Currently unhoused. Requires shelter with medical respite capacity. Needs social worker for case management. Mental health support for anxiety.",
        "follow_up_instructions": "Follow up with PCP within 7 days, Pulmonology in 2 weeks, Continue COPD action plan",
        "discharge_date": "10/24/2025",
        "hospital": "San Francisco General Hospital",
        "confidence_score": 0.92
    }

# Fund agents if needed
if __name__ == "__main__":
    # Fund agents (this would be done with actual Fetch.ai tokens)
    fund_agent_if_low(hospital_agent.wallet.address())
    fund_agent_if_low(coordinator_agent.wallet.address())
    fund_agent_if_low(shelter_agent.wallet.address())
    fund_agent_if_low(transport_agent.wallet.address())
    fund_agent_if_low(social_worker_agent.wallet.address())
    fund_agent_if_low(followup_agent.wallet.address())
    
    # Fund new Phase 1 agents
    fund_agent_if_low(resource_agent.wallet.address())
    fund_agent_if_low(pharmacy_agent.wallet.address())
    fund_agent_if_low(eligibility_agent.wallet.address())
    fund_agent_if_low(analytics_agent.wallet.address())
    fund_agent_if_low(parser_agent.wallet.address())
    
    # Run all agents
    hospital_agent.run()
    coordinator_agent.run()
    shelter_agent.run()
    transport_agent.run()
    social_worker_agent.run()
    followup_agent.run()
    
    # Run new Phase 1 agents
    resource_agent.run()
    pharmacy_agent.run()
    eligibility_agent.run()
    analytics_agent.run()
    parser_agent.run()
