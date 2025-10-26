"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  FileText,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Phone,
  Home,
  Car,
  Users,
  Package,
  MapPin,
  Trash2
} from "lucide-react";

interface Workflow {
  case_id: string;
  patient: {
    contact_info: {
      name: string;
      phone1?: string;
    };
    discharge_info: {
      discharging_facility: string;
      planned_discharge_date?: string;
    };
    follow_up: {
      medical_condition?: string;
      physical_disability?: string;
    };
  };
  status: string;
  current_step: string;
  timeline: Array<{
    step: string;
    status: string;
    description: string;
    logs: string[];
    agent?: string;
    timestamp: string;
  }>;
  shelter?: {
    name: string;
    address: string;
    phone: string;
    available_beds: number;
    accessibility: boolean;
  };
  transport?: {
    provider: string;
    vehicle_type: string;
    eta: string;
    status: string;
  };
  social_worker?: string;
  created_at: string;
  updated_at: string;
}

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
        setError(null);
      } else {
        setError('Failed to fetch workflows');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'coordinated':
      case 'completed':
        return {
          icon: CheckCircle,
          color: '#10B981',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Completed'
        };
      case 'in_progress':
      case 'initiated':
        return {
          icon: Loader2,
          color: '#3B82F6',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'In Progress'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: '#EF4444',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Error'
        };
      default:
        return {
          icon: Clock,
          color: '#6B7280',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Pending'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleWorkflowExpansion = (caseId: string) => {
    setExpandedWorkflow(expandedWorkflow === caseId ? null : caseId);
  };

  const deleteWorkflow = async (caseId: string) => {
    if (!confirm(`Are you sure you want to delete workflow ${caseId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${caseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setWorkflows(workflows.filter(w => w.case_id !== caseId));
        console.log(`Workflow ${caseId} deleted successfully`);
      } else {
        const error = await response.json();
        console.error('Error deleting workflow:', error);
        alert(`Failed to delete workflow: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0D7377' }} />
        <span className="ml-3 text-lg" style={{ color: '#6B7575' }}>Loading workflows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <button
          onClick={fetchWorkflows}
          className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: '#0D7377', opacity: 0.3 }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1D1E' }}>
          No Active Workflows
        </h3>
        <p className="text-base mb-6" style={{ color: '#6B7575' }}>
          Start a new discharge workflow from the Patient Intake tab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 
            className="text-3xl font-bold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            Agent Workflows
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6B7575' }}>
            {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'} found
          </p>
        </div>
        <button
          onClick={fetchWorkflows}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" style={{ color: '#0D7377' }} />
          <span className="text-sm font-medium" style={{ color: '#0D7377' }}>Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map((workflow, index) => {
          const statusConfig = getStatusConfig(workflow.status);
          const StatusIcon = statusConfig.icon;
          const isAnimating = workflow.status === 'in_progress' || workflow.status === 'initiated';
          const isExpanded = expandedWorkflow === workflow.case_id;

          return (
            <motion.div
              key={workflow.case_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div
                className="p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderColor: '#E0D5C7'
                }}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleWorkflowExpansion(workflow.case_id)}
                  >
                    {/* Case ID and Status */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" style={{ color: '#0D7377' }} />
                        <span className="font-mono text-sm font-semibold" style={{ color: '#1A1D1E' }}>
                          {workflow.case_id}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}>
                        <StatusIcon 
                          className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`}
                          style={{ color: statusConfig.color }}
                        />
                        <span className="text-xs font-medium" style={{ color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" style={{ color: '#6B7575' }} />
                        <span className="text-sm font-medium" style={{ color: '#1A1D1E' }}>
                          {workflow.patient.contact_info.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" style={{ color: '#6B7575' }} />
                        <span className="text-sm" style={{ color: '#6B7575' }}>
                          {workflow.patient.discharge_info.discharging_facility}
                        </span>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center space-x-4 text-xs" style={{ color: '#6B7575' }}>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Created: {formatDate(workflow.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {formatDate(workflow.updated_at)}</span>
                      </div>
                    </div>

                    {/* Current Step */}
                    {workflow.current_step && (
                      <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(13, 115, 119, 0.05)' }}>
                        <span className="text-xs font-medium" style={{ color: '#0D7377' }}>
                          Current Step: {workflow.current_step.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(workflow.case_id);
                      }}
                      className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                    </button>
                    
                    {/* Expand Button */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
                         style={{
                           background: 'linear-gradient(135deg, #0D7377, #14919B)',
                           opacity: 0.9
                         }}>
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-white" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Workflow Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 rounded-2xl border-2 overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#E0D5C7'
                    }}
                  >
                    <div className="p-6 space-y-6">
                      {/* Patient Information */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h4 className="text-lg font-bold mb-3" style={{ color: '#1A1D1E' }}>
                          Patient Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center space-x-2"
                          >
                            <User className="w-4 h-4 text-[#6B7575]" />
                            <span><strong>Name:</strong> {workflow.patient.contact_info.name}</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center space-x-2"
                          >
                            <Phone className="w-4 h-4 text-[#6B7575]" />
                            <span><strong>Phone:</strong> {workflow.patient.contact_info.phone1 || "Not provided"}</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center space-x-2"
                          >
                            <AlertCircle className="w-4 h-4 text-[#6B7575]" />
                            <span><strong>Condition:</strong> {workflow.patient.follow_up.medical_condition || "Not specified"}</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center space-x-2"
                          >
                            <Calendar className="w-4 h-4 text-[#6B7575]" />
                            <span><strong>Discharge:</strong> {workflow.patient.discharge_info.planned_discharge_date || "TBD"}</span>
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Assigned Services */}
                      {(workflow.shelter || workflow.transport || workflow.social_worker) && (
                        <div>
                          <h4 className="text-lg font-bold mb-3" style={{ color: '#1A1D1E' }}>
                            Assigned Services
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {workflow.shelter && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0, duration: 0.5, ease: "easeOut" }}
                                className="bg-green-50 border border-green-200 rounded-xl p-4"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Home className="w-5 h-5 text-green-600" />
                                  <span className="font-semibold text-green-800">Shelter</span>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div><strong>Name:</strong> {workflow.shelter.name}</div>
                                  <div><strong>Address:</strong> {workflow.shelter.address}</div>
                                  <div><strong>Phone:</strong> {workflow.shelter.phone}</div>
                                  <div><strong>Beds:</strong> {workflow.shelter.available_beds}</div>
                                  <div><strong>Accessible:</strong> {workflow.shelter.accessibility ? "Yes" : "No"}</div>
                                </div>
                              </motion.div>
                            )}
                            
                            {workflow.transport && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Car className="w-5 h-5 text-blue-600" />
                                  <span className="font-semibold text-blue-800">Transport</span>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div><strong>Provider:</strong> {workflow.transport.provider}</div>
                                  <div><strong>Vehicle:</strong> {workflow.transport.vehicle_type}</div>
                                  <div><strong>ETA:</strong> {workflow.transport.eta}</div>
                                  <div><strong>Status:</strong> {workflow.transport.status}</div>
                                </div>
                              </motion.div>
                            )}
                            
                            {workflow.social_worker && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                                className="bg-purple-50 border border-purple-200 rounded-xl p-4"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Users className="w-5 h-5 text-purple-600" />
                                  <span className="font-semibold text-purple-800">Social Worker</span>
                                </div>
                                <div className="text-sm">
                                  <div><strong>Assigned:</strong> {workflow.social_worker}</div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {workflow.timeline && workflow.timeline.length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold mb-3" style={{ color: '#1A1D1E' }}>
                            Agent Timeline
                          </h4>
                          <div className="space-y-3">
                            <AnimatePresence>
                              {workflow.timeline.map((event, eventIndex) => (
                                <motion.div
                                  key={`${event.step}-${eventIndex}`}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                  transition={{
                                    delay: eventIndex * 0.15,
                                    duration: 0.4,
                                    ease: "easeOut"
                                  }}
                                  className="bg-white border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-gray-700">
                                        {event.step.replace('_', ' ').toUpperCase()}
                                      </span>
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        event.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        event.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {event.status}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {event.agent && (
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                          {event.agent.replace('_', ' ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                  {event.logs && event.logs.length > 0 && (
                                    <div className="text-xs text-gray-500 space-y-1">
                                      {event.logs.slice(0, 3).map((log, logIndex) => (
                                        <motion.div 
                                          key={logIndex} 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: eventIndex * 0.15 + logIndex * 0.1 }}
                                          className="flex items-start space-x-2"
                                        >
                                          <span className="text-gray-400 mt-1">•</span>
                                          <span>{log}</span>
                                        </motion.div>
                                      ))}
                                      {event.logs.length > 3 && (
                                        <div className="text-gray-400 italic">
                                          ... and {event.logs.length - 3} more logs
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

