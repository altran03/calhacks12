"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  Car,
  Home,
  Users,
  Package,
  Download,
  Printer,
  AlertCircle,
  Loader2
} from "lucide-react";

interface ServiceInfo {
  provider: string;
  address?: string;
  phone: string;
  services?: string[];
  accessibility?: boolean;
  bed_confirmed?: boolean;
  vehicle_type?: string;
  pickup_time?: string;
  accessibility_confirmed?: boolean;
  case_manager?: string;
  contact?: string;
  follow_up_scheduled?: boolean;
  food_vouchers?: number;
  hygiene_kit?: boolean;
  clothing?: string[];
  medical_equipment?: string[];
  special_notes: string;
}

interface ServicesProvided {
  shelter_services: ServiceInfo;
  transport_services: ServiceInfo;
  social_worker_services: ServiceInfo;
  resource_services: ServiceInfo;
}

interface FinalizedReport {
  case_id: string;
  patient_name: string;
  medical_condition: string;
  discharge_date: string;
  hospital: string;
  coordination_summary: {
    total_agents: number;
    agents_involved: string[];
    coordination_status: string;
    all_services_confirmed: boolean;
  };
  services_provided: ServicesProvided;
  care_provider_notes: string[];
  patient_notes: string[];
  emergency_contacts: Array<{
    service: string;
    contact: string;
    phone: string;
  }>;
  generated_at: string;
  generated_by: string;
}

interface FinalizedReportProps {
  caseId?: string;
}

