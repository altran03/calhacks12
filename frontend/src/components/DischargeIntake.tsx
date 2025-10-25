"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Building2, 
  MapPin, 
  Package, 
  FileCheck, 
  Upload, 
  X, 
  File, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Stethoscope,
  Home,
  ShoppingBag,
  Truck,
  Users
} from "lucide-react";

interface PatientInfo {
  // Patient and Admission Information
  name: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
  gender: string;
  housingStatus: "homeless" | "housed" | "unstable";
  principalResidence: string;
  
  // Medical Information
  primaryDiagnosis: string;
  treatmentSummary: string;
  dischargeDateTime: string;
  medicallyStable: boolean;
  
  // Post-Discharge Planning
  plannedDestination: string;
  acceptingAgencyName: string;
  acceptingAgencyContact: string;
  interimLocation: string;
  transportationArranged: string;
  followUpClinic: string;
  
  // Resource Provision
  mealOffered: "yes" | "no" | "declined" | "";
  clothingProvided: "yes" | "no" | "not_needed" | "";
  dischargeMedication: "yes" | "no" | "na" | "";
  medicationList: string;
  infectiousDiseaseScreening: "yes" | "no" | "";
  insuranceScreening: "yes" | "no" | "";
  socialWorkerAssigned: string;
  
  // Documentation and Consent
  consentForReferral: "digital" | "written" | "verbal" | "";
  staffName: string;
  intakeDate: string;

  // Parser Agent Autofill Structures (optional)
  contactInfo?: {
    name?: string;
    phone1?: string;
    phone2?: string;
    dateOfBirth?: string;
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
  };
  dischargeInfo?: {
    dischargingFacility?: string;
    dischargingFacilityPhone?: string;
    facilityAddress?: string;
    facilityFloor?: string;
    facilityCity?: string;
    facilityState?: string;
    facilityZip?: string;
    medicalRecordNumber?: string;
    dateOfAdmission?: string;
    plannedDischargeDate?: string;
    dischargedTo?: string;
    dischargeAddress?: string;
    dischargeApartment?: string;
    dischargeCity?: string;
    dischargeState?: string;
    dischargeZip?: string;
    dischargePhone?: string;
    travelOutsideNyc?: boolean;
    travelDateDestination?: string;
  };
  followUp?: {
    appointmentDate?: string;
    physicianName?: string;
    physicianPhone?: string;
    physicianCell?: string;
    physicianAddress?: string;
    physicianCity?: string;
    physicianState?: string;
    physicianZip?: string;
    barriersToAdherence?: string;
    physicalDisability?: string;
    medicalCondition?: string;
    substanceUse?: string;
    mentalDisorder?: string;
    otherBarriers?: string;
  };
  treatmentInfo?: {
    therapyInitiatedDate?: string;
    therapyInterrupted?: boolean;
    interruptionReason?: string;
    medications?: string | object;
    frequency?: string;
    centralLineInserted?: boolean;
    daysOfMedicationSupplied?: string;
    patientAgreedToDot?: boolean;
    formFilledByName?: string;
    formFilledDate?: string;
    responsiblePhysicianName?: string;
    physicianLicenseNumber?: string;
    physicianPhone?: string;
  };
  labResults?: {
    smear1_date?: string;
    smear1_source?: string;
    smear1_result?: string;
    smear1_grade?: string;
    smear2_date?: string;
    smear2_source?: string;
    smear2_result?: string;
    smear2_grade?: string;
    smear3_date?: string;
    smear3_source?: string;
    smear3_result?: string;
    smear3_grade?: string;
  };
}

interface DischargeIntakeProps {
  onWorkflowStarted?: () => void;
}

