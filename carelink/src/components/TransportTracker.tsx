"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, MapPin, Clock, CheckCircle, Phone, Navigation } from "lucide-react";

interface TransportInfo {
  provider: string;
  vehicle_type: string;
  eta: string;
  route: Array<{ lat: number; lng: number }>;
  status: string;
}

export default function TransportTracker() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/workflows");
      const data = await response.json();
      setWorkflows(data.filter((w: any) => w.transport));
      if (data.length > 0) {
        setSelectedWorkflow(data[0]);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "en_route":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "arrived":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "en_route":
        return <Truck className="w-4 h-4" />;
      case "arrived":
        return <MapPin className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!selectedWorkflow || !selectedWorkflow.transport) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Transport</h3>
        <p className="text-gray-600">Transport information will appear here when a discharge workflow is initiated.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Transport Tracker</h2>
        <p className="text-gray-600">Monitor patient transportation in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transport List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Transports</h3>
          {workflows.map((workflow) => (
            <motion.div
              key={workflow.case_id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedWorkflow(workflow)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedWorkflow?.case_id === workflow.case_id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{workflow.patient.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.transport.status)}`}>
                  {workflow.transport.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{workflow.transport.provider}</p>
              <p className="text-xs text-gray-500 mt-1">
                ETA: {workflow.transport.eta}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transport Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedWorkflow.patient.name}
              </h3>
              <p className="text-gray-600">
                Transport to {selectedWorkflow.shelter?.name || "Shelter"}
              </p>
            </div>

            {/* Transport Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Transport Status</h4>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(selectedWorkflow.transport.status)}`}>
                  {getStatusIcon(selectedWorkflow.transport.status)}
                  <span className="text-sm font-medium">{selectedWorkflow.transport.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-900">Provider</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedWorkflow.transport.provider}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-900">ETA</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedWorkflow.transport.eta}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-gray-900">Vehicle Type</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedWorkflow.transport.vehicle_type}</p>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Route Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Pickup Location</p>
                    <p className="text-sm text-gray-600">{selectedWorkflow.patient.hospital}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Drop-off Location</p>
                    <p className="text-sm text-gray-600">
                      {selectedWorkflow.shelter?.name} - {selectedWorkflow.shelter?.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  Transport Provider: {selectedWorkflow.transport.provider}
                </span>
              </div>
              {selectedWorkflow.social_worker && (
                <div className="flex items-center space-x-2 mt-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    Social Worker: {selectedWorkflow.social_worker}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
