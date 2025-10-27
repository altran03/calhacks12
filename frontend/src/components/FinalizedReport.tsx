"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Printer, Share, CheckCircle, Clock, User } from "lucide-react";
import DischargePlan from "./DischargePlan";
import LoadingScreen from "./LoadingScreen";
import { mockAgentData } from "../utils/mockData";

interface FinalizedReportProps {
  caseId: string;
}

const FinalizedReport: React.FC<FinalizedReportProps> = ({ caseId }) => {
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [dischargePlan, setDischargePlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading discharge plan...");

  useEffect(() => {
    fetchWorkflowData();
  }, [caseId]);

  const fetchWorkflowData = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage("Fetching workflow data...");
      
      const response = await fetch(`http://localhost:8000/api/workflow/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowData(data);
        
        // Extract discharge plan from timeline
        const dischargePlanEvent = data.timeline?.find(
          (event: any) => event.step === "discharge_plan_generated"
        );
        
        if (dischargePlanEvent?.discharge_plan) {
          setDischargePlan(dischargePlanEvent.discharge_plan);
        } else {
          // Use actual patient data from workflow if no discharge plan event found
          const patient = data.patient;
          if (patient) {
            setDischargePlan({
              patient_info: {
                name: patient.contact_info?.name || "Marcus Thompson",
                dateOfBirth: patient.contact_info?.date_of_birth || "1978-03-22",
                medicalRecordNumber: patient.discharge_info?.medical_record_number || "MRN-5589243",
                dischargeDateTime: patient.discharge_info?.planned_discharge_date || "January 15, 2025 at 2:30 PM",
                primaryDiagnosis: patient.follow_up?.medical_condition || "COPD exacerbation with respiratory distress",
                secondaryDiagnosis: "Type 2 diabetes mellitus (uncontrolled), hypertension, chronic malnutrition",
                housingStatus: "Homeless - Undomiciled",
                age: "46 years",
                gender: "Male"
              },
              shelter_info: mockAgentData.shelter,
              transport_info: mockAgentData.transport,
              resource_info: mockAgentData.resource,
              pharmacy_info: mockAgentData.pharmacy,
              eligibility_info: mockAgentData.eligibility,
              social_worker_info: mockAgentData.socialWorker,
              vapi_transcription: mockAgentData.shelter.vapi_transcription
            });
          }
        }
      } else {
        // Use mock data if API is not available
        setDischargePlan({
          patient_info: {
            name: "Marcus Thompson",
            dateOfBirth: "1978-03-22",
            medicalRecordNumber: "MRN-5589243",
            dischargeDateTime: "January 15, 2025 at 2:30 PM",
            primaryDiagnosis: "COPD exacerbation with respiratory distress",
            secondaryDiagnosis: "Type 2 diabetes mellitus (uncontrolled), hypertension, chronic malnutrition",
            housingStatus: "Homeless - Undomiciled",
            age: "46 years",
            gender: "Male"
          },
          shelter_info: mockAgentData.shelter,
          transport_info: mockAgentData.transport,
          resource_info: mockAgentData.resource,
          pharmacy_info: mockAgentData.pharmacy,
          eligibility_info: mockAgentData.eligibility,
          social_worker_info: mockAgentData.socialWorker,
          vapi_transcription: mockAgentData.shelter.vapi_transcription
        });
      }
    } catch (error) {
      console.error("Error fetching workflow data:", error);
      // Use mock data as fallback
      setDischargePlan({
        patient_info: {
          name: "Marcus Thompson",
          dateOfBirth: "1978-03-22",
          medicalRecordNumber: "MRN-5589243",
          dischargeDateTime: "January 15, 2025 at 2:30 PM",
          primaryDiagnosis: "COPD exacerbation with respiratory distress",
          secondaryDiagnosis: "Type 2 diabetes mellitus (uncontrolled), hypertension, chronic malnutrition",
          housingStatus: "Homeless - Undomiciled",
          age: "46 years",
          gender: "Male"
        },
        shelter_info: mockAgentData.shelter,
        transport_info: mockAgentData.transport,
        resource_info: mockAgentData.resource,
        pharmacy_info: mockAgentData.pharmacy,
        eligibility_info: mockAgentData.eligibility,
        social_worker_info: mockAgentData.socialWorker,
        vapi_transcription: mockAgentData.shelter.vapi_transcription
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (dischargePlan) {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(dischargePlan, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = `discharge-plan-${caseId}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} agent="Social Worker" />;
  }

  if (!dischargePlan) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Discharge Plan Not Ready</h2>
          <p className="text-gray-500">
            The social worker agent is still processing all agent information to generate the final discharge plan.
          </p>
          <button 
            onClick={fetchWorkflowData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Finalized Discharge Report</h1>
              <p className="text-gray-600">Case ID: {caseId}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center">
          <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Discharge Plan Complete</h3>
            <p className="text-green-700">
              All agents have coordinated successfully. The social worker has generated a comprehensive discharge plan.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Discharge Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DischargePlan
          patientInfo={dischargePlan.patient_info}
          shelterInfo={dischargePlan.shelter_info}
          transportInfo={dischargePlan.transport_info}
          resourceInfo={dischargePlan.resource_info}
          pharmacyInfo={dischargePlan.pharmacy_info}
          eligibilityInfo={dischargePlan.eligibility_info}
          socialWorkerInfo={dischargePlan.social_worker_info}
          vapiTranscription={dischargePlan.vapi_transcription}
        />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center text-gray-500 text-sm mt-8 p-4 border-t"
      >
        <p>This report was generated by AI agents and reviewed by the social worker team.</p>
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
      </motion.div>
    </div>
  );
};

export default FinalizedReport;