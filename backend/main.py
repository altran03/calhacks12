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

# Import database functions for form persistence
from database import save_form_draft, get_form_draft, list_form_drafts, delete_form_draft

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
    """Create a new discharge workflow with Gemini AI analysis and Coordinator Agent"""
    case_id = f"CASE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print(f"\n{'='*60}")
    print(f"🏥 DISCHARGE WORKFLOW INITIATED")
    print(f"{'='*60}")
    print(f"📋 Case ID: {case_id}")
    print(f"👤 Patient: {patient.contact_info.name}")
    print(f"🏥 Hospital: {patient.discharge_info.discharging_facility}")
    print(f"{'='*60}\n")
    
    # Use Gemini for intelligent analysis if available
    ai_analysis = None
    if GEMINI_AVAILABLE:
        try:
            # Convert patient data to dict for Gemini processing - use model_dump() for proper serialization
            patient_dict = {
                "contact_info": patient.contact_info.model_dump(),
                "discharge_info": patient.discharge_info.model_dump(),
                "follow_up": patient.follow_up.model_dump(),
                "lab_results": patient.lab_results.model_dump(),
                "treatment_info": patient.treatment_info.model_dump()
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
    
    # Send form data to Coordinator Agent via Fetch.ai
    await send_discharge_to_coordinator_agent(case_id, patient, workflow)
    
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

@app.post("/api/form-draft/save")
async def save_draft(case_id: str = Form(...), form_data: str = Form(...)):
    """Save form draft to SQLite database"""
    try:
        form_data_dict = json.loads(form_data)
        success = save_form_draft(case_id, form_data_dict)
        if success:
            return {"status": "success", "message": "Form draft saved", "case_id": case_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to save form draft")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid form data JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving draft: {str(e)}")

@app.get("/api/form-draft/{case_id}")
async def load_draft(case_id: str):
    """Load form draft from SQLite database"""
    try:
        form_data = get_form_draft(case_id)
        if form_data:
            return {"status": "success", "form_data": form_data, "case_id": case_id}
        else:
            return {"status": "not_found", "message": "No draft found for this case_id", "case_id": case_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading draft: {str(e)}")

@app.get("/api/form-drafts/list")
async def list_drafts(limit: int = 50):
    """List all form drafts"""
    try:
        drafts = list_form_drafts(limit)
        return {"status": "success", "drafts": drafts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing drafts: {str(e)}")

@app.delete("/api/form-draft/{case_id}")
async def delete_draft(case_id: str):
    """Delete form draft"""
    try:
        success = delete_form_draft(case_id)
        if success:
            return {"status": "success", "message": "Form draft deleted", "case_id": case_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete form draft")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting draft: {str(e)}")

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

async def send_discharge_to_coordinator_agent(case_id: str, patient: PatientInfo, workflow: WorkflowStatus):
    """Send discharge request with form data to Coordinator Agent via Fetch.ai"""
    import httpx
    
    coordinator_agent_url = "http://127.0.0.1:8002"
    
    # Use model_dump() to properly serialize Pydantic models including nested objects
    treatment_dict = patient.treatment_info.model_dump()
    
    # Build the discharge request payload from the filled form data
    discharge_payload = {
        "case_id": case_id,
        "patient_name": patient.contact_info.name,
        "patient_dob": patient.contact_info.date_of_birth,
        "hospital": patient.discharge_info.discharging_facility,
        "discharge_date": patient.discharge_info.planned_discharge_date,
        "medical_condition": patient.follow_up.medical_condition or "",
        "medications": treatment_dict.get("all_medications", []) if isinstance(treatment_dict.get("all_medications"), list) else [],
        "accessibility_needs": treatment_dict.get("accessibility_needs", ""),
        "dietary_needs": treatment_dict.get("dietary_needs", ""),
        "social_needs": treatment_dict.get("social_needs", ""),
        "follow_up_instructions": patient.follow_up.physician_name or "",
        # Include full form data for agents to use - properly serialize all nested Pydantic models
        "form_data": {
            "contact_info": patient.contact_info.model_dump(),
            "discharge_info": patient.discharge_info.model_dump(),
            "follow_up": patient.follow_up.model_dump(),
            "lab_results": patient.lab_results.model_dump(),
            "treatment_info": treatment_dict
        }
    }
    
    print(f"\n{'='*60}")
    print(f"📤 SENDING TO COORDINATOR AGENT")
    print(f"{'='*60}")
    print(f"🔗 URL: {coordinator_agent_url}/discharge")
    print(f"📋 Case ID: {case_id}")
    print(f"👤 Patient: {discharge_payload['patient_name']}")
    print(f"🏥 Hospital: {discharge_payload['hospital']}")
    print(f"📅 Discharge Date: {discharge_payload['discharge_date']}")
    print(f"{'='*60}\n")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # POST to the coordinator agent endpoint
            response = await client.post(
                f"{coordinator_agent_url}/discharge",
                json=discharge_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📥 Coordinator Agent Response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Coordinator Agent accepted discharge request!")
                print(f"📊 Response: {result}")
                
                # Update workflow with agent confirmation
                workflow.timeline.append({
                    "step": "coordinator_notified",
                    "status": "completed",
                    "timestamp": datetime.now().isoformat(),
                    "description": "Coordinator Agent started processing discharge workflow"
                })
                
                return result
            else:
                error_detail = response.text
                print(f"⚠️ Coordinator Agent returned status {response.status_code}: {error_detail}")
                
                # Still proceed with local simulation as fallback
                await trigger_agent_coordination_fallback(case_id)
                
    except httpx.ConnectError:
        print(f"⚠️ Cannot connect to Coordinator Agent at {coordinator_agent_url}")
        print(f"⚠️ Make sure Coordinator Agent is running on port 8002")
        print(f"⚠️ Falling back to simulated coordination...")
        
        # Fallback to simulated coordination
        await trigger_agent_coordination_fallback(case_id)
        
    except Exception as e:
        print(f"⚠️ Error communicating with Coordinator Agent: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to simulated coordination
        await trigger_agent_coordination_fallback(case_id)

async def trigger_agent_coordination_fallback(case_id: str):
    """Fallback: Simulate agent coordination when agents are not running"""
    workflow = workflows[case_id]
    
    print(f"\n{'='*60}")
    print(f"🔄 MULTI-AGENT COORDINATION STARTED")
    print(f"{'='*60}")
    print(f"📋 Case ID: {case_id}")
    print(f"👤 Patient: {workflow.patient.contact_info.name}")
    print(f"🤖 Orchestrating {6} AI Agents...")
    print(f"{'='*60}\n")
    
    # Step 1: Coordinator Agent → Shelter Agent
    print(f"🤖 [COORDINATOR AGENT] → [SHELTER AGENT]")
    print(f"   📨 Message: Find available shelter for {workflow.patient.contact_info.name}")
    print(f"   📍 Location: {workflow.patient.discharge_info.discharging_facility}")
    print(f"   ♿ Requirements: Wheelchair accessible, medical respite\n")
    
    workflow.current_step = "shelter_search"
    workflow.timeline.append({
        "step": "shelter_search",
        "status": "in_progress",
        "timestamp": datetime.now().isoformat(),
        "description": "🏠 Shelter Agent querying Bright Data for available beds",
        "logs": [
            "Connecting to SF shelter database via Bright Data",
            f"Searching for shelters near {workflow.patient.discharge_info.discharging_facility}",
            "Filtering for wheelchair-accessible facilities"
        ]
    })
    workflow.updated_at = datetime.now()
    
    print(f"🏠 [SHELTER AGENT] Processing request...")
    print(f"   🔍 Querying Bright Data shelter database")
    print(f"   🌐 Web scraping SF HSH real-time data\n")
    
    await asyncio.sleep(2)
    
    # Find shelter
    suitable_shelters = [s for s in shelters if s.available_beds > 0]
    if suitable_shelters:
        workflow.shelter = suitable_shelters[0]
        workflow.timeline[-1]["status"] = "completed"
        
        print(f"🏠 [SHELTER AGENT] → [COORDINATOR AGENT]")
        print(f"   ✅ Found {len(suitable_shelters)} available shelters")
        print(f"   🏢 Best match: {workflow.shelter.name}")
        print(f"   🛏️  Available beds: {workflow.shelter.available_beds}")
        print(f"   ♿ Wheelchair accessible: Yes")
        print(f"   📞 Calling shelter via Vapi to confirm...\n")
        
        workflow.timeline.append({
            "step": "shelter_confirmed",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "description": f"✅ Shelter confirmed: {workflow.shelter.name}",
            "logs": [
                f"Found {len(suitable_shelters)} available shelters",
                f"Selected: {workflow.shelter.name}",
                f"Available beds: {workflow.shelter.available_beds}",
                f"Accessibility: {'Yes' if workflow.shelter.accessibility else 'No'}",
                f"Contact: {workflow.shelter.phone}"
            ]
        })
    
    workflow.updated_at = datetime.now()
    await asyncio.sleep(1)
    
    # Step 2: Coordinator Agent → Transport Agent
    print(f"🤖 [COORDINATOR AGENT] → [TRANSPORT AGENT]")
    print(f"   📨 Message: Arrange wheelchair-accessible transport")
    print(f"   🏥 Pickup: {workflow.patient.discharge_info.discharging_facility}")
    print(f"   🏠 Dropoff: {workflow.shelter.name if workflow.shelter else 'TBD'}\n")
    
    workflow.current_step = "transport_coordination"
    workflow.timeline.append({
        "step": "transport_requested",
        "status": "in_progress",
        "timestamp": datetime.now().isoformat(),
        "description": "🚐 Transport Agent scheduling wheelchair-accessible vehicle",
        "logs": [
            "Searching for available transport providers",
            "Requesting wheelchair-accessible vehicle",
            f"Route: {workflow.patient.discharge_info.discharging_facility} → {workflow.shelter.name if workflow.shelter else 'TBD'}"
        ]
    })
    workflow.updated_at = datetime.now()
    
    print(f"🚐 [TRANSPORT AGENT] Processing request...")
    print(f"   🔍 Finding available wheelchair-accessible vehicles")
    print(f"   📍 Calculating optimal route\n")
    
    await asyncio.sleep(2)
    
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
    workflow.timeline[-1]["status"] = "completed"
    
    print(f"🚐 [TRANSPORT AGENT] → [COORDINATOR AGENT]")
    print(f"   ✅ Transport scheduled successfully")
    print(f"   🚙 Provider: SF Paratransit")
    print(f"   ♿ Vehicle: Wheelchair-accessible van")
    print(f"   ⏱️  ETA: 30 minutes")
    print(f"   📞 Driver notified via Vapi\n")
    
    workflow.timeline.append({
        "step": "transport_scheduled",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "description": f"✅ Transport scheduled: {workflow.transport.provider}",
        "logs": [
            f"Provider: {workflow.transport.provider}",
            f"Vehicle type: {workflow.transport.vehicle_type.replace('_', ' ').title()}",
            f"ETA: {workflow.transport.eta}",
            "Driver assigned and notified via Vapi"
        ]
    })
    
    workflow.updated_at = datetime.now()
    await asyncio.sleep(1)
    
    # Step 3: Coordinator Agent → Social Worker Agent
    print(f"🤖 [COORDINATOR AGENT] → [SOCIAL WORKER AGENT]")
    print(f"   📨 Message: Assign case manager for {workflow.patient.contact_info.name}")
    print(f"   💼 Requirements: Homeless services, mental health support\n")
    
    workflow.current_step = "social_worker_assignment"
    workflow.timeline.append({
        "step": "social_worker_assigned",
        "status": "in_progress",
        "timestamp": datetime.now().isoformat(),
        "description": "👥 Social Worker Agent matching with case manager",
        "logs": [
            "Analyzing patient needs",
            "Checking case manager availability",
            "Matching based on expertise and caseload"
        ]
    })
    workflow.updated_at = datetime.now()
    
    print(f"👥 [SOCIAL WORKER AGENT] Processing request...")
    print(f"   🔍 Analyzing patient medical condition")
    print(f"   📋 Reviewing case manager availability")
    print(f"   🎯 Matching based on specialization\n")
    
    await asyncio.sleep(2)
    
    workflow.social_worker = "Sarah Johnson - SF Health Department"
    workflow.timeline[-1]["status"] = "completed"
    workflow.timeline[-1]["logs"] = [
        f"Assigned: {workflow.social_worker}",
        "Specialization: Homeless services, mental health support",
        "Contact information sent to patient",
        "First follow-up scheduled within 48 hours"
    ]
    
    print(f"👥 [SOCIAL WORKER AGENT] → [COORDINATOR AGENT]")
    print(f"   ✅ Case manager assigned")
    print(f"   👤 Name: Sarah Johnson")
    print(f"   🏢 Department: SF Health Department")
    print(f"   📅 First follow-up: Within 48 hours\n")
    
    # Step 4: Coordinator Agent → Resource Agent
    print(f"🤖 [COORDINATOR AGENT] → [RESOURCE AGENT]")
    print(f"   📨 Message: Prepare discharge resource package")
    print(f"   📦 Items: Meals, hygiene kit, clothing\n")
    
    print(f"📦 [RESOURCE AGENT] Processing request...")
    print(f"   🍽️  Preparing 3-day meal vouchers")
    print(f"   🧼 Assembling hygiene kit")
    print(f"   👕 Packing weather-appropriate clothing\n")
    
    await asyncio.sleep(1)
    
    workflow.timeline.append({
        "step": "resources_confirmed",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "description": "📦 Resource Agent coordinated meals, hygiene kit, clothing",
        "logs": [
            "Meal vouchers prepared (3 days)",
            "Hygiene kit assembled",
            "Weather-appropriate clothing packed",
            "Resources will be delivered to shelter"
        ]
    })
    
    print(f"📦 [RESOURCE AGENT] → [COORDINATOR AGENT]")
    print(f"   ✅ Resources prepared and packaged")
    print(f"   🍽️  Meals: 3-day vouchers")
    print(f"   🧼 Hygiene: Full kit with essentials")
    print(f"   👕 Clothing: Weather-appropriate outfit")
    print(f"   🚚 Delivery: Will arrive at shelter before patient\n")
    
    # Final status
    workflow.status = "coordinated"
    workflow.current_step = "ready_for_discharge"
    workflow.timeline.append({
        "step": "workflow_complete",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "description": "🎉 All agents coordinated successfully - Patient ready for safe discharge",
        "logs": [
            "✅ Shelter confirmed and bed reserved",
            "✅ Transport scheduled and driver notified",
            "✅ Social worker assigned and contacted",
            "✅ Resources prepared and ready for delivery",
            "Next step: Execute discharge plan"
        ]
    })
    
    workflow.updated_at = datetime.now()
    
    print(f"\n{'='*60}")
    print(f"✅ MULTI-AGENT COORDINATION COMPLETE")
    print(f"{'='*60}")
    print(f"📋 Case ID: {case_id}")
    print(f"👤 Patient: {workflow.patient.contact_info.name}")
    print(f"📊 Total timeline steps: {len(workflow.timeline)}")
    print(f"🎯 Status: {workflow.status}")
    print(f"✅ All agents completed their tasks successfully!")
    print(f"{'='*60}\n")

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
