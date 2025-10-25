"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, User, Home, Truck, Phone } from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "pending";
  timestamp: string;
  description: string;
  icon: React.ReactNode;
}

export default function WorkflowTimeline() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/workflows");
      const data = await response.json();
      setWorkflows(data);
      if (data.length > 0) {
        setSelectedWorkflow(data[0]);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "discharge_initiated":
        return <User className="w-5 h-5" />;
      case "shelter_matched":
        return <Home className="w-5 h-5" />;
      case "transport_scheduled":
        return <Truck className="w-5 h-5" />;
      case "social_worker_assigned":
        return <Phone className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!selectedWorkflow) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Workflows</h3>
        <p className="text-gray-600">Create a new discharge intake to see workflow progress here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Workflow Timeline</h2>
        <p className="text-gray-600">Track the progress of patient discharge coordination</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Cases</h3>
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
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{workflow.patient.hospital}</p>
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(workflow.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedWorkflow.patient.name}
              </h3>
              <p className="text-gray-600">
                Case ID: {selectedWorkflow.case_id}
              </p>
            </div>

            <div className="space-y-4">
              {selectedWorkflow.timeline.map((step: any, index: number) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === "completed" ? "bg-green-100" : 
                      step.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      {getStepIcon(step.step)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {step.step.replace(/_/g, " ")}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(step.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Current Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedWorkflow.status)}`}>
                  {selectedWorkflow.current_step.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-gray-600">
                  Last updated: {new Date(selectedWorkflow.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
