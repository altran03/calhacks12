"""
Shared models for all CareLink agents
Based on Fetch.ai uAgent framework
"""

from uagents import Model
from typing import List, Dict, Any, Optional
from datetime import datetime

# ============================================
# CORE WORKFLOW MODELS
# ============================================

class DischargeRequest(Model):
    case_id: str
    patient_name: str
    medical_condition: str
    accessibility_needs: Optional[str] = None
    dietary_needs: Optional[str] = None
    social_needs: Optional[str] = None
    hospital: str
    discharge_date: str

class WorkflowUpdate(Model):
    case_id: str
    step: str
    status: str
    details: Dict[str, Any]
    timestamp: str

# ============================================
# SHELTER & HOUSING MODELS
# ============================================

class ShelterMatch(Model):
    case_id: str
    shelter_name: str
    address: str
    available_beds: int
    accessibility: bool
    services: List[str]
    phone: str
    patient_context: Optional[Dict[str, Any]] = None  # Patient info from social worker for VAPI calls

class ShelterAvailabilityRequest(Model):
    case_id: str
    shelter_name: str
    accessibility_required: bool
    medical_respite_needed: bool

class ShelterAvailabilityResponse(Model):
    case_id: str
    shelter_name: str
    beds_available: int
    accessibility_confirmed: bool
    services_available: List[str]
    contact_person: str
    phone: str

# ============================================
# TRANSPORTATION MODELS
# ============================================

class TransportRequest(Model):
    case_id: str
    pickup_location: str
    dropoff_location: str
    accessibility_required: bool
    urgency: str
    patient_name: str
    estimated_time: Optional[str] = None

class TransportConfirmation(Model):
    case_id: str
    transport_provider: str
    pickup_time: str
    estimated_duration: str
    driver_name: str
    driver_phone: str
    vehicle_type: str
    accessibility_features: List[str]

# ============================================
# SOCIAL WORKER MODELS
# ============================================

class SocialWorkerAssignment(Model):
    case_id: str
    social_worker_name: str
    contact_phone: str
    department: str
    specialization: Optional[str] = None

class SocialWorkerConfirmation(Model):
    case_id: str
    social_worker_name: str
    contact_phone: str
    department: str
    availability: str
    first_contact_date: str
    case_priority: str

# ============================================
# RESOURCE COORDINATION MODELS
# ============================================

class ResourceRequest(Model):
    case_id: str
    patient_name: str
    dietary_restrictions: Optional[str] = None
    allergies: Optional[str] = None
    needed_items: List[str]  # ["food", "hygiene_kit", "clothing"]
    location: str
    urgency: str = "standard"

class ResourceMatch(Model):
    case_id: str
    resource_type: str
    provider_name: str
    address: str
    available_items: List[str]
    phone: str
    pickup_time: Optional[str] = None
    dietary_accommodations: bool = False

# ============================================
# PHARMACY MODELS
# ============================================

class PharmacyRequest(Model):
    case_id: str
    patient_name: str
    medications: List[Dict[str, str]]  # [{"name": "Lisinopril", "dosage": "10mg", "quantity": "30"}]
    insurance_info: Optional[str] = None
    location: str
    urgency: str = "standard"

class PharmacyMatch(Model):
    case_id: str
    pharmacy_name: str
    address: str
    phone: str
    hours: str
    medications_available: bool
    cost_estimate: Optional[float] = None
    ready_time: Optional[str] = None

# ============================================
# ELIGIBILITY & BENEFITS MODELS
# ============================================

class EligibilityRequest(Model):
    case_id: str
    patient_name: str
    dob: str
    ssn_last4: Optional[str] = None
    income_level: Optional[str] = None
    current_benefits: List[str]
    location: str

class EligibilityResult(Model):
    case_id: str
    eligible_programs: List[Dict[str, Any]]
    requires_manual_review: bool
    next_steps: List[str]
    total_monthly_benefits: float

# ============================================
# DOCUMENT PROCESSING MODELS
# ============================================

class DocumentParseRequest(Model):
    case_id: str
    document_url: str  # URL or path to uploaded document
    document_type: str  # "discharge_summary", "medical_record", "prescription", etc.

class PDFProcessingRequest(Model):
    case_id: str
    file_path: str
    file_name: str
    file_size: int
    document_type: str = "discharge_summary"

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

class AutofillData(Model):
    case_id: str
    contact_info: Dict[str, Any]
    discharge_info: Dict[str, Any]
    follow_up: Dict[str, Any]
    lab_results: Dict[str, Any]
    treatment_info: Dict[str, Any]
    confidence_score: float
    source_file: str

# ============================================
# ANALYTICS & MONITORING MODELS
# ============================================

class AnalyticsData(Model):
    metric_type: str
    timestamp: str
    value: Any
    metadata: Dict[str, Any]

class SystemHealthCheck(Model):
    agent_name: str
    status: str
    last_activity: str
    performance_metrics: Dict[str, Any]

# ============================================
# NOTIFICATION MODELS
# ============================================

class NotificationRequest(Model):
    case_id: str
    notification_type: str  # "urgent", "update", "reminder"
    message: str
    recipient: str
    priority: str = "normal"

class NotificationConfirmation(Model):
    case_id: str
    notification_id: str
    status: str
    delivery_time: str
    method: str  # "email", "sms", "call"

# ============================================
# FINALIZED REPORT MODELS
# ============================================

class FinalizedReport(Model):
    """Comprehensive finalized report for patient and care provider"""
    case_id: str
    patient_name: str
    medical_condition: str
    discharge_date: str
    hospital: str
    
    # Eligibility Summary
    eligibility_status: str
    eligible_programs: List[str]
    benefits_summary: str
    
    # Shelter Assignment
    shelter_name: str
    shelter_address: str
    shelter_phone: str
    shelter_services: List[str]
    bed_confirmation: bool
    
    # Transport Arrangements
    transport_provider: str
    transport_type: str
    pickup_time: str
    driver_contact: str
    accessibility_confirmed: bool
    
    # Social Worker Assignment
    social_worker_name: str
    social_worker_contact: str
    case_manager_assigned: str
    follow_up_scheduled: bool
    
    # Resource Package
    resource_package: List[str]
    food_vouchers: int
    hygiene_kit: bool
    clothing_provided: List[str]
    medical_equipment: List[str]
    
    # Pharmacy Services
    pharmacy_name: str
    pharmacy_address: str
    pharmacy_phone: str
    medications_ready: bool
    delivery_arranged: bool
    
    # Coordination Summary
    coordination_status: str
    all_services_confirmed: bool
    
    # Important Notes
    important_notes: List[str]
    
    # Contact Information
    emergency_contacts: List[Dict[str, str]]
    
    # Generated timestamp
    generated_at: str
    generated_by: str

class AgentResponse(Model):
    """Response from individual agents"""
    agent_name: str
    case_id: str
    status: str
    response_data: Dict[str, Any]
    timestamp: str
    error: Optional[str] = None
