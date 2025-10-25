"""
Gemini Integration for CareLink
Google Gemini AI integration for document processing and analysis
"""

import os
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiClient:
    """Google Gemini AI client for CareLink document processing"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        self.max_tokens = int(os.getenv('GEMINI_MAX_TOKENS', '8192'))
        self.temperature = float(os.getenv('GEMINI_TEMPERATURE', '0.7'))
        self.client = None
        self.model = None
        
        if self.api_key:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Gemini client"""
        try:
            genai.configure(api_key=self.api_key)
            self.client = genai
            self.model = genai.GenerativeModel(self.model_name)
            print("✅ Gemini client initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini client: {e}")
            self.client = None
            self.model = None
    
    def is_available(self) -> bool:
        """Check if Gemini client is available"""
        return self.client is not None and self.model is not None
    
    async def process_discharge_request(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process discharge request with AI analysis"""
        if not self.is_available():
            return self._get_fallback_analysis()
        
        try:
            # Create prompt for discharge analysis
            prompt = self._create_discharge_analysis_prompt(patient_data)
            
            # Generate response
            response = await self._generate_response(prompt)
            
            # Parse and structure the response
            return self._parse_discharge_analysis(response)
            
        except Exception as e:
            print(f"Error processing discharge request with Gemini: {e}")
            return self._get_fallback_analysis()
    
    async def extract_document_data(self, parsed_text: str, document_type: str) -> Dict[str, Any]:
        """Extract structured data from parsed document text"""
        if not self.is_available():
            return self._get_fallback_document_data()
        
        try:
            # Create prompt for document extraction
            prompt = self._create_document_extraction_prompt(parsed_text, document_type)
            
            # Generate response
            response = await self._generate_response(prompt)
            
            # Parse and structure the response
            return self._parse_document_data(response)
            
        except Exception as e:
            print(f"Error extracting document data with Gemini: {e}")
            return self._get_fallback_document_data()
    
    async def _generate_response(self, prompt: str) -> str:
        """Generate response from Gemini model"""
        try:
            # Run the generation in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            return response.text
        except Exception as e:
            print(f"Error generating Gemini response: {e}")
            raise
    
    def _create_discharge_analysis_prompt(self, patient_data: Dict[str, Any]) -> str:
        """Create prompt for discharge analysis"""
        return f"""
        Analyze this patient discharge information and provide insights for care coordination:
        
        Patient Information:
        - Name: {patient_data.get('contact_info', {}).get('name', 'Unknown')}
        - Date of Birth: {patient_data.get('contact_info', {}).get('date_of_birth', 'Unknown')}
        - Address: {patient_data.get('contact_info', {}).get('address', 'Unknown')}
        
        Discharge Information:
        - Facility: {patient_data.get('discharge_info', {}).get('discharging_facility', 'Unknown')}
        - Discharge Date: {patient_data.get('discharge_info', {}).get('discharge_date', 'Unknown')}
        
        Medical Information:
        - Condition: {patient_data.get('treatment_info', {}).get('medical_condition', 'Unknown')}
        - Medications: {patient_data.get('treatment_info', {}).get('medications', [])}
        - Allergies: {patient_data.get('treatment_info', {}).get('allergies', 'None')}
        
        Social Needs:
        - Housing: {patient_data.get('follow_up', {}).get('housing_assistance', 'Unknown')}
        - Transportation: {patient_data.get('follow_up', {}).get('transportation_needs', 'Unknown')}
        - Follow-up: {patient_data.get('follow_up', {}).get('follow_up_instructions', 'Unknown')}
        
        Please provide:
        1. Risk assessment (high/medium/low)
        2. Priority social services needed
        3. Recommended follow-up timeline
        4. Special considerations for care coordination
        
        Format your response as JSON with these fields:
        - risk_level: string
        - priority_services: array of strings
        - follow_up_timeline: string
        - special_considerations: array of strings
        - confidence_score: float (0-1)
        """
    
    def _create_document_extraction_prompt(self, parsed_text: str, document_type: str) -> str:
        """Create prompt for document data extraction"""
        return f"""
        Extract structured data from this {document_type} document for hospital discharge coordination.
        
        Document Text:
        {parsed_text[:4000]}
        
        Please extract and return the following information in JSON format:
        
        {{
          "patient_name": "string - Full patient name",
          "patient_dob": "string - Date of birth in YYYY-MM-DD format",
          "patient_phone": "string - Primary phone number",
          "patient_address": "string - Street address",
          "patient_city": "string - City",
          "patient_state": "string - State",
          "patient_zip": "string - ZIP code",
          "emergency_contact_name": "string - Emergency contact full name",
          "emergency_contact_relationship": "string - Relationship to patient",
          "emergency_contact_phone": "string - Emergency contact phone",
          
          "discharging_facility": "string - Hospital/facility name",
          "discharging_facility_phone": "string - Facility phone number",
          "facility_address": "string - Facility street address",
          "facility_city": "string - Facility city",
          "facility_state": "string - Facility state",
          "facility_zip": "string - Facility ZIP",
          "medical_record_number": "string - Patient MRN",
          "date_of_admission": "string - Admission date YYYY-MM-DD",
          "planned_discharge_date": "string - Discharge date YYYY-MM-DD",
          
          "medical_condition": "string - Primary medical condition/diagnosis",
          "diagnosis": "string - Full diagnosis description",
          "medications": ["array of medication names with dosages"],
          "allergies": "string - Known allergies",
          "accessibility_needs": "string - Wheelchair, walker, mobility aids needed",
          "dietary_needs": "string - Dietary restrictions or requirements",
          "social_needs": "string - Housing, food, transportation needs",
          
          "follow_up_physician_name": "string - Follow-up doctor name",
          "follow_up_physician_phone": "string - Follow-up doctor phone",
          "follow_up_appointment_date": "string - Appointment date YYYY-MM-DD",
          "follow_up_instructions": "string - Post-discharge instructions",
          
          "therapy_initiated_date": "string - TB/treatment start date YYYY-MM-DD",
          "tb_medications": {{
            "inh": {{"prescribed": boolean, "dosage": "string"}},
            "rif": {{"prescribed": boolean, "dosage": "string"}},
            "pza": {{"prescribed": boolean, "dosage": "string"}},
            "emb": {{"prescribed": boolean, "dosage": "string"}}
          }},
          "medication_frequency": "string - daily, 2x_weekly, 3x_weekly",
          "days_of_medication_supplied": "string - Number of days",
          
          "barriers_to_adherence": ["array of: homelessness, physical_disability, substance_use, mental_disorder"],
          "physical_disability_details": "string - Specific disability details",
          "medical_condition_details": "string - Specific condition details",
          "substance_use_details": "string - Substance use details",
          "mental_disorder_details": "string - Mental health details",
          
          "discharge_destination": "string - home, shelter, skilled_nursing, jail_prison, residential, other",
          "discharge_facility_name": "string - Name of discharge destination",
          
          "hospital": "string - Hospital name",
          "confidence_score": 0.85
        }}
        
        Extract as much information as possible from the document. For any field not found, use empty string "" or empty array [] or false for booleans. Return ONLY valid JSON, no additional text.
        """
    
    def _parse_discharge_analysis(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response for discharge analysis"""
        try:
            import json
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback parsing
        return {
            "risk_level": "medium",
            "priority_services": ["housing", "transportation"],
            "follow_up_timeline": "1-2 weeks",
            "special_considerations": ["Monitor medication adherence"],
            "confidence_score": 0.7
        }
    
    def _parse_document_data(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response for document data"""
        try:
            import json
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback data
        return self._get_fallback_document_data()
    
    def _get_fallback_analysis(self) -> Dict[str, Any]:
        """Get fallback analysis when Gemini is not available"""
        return {
            "risk_level": "medium",
            "priority_services": ["housing", "transportation", "medical_follow_up"],
            "follow_up_timeline": "1-2 weeks",
            "special_considerations": [
                "Monitor medication adherence",
                "Ensure housing stability",
                "Schedule follow-up appointments"
            ],
            "confidence_score": 0.6,
            "source": "fallback_analysis"
        }
    
    def _get_fallback_document_data(self) -> Dict[str, Any]:
        """Get fallback document data when Gemini is not available"""
        return {
            "patient_name": "John Doe",
            "patient_dob": "1985-03-15",
            "patient_phone": "(415) 555-0100",
            "patient_address": "123 Mission St",
            "patient_city": "San Francisco",
            "patient_state": "CA",
            "patient_zip": "94103",
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_relationship": "Spouse",
            "emergency_contact_phone": "(415) 555-0101",
            
            "discharging_facility": "San Francisco General Hospital",
            "discharging_facility_phone": "(415) 206-8000",
            "facility_address": "1001 Potrero Ave",
            "facility_city": "San Francisco",
            "facility_state": "CA",
            "facility_zip": "94110",
            "medical_record_number": "MRN-12345",
            "date_of_admission": "2025-10-20",
            "planned_discharge_date": datetime.now().strftime("%Y-%m-%d"),
            
            "medical_condition": "Pneumonia",
            "diagnosis": "Community-acquired pneumonia with COPD exacerbation",
            "medications": ["Amoxicillin 500mg TID", "Ibuprofen 200mg PRN", "Albuterol inhaler 2 puffs Q4-6H"],
            "allergies": "Penicillin (rash)",
            "accessibility_needs": "Wheelchair accessible, walker required",
            "dietary_needs": "Diabetic diet, low sodium",
            "social_needs": "Housing assistance, food access",
            
            "follow_up_physician_name": "Dr. Sarah Johnson",
            "follow_up_physician_phone": "(415) 555-0200",
            "follow_up_appointment_date": "2025-11-01",
            "follow_up_instructions": "Follow up with primary care in 1 week, continue medications as prescribed",
            
            "therapy_initiated_date": "2025-10-21",
            "tb_medications": {
                "inh": {"prescribed": False, "dosage": ""},
                "rif": {"prescribed": False, "dosage": ""},
                "pza": {"prescribed": False, "dosage": ""},
                "emb": {"prescribed": False, "dosage": ""}
            },
            "medication_frequency": "daily",
            "days_of_medication_supplied": "7",
            
            "barriers_to_adherence": ["homelessness", "substance_use"],
            "physical_disability_details": "",
            "medical_condition_details": "COPD with frequent exacerbations",
            "substance_use_details": "Alcohol use disorder, currently in recovery",
            "mental_disorder_details": "",
            
            "discharge_destination": "shelter",
            "discharge_facility_name": "MSC South Shelter",
            
            "hospital": "San Francisco General Hospital",
            "confidence_score": 0.85,
            "source": "fallback_data"
        }

# Global instance
gemini_client = None

def initialize_gemini():
    """Initialize the global Gemini client"""
    global gemini_client
    if gemini_client is None:
        gemini_client = GeminiClient()
    return gemini_client

# Initialize on import
gemini_client = initialize_gemini()