export default function DischargeIntake({ onWorkflowStarted }: DischargeIntakeProps = {}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [caseId, setCaseId] = useState<string>("");
  const [formData, setFormData] = useState<PatientInfo>({
    name: "",
    dateOfBirth: "",
    medicalRecordNumber: "",
    gender: "",
    housingStatus: "homeless",
    principalResidence: "",
    primaryDiagnosis: "",
    treatmentSummary: "",
    dischargeDateTime: "",
    medicallyStable: true,
    plannedDestination: "",
    acceptingAgencyName: "",
    acceptingAgencyContact: "",
    interimLocation: "",
    transportationArranged: "",
    followUpClinic: "",
    mealOffered: "",
    clothingProvided: "",
    dischargeMedication: "",
    medicationList: "",
    infectiousDiseaseScreening: "",
    insuranceScreening: "",
    socialWorkerAssigned: "",
    consentForReferral: "",
    staffName: "",
    intakeDate: new Date().toISOString().split('T')[0],
    // Initialize nested objects for parser agent autofill
    contactInfo: {
      name: "",
      phone1: "",
      phone2: "",
      dateOfBirth: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      zip: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
    },
    dischargeInfo: {
      dischargingFacility: "",
      dischargingFacilityPhone: "",
      facilityAddress: "",
      facilityCity: "",
      facilityState: "",
      facilityZip: "",
      medicalRecordNumber: "",
      dateOfAdmission: "",
      plannedDischargeDate: "",
      dischargedTo: "",
    },
    followUp: {
      appointmentDate: "",
      physicianName: "",
      physicianPhone: "",
      barriersToAdherence: "",
      medicalCondition: "",
    },
    treatmentInfo: {
      therapyInitiatedDate: "",
      medications: "",
      frequency: "",
      daysOfMedicationSupplied: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load form draft on component mount
  useEffect(() => {
    // Generate or retrieve case ID from localStorage
    let storedCaseId = localStorage.getItem('current_case_id');
    if (!storedCaseId) {
      storedCaseId = `CASE_${Date.now()}`;
      localStorage.setItem('current_case_id', storedCaseId);
    }
    setCaseId(storedCaseId);

    // Check if this case has been submitted
    const submittedStatus = localStorage.getItem(`case_submitted_${storedCaseId}`);
    if (submittedStatus === 'true') {
      setSubmitted(true);
      setSubmittedCaseId(storedCaseId);
    }

    // Load form draft from backend
    const loadDraft = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/form-draft/${storedCaseId}`);
        const result = await response.json();
        
        if (result.status === "success" && result.form_data) {
          console.log("✅ Loaded form draft:", result.form_data);
          setFormData(result.form_data);
          console.log("📝 Form restored from SQLite database");
        } else {
          console.log("📄 No existing draft found, starting fresh");
        }
      } catch (error) {
        console.error("Error loading form draft:", error);
      }
    };

    loadDraft();
  }, []);

  // Auto-save form data when it changes (debounced)
  useEffect(() => {
    if (!caseId) return;

    setSaveStatus("saving");
    const timeoutId = setTimeout(async () => {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('case_id', caseId);
        formDataToSend.append('form_data', JSON.stringify(formData));

        const response = await fetch('http://localhost:8000/api/form-draft/save', {
          method: 'POST',
          body: formDataToSend,
        });

        const result = await response.json();
        if (result.status === "success") {
          console.log("💾 Form auto-saved to SQLite");
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(""), 2000);
        }
      } catch (error) {
        console.error("Error auto-saving form:", error);
        setSaveStatus("");
      }
    }, 2000); // Save 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData, caseId]);

  const steps = [
    { 
      id: 0, 
      title: "Upload Docs", 
      icon: Upload, 
      color: "#8B5CF6",
      description: "Upload documents first to autofill the form"
    },
    { 
      id: 1, 
      title: "Patient Info", 
      icon: User, 
      color: "#0D7377",
      description: "Basic patient and admission information"
    },
    { 
      id: 2, 
      title: "Medical Details", 
      icon: Stethoscope, 
      color: "#D17A5C",
      description: "Diagnosis and treatment summary"
    },
    { 
      id: 3, 
      title: "Discharge Plan", 
      icon: MapPin, 
      color: "#2D9F7E",
      description: "Destination and follow-up arrangements"
    },
    { 
      id: 4, 
      title: "Resources", 
      icon: ShoppingBag, 
      color: "#E8A87C",
      description: "Meals, clothing, medication, and screenings"
    },
    { 
      id: 5, 
      title: "Documentation", 
      icon: FileCheck, 
      color: "#14919B",
      description: "Consent and staff information"
    },
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return false;
      }
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const processPDFFiles = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload PDF files first");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append("case_id", caseId || `CASE_${Date.now()}`);
      
      uploadedFiles.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const response = await fetch("http://localhost:8000/api/process-pdf", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to process PDF files");
      }

      const result = await response.json();
      console.log("Parser Agent Response:", result);
      console.log("Autofill Data Structure:", result.autofill_data);
      console.log("Contact Info:", result.autofill_data?.contact_info);
      console.log("Discharge Info:", result.autofill_data?.discharge_info);
      
      if (result.status === "success" && result.autofill_data) {
        const autofillData = result.autofill_data;
        
        // Parser agent returns structured data - map it to form fields
        setFormData(prevData => {
          const prevContactInfo = prevData.contactInfo ?? {};
          const prevDischargeInfo = prevData.dischargeInfo ?? {};
          const prevFollowUp = prevData.followUp ?? {};
          const prevTreatmentInfo = prevData.treatmentInfo ?? {};
          
          return {
            ...prevData,
            // Map contact_info to flat form fields
            name: autofillData.contact_info?.name || prevData.name,
            dateOfBirth: autofillData.contact_info?.date_of_birth || prevData.dateOfBirth,
            
            // Map discharge_info to flat form fields  
            medicalRecordNumber: autofillData.discharge_info?.medical_record_number || prevData.medicalRecordNumber,
            principalResidence: autofillData.discharge_info?.discharging_facility || prevData.principalResidence,
            dischargeDateTime: autofillData.discharge_info?.planned_discharge_date || prevData.dischargeDateTime,
            
            // Map follow_up to flat form fields
            followUpClinic: autofillData.follow_up?.physician_name || prevData.followUpClinic,
            primaryDiagnosis: autofillData.follow_up?.medical_condition || prevData.primaryDiagnosis,
            
            // Map treatment_info to flat form fields
            medicationList: Array.isArray(autofillData.treatment_info?.all_medications) 
              ? autofillData.treatment_info.all_medications.join(', ')
              : (autofillData.treatment_info?.medications || prevData.medicationList),
            
            treatmentSummary: autofillData.treatment_info?.diagnosis || prevData.treatmentSummary,
            
            // Keep nested objects for reference
            contactInfo: {
              ...prevContactInfo,
              name: autofillData.contact_info?.name || prevContactInfo.name,
              phone1: autofillData.contact_info?.phone1 || prevContactInfo.phone1,
              phone2: autofillData.contact_info?.phone2 || prevContactInfo.phone2,
              dateOfBirth: autofillData.contact_info?.date_of_birth || prevContactInfo.dateOfBirth,
              address: autofillData.contact_info?.address || prevContactInfo.address,
              apartment: autofillData.contact_info?.apartment || prevContactInfo.apartment,
              city: autofillData.contact_info?.city || prevContactInfo.city,
              state: autofillData.contact_info?.state || prevContactInfo.state,
              zip: autofillData.contact_info?.zip || prevContactInfo.zip,
              emergencyContactName: autofillData.contact_info?.emergency_contact_name || prevContactInfo.emergencyContactName,
              emergencyContactRelationship: autofillData.contact_info?.emergency_contact_relationship || prevContactInfo.emergencyContactRelationship,
              emergencyContactPhone: autofillData.contact_info?.emergency_contact_phone || prevContactInfo.emergencyContactPhone,
            },
            dischargeInfo: {
              ...prevDischargeInfo,
              dischargingFacility: autofillData.discharge_info?.discharging_facility || prevDischargeInfo.dischargingFacility,
              dischargingFacilityPhone: autofillData.discharge_info?.discharging_facility_phone || prevDischargeInfo.dischargingFacilityPhone,
              facilityAddress: autofillData.discharge_info?.facility_address || prevDischargeInfo.facilityAddress,
              facilityCity: autofillData.discharge_info?.facility_city || prevDischargeInfo.facilityCity,
              facilityState: autofillData.discharge_info?.facility_state || prevDischargeInfo.facilityState,
              facilityZip: autofillData.discharge_info?.facility_zip || prevDischargeInfo.facilityZip,
              medicalRecordNumber: autofillData.discharge_info?.medical_record_number || prevDischargeInfo.medicalRecordNumber,
              dateOfAdmission: autofillData.discharge_info?.date_of_admission || prevDischargeInfo.dateOfAdmission,
              plannedDischargeDate: autofillData.discharge_info?.planned_discharge_date || prevDischargeInfo.plannedDischargeDate,
              dischargedTo: autofillData.discharge_info?.discharged_to || prevDischargeInfo.dischargedTo,
            },
            followUp: {
              ...prevFollowUp,
              appointmentDate: autofillData.follow_up?.appointment_date || prevFollowUp.appointmentDate,
              physicianName: autofillData.follow_up?.physician_name || prevFollowUp.physicianName,
              physicianPhone: autofillData.follow_up?.physician_phone || prevFollowUp.physicianPhone,
              barriersToAdherence: autofillData.follow_up?.barriers_to_adherence || prevFollowUp.barriersToAdherence,
              medicalCondition: autofillData.follow_up?.medical_condition || prevFollowUp.medicalCondition,
            },
            treatmentInfo: {
              ...prevTreatmentInfo,
              therapyInitiatedDate: autofillData.treatment_info?.therapy_initiated_date || prevTreatmentInfo.therapyInitiatedDate,
              medications: autofillData.treatment_info?.medications || prevTreatmentInfo.medications,
              frequency: autofillData.treatment_info?.frequency || prevTreatmentInfo.frequency,
              daysOfMedicationSupplied: autofillData.treatment_info?.days_of_medication_supplied || prevTreatmentInfo.daysOfMedicationSupplied,
            },
          };
        });
        
        const confidence = autofillData.confidence_score || 0.85;
        alert(`✅ PDF processed successfully via Parser Agent!\n\n📊 Confidence Score: ${(confidence * 100).toFixed(0)}%\n🤖 Agent: ${result.agent_used || 'parser_agent'}\n📡 Port: ${result.agent_port || 8011}\n\nForm has been auto-filled with extracted data.`);
      }
      
    } catch (error) {
      console.error("Error processing PDF files:", error);
      alert("Failed to process PDF files. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare payload in the format expected by backend PatientInfo model
      const payload = {
        contact_info: {
          name: formData.contactInfo?.name || formData.name || "",
          phone1: formData.contactInfo?.phone1 || "",
          phone2: formData.contactInfo?.phone2 || "",
          date_of_birth: formData.contactInfo?.dateOfBirth || formData.dateOfBirth || "",
          address: formData.contactInfo?.address || "",
          apartment: formData.contactInfo?.apartment || "",
          city: formData.contactInfo?.city || "",
          state: formData.contactInfo?.state || "",
          zip: formData.contactInfo?.zip || "",
          emergency_contact_name: formData.contactInfo?.emergencyContactName || "",
          emergency_contact_relationship: formData.contactInfo?.emergencyContactRelationship || "",
          emergency_contact_phone: formData.contactInfo?.emergencyContactPhone || "",
        },
        discharge_info: {
          discharging_facility: formData.dischargeInfo?.dischargingFacility || "",
          discharging_facility_phone: formData.dischargeInfo?.dischargingFacilityPhone || "",
          facility_address: formData.dischargeInfo?.facilityAddress || "",
          facility_floor: formData.dischargeInfo?.facilityFloor || "",
          facility_city: formData.dischargeInfo?.facilityCity || "",
          facility_state: formData.dischargeInfo?.facilityState || "",
          facility_zip: formData.dischargeInfo?.facilityZip || "",
          medical_record_number: formData.dischargeInfo?.medicalRecordNumber || formData.medicalRecordNumber || "",
          date_of_admission: formData.dischargeInfo?.dateOfAdmission || "",
          planned_discharge_date: formData.dischargeInfo?.plannedDischargeDate || formData.dischargeDateTime || "",
          discharged_to: formData.dischargeInfo?.dischargedTo || formData.plannedDestination || "",
          discharge_address: formData.dischargeInfo?.dischargeAddress || "",
          discharge_apartment: formData.dischargeInfo?.dischargeApartment || "",
          discharge_city: formData.dischargeInfo?.dischargeCity || "",
          discharge_state: formData.dischargeInfo?.dischargeState || "",
          discharge_zip: formData.dischargeInfo?.dischargeZip || "",
          discharge_phone: formData.dischargeInfo?.dischargePhone || "",
          travel_outside_nyc: formData.dischargeInfo?.travelOutsideNyc || false,
          travel_date_destination: formData.dischargeInfo?.travelDateDestination || "",
        },
        follow_up: {
          appointment_date: formData.followUp?.appointmentDate || "",
          physician_name: formData.followUp?.physicianName || "",
          physician_phone: formData.followUp?.physicianPhone || "",
          physician_cell: formData.followUp?.physicianCell || "",
          physician_address: formData.followUp?.physicianAddress || "",
          physician_city: formData.followUp?.physicianCity || "",
          physician_state: formData.followUp?.physicianState || "",
          physician_zip: formData.followUp?.physicianZip || "",
          barriers_to_adherence: formData.followUp?.barriersToAdherence || [],
          physical_disability: formData.followUp?.physicalDisability || "",
          medical_condition: formData.followUp?.medicalCondition || formData.primaryDiagnosis || "",
          substance_use: formData.followUp?.substanceUse || "",
          mental_disorder: formData.followUp?.mentalDisorder || "",
          other_barriers: formData.followUp?.otherBarriers || "",
        },
        lab_results: formData.labResults || {
          smear1_date: "",
          smear1_source: "",
          smear1_result: "",
          smear1_grade: "",
          smear2_date: "",
          smear2_source: "",
          smear2_result: "",
          smear2_grade: "",
          smear3_date: "",
          smear3_source: "",
          smear3_result: "",
          smear3_grade: "",
        },
        treatment_info: {
          therapy_initiated_date: formData.treatmentInfo?.therapyInitiatedDate || "",
          therapy_interrupted: formData.treatmentInfo?.therapyInterrupted || false,
          interruption_reason: formData.treatmentInfo?.interruptionReason || "",
          medications: formData.treatmentInfo?.medications || {},
          frequency: formData.treatmentInfo?.frequency || "",
          central_line_inserted: formData.treatmentInfo?.centralLineInserted || false,
          days_of_medication_supplied: formData.treatmentInfo?.daysOfMedicationSupplied || "",
          patient_agreed_to_dot: formData.treatmentInfo?.patientAgreedToDot || false,
          form_filled_by_name: formData.treatmentInfo?.formFilledByName || formData.staffName || "",
          form_filled_date: formData.treatmentInfo?.formFilledDate || formData.intakeDate || "",
          responsible_physician_name: formData.treatmentInfo?.responsiblePhysicianName || "",
          physician_license_number: formData.treatmentInfo?.physicianLicenseNumber || "",
          physician_phone: formData.treatmentInfo?.physicianPhone || "",
        },
      };

      console.log("📤 Submitting discharge workflow to backend...");
      console.log("📋 Payload:", payload);
      
      const response = await fetch("http://localhost:8000/api/discharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Discharge workflow created:", result);
        console.log("🤖 Coordinator Agent has been notified with filled form data");
        
        // IMPORTANT: Update localStorage with the backend-generated case_id
        const backendCaseId = result.case_id;
        localStorage.setItem('current_case_id', backendCaseId);
        localStorage.setItem(`case_submitted_${backendCaseId}`, 'true');
        
        // Update component state with backend case ID
        setCaseId(backendCaseId);
        setSubmitted(true);
        setSubmittedCaseId(backendCaseId);
        
        console.log("💾 Updated case ID to backend value:", backendCaseId);
        
        // Redirect to workflow page to watch real-time agent coordination
        console.log("🔄 Redirecting to workflow page...");
        router.push(`/workflow/${backendCaseId}`);
      } else {
        const error = await response.json();
        console.error("❌ Error submitting discharge:", error);
        alert(`Failed to submit discharge: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error submitting discharge:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartNewCase = () => {
    const newCaseId = `CASE_${Date.now()}`;
    localStorage.setItem('current_case_id', newCaseId);
    localStorage.removeItem(`case_submitted_${caseId}`);
    
    // Reset form
    setSubmitted(false);
    setSubmittedCaseId("");
    setCaseId(newCaseId);
    setCurrentStep(0);
    setFormData({
      name: "",
      dateOfBirth: "",
      medicalRecordNumber: "",
      gender: "",
      housingStatus: "homeless",
      principalResidence: "",
      primaryDiagnosis: "",
      treatmentSummary: "",
      dischargeDateTime: "",
      medicallyStable: true,
      plannedDestination: "",
      acceptingAgencyName: "",
      acceptingAgencyContact: "",
      interimLocation: "",
      transportationArranged: "",
      followUpClinic: "",
      mealOffered: "",
      clothingProvided: "",
      dischargeMedication: "",
      medicationList: "",
      infectiousDiseaseScreening: "",
      insuranceScreening: "",
      socialWorkerAssigned: "",
      consentForReferral: "",
      staffName: "",
      intakeDate: new Date().toISOString().split('T')[0],
      contactInfo: {
        name: "",
        phone1: "",
        phone2: "",
        dateOfBirth: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        zip: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactPhone: "",
      },
      dischargeInfo: {
        dischargingFacility: "",
        dischargingFacilityPhone: "",
        facilityAddress: "",
        facilityCity: "",
        facilityState: "",
        facilityZip: "",
        medicalRecordNumber: "",
        dateOfAdmission: "",
        plannedDischargeDate: "",
        dischargedTo: "",
      },
      followUp: {
        appointmentDate: "",
        physicianName: "",
        physicianPhone: "",
        barriersToAdherence: "",
        medicalCondition: "",
      },
      treatmentInfo: {
        therapyInitiatedDate: "",
        medications: "",
        frequency: "",
        daysOfMedicationSupplied: "",
      },
    });
    setUploadedFiles([]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Heart className="w-8 h-8 text-[#D17A5C]" />
          <h2 
            className="text-4xl font-bold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            Homeless Patient Discharge
          </h2>
        </div>
        <p className="text-lg" style={{ color: '#6B7575' }}>
          Coordinating accessible aftercare for patients experiencing homelessness
        </p>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm"
            style={{ color: saveStatus === "saved" ? '#2D9F7E' : '#6B7575' }}
          >
            {saveStatus === "saving" ? "💾 Saving..." : "✅ Saved to database"}
          </motion.div>
        )}
      </motion.div>

      {/* Success Banner */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 159, 126, 0.1), rgba(61, 184, 150, 0.1))',
            border: '2px solid #2D9F7E',
            boxShadow: '0 4px 16px rgba(45, 159, 126, 0.2)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2D9F7E, #3DB896)',
                  boxShadow: '0 4px 16px rgba(45, 159, 126, 0.3)'
                }}
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: 'Crimson Pro, serif', color: '#2D9F7E' }}
                >
                  ✅ Discharge Coordination Initiated!
                </h3>
                <p className="text-sm mb-3" style={{ color: '#1A1D1E' }}>
                  Case ID: <span className="font-mono font-semibold">{submittedCaseId}</span>
                </p>
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg"
                  style={{
                    background: 'rgba(45, 159, 126, 0.15)',
                    color: '#2D9F7E'
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Multi-Agent Coordination in Progress</span>
                </motion.div>
                <p className="text-sm mt-3" style={{ color: '#6B7575' }}>
                  💡 Navigate to <strong>Workflow Timeline</strong>, <strong>Resource Map</strong>, or <strong>Transport Hub</strong> to track progress
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={handleStartNewCase}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #0D7377, #14919B)',
                boxShadow: '0 2px 8px rgba(13, 115, 119, 0.3)'
              }}
            >
              Start New Case
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;

            return (
              <React.Fragment key={step.id}>
                <motion.div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setCurrentStep(index)}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300"
                    style={{
                      background: isActive || isCompleted 
                        ? `linear-gradient(135deg, ${step.color}, ${step.color}dd)`
                        : 'rgba(224, 213, 199, 0.3)',
                      border: `2px solid ${isActive || isCompleted ? step.color : '#E0D5C7'}`,
                      boxShadow: isActive ? `0 8px 24px ${step.color}40` : 'none'
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive || isCompleted ? 'text-white' : 'text-[#6B7575]'}`} />
                    )}
                    
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ border: `2px solid ${step.color}` }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <span 
                    className="text-xs font-medium text-center max-w-[80px]"
                    style={{ color: isActive || isCompleted ? step.color : '#6B7575' }}
                  >
                    {step.title}
                  </span>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <div 
                    className="flex-1 h-0.5 mx-2 transition-all duration-500"
                    style={{
                      background: isCompleted 
                        ? `linear-gradient(90deg, ${steps[index].color}, ${steps[index + 1].color})`
                        : '#E0D5C7'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl p-10 mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #E0D5C7',
            boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)',
            minHeight: '500px'
          }}
        >
          {/* Step Content Header */}
          <div className="mb-8">
            <h3 
              className="text-2xl font-semibold mb-2"
              style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
            >
              {steps[currentStep].title}
            </h3>
            <p style={{ color: '#6B7575' }}>
              {steps[currentStep].description}
            </p>
          </div>

          {/* Step 0: Document Upload */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div 
                className="p-6 rounded-2xl mb-6"
                style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid #E0D5C7'
                }}
              >
                <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Crimson Pro, serif', color: '#8B5CF6' }}>
                  💡 Upload First, Then Review
                </h4>
                <p className="text-sm mb-3" style={{ color: '#6B7575' }}>
                  Upload discharge documents first to automatically populate the form. You can then review and fill in any missing information in the following steps.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: '#6B7575' }}>
                  <div>
                    <strong>• Discharge Summary</strong> - Patient info, diagnosis, dates
                  </div>
                  <div>
                    <strong>• Medication List</strong> - Prescriptions and dosages
                  </div>
                  <div>
                    <strong>• Referral Forms</strong> - Agency details, consent status
                  </div>
                  <div>
                    <strong>• Clinical Notes</strong> - Medical stability, treatment
                  </div>
                  <div>
                    <strong>• Transport Voucher</strong> - Transportation arrangements
                  </div>
                  <div>
                    <strong>• Consent Forms</strong> - Release authorization
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/5"
                    : "border-[#E0D5C7] hover:border-[#8B5CF6]/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-[#8B5CF6]" />
                <p className="text-xl font-semibold mb-2" style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}>
                  Drop PDF files here
                </p>
                <p className="mb-6" style={{ color: '#6B7575' }}>
                  or click to browse
                </p>
                <motion.button
                  type="button"
                  onClick={openFileDialog}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 rounded-xl text-white font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  Choose Files
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold" style={{ color: '#1A1D1E' }}>
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid #E0D5C7'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <File className="w-6 h-6 text-[#8B5CF6]" />
                        <div>
                          <p className="font-medium" style={{ color: '#1A1D1E' }}>
                            {file.name}
                          </p>
                          <p className="text-sm" style={{ color: '#6B7575' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => removeFile(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      >
                        <X className="w-5 h-5" style={{ color: '#C85C5C' }} />
                      </motion.button>
                    </motion.div>
                  ))}

                  {/* Process PDF Button */}
                  <motion.button
                    type="button"
                    onClick={processPDFFiles}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center space-x-2"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Processing PDFs...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Process PDFs & Autofill Form</span>
                      </>
                    )}
                  </motion.button>
                  <p className="text-center text-sm" style={{ color: '#6B7575' }}>
                    Click "Next" after processing to review autofilled information
                  </p>
                </div>
              )}

              {uploadedFiles.length === 0 && (
                <div className="text-center">
                  <p className="text-sm" style={{ color: '#6B7575' }}>
                    💡 You can skip this step and fill the form manually, or upload documents later
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Patient and Admission Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Patient Name (or "Unknown") *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                    placeholder="Enter patient's name or 'Unknown'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Date of Birth (or approximate) *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Medical Record Number *
                  </label>
                  <input
                    type="text"
                    name="medicalRecordNumber"
                    value={formData.medicalRecordNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                    placeholder="MRN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Gender (optional)
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                    <option value="decline">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Housing Status *
                  </label>
                  <select
                    name="housingStatus"
                    value={formData.housingStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="homeless">Homeless</option>
                    <option value="housed">Housed</option>
                    <option value="unstable">Unstable Housing</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Principal Residence
                  </label>
                  <input
                    type="text"
                    name="principalResidence"
                    value={formData.principalResidence}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Shelter name, encampment location, or 'Undomiciled'"
                  />
                  <p className="text-xs mt-1" style={{ color: '#6B7575' }}>
                    Examples: "Mission Shelter", "Tent on 5th Street", "Undomiciled"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Primary Diagnosis and Reason for Admission *
                  </label>
                  <textarea
                    name="primaryDiagnosis"
                    value={formData.primaryDiagnosis}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3"
                    placeholder="Primary diagnosis, presenting condition, reason for hospitalization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Summary of Treatment/Course in Hospital *
                  </label>
                  <textarea
                    name="treatmentSummary"
                    value={formData.treatmentSummary}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3"
                    placeholder="Brief summary of hospital stay, treatments received, procedures performed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Date and Time of Discharge *
                  </label>
                  <input
                    type="datetime-local"
                    name="dischargeDateTime"
                    value={formData.dischargeDateTime}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Medically Stable for Discharge? *
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="medicallyStable"
                        checked={formData.medicallyStable === true}
                        onChange={() => setFormData(prev => ({ ...prev, medicallyStable: true }))}
                        className="w-5 h-5"
                      />
                      <span>Yes - Patient is medically stable</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="medicallyStable"
                        checked={formData.medicallyStable === false}
                        onChange={() => setFormData(prev => ({ ...prev, medicallyStable: false }))}
                        className="w-5 h-5"
                      />
                      <span>No - Additional care needed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Post-Discharge Planning */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Planned Destination *
                  </label>
                  <select
                    name="plannedDestination"
                    value={formData.plannedDestination}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select destination</option>
                    <option value="shelter">Shelter</option>
                    <option value="social_services">Social Services Agency</option>
                    <option value="residence">Private Residence</option>
                    <option value="tbd">To Be Determined (AI will coordinate)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Accepting Agency/Shelter Name
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(45, 159, 126, 0.1)', color: '#2D9F7E' }}>
                      🤖 AI Agent will find if blank
                    </span>
                  </label>
                  <input
                    type="text"
                    name="acceptingAgencyName"
                    value={formData.acceptingAgencyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Leave blank for AI Shelter Agent to find best match"
                  />
                  <p className="text-xs mt-1" style={{ color: '#6B7575' }}>
                    Shelter Agent will query SF shelter database via Bright Data and verify availability
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Agency Contact
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(45, 159, 126, 0.1)', color: '#2D9F7E' }}>
                      🤖 AI coordinated
                    </span>
                  </label>
                  <input
                    type="text"
                    name="acceptingAgencyContact"
                    value={formData.acceptingAgencyContact}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Will be provided by Shelter Agent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Interim Location (if shelter not yet assigned)
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(45, 159, 126, 0.1)', color: '#2D9F7E' }}>
                      🤖 AI coordinated
                    </span>
                  </label>
                  <input
                    type="text"
                    name="interimLocation"
                    value={formData.interimLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Leave blank - Coordinator Agent will arrange safe interim location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Transportation Arranged
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                      🤖 Transport Agent
                    </span>
                  </label>
                  <input
                    type="text"
                    name="transportationArranged"
                    value={formData.transportationArranged}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Leave blank - Transport Agent will schedule wheelchair-accessible vehicle"
                  />
                  <p className="text-xs mt-1" style={{ color: '#6B7575' }}>
                    Transport Agent will find providers, schedule pickup, and assign driver via Vapi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Follow-up Clinic/Care Referral
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(232, 168, 124, 0.1)', color: '#E8A87C' }}>
                      🤖 Resource Agent
                    </span>
                  </label>
                  <input
                    type="text"
                    name="followUpClinic"
                    value={formData.followUpClinic}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Leave blank - Resource Agent will coordinate follow-up care"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Resource Provision */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Was meal offered prior to discharge? *
                  </label>
                  <select
                    name="mealOffered"
                    value={formData.mealOffered}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes - Meal provided</option>
                    <option value="no">No - Not offered</option>
                    <option value="declined">Declined by patient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Weather-appropriate clothing provided? *
                  </label>
                  <select
                    name="clothingProvided"
                    value={formData.clothingProvided}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes - Clothing provided</option>
                    <option value="no">No - Not provided</option>
                    <option value="not_needed">Not needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Discharge medication provided? *
                  </label>
                  <select
                    name="dischargeMedication"
                    value={formData.dischargeMedication}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes - Medication provided</option>
                    <option value="no">No - Prescription given</option>
                    <option value="na">N/A - No medication needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Medication List/Prescriptions
                  </label>
                  <textarea
                    name="medicationList"
                    value={formData.medicationList}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3"
                    placeholder="List medications provided or prescribed with dosages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Infectious disease screening performed? *
                  </label>
                  <select
                    name="infectiousDiseaseScreening"
                    value={formData.infectiousDiseaseScreening}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes - Screening completed</option>
                    <option value="no">No - Not performed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Insurance screening/enrollment done? *
                  </label>
                  <select
                    name="insuranceScreening"
                    value={formData.insuranceScreening}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes - Screening completed</option>
                    <option value="no">No - Not performed</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Social Worker/Case Manager Assigned
                    <span className="ml-2 text-xs font-normal px-2 py-1 rounded" style={{ background: 'rgba(209, 122, 92, 0.1)', color: '#D17A5C' }}>
                      🤖 Social Worker Agent
                    </span>
                  </label>
                  <input
                    type="text"
                    name="socialWorkerAssigned"
                    value={formData.socialWorkerAssigned}
                    onChange={handleChange}
                    className="w-full px-4 py-3"
                    placeholder="Leave blank - Social Worker Agent will assign based on patient needs"
                  />
                  <p className="text-xs mt-1" style={{ color: '#6B7575' }}>
                    Agent will match patient with appropriate case manager and provide contact info
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Documentation and Consent */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Consent for Release/Referral *
                  </label>
                  <select
                    name="consentForReferral"
                    value={formData.consentForReferral}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  >
                    <option value="">Select consent type</option>
                    <option value="digital">Digital/Electronic consent</option>
                    <option value="written">Written/Scanned consent</option>
                    <option value="verbal">Verbal consent (documented)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Intake Date *
                  </label>
                  <input
                    type="date"
                    name="intakeDate"
                    value={formData.intakeDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D1E' }}>
                    Staff Name Completing Intake *
                  </label>
                  <input
                    type="text"
                    name="staffName"
                    value={formData.staffName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div 
                className="mt-8 p-6 rounded-2xl"
                style={{
                  background: 'rgba(13, 115, 119, 0.05)',
                  border: '1px solid #E0D5C7'
                }}
              >
                <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Crimson Pro, serif', color: '#0D7377' }}>
                  🤖 AI Agent Workflow Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: '#6B7575' }}>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(45, 159, 126, 0.2)' }}>
                      <Home className="w-3 h-3" style={{ color: '#2D9F7E' }} />
                    </div>
                    <div>
                      <strong>Shelter Agent:</strong> Queries SF shelter database, verifies bed availability via Vapi calls
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                      <Truck className="w-3 h-3" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <strong>Transport Agent:</strong> Finds wheelchair-accessible transport, schedules pickup & assigns driver
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(209, 122, 92, 0.2)' }}>
                      <Users className="w-3 h-3" style={{ color: '#D17A5C' }} />
                    </div>
                    <div>
                      <strong>Social Worker Agent:</strong> Assigns case manager based on patient needs and availability
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(232, 168, 124, 0.2)' }}>
                      <Package className="w-3 h-3" style={{ color: '#E8A87C' }} />
                    </div>
                    <div>
                      <strong>Resource Agent:</strong> Coordinates meals, clothing, hygiene items & follow-up care
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-4" style={{ color: '#6B7575' }}>
                  💡 Leave AI-coordinated fields blank and the agents will handle them automatically after submission
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          whileHover={currentStep > 0 ? { scale: 1.05, x: -5 } : {}}
          whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all"
          style={{
            background: currentStep === 0 ? 'rgba(224, 213, 199, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #E0D5C7',
            color: currentStep === 0 ? '#6B7575' : '#1A1D1E',
            opacity: currentStep === 0 ? 0.5 : 1,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Previous</span>
        </motion.button>

        <div className="flex items-center space-x-2" style={{ color: '#6B7575' }}>
          <span className="font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {currentStep < steps.length - 1 ? (
          <motion.button
            type="button"
            onClick={nextStep}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #0D7377, #14919B)',
              boxShadow: '0 4px 16px rgba(13, 115, 119, 0.3)'
            }}
          >
            <span>Next</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : submitted ? (
          <motion.div
            className="flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold"
            style={{
              background: 'rgba(45, 159, 126, 0.1)',
              border: '2px solid #2D9F7E',
              color: '#2D9F7E'
            }}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Coordination Active</span>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #2D9F7E, #3DB896)',
              boxShadow: '0 4px 16px rgba(45, 159, 126, 0.3)',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Initiating Workflow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Start Coordination</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
