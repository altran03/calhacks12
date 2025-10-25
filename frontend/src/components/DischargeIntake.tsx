"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, FileText, Phone, Calendar, MapPin, Stethoscope, Home, Building, TestTube, Pill } from "lucide-react";

interface PatientContactInfo {
  name: string;
  phone1: string;
  phone2: string;
  dateOfBirth: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

interface DischargeInformation {
  dischargingFacility: string;
  dischargingFacilityPhone: string;
  facilityAddress: string;
  facilityFloor: string;
  facilityCity: string;
  facilityState: string;
  facilityZip: string;
  medicalRecordNumber: string;
  dateOfAdmission: string;
  plannedDischargeDate: string;
  dischargedTo: string;
  dischargeAddress: string;
  dischargeApartment: string;
  dischargeCity: string;
  dischargeState: string;
  dischargeZip: string;
  dischargePhone: string;
  travelOutsideNYC: boolean;
  travelDateDestination: string;
}

interface FollowUpAppointment {
  appointmentDate: string;
  physicianName: string;
  physicianPhone: string;
  physicianCell: string;
  physicianAddress: string;
  physicianCity: string;
  physicianState: string;
  physicianZip: string;
  barriersToAdherence: string[];
  physicalDisability: string;
  medicalCondition: string;
  substanceUse: string;
  mentalDisorder: string;
  otherBarriers: string;
}

interface LaboratoryResults {
  smear1Date: string;
  smear1Source: string;
  smear1Result: string;
  smear1Grade: string;
  smear2Date: string;
  smear2Source: string;
  smear2Result: string;
  smear2Grade: string;
  smear3Date: string;
  smear3Source: string;
  smear3Result: string;
  smear3Grade: string;
}

interface TreatmentInformation {
  therapyInitiatedDate: string;
  therapyInterrupted: boolean;
  interruptionReason: string;
  medications: {
    inh: { prescribed: boolean; dosage: string };
    rif: { prescribed: boolean; dosage: string };
    pza: { prescribed: boolean; dosage: string };
    emb: { prescribed: boolean; dosage: string };
    sm: { prescribed: boolean; dosage: string };
    vitaminB6: { prescribed: boolean; dosage: string };
    injectables: { prescribed: boolean; type: string };
    other: { prescribed: boolean; type: string };
  };
  frequency: string;
  centralLineInserted: boolean;
  daysOfMedicationSupplied: string;
  patientAgreedToDOT: boolean;
  formFilledByName: string;
  formFilledDate: string;
  responsiblePhysicianName: string;
  physicianLicenseNumber: string;
  physicianPhone: string;
}

interface PatientInfo {
  contactInfo: PatientContactInfo;
  dischargeInfo: DischargeInformation;
  followUp: FollowUpAppointment;
  labResults: LaboratoryResults;
  treatmentInfo: TreatmentInformation;
}

export default function DischargeIntake() {
  const [formData, setFormData] = useState<PatientInfo>({
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
      facilityFloor: "",
      facilityCity: "",
      facilityState: "",
      facilityZip: "",
      medicalRecordNumber: "",
      dateOfAdmission: "",
      plannedDischargeDate: "",
      dischargedTo: "",
      dischargeAddress: "",
      dischargeApartment: "",
      dischargeCity: "",
      dischargeState: "",
      dischargeZip: "",
      dischargePhone: "",
      travelOutsideNYC: false,
      travelDateDestination: "",
    },
    followUp: {
      appointmentDate: "",
      physicianName: "",
      physicianPhone: "",
      physicianCell: "",
      physicianAddress: "",
      physicianCity: "",
      physicianState: "",
      physicianZip: "",
      barriersToAdherence: [],
      physicalDisability: "",
      medicalCondition: "",
      substanceUse: "",
      mentalDisorder: "",
      otherBarriers: "",
    },
    labResults: {
      smear1Date: "",
      smear1Source: "",
      smear1Result: "",
      smear1Grade: "",
      smear2Date: "",
      smear2Source: "",
      smear2Result: "",
      smear2Grade: "",
      smear3Date: "",
      smear3Source: "",
      smear3Result: "",
      smear3Grade: "",
    },
    treatmentInfo: {
      therapyInitiatedDate: "",
      therapyInterrupted: false,
      interruptionReason: "",
      medications: {
        inh: { prescribed: false, dosage: "" },
        rif: { prescribed: false, dosage: "" },
        pza: { prescribed: false, dosage: "" },
        emb: { prescribed: false, dosage: "" },
        sm: { prescribed: false, dosage: "" },
        vitaminB6: { prescribed: false, dosage: "" },
        injectables: { prescribed: false, type: "" },
        other: { prescribed: false, type: "" },
      },
      frequency: "",
      centralLineInserted: false,
      daysOfMedicationSupplied: "",
      patientAgreedToDOT: false,
      formFilledByName: "",
      formFilledDate: "",
      responsiblePhysicianName: "",
      physicianLicenseNumber: "",
      physicianPhone: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/discharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
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
              facilityFloor: "",
              facilityCity: "",
              facilityState: "",
              facilityZip: "",
              medicalRecordNumber: "",
              dateOfAdmission: "",
              plannedDischargeDate: "",
              dischargedTo: "",
              dischargeAddress: "",
              dischargeApartment: "",
              dischargeCity: "",
              dischargeState: "",
              dischargeZip: "",
              dischargePhone: "",
              travelOutsideNYC: false,
              travelDateDestination: "",
            },
            followUp: {
              appointmentDate: "",
              physicianName: "",
              physicianPhone: "",
              physicianCell: "",
              physicianAddress: "",
              physicianCity: "",
              physicianState: "",
              physicianZip: "",
              barriersToAdherence: [],
              physicalDisability: "",
              medicalCondition: "",
              substanceUse: "",
              mentalDisorder: "",
              otherBarriers: "",
            },
            labResults: {
              smear1Date: "",
              smear1Source: "",
              smear1Result: "",
              smear1Grade: "",
              smear2Date: "",
              smear2Source: "",
              smear2Result: "",
              smear2Grade: "",
              smear3Date: "",
              smear3Source: "",
              smear3Result: "",
              smear3Grade: "",
            },
            treatmentInfo: {
              therapyInitiatedDate: "",
              therapyInterrupted: false,
              interruptionReason: "",
              medications: {
                inh: { prescribed: false, dosage: "" },
                rif: { prescribed: false, dosage: "" },
                pza: { prescribed: false, dosage: "" },
                emb: { prescribed: false, dosage: "" },
                sm: { prescribed: false, dosage: "" },
                vitaminB6: { prescribed: false, dosage: "" },
                injectables: { prescribed: false, type: "" },
                other: { prescribed: false, type: "" },
              },
              frequency: "",
              centralLineInserted: false,
              daysOfMedicationSupplied: "",
              patientAgreedToDOT: false,
              formFilledByName: "",
              formFilledDate: "",
              responsiblePhysicianName: "",
              physicianLicenseNumber: "",
              physicianPhone: "",
            },
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting discharge:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    const [section, field] = name.split('.');
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof PatientInfo],
        [field]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleNestedChange = (section: keyof PatientInfo, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleMedicationChange = (medication: string, field: 'prescribed' | 'dosage' | 'type', value: any) => {
    setFormData(prev => ({
      ...prev,
      treatmentInfo: {
        ...prev.treatmentInfo,
        medications: {
          ...prev.treatmentInfo.medications,
          [medication]: {
            ...prev.treatmentInfo.medications[medication as keyof typeof prev.treatmentInfo.medications],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleBarrierChange = (barrier: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      followUp: {
        ...prev.followUp,
        barriersToAdherence: checked
          ? [...prev.followUp.barriersToAdherence, barrier]
          : prev.followUp.barriersToAdherence.filter(b => b !== barrier),
      },
    }));
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Discharge Workflow Initiated!</h3>
        <p className="text-gray-600">Our AI agents are coordinating shelter placement, transport, and social worker assignment.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Discharge Approval Request Form</h2>
        <p className="text-gray-600">Complete this form in entirety to initiate the CareLink coordination workflow</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A: Patient Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <User className="w-6 h-6 mr-3 text-blue-500" />
            Section A: Patient Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input
                type="text"
                name="contactInfo.name"
                value={formData.contactInfo.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter patient's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel. # (1)</label>
              <input
                type="tel"
                name="contactInfo.phone1"
                value={formData.contactInfo.phone1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel. # (2)</label>
              <input
                type="tel"
                name="contactInfo.phone2"
                value={formData.contactInfo.phone2}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
              <input
                type="date"
                name="contactInfo.dateOfBirth"
                value={formData.contactInfo.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="contactInfo.address"
                value={formData.contactInfo.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apt.</label>
              <input
                type="text"
                name="contactInfo.apartment"
                value={formData.contactInfo.apartment}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Apt/Unit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="contactInfo.city"
                value={formData.contactInfo.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="contactInfo.state"
                value={formData.contactInfo.state}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
              <input
                type="text"
                name="contactInfo.zip"
                value={formData.contactInfo.zip}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ZIP code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                name="contactInfo.emergencyContactName"
                value={formData.contactInfo.emergencyContactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Patient</label>
              <input
                type="text"
                name="contactInfo.emergencyContactRelationship"
                value={formData.contactInfo.emergencyContactRelationship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Tel. #</label>
              <input
                type="tel"
                name="contactInfo.emergencyContactPhone"
                value={formData.contactInfo.emergencyContactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>
          </div>
        </div>

        {/* Section B: Discharge Information */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <Building className="w-6 h-6 mr-3 text-green-500" />
            Section B: Discharge Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discharging Facility</label>
              <input
                type="text"
                name="dischargeInfo.dischargingFacility"
                value={formData.dischargeInfo.dischargingFacility}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hospital name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discharging Facility Tel. #</label>
              <input
                type="tel"
                name="dischargeInfo.dischargingFacilityPhone"
                value={formData.dischargeInfo.dischargingFacilityPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="dischargeInfo.facilityAddress"
                value={formData.dischargeInfo.facilityAddress}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Facility address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fl.</label>
              <input
                type="text"
                name="dischargeInfo.facilityFloor"
                value={formData.dischargeInfo.facilityFloor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Floor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="dischargeInfo.facilityCity"
                value={formData.dischargeInfo.facilityCity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="dischargeInfo.facilityState"
                value={formData.dischargeInfo.facilityState}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
              <input
                type="text"
                name="dischargeInfo.facilityZip"
                value={formData.dischargeInfo.facilityZip}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ZIP code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Medical Record #</label>
              <input
                type="text"
                name="dischargeInfo.medicalRecordNumber"
                value={formData.dischargeInfo.medicalRecordNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Medical record number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Admission</label>
              <input
                type="date"
                name="dischargeInfo.dateOfAdmission"
                value={formData.dischargeInfo.dateOfAdmission}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Discharge Date</label>
              <input
                type="date"
                name="dischargeInfo.plannedDischargeDate"
                value={formData.dischargeInfo.plannedDischargeDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Discharged To</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="home"
                    checked={formData.dischargeInfo.dischargedTo === "home"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Home
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="shelter"
                    checked={formData.dischargeInfo.dischargedTo === "shelter"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Shelter
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="skilled_nursing"
                    checked={formData.dischargeInfo.dischargedTo === "skilled_nursing"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Skilled Nursing Facility
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="jail_prison"
                    checked={formData.dischargeInfo.dischargedTo === "jail_prison"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Jail/Prison
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="residential"
                    checked={formData.dischargeInfo.dischargedTo === "residential"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Residential Facility
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.dischargedTo"
                    value="other"
                    checked={formData.dischargeInfo.dischargedTo === "other"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Other Facility
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Facility</label>
              <input
                type="text"
                name="dischargeInfo.dischargeAddress"
                value={formData.dischargeInfo.dischargeAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Facility name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="dischargeInfo.dischargeAddress"
                value={formData.dischargeInfo.dischargeAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Facility address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apt./Fl.</label>
              <input
                type="text"
                name="dischargeInfo.dischargeApartment"
                value={formData.dischargeInfo.dischargeApartment}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Apt/Floor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="dischargeInfo.dischargeCity"
                value={formData.dischargeInfo.dischargeCity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="dischargeInfo.dischargeState"
                value={formData.dischargeInfo.dischargeState}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
              <input
                type="text"
                name="dischargeInfo.dischargeZip"
                value={formData.dischargeInfo.dischargeZip}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ZIP code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel. #</label>
              <input
                type="tel"
                name="dischargeInfo.dischargePhone"
                value={formData.dischargeInfo.dischargePhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Is patient scheduled to travel outside of NYC?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.travelOutsideNYC"
                    value="true"
                    checked={formData.dischargeInfo.travelOutsideNYC === true}
                    onChange={(e) => handleNestedChange('dischargeInfo', 'travelOutsideNYC', true)}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dischargeInfo.travelOutsideNYC"
                    value="false"
                    checked={formData.dischargeInfo.travelOutsideNYC === false}
                    onChange={(e) => handleNestedChange('dischargeInfo', 'travelOutsideNYC', false)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {formData.dischargeInfo.travelOutsideNYC && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, specify date/destination</label>
                  <input
                    type="text"
                    name="dischargeInfo.travelDateDestination"
                    value={formData.dischargeInfo.travelDateDestination}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Date and destination"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section C: Patient Follow-Up Appointment */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <Calendar className="w-6 h-6 mr-3 text-purple-500" />
            Section C: Patient Follow-Up Appointment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Follow-up Appointment Date</label>
              <input
                type="date"
                name="followUp.appointmentDate"
                value={formData.followUp.appointmentDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physician Assuming Care</label>
              <input
                type="text"
                name="followUp.physicianName"
                value={formData.followUp.physicianName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Physician name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel. #</label>
              <input
                type="tel"
                name="followUp.physicianPhone"
                value={formData.followUp.physicianPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cell. #</label>
              <input
                type="tel"
                name="followUp.physicianCell"
                value={formData.followUp.physicianCell}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="followUp.physicianAddress"
                value={formData.followUp.physicianAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Physician address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="followUp.physicianCity"
                value={formData.followUp.physicianCity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="followUp.physicianState"
                value={formData.followUp.physicianState}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
              <input
                type="text"
                name="followUp.physicianZip"
                value={formData.followUp.physicianZip}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ZIP code"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Potential Barriers to TB Therapy Adherence</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('none')}
                    onChange={(e) => handleBarrierChange('none', e.target.checked)}
                    className="mr-2"
                  />
                  None
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('adverse_reactions')}
                    onChange={(e) => handleBarrierChange('adverse_reactions', e.target.checked)}
                    className="mr-2"
                  />
                  Adverse Reactions
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('homelessness')}
                    onChange={(e) => handleBarrierChange('homelessness', e.target.checked)}
                    className="mr-2"
                  />
                  Homelessness
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('physical_disability')}
                    onChange={(e) => handleBarrierChange('physical_disability', e.target.checked)}
                    className="mr-2"
                  />
                  Physical Disability
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('medical_condition')}
                    onChange={(e) => handleBarrierChange('medical_condition', e.target.checked)}
                    className="mr-2"
                  />
                  Medical Condition
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('substance_use')}
                    onChange={(e) => handleBarrierChange('substance_use', e.target.checked)}
                    className="mr-2"
                  />
                  Substance Use
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('mental_disorder')}
                    onChange={(e) => handleBarrierChange('mental_disorder', e.target.checked)}
                    className="mr-2"
                  />
                  Mental Disorder
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUp.barriersToAdherence.includes('other')}
                    onChange={(e) => handleBarrierChange('other', e.target.checked)}
                    className="mr-2"
                  />
                  Other
                </label>
              </div>
            </div>

            {formData.followUp.barriersToAdherence.includes('physical_disability') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Disability (specify)</label>
                <input
                  type="text"
                  name="followUp.physicalDisability"
                  value={formData.followUp.physicalDisability}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specify physical disability"
                />
              </div>
            )}

            {formData.followUp.barriersToAdherence.includes('medical_condition') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Condition (specify)</label>
                <input
                  type="text"
                  name="followUp.medicalCondition"
                  value={formData.followUp.medicalCondition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specify medical condition"
                />
              </div>
            )}

            {formData.followUp.barriersToAdherence.includes('substance_use') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Substance Use (specify)</label>
                <input
                  type="text"
                  name="followUp.substanceUse"
                  value={formData.followUp.substanceUse}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specify substance use"
                />
              </div>
            )}

            {formData.followUp.barriersToAdherence.includes('mental_disorder') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mental Disorder (specify)</label>
                <input
                  type="text"
                  name="followUp.mentalDisorder"
                  value={formData.followUp.mentalDisorder}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specify mental disorder"
                />
              </div>
            )}

            {formData.followUp.barriersToAdherence.includes('other') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Other (specify)</label>
                <input
                  type="text"
                  name="followUp.otherBarriers"
                  value={formData.followUp.otherBarriers}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specify other barriers"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section D: Laboratory Results */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <TestTube className="w-6 h-6 mr-3 text-red-500" />
            Section D: Laboratory Results
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of AFB Smear 1</label>
                <input
                  type="date"
                  name="labResults.smear1Date"
                  value={formData.labResults.smear1Date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Source</label>
                <input
                  type="text"
                  name="labResults.smear1Source"
                  value={formData.labResults.smear1Source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sputum, BAL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AFB Smear Result</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear1Result"
                      value="positive"
                      checked={formData.labResults.smear1Result === "positive"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Positive
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear1Result"
                      value="negative"
                      checked={formData.labResults.smear1Result === "negative"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Negative
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (if positive)</label>
                <input
                  type="text"
                  name="labResults.smear1Grade"
                  value={formData.labResults.smear1Grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of AFB Smear 2</label>
                <input
                  type="date"
                  name="labResults.smear2Date"
                  value={formData.labResults.smear2Date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Source</label>
                <input
                  type="text"
                  name="labResults.smear2Source"
                  value={formData.labResults.smear2Source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sputum, BAL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AFB Smear Result</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear2Result"
                      value="positive"
                      checked={formData.labResults.smear2Result === "positive"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Positive
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear2Result"
                      value="negative"
                      checked={formData.labResults.smear2Result === "negative"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Negative
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (if positive)</label>
                <input
                  type="text"
                  name="labResults.smear2Grade"
                  value={formData.labResults.smear2Grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of AFB Smear 3</label>
                <input
                  type="date"
                  name="labResults.smear3Date"
                  value={formData.labResults.smear3Date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Source</label>
                <input
                  type="text"
                  name="labResults.smear3Source"
                  value={formData.labResults.smear3Source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sputum, BAL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AFB Smear Result</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear3Result"
                      value="positive"
                      checked={formData.labResults.smear3Result === "positive"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Positive
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="labResults.smear3Result"
                      value="negative"
                      checked={formData.labResults.smear3Result === "negative"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Negative
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (if positive)</label>
                <input
                  type="text"
                  name="labResults.smear3Grade"
                  value={formData.labResults.smear3Grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grade"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section E: Treatment Information */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <Pill className="w-6 h-6 mr-3 text-orange-500" />
            Section E: Treatment Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date TB Therapy Initiated</label>
              <input
                type="date"
                name="treatmentInfo.therapyInitiatedDate"
                value={formData.treatmentInfo.therapyInitiatedDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Interruption in Therapy?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.therapyInterrupted"
                    value="true"
                    checked={formData.treatmentInfo.therapyInterrupted === true}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'therapyInterrupted', true)}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.therapyInterrupted"
                    value="false"
                    checked={formData.treatmentInfo.therapyInterrupted === false}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'therapyInterrupted', false)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {formData.treatmentInfo.therapyInterrupted && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason and Duration of Interruption</label>
                  <input
                    type="text"
                    name="treatmentInfo.interruptionReason"
                    value={formData.treatmentInfo.interruptionReason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Specify reason and duration"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">TB Medications at Discharge</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.inh.prescribed}
                    onChange={(e) => handleMedicationChange('inh', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>INH</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.inh.dosage}
                    onChange={(e) => handleMedicationChange('inh', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.rif.prescribed}
                    onChange={(e) => handleMedicationChange('rif', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>RIF</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.rif.dosage}
                    onChange={(e) => handleMedicationChange('rif', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.pza.prescribed}
                    onChange={(e) => handleMedicationChange('pza', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>PZA</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.pza.dosage}
                    onChange={(e) => handleMedicationChange('pza', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.emb.prescribed}
                    onChange={(e) => handleMedicationChange('emb', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>EMB</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.emb.dosage}
                    onChange={(e) => handleMedicationChange('emb', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.sm.prescribed}
                    onChange={(e) => handleMedicationChange('sm', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>SM</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.sm.dosage}
                    onChange={(e) => handleMedicationChange('sm', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.vitaminB6.prescribed}
                    onChange={(e) => handleMedicationChange('vitaminB6', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Vitamin B6</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.vitaminB6.dosage}
                    onChange={(e) => handleMedicationChange('vitaminB6', 'dosage', e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="mg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.injectables.prescribed}
                    onChange={(e) => handleMedicationChange('injectables', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Injectables</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.injectables.type}
                    onChange={(e) => handleMedicationChange('injectables', 'type', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="specify"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.treatmentInfo.medications.other.prescribed}
                    onChange={(e) => handleMedicationChange('other', 'prescribed', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Other TB Meds</span>
                  <input
                    type="text"
                    value={formData.treatmentInfo.medications.other.type}
                    onChange={(e) => handleMedicationChange('other', 'type', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="specify"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Frequency</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.frequency"
                    value="daily"
                    checked={formData.treatmentInfo.frequency === "daily"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Daily
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.frequency"
                    value="2x_weekly"
                    checked={formData.treatmentInfo.frequency === "2x_weekly"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  2x Weekly
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.frequency"
                    value="3x_weekly"
                    checked={formData.treatmentInfo.frequency === "3x_weekly"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  3x Weekly
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.frequency"
                    value="other"
                    checked={formData.treatmentInfo.frequency === "other"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Other
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">Was a central line (i.e. PICC) inserted on the patient?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.centralLineInserted"
                    value="true"
                    checked={formData.treatmentInfo.centralLineInserted === true}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'centralLineInserted', true)}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.centralLineInserted"
                    value="false"
                    checked={formData.treatmentInfo.centralLineInserted === false}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'centralLineInserted', false)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days of Medications Supplied</label>
              <input
                type="text"
                name="treatmentInfo.daysOfMedicationSupplied"
                value={formData.treatmentInfo.daysOfMedicationSupplied}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of days"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Patient Agreed to DOT?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.patientAgreedToDOT"
                    value="true"
                    checked={formData.treatmentInfo.patientAgreedToDOT === true}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'patientAgreedToDOT', true)}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="treatmentInfo.patientAgreedToDOT"
                    value="false"
                    checked={formData.treatmentInfo.patientAgreedToDOT === false}
                    onChange={(e) => handleNestedChange('treatmentInfo', 'patientAgreedToDOT', false)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Print Name of Individual Filling Out This Form</label>
              <input
                type="text"
                name="treatmentInfo.formFilledByName"
                value={formData.treatmentInfo.formFilledByName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="treatmentInfo.formFilledDate"
                value={formData.treatmentInfo.formFilledDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Responsible Physician</label>
              <input
                type="text"
                name="treatmentInfo.responsiblePhysicianName"
                value={formData.treatmentInfo.responsiblePhysicianName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Physician name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License #</label>
              <input
                type="text"
                name="treatmentInfo.physicianLicenseNumber"
                value={formData.treatmentInfo.physicianLicenseNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="License number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel. #</label>
              <input
                type="tel"
                name="treatmentInfo.physicianPhone"
                value={formData.treatmentInfo.physicianPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(   )   -"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initiating Workflow...</span>
              </div>
            ) : (
              "Start Coordination Workflow"
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
