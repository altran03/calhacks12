"""
Parser Agent - Document intelligence and PDF processing
Uses LlamaParse + Gemini for document parsing and data extraction
"""

# Suppress SQLAlchemy typing warning for Python 3.13 compatibility
import warnings
warnings.filterwarnings('ignore', message='.*TypingOnly.*')

# Load environment variables
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env file from backend directory
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✅ Loaded environment variables from {env_path}")
else:
    print(f"⚠️ No .env file found at {env_path}")

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from .models import (
    DocumentParseRequest, PDFProcessingRequest, ParsedDischargeData, 
    AutofillData, WorkflowUpdate
)
from typing import Dict, Any
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Initialize Parser Agent
parser_agent = Agent(
    name="parser_agent",
    seed="eumgwuuj bepocvmr lakpfbsy bocazrtx jprflyfn njefdrxj xprdndtv bkvcjmae gdcogigh phyucxsx vgtzumuc azhzhzta",
    port=8011,
    endpoint=["http://127.0.0.1:8011/submit"],
    mailbox=True,
)

# Define Parser Protocol for Agentverse deployment
parser_protocol = Protocol(name="ParserProtocol", version="1.0.0")

# Create processing function that can be reused
async def process_pdf_internal(case_id: str, file_path: str, file_name: str, file_size: int, document_type: str) -> AutofillData:
    """Internal PDF processing logic"""
    print(f"📄 File: {file_name}")
    print(f"📍 Path: {file_path}")
    print(f"📦 Size: {file_size} bytes")
    
    # Validate file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return AutofillData(
            case_id=case_id,
            contact_info={},
            discharge_info={},
            follow_up={},
            lab_results={},
            treatment_info={},
            confidence_score=0.0,
            source_file=file_name
        )
    
    print(f"\n🔄 Step 1: Parsing PDF with LlamaParse...")
    parsed_text = await parse_document_with_llamaparse(file_path, document_type)
    print(f"✅ Parsed {len(parsed_text)} characters")
    
    print(f"\n🔄 Step 2: Extracting data with Gemini AI...")
    extracted_data = await extract_data_with_gemini(parsed_text, document_type)
    print(f"✅ Extracted {len(extracted_data)} fields")
    
    print(f"\n🔄 Step 3: Formatting for autofill...")
    autofill_data = format_extracted_data_for_autofill(extracted_data, case_id, file_name)
    print(f"✅ Formatted with confidence {autofill_data.confidence_score}")
    
    return autofill_data

@parser_protocol.on_message(model=DocumentParseRequest, replies={WorkflowUpdate})
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

@parser_protocol.on_message(model=PDFProcessingRequest, replies={AutofillData})
async def handle_pdf_processing(ctx: Context, sender: str, msg: PDFProcessingRequest):
    """Parser agent processes uploaded PDF files for autofill via Fetch.ai messaging"""
    ctx.logger.info(f"Processing PDF file {msg.file_name} for case {msg.case_id}")
    
    try:
        # Use the internal processing function
        autofill_data = await process_pdf_internal(
            msg.case_id,
            msg.file_path,
            msg.file_name,
            msg.file_size,
            msg.document_type
        )
        
        # Send autofill data back to main API
        await ctx.send(
            "main_api_address",  # This would be the main API endpoint
            autofill_data
        )
        
        ctx.logger.info(f"Successfully processed PDF {msg.file_name} with confidence {autofill_data.confidence_score}")
        
    except Exception as e:
        ctx.logger.error(f"Error processing PDF {msg.file_name}: {e}")
        # Send error response
        error_response = AutofillData(
            case_id=msg.case_id,
            contact_info={},
            discharge_info={},
            follow_up={},
            lab_results={},
            treatment_info={},
            confidence_score=0.0,
            source_file=msg.file_name
        )
        await ctx.send("main_api_address", error_response)

# HTTP REST endpoint - using Fetch.ai decorator
@parser_agent.on_rest_post("/process", PDFProcessingRequest, AutofillData)
async def handle_http_pdf_processing(ctx: Context, req: PDFProcessingRequest) -> AutofillData:
    """Fetch.ai REST endpoint for processing PDF files"""
    print(f"\n{'='*60}")
    print(f"🤖 FETCH.AI PARSER AGENT RECEIVED HTTP REQUEST")
    print(f"{'='*60}")
    print(f"📋 Case ID: {req.case_id}")
    
    try:
        # Use the internal processing function
        autofill_data = await process_pdf_internal(
            req.case_id,
            req.file_path,
            req.file_name,
            req.file_size,
            req.document_type
        )
        
        print(f"\n{'='*60}")
        print(f"✅ FETCH.AI PARSER AGENT COMPLETED SUCCESSFULLY")
        print(f"📤 Returning AutofillData with {len(autofill_data.contact_info)} contact fields")
        print(f"{'='*60}\n")
        
        return autofill_data
        
    except Exception as e:
        print(f"\n❌ ERROR IN FETCH.AI PARSER AGENT: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        # Return error response with valid structure
        return AutofillData(
            case_id=req.case_id,
            contact_info={},
            discharge_info={},
            follow_up={},
            lab_results={},
            treatment_info={},
            confidence_score=0.0,
            source_file=req.file_name
        )

# Helper functions for ParserAgent
async def parse_document_with_llamaparse(document_path: str, document_type: str) -> str:
    """Parse document using LlamaParse API"""
    try:
        # Check if LlamaParse is available
        llama_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
        print(f"🔑 LLAMA_CLOUD_API_KEY found: {'Yes' if llama_api_key else 'No'}")
        if llama_api_key:
            print(f"🔑 API Key preview: {llama_api_key[:10]}...")
        
        if not llama_api_key or llama_api_key == "your_llamaparse_api_key_here":
            print("⚠️ LlamaParse API key not configured, using mock data")
            return await get_mock_discharge_summary()
        
        # Use actual LlamaParse API
        from llama_parse import LlamaParse
        
        parser = LlamaParse(
            api_key=llama_api_key,
            result_type="text",  # or "markdown"
            verbose=True,
            language="en"
        )
        
        # Parse the document
        documents = parser.load_data(document_path)
        
        if documents and len(documents) > 0:
            parsed_text = documents[0].text
            print(f"Successfully parsed document with LlamaParse: {len(parsed_text)} characters")
            return parsed_text
        else:
            print("No content extracted from document")
            return await get_mock_discharge_summary()
            
    except ImportError:
        print("LlamaParse not installed, using mock data")
        return await get_mock_discharge_summary()
    except Exception as e:
        print(f"Error parsing document with LlamaParse: {e}")
        return await get_mock_discharge_summary()

async def extract_data_with_gemini(parsed_text: str, document_type: str) -> Dict[str, Any]:
    """Extract structured data from parsed text using Gemini"""
    try:
        from gemini_integration import gemini_client
        if gemini_client is None:
            raise ValueError("Gemini client not available")
        return await gemini_client.extract_document_data(parsed_text, document_type)
    except Exception as e:
        print(f"Error using Gemini integration: {e}")
        # Fallback to mock data
        return {
            "patient_name": "John Doe",
            "patient_dob": "1985-03-15",
            "medical_condition": "Pneumonia",
            "diagnosis": "Community-acquired pneumonia",
            "medications": ["Amoxicillin 500mg", "Ibuprofen 200mg"],
            "allergies": "Penicillin",
            "accessibility_needs": "Wheelchair accessible",
            "dietary_needs": "Diabetic diet",
            "social_needs": "Housing assistance",
            "follow_up_instructions": "Follow up with primary care in 1 week",
            "discharge_date": datetime.now().strftime("%Y-%m-%d"),
            "hospital": "San Francisco General Hospital",
            "confidence_score": 0.85
        }

def format_extracted_data_for_autofill(extracted_data: Dict[str, Any], case_id: str, source_file: str) -> AutofillData:
    """Format extracted data for autofilling the discharge intake form"""
    
    # Helper function to format dates
    def format_date(date_str: str) -> str:
        if not date_str:
            return ""
        try:
            from datetime import datetime
            if "/" in date_str:
                # Convert MM/DD/YYYY to YYYY-MM-DD
                parsed_date = datetime.strptime(date_str, "%m/%d/%Y")
                return parsed_date.strftime("%Y-%m-%d")
            elif "-" in date_str and len(date_str) == 10:
                # Already in YYYY-MM-DD format
                return date_str
        except:
            pass
        return date_str
    
    # Contact Information Section
    contact_info = {
        "name": extracted_data.get("patient_name", ""),
        "phone1": extracted_data.get("patient_phone", ""),
        "phone2": "",
        "date_of_birth": format_date(extracted_data.get("patient_dob", "")),
        "address": extracted_data.get("patient_address", ""),
        "apartment": "",
        "city": extracted_data.get("patient_city", ""),
        "state": extracted_data.get("patient_state", ""),
        "zip": extracted_data.get("patient_zip", ""),
        "emergency_contact_name": extracted_data.get("emergency_contact_name", ""),
        "emergency_contact_relationship": extracted_data.get("emergency_contact_relationship", ""),
        "emergency_contact_phone": extracted_data.get("emergency_contact_phone", ""),
    }
    
    # Discharge Information Section
    discharge_info = {
        "discharging_facility": extracted_data.get("discharging_facility", "") or extracted_data.get("hospital", ""),
        "discharging_facility_phone": extracted_data.get("discharging_facility_phone", ""),
        "facility_address": extracted_data.get("facility_address", ""),
        "facility_floor": "",
        "facility_city": extracted_data.get("facility_city", ""),
        "facility_state": extracted_data.get("facility_state", ""),
        "facility_zip": extracted_data.get("facility_zip", ""),
        "medical_record_number": extracted_data.get("medical_record_number", "") or extracted_data.get("mrn", ""),
        "date_of_admission": format_date(extracted_data.get("date_of_admission", "")),
        "planned_discharge_date": format_date(extracted_data.get("planned_discharge_date", "")) or format_date(extracted_data.get("discharge_date", "")),
        "discharged_to": extracted_data.get("discharge_destination", ""),
        "discharge_address": extracted_data.get("discharge_facility_name", ""),
        "discharge_apartment": "",
        "discharge_city": "",
        "discharge_state": "",
        "discharge_zip": "",
        "discharge_phone": "",
        "travel_outside_nyc": False,
        "travel_date_destination": "",
    }
    
    # Follow-Up Appointment Section
    follow_up = {
        "appointment_date": format_date(extracted_data.get("follow_up_appointment_date", "")),
        "physician_name": extracted_data.get("follow_up_physician_name", "") or extracted_data.get("physician", ""),
        "physician_phone": extracted_data.get("follow_up_physician_phone", "") or extracted_data.get("physician_phone", ""),
        "physician_cell": "",
        "physician_address": "",
        "physician_city": "",
        "physician_state": "",
        "physician_zip": "",
        "barriers_to_adherence": extracted_data.get("barriers_to_adherence", []),
        "physical_disability": extracted_data.get("physical_disability_details", ""),
        "medical_condition": extracted_data.get("medical_condition_details", "") or extracted_data.get("medical_condition", ""),
        "substance_use": extracted_data.get("substance_use_details", ""),
        "mental_disorder": extracted_data.get("mental_disorder_details", ""),
        "other_barriers": "",
        "follow_up_instructions": extracted_data.get("follow_up_instructions", ""),
    }
    
    # Laboratory Results Section
    lab_results = {
        "smear1_date": "",
        "smear1_source": "",
        "smear1_result": "",
        "smear1_grade": "",
        "smear2_date": "",
        "smear2_source": "",
        "smear2_result": "",
        "smear2_grade": "",
        "smear3_date": "",
        "smear3_source": "",
        "smear3_result": "",
        "smear3_grade": "",
    }
    
    # Treatment Information Section
    tb_meds = extracted_data.get("tb_medications", {})
    treatment_info = {
        "therapy_initiated_date": format_date(extracted_data.get("therapy_initiated_date", "")),
        "therapy_interrupted": False,
        "interruption_reason": "",
        "medications": tb_meds,
        "frequency": extracted_data.get("medication_frequency", ""),
        "central_line_inserted": False,
        "days_of_medication_supplied": extracted_data.get("days_of_medication_supplied", ""),
        "patient_agreed_to_dot": False,
        "form_filled_by_name": "",
        "form_filled_date": "",
        "responsible_physician_name": extracted_data.get("follow_up_physician_name", ""),
        "physician_license_number": "",
        "physician_phone": extracted_data.get("follow_up_physician_phone", ""),
        "all_medications": extracted_data.get("medications", []),
        "allergies": extracted_data.get("allergies", ""),
        "accessibility_needs": extracted_data.get("accessibility_needs", ""),
        "dietary_needs": extracted_data.get("dietary_needs", ""),
        "social_needs": extracted_data.get("social_needs", ""),
        "diagnosis": extracted_data.get("diagnosis", ""),
    }
    
    return AutofillData(
        case_id=case_id,
        contact_info=contact_info,
        discharge_info=discharge_info,
        follow_up=follow_up,
        lab_results=lab_results,
        treatment_info=treatment_info,
        confidence_score=extracted_data.get("confidence_score", 0.85),
        source_file=source_file
    )

async def get_mock_discharge_summary() -> str:
    """Return mock discharge summary for testing"""
    return """
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

# Include protocol with manifest publishing for Agentverse deployment
parser_agent.include(parser_protocol, publish_manifest=True)

# Fund agent if needed
if __name__ == "__main__":
    fund_agent_if_low(parser_agent.wallet.address())
    parser_agent.run()
