# Suppress SQLAlchemy typing warning for Python 3.13 compatibility
import warnings
warnings.filterwarnings('ignore', message='.*TypingOnly.*')

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import tempfile
import shutil
from dotenv import load_dotenv
import asyncio
import json
from datetime import datetime

# Import Gemini integration
try:
    from gemini_integration import gemini_client
    GEMINI_AVAILABLE = gemini_client is not None
    if not GEMINI_AVAILABLE:
        print("Warning: Gemini integration not available. Using fallback responses.")
except ImportError:
    GEMINI_AVAILABLE = False
    gemini_client = None
    print("Warning: Gemini integration not available. Using fallback responses.")

# Import agents
try:
    from agents import (
        DischargeRequest, WorkflowUpdate, PDFProcessingRequest, AutofillData,
        coordinator_agent, parser_agent
    )
    AGENTS_AVAILABLE = True
    print("✅ Agents imported successfully")
except ImportError as e:
    AGENTS_AVAILABLE = False
    print(f"⚠️ Agents not available: {e}")

# Load environment variables
load_dotenv()

app = FastAPI(title="CareLink API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PatientContactInfo(BaseModel):
    name: str
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    date_of_birth: str
    address: str
    apartment: Optional[str] = None
    city: str
    state: str
    zip: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class DischargeInformation(BaseModel):
    discharging_facility: str
    discharging_facility_phone: Optional[str] = None
    facility_address: str
    facility_floor: Optional[str] = None
    facility_city: str
    facility_state: str
    facility_zip: str
    medical_record_number: str
    date_of_admission: str
    planned_discharge_date: str
    discharged_to: str
    discharge_address: Optional[str] = None
    discharge_apartment: Optional[str] = None
    discharge_city: Optional[str] = None
    discharge_state: Optional[str] = None
    discharge_zip: Optional[str] = None
    discharge_phone: Optional[str] = None
    travel_outside_nyc: bool = False
    travel_date_destination: Optional[str] = None

class FollowUpAppointment(BaseModel):
    appointment_date: Optional[str] = None
    physician_name: Optional[str] = None
    physician_phone: Optional[str] = None
    physician_cell: Optional[str] = None
    physician_address: Optional[str] = None
    physician_city: Optional[str] = None
    physician_state: Optional[str] = None
    physician_zip: Optional[str] = None
    barriers_to_adherence: List[str] = []
    physical_disability: Optional[str] = None
    medical_condition: Optional[str] = None
    substance_use: Optional[str] = None
    mental_disorder: Optional[str] = None
    other_barriers: Optional[str] = None

class LaboratoryResults(BaseModel):
    smear1_date: Optional[str] = None
    smear1_source: Optional[str] = None
    smear1_result: Optional[str] = None
    smear1_grade: Optional[str] = None
    smear2_date: Optional[str] = None
    smear2_source: Optional[str] = None
    smear2_result: Optional[str] = None
    smear2_grade: Optional[str] = None
    smear3_date: Optional[str] = None
    smear3_source: Optional[str] = None
    smear3_result: Optional[str] = None
    smear3_grade: Optional[str] = None

class MedicationInfo(BaseModel):
    prescribed: bool = False
    dosage: Optional[str] = None
    type: Optional[str] = None

class TreatmentInformation(BaseModel):
    therapy_initiated_date: Optional[str] = None
    therapy_interrupted: bool = False
    interruption_reason: Optional[str] = None
    medications: Dict[str, MedicationInfo] = {}
    frequency: Optional[str] = None
    central_line_inserted: bool = False
    days_of_medication_supplied: Optional[str] = None
    patient_agreed_to_dot: bool = False
    form_filled_by_name: Optional[str] = None
    form_filled_date: Optional[str] = None
    responsible_physician_name: Optional[str] = None
    physician_license_number: Optional[str] = None
    physician_phone: Optional[str] = None

class PatientInfo(BaseModel):
    contact_info: PatientContactInfo
    discharge_info: DischargeInformation
    follow_up: FollowUpAppointment
    lab_results: LaboratoryResults
    treatment_info: TreatmentInformation

class ShelterInfo(BaseModel):
    name: str
    address: str
    capacity: int
    available_beds: int
    accessibility: bool
    phone: str
    services: List[str]
    location: Dict[str, float]  # lat, lng

class TransportInfo(BaseModel):
    provider: str
    vehicle_type: str
    eta: str
    route: List[Dict[str, float]]
    status: str

class WorkflowStatus(BaseModel):
    case_id: str
    patient: PatientInfo
    status: str
    current_step: str
    shelter: Optional[ShelterInfo] = None
    transport: Optional[TransportInfo] = None
    social_worker: Optional[str] = None
    timeline: List[Dict[str, Any]]
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# In-memory storage for demo (replace with database in production)
workflows: Dict[str, WorkflowStatus] = {}
shelters: List[ShelterInfo] = []

# Initialize sample data
def init_sample_data():
    global shelters
    shelters = [
        ShelterInfo(
            name="Mission Neighborhood Resource Center",
            address="165 Capp St, San Francisco, CA 94110",
            capacity=50,
            available_beds=12,
            accessibility=True,
            phone="(415) 431-4000",
            services=["medical respite", "case management", "meals"],
            location={"lat": 37.7749, "lng": -122.4194}
        ),
        ShelterInfo(
            name="Hamilton Family Center",
            address="260 Golden Gate Ave, San Francisco, CA 94102",
            capacity=30,
            available_beds=8,
            accessibility=True,
            phone="(415) 292-5222",
            services=["family shelter", "childcare", "counseling"],
            location={"lat": 37.7849, "lng": -122.4094}
        ),
        ShelterInfo(
            name="St. Anthony's Foundation",
            address="150 Golden Gate Ave, San Francisco, CA 94102",
            capacity=100,
            available_beds=25,
            accessibility=True,
            phone="(415) 241-2600",
            services=["emergency shelter", "medical clinic", "dining room"],
            location={"lat": 37.7849, "lng": -122.4094}
        )
    ]

# API Routes
@app.get("/")
async def root():
    return {"message": "CareLink API is running", "version": "1.0.0"}

@app.post("/api/discharge", response_model=WorkflowStatus)
async def create_discharge_workflow(patient: PatientInfo):
    """Create a new discharge workflow with Gemini AI analysis"""
    case_id = f"CASE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Use Gemini for intelligent analysis if available
    ai_analysis = None
    if GEMINI_AVAILABLE:
        try:
            # Convert patient data to dict for Gemini processing
            patient_dict = {
                "contact_info": patient.contact_info.__dict__,
                "discharge_info": patient.discharge_info.__dict__,
                "follow_up": patient.follow_up.__dict__,
                "lab_results": patient.lab_results.__dict__,
                "treatment_info": patient.treatment_info.__dict__
            }
            ai_analysis = await gemini_client.process_discharge_request(patient_dict)
        except Exception as e:
            print(f"Error processing with Gemini: {e}")
            ai_analysis = None
    
    workflow = WorkflowStatus(
        case_id=case_id,
        patient=patient,
        status="initiated",
        current_step="shelter_matching",
        timeline=[
            {
                "step": "discharge_initiated",
                "status": "completed",
                "timestamp": datetime.now().isoformat(),
                "description": f"Discharge workflow initiated for {patient.contact_info.name}"
            },
            {
                "step": "ai_analysis",
                "status": "completed" if ai_analysis else "skipped",
                "timestamp": datetime.now().isoformat(),
                "description": "AI analysis completed" if ai_analysis else "AI analysis unavailable"
            }
        ],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Store AI analysis if available
    if ai_analysis:
        workflow.ai_analysis = ai_analysis
    
    workflows[case_id] = workflow
    
    # Trigger agent coordination (simulated)
    await trigger_agent_coordination(case_id)
    
    return workflow

@app.get("/api/workflows", response_model=List[WorkflowStatus])
async def get_workflows():
    """Get all workflows"""
    return list(workflows.values())

@app.get("/api/workflows/{case_id}", response_model=WorkflowStatus)
async def get_workflow(case_id: str):
    """Get specific workflow"""
    if case_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflows[case_id]

@app.get("/api/shelters", response_model=List[ShelterInfo])
async def get_shelters():
    """Get all shelters"""
    return shelters

@app.post("/api/shelters/{shelter_name}/availability")
async def update_shelter_availability(shelter_name: str, available_beds: int):
    """Update shelter availability (called by Vapi webhook)"""
    for shelter in shelters:
        if shelter.name == shelter_name:
            shelter.available_beds = available_beds
            return {"message": f"Updated {shelter_name} availability to {available_beds} beds"}
    
    raise HTTPException(status_code=404, detail="Shelter not found")

@app.post("/api/vapi/webhook")
async def vapi_webhook(data: Dict[str, Any]):
    """Handle Vapi webhook calls"""
    # Process voice call results
    call_type = data.get("type", "")
    transcript = data.get("transcript", "")
    
    if call_type == "shelter_availability":
        # Process shelter availability call
        await process_shelter_availability_call(transcript)
    elif call_type == "social_worker_confirmation":
        # Process social worker confirmation
        await process_social_worker_confirmation(transcript)
    
    return {"status": "processed"}

@app.post("/api/process-pdf")
async def process_pdf_upload(
    files: List[UploadFile] = File(...),
    case_id: str = Form(...)
):
    """Process uploaded PDF files with Parser Agent (Fetch.ai uAgent)"""
    try:
        print(f"\n{'='*60}")
        print(f"🤖 USING FETCH.AI PARSER AGENT")
        print(f"{'='*60}")
        
        processed_files = []
        
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                shutil.copyfileobj(file.file, temp_file)
                temp_file_path = temp_file.name
            
            # Get file size
            file_size = os.path.getsize(temp_file_path)
            
            try:
                print(f"\n📄 Processing: {file.filename}")
                print(f"📍 Temp file: {temp_file_path}")
                print(f"📦 File size: {file_size} bytes")
                print(f"🔗 Sending message to Parser Agent on port 8011...")
                
                # Send PDFProcessingRequest to Parser Agent via HTTP
                response = await send_message_to_parser_agent(
                    case_id=case_id,
                    file_path=temp_file_path,
                    file_name=file.filename,
                    file_size=file_size,
                    document_type="discharge_summary"
                )
                
                print(f"✅ Parser Agent Response Received!")
                print(f"📊 Confidence Score: {response.get('confidence_score', 0)}")
                
                processed_files.append({
                    "filename": file.filename,
                    "autofill_data": response.get("autofill_data", {}),
                    "confidence_score": response.get("confidence_score", 0.85),
                    "source_file": file.filename
                })
                
            finally:
                # Clean up temporary file after a delay (agent needs to read it)
                await asyncio.sleep(2)  # Give agent time to process
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
        
        print(f"\n{'='*60}")
        print(f"✅ All PDFs processed via Parser Agent")
        print(f"{'='*60}\n")
        
        return {
            "status": "success",
            "case_id": case_id,
            "processed_files": processed_files,
            "autofill_data": merge_autofill_data_from_agent(processed_files),
            "agent_used": "parser_agent",
            "agent_port": 8011
        }
        
    except Exception as e:
        print(f"❌ Error in PDF processing: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def format_for_autofill(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """Format extracted data for autofilling the discharge form"""
    return {
        "contact_info": {
            "name": extracted_data.get("patient_name", ""),
            "date_of_birth": extracted_data.get("patient_dob", ""),
        },
        "discharge_info": {
            "discharging_facility": extracted_data.get("hospital", ""),
            "medical_record_number": extracted_data.get("mrn", ""),
            "planned_discharge_date": extracted_data.get("discharge_date", ""),
            "medical_condition": extracted_data.get("medical_condition", ""),
            "diagnosis": extracted_data.get("diagnosis", ""),
        },
        "follow_up": {
            "physician_name": extracted_data.get("physician", ""),
            "physician_phone": extracted_data.get("physician_phone", ""),
            "follow_up_instructions": extracted_data.get("follow_up_instructions", ""),
        },
        "lab_results": {
            # Lab results would be extracted from the document
            "lab_values": extracted_data.get("lab_values", []),
        },
        "treatment_info": {
            "medications": extracted_data.get("medications", []),
            "allergies": extracted_data.get("allergies", ""),
            "accessibility_needs": extracted_data.get("accessibility_needs", ""),
            "dietary_needs": extracted_data.get("dietary_needs", ""),
            "social_needs": extracted_data.get("social_needs", ""),
        }
    }

async def send_message_to_parser_agent(
    case_id: str,
    file_path: str,
    file_name: str,
    file_size: int,
    document_type: str
) -> Dict[str, Any]:
    """Send PDF processing request to Fetch.ai Parser Agent via custom endpoint"""
    import httpx
    
    parser_agent_url = "http://127.0.0.1:8011"
    
    # Payload for the parser agent
    payload = {
        "case_id": case_id,
        "file_path": file_path,
        "file_name": file_name,
        "file_size": file_size,
        "document_type": document_type
    }
    
    print(f"📤 Sending to Fetch.ai Parser Agent: {parser_agent_url}/process")
    print(f"📋 Payload: {payload}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # POST to the custom parser agent endpoint
            response = await client.post(
                f"{parser_agent_url}/process",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📥 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Fetch.ai Parser Agent responded successfully!")
                print(f"📊 AutofillData received:")
                print(f"   - Contact fields: {len(result.get('contact_info', {}))}")
                print(f"   - Discharge fields: {len(result.get('discharge_info', {}))}")
                print(f"   - Follow-up fields: {len(result.get('follow_up', {}))}")
                print(f"   - Confidence score: {result.get('confidence_score', 0)}")
                
                return {
                    "autofill_data": result,
                    "confidence_score": result.get("confidence_score", 0.85)
                }
            else:
                error_detail = response.text
                print(f"❌ Parser Agent returned status {response.status_code}")
                print(f"📄 Error: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Parser Agent error: {error_detail}"
                )
                
    except httpx.ConnectError:
        print(f"❌ Cannot connect to Fetch.ai Parser Agent at {parser_agent_url}")
        print(f"⚠️ Make sure Parser Agent is running on port 8011")
        print(f"⚠️ Start it with: cd backend && python3 -m agents.parser_agent")
        raise HTTPException(
            status_code=503,
            detail="Parser Agent not running on port 8011. Start with: python3 -m agents.parser_agent"
        )
        
    except HTTPException:
        raise
        
    except Exception as e:
        print(f"❌ Error communicating with Fetch.ai Parser Agent: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to communicate with Parser Agent: {str(e)}"
        )

def merge_autofill_data_from_agent(processed_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge autofill data from multiple files processed by agent"""
    if not processed_files:
        return {}
    
    # Sort by confidence score (highest first)
    sorted_files = sorted(processed_files, key=lambda x: x.get("confidence_score", 0), reverse=True)
    
    # Start with the highest confidence file
    merged_data = sorted_files[0]["autofill_data"]
    
    # Merge additional data from other files
    for file_data in sorted_files[1:]:
        autofill_data = file_data["autofill_data"]
        # Merge logic here if needed
    
    return merged_data

def merge_autofill_data(processed_files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge autofill data from multiple files, prioritizing higher confidence scores"""
    if not processed_files:
        return {}
    
    # Sort by confidence score (highest first)
    sorted_files = sorted(processed_files, key=lambda x: x.get("confidence_score", 0), reverse=True)
    
    # Start with the highest confidence file
    merged_data = sorted_files[0]["autofill_data"]
    
    # Merge additional data from other files
    for file_data in sorted_files[1:]:
        autofill_data = file_data["autofill_data"]
        
        # Merge contact info
        if autofill_data.get("contact_info", {}).get("name") and not merged_data.get("contact_info", {}).get("name"):
            merged_data["contact_info"]["name"] = autofill_data["contact_info"]["name"]
        
        # Merge discharge info
        for key, value in autofill_data.get("discharge_info", {}).items():
            if value and not merged_data.get("discharge_info", {}).get(key):
                merged_data["discharge_info"][key] = value
        
        # Merge follow-up info
        for key, value in autofill_data.get("follow_up", {}).items():
            if value and not merged_data.get("follow_up", {}).get(key):
                merged_data["follow_up"][key] = value
        
        # Merge treatment info
        if autofill_data.get("treatment_info", {}).get("medications"):
            existing_meds = merged_data.get("treatment_info", {}).get("medications", [])
            new_meds = autofill_data["treatment_info"]["medications"]
            merged_data["treatment_info"]["medications"] = list(set(existing_meds + new_meds))
    
    return merged_data

async def trigger_agent_coordination(case_id: str):
    """Trigger Fetch.ai agent coordination"""
    # Simulate agent coordination
    workflow = workflows[case_id]
    
    # Simulate shelter matching
    await asyncio.sleep(1)
    suitable_shelters = [s for s in shelters if s.available_beds > 0]
    if suitable_shelters:
        workflow.shelter = suitable_shelters[0]
        workflow.timeline.append({
            "step": "shelter_matched",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "description": f"Matched with {workflow.shelter.name}"
        })
    
    # Simulate transport coordination
    await asyncio.sleep(1)
    workflow.transport = TransportInfo(
        provider="SF Paratransit",
        vehicle_type="wheelchair_accessible",
        eta="30 minutes",
        route=[
            {"lat": 37.7749, "lng": -122.4194},  # Hospital
            {"lat": 37.7849, "lng": -122.4094}   # Shelter
        ],
        status="scheduled"
    )
    workflow.timeline.append({
        "step": "transport_scheduled",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "description": f"Transport scheduled with {workflow.transport.provider}"
    })
    
    # Simulate social worker assignment
    await asyncio.sleep(1)
    workflow.social_worker = "Sarah Johnson - SF Health Department"
    workflow.status = "coordinated"
    workflow.current_step = "ready_for_discharge"
    workflow.timeline.append({
        "step": "social_worker_assigned",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "description": f"Assigned social worker: {workflow.social_worker}"
    })
    
    workflow.updated_at = datetime.now()

async def process_shelter_availability_call(transcript: str):
    """Process shelter availability voice call transcript"""
    # Parse transcript to extract availability info
    # This would integrate with actual voice processing
    pass

async def process_social_worker_confirmation(transcript: str):
    """Process social worker confirmation transcript"""
    # Parse transcript for confirmation
    pass

if __name__ == "__main__":
    init_sample_data()
    uvicorn.run(app, host="0.0.0.0", port=8000)