const FinalizedReport: React.FC<FinalizedReportProps> = ({ caseId }) => {
  const [report, setReport] = useState<FinalizedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (currentCaseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/workflows/${currentCaseId}/finalized-report`);
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Workflow not yet completed. Please wait for coordination to finish.");
        } else if (response.status === 404) {
          throw new Error("Workflow not found. Please check the case ID.");
        } else {
          throw new Error(`Failed to fetch report: ${response.status}`);
        }
      }
      
      const data = await response.json();
      setReport(data.report);
    } catch (e: any) {
      console.error("Failed to fetch finalized report:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchReport(caseId);
    }
  }, [caseId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;
    
    const reportText = `
FINALIZED DISCHARGE REPORT
==========================

Case ID: ${report.case_id}
Patient: ${report.patient_name}
Medical Condition: ${report.medical_condition}
Discharge Date: ${report.discharge_date}
Hospital: ${report.hospital}

SERVICES PROVIDED:
==================

SHELTER SERVICES:
- Provider: ${report.services_provided.shelter_services.provider}
- Address: ${report.services_provided.shelter_services.address}
- Phone: ${report.services_provided.shelter_services.phone}
- Services: ${report.services_provided.shelter_services.services?.join(", ")}
- Accessibility: ${report.services_provided.shelter_services.accessibility ? "Yes" : "No"}
- Bed Confirmed: ${report.services_provided.shelter_services.bed_confirmed ? "Yes" : "No"}
- Notes: ${report.services_provided.shelter_services.special_notes}

TRANSPORT SERVICES:
- Provider: ${report.services_provided.transport_services.provider}
- Phone: ${report.services_provided.transport_services.phone}
- Vehicle Type: ${report.services_provided.transport_services.vehicle_type}
- Pickup Time: ${report.services_provided.transport_services.pickup_time}
- Accessibility: ${report.services_provided.transport_services.accessibility_confirmed ? "Yes" : "No"}
- Notes: ${report.services_provided.transport_services.special_notes}

SOCIAL WORKER SERVICES:
- Case Manager: ${report.services_provided.social_worker_services.case_manager}
- Contact: ${report.services_provided.social_worker_services.contact}
- Phone: ${report.services_provided.social_worker_services.phone}
- Follow-up Scheduled: ${report.services_provided.social_worker_services.follow_up_scheduled ? "Yes" : "No"}
- Notes: ${report.services_provided.social_worker_services.special_notes}

RESOURCE SERVICES:
- Food Vouchers: ${report.services_provided.resource_services.food_vouchers} days
- Hygiene Kit: ${report.services_provided.resource_services.hygiene_kit ? "Yes" : "No"}
- Clothing: ${report.services_provided.resource_services.clothing?.join(", ")}
- Medical Equipment: ${report.services_provided.resource_services.medical_equipment?.join(", ")}
- Notes: ${report.services_provided.resource_services.special_notes}

Generated: ${new Date(report.generated_at).toLocaleString()}
Generated by: ${report.generated_by}
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discharge-report-${report.case_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#0D7377] animate-spin" />
        <p className="text-lg font-medium" style={{ color: "#1A1D1E" }}>
          Generating finalized report...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <button 
          onClick={() => caseId && fetchReport(caseId)} 
          className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-[#6B7575]" />
        <p className="text-lg font-medium" style={{ color: "#1A1D1E" }}>
          No finalized report available.
        </p>
        <p className="text-sm mt-2" style={{ color: "#6B7575" }}>
          Complete a workflow to generate a finalized report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header */}
      <div className="text-center print:hidden">
        <h2 className="text-3xl font-bold mb-2" style={{ color: "#1A1D1E" }}>
          Finalized Discharge Report
        </h2>
        <p className="text-lg" style={{ color: "#6B7575" }}>
          Comprehensive service coordination summary
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 print:hidden">
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#14919B] transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:p-0">
        {/* Patient Information */}
        <div className="mb-8 print:mb-4">
          <h3 className="text-2xl font-bold mb-4" style={{ color: "#1A1D1E" }}>
            Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-[#0D7377]" />
              <div>
                <p className="text-sm text-gray-600">Patient Name</p>
                <p className="font-semibold">{report.patient_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#0D7377]" />
              <div>
                <p className="text-sm text-gray-600">Case ID</p>
                <p className="font-semibold">{report.case_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-[#0D7377]" />
              <div>
                <p className="text-sm text-gray-600">Medical Condition</p>
                <p className="font-semibold">{report.medical_condition}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-[#0D7377]" />
              <div>
                <p className="text-sm text-gray-600">Discharge Date</p>
                <p className="font-semibold">{report.discharge_date}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Provided */}
        <div className="mb-8 print:mb-4">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "#1A1D1E" }}>
            Services Provided
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shelter Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Home className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-bold text-green-800">Shelter Services</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Provider:</span>
                  <span>{report.services_provided.shelter_services.provider}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span>{report.services_provided.shelter_services.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>{report.services_provided.shelter_services.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Wheelchair Accessible: {report.services_provided.shelter_services.accessibility ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Bed Confirmed: {report.services_provided.shelter_services.bed_confirmed ? "Yes" : "No"}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Services:</strong> {report.services_provided.shelter_services.services?.join(", ")}
                </div>
                <div className="text-sm text-green-700 mt-2 p-2 bg-green-100 rounded">
                  <strong>Notes:</strong> {report.services_provided.shelter_services.special_notes}
                </div>
              </div>
            </motion.div>

            {/* Transport Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Car className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-bold text-blue-800">Transport Services</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Provider:</span>
                  <span>{report.services_provided.transport_services.provider}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>{report.services_provided.transport_services.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-gray-600" />
                  <span>Vehicle: {report.services_provided.transport_services.vehicle_type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>Pickup: {report.services_provided.transport_services.pickup_time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Accessible: {report.services_provided.transport_services.accessibility_confirmed ? "Yes" : "No"}</span>
                </div>
                <div className="text-sm text-blue-700 mt-2 p-2 bg-blue-100 rounded">
                  <strong>Notes:</strong> {report.services_provided.transport_services.special_notes}
                </div>
              </div>
            </motion.div>

            {/* Social Worker Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-purple-50 border border-purple-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-purple-600" />
                <h4 className="text-lg font-bold text-purple-800">Social Worker Services</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Case Manager:</span>
                  <span>{report.services_provided.social_worker_services.case_manager}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Contact:</span>
                  <span>{report.services_provided.social_worker_services.contact}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>{report.services_provided.social_worker_services.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Follow-up: {report.services_provided.social_worker_services.follow_up_scheduled ? "Scheduled" : "Not Scheduled"}</span>
                </div>
                <div className="text-sm text-purple-700 mt-2 p-2 bg-purple-100 rounded">
                  <strong>Notes:</strong> {report.services_provided.social_worker_services.special_notes}
                </div>
              </div>
            </motion.div>

            {/* Resource Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-6 h-6 text-orange-600" />
                <h4 className="text-lg font-bold text-orange-800">Resource Services</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Food Vouchers:</span>
                  <span>{report.services_provided.resource_services.food_vouchers} days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Hygiene Kit: {report.services_provided.resource_services.hygiene_kit ? "Provided" : "Not Provided"}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Clothing:</strong> {report.services_provided.resource_services.clothing?.join(", ")}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Medical Equipment:</strong> {report.services_provided.resource_services.medical_equipment?.join(", ")}
                </div>
                <div className="text-sm text-orange-700 mt-2 p-2 bg-orange-100 rounded">
                  <strong>Notes:</strong> {report.services_provided.resource_services.special_notes}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Coordination Summary */}
        <div className="mb-8 print:mb-4">
          <h3 className="text-2xl font-bold mb-4" style={{ color: "#1A1D1E" }}>
            Coordination Summary
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h4 className="text-lg font-bold text-green-800">All Services Confirmed</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-green-600">{report.coordination_summary.total_agents}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Coordination Status</p>
                <p className="text-lg font-semibold text-green-600 capitalize">{report.coordination_summary.coordination_status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Services Confirmed</p>
                <p className="text-lg font-semibold text-green-600">{report.coordination_summary.all_services_confirmed ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-8 print:mb-4">
          <h3 className="text-2xl font-bold mb-4" style={{ color: "#1A1D1E" }}>
            Important Notes
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-blue-800 mb-3">For Care Providers</h4>
              <ul className="space-y-2">
                {report.care_provider_notes.map((note, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-green-800 mb-3">For Patient</h4>
              <ul className="space-y-2">
                {report.patient_notes.map((note, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 print:pt-4">
          <div className="text-center text-sm text-gray-600">
            <p>Report generated on {new Date(report.generated_at).toLocaleString()}</p>
            <p>Generated by {report.generated_by}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizedReport;
