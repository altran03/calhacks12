from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv
import asyncio
import json
from datetime import datetime

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
    """Create a new discharge workflow"""
    case_id = f"CASE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
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
                "description": f"Discharge workflow initiated for {patient.name}"
            }
        ],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
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
