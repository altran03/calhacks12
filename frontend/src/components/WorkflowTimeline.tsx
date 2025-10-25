"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Truck, 
  Home, 
  Users, 
  MessageSquare,
  Activity,
  Zap,
  Brain,
  Network,
  ShoppingBag,
  Pill,
  FileCheck,
  BarChart3,
  FileText,
  Sparkles,
  Radio,
  Phone,
  MapPin,
  ArrowRight
} from "lucide-react";

interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "transcription";
  transcription?: {
    speaker: string;
    text: string;
    duration?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  type: "ParserAgent" | "HospitalAgent" | "CoordinatorAgent" | "SocialWorkerAgent" | "ShelterAgent" | "TransportAgent" | "ResourceAgent" | "PharmacyAgent" | "EligibilityAgent" | "AnalyticsAgent";
  status: "idle" | "working" | "completed" | "error";
  currentTask: string;
  progress: number;
  lastActivity: string;
  logs: AgentLog[];
  connections: string[]; // IDs of agents this agent communicates with
}

const WorkflowTimeline: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [caseId, setCaseId] = useState<string>("");
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<number>(0); // 0: Parser→Hospital→Coordinator, 1: Shelter+Social, 2: Transport, 3: Others
  const [globalLogs, setGlobalLogs] = useState<Array<AgentLog & { agentName: string; agentColor: string }>>([]);

  useEffect(() => {
    // Get current case ID from localStorage
    const storedCaseId = localStorage.getItem('current_case_id');
    if (storedCaseId) {
      setCaseId(storedCaseId);
    }
    
    initializeAgents();
    
    // Start polling for real workflow data
    const pollInterval = setInterval(() => {
      if (storedCaseId) {
        const isSubmitted = localStorage.getItem(`case_submitted_${storedCaseId}`);
        if (isSubmitted === 'true') {
          fetchWorkflowData(storedCaseId);
        }
      }
    }, 2000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchWorkflowData = async (currentCaseId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${currentCaseId}`);
      if (response.ok) {
        const workflow = await response.json();
        
        if (workflow) {
          console.log("📊 Workflow data received:", workflow);
          setWorkflowData(workflow);
          updateAgentsFromWorkflow(workflow);
        }
      }
    } catch (error) {
      console.log("Workflow data not yet available:", error);
    }
  };

  const initializeAgents = () => {
    const initialAgents: Agent[] = [
      {
        id: "parser",
        name: "Parser Agent",
        type: "ParserAgent",
        status: "idle",
        currentTask: "Ready to parse discharge documents",
        progress: 0,
        lastActivity: "Waiting for document upload",
        logs: [],
        connections: ["hospital"]
      },
      {
        id: "hospital",
        name: "Hospital Agent",
        type: "HospitalAgent",
        status: "idle",
        currentTask: "Awaiting discharge request",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "coordinator",
        name: "Coordinator Agent",
        type: "CoordinatorAgent",
        status: "idle",
        currentTask: "Ready to orchestrate workflow",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["shelter", "social", "transport", "resource", "pharmacy", "eligibility"]
      },
      {
        id: "shelter",
        name: "Shelter Agent",
        type: "ShelterAgent",
        status: "idle",
        currentTask: "Ready to find shelter",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "social",
        name: "Social Worker Agent",
        type: "SocialWorkerAgent",
        status: "idle",
        currentTask: "Ready to assign case manager",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "transport",
        name: "Transport Agent",
        type: "TransportAgent",
        status: "idle",
        currentTask: "Ready to arrange transport",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "resource",
        name: "Resource Agent",
        type: "ResourceAgent",
        status: "idle",
        currentTask: "Ready to coordinate resources",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "pharmacy",
        name: "Pharmacy Agent",
        type: "PharmacyAgent",
        status: "idle",
        currentTask: "Ready to coordinate medications",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "eligibility",
        name: "Eligibility Agent",
        type: "EligibilityAgent",
        status: "idle",
        currentTask: "Ready to verify benefits",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: ["coordinator"]
      },
      {
        id: "analytics",
        name: "Analytics Agent",
        type: "AnalyticsAgent",
        status: "idle",
        currentTask: "Ready to collect metrics",
        progress: 0,
        lastActivity: "Waiting",
        logs: [],
        connections: []
      }
    ];
    setAgents(initialAgents);
  };

  const updateAgentsFromWorkflow = (workflow: any) => {
    setAgents(prevAgents => {
      const updatedAgents = [...prevAgents];
      const newGlobalLogs: Array<AgentLog & { agentName: string; agentColor: string }> = [];
      
      workflow.timeline?.forEach((timelineItem: any) => {
        const agentId = getAgentIdFromStep(timelineItem.step);
        const agentIndex = updatedAgents.findIndex(a => a.id === agentId);
        
        if (agentIndex !== -1) {
          const agent = updatedAgents[agentIndex];
          const status = timelineItem.status === "completed" ? "completed" : 
                        timelineItem.status === "in_progress" ? "working" : "idle";
          
          const colors = getAgentColor(agent.type, status as any);
          
          // Convert logs array to AgentLog format
          const logs: AgentLog[] = (timelineItem.logs || []).map((log: string, idx: number) => {
            const isTranscription = log.includes("🎙️ TRANSCRIPTION");
            const logEntry: AgentLog = {
              id: `${agentId}-log-${idx}-${Date.now()}`,
              timestamp: timelineItem.timestamp || new Date().toISOString(),
              message: log,
              type: isTranscription ? "transcription" : log.includes("✅") ? "success" : log.includes("❌") ? "error" : "info"
            };
            
            // Parse transcription if present
            if (isTranscription) {
              const transcriptionMatch = log.match(/🎙️ TRANSCRIPTION - ([^:]+): '([^']+)'/);
              if (transcriptionMatch) {
                logEntry.transcription = {
                  speaker: transcriptionMatch[1],
                  text: transcriptionMatch[2]
                };
              }
            }
            
            // Add to global logs
            newGlobalLogs.push({
              ...logEntry,
              agentName: agent.name,
              agentColor: colors.border
            });
            
            return logEntry;
          });
          
          updatedAgents[agentIndex] = {
            ...updatedAgents[agentIndex],
            status: status as any,
            currentTask: timelineItem.description || updatedAgents[agentIndex].currentTask,
            progress: status === "completed" ? 100 : status === "working" ? 65 : 0,
            lastActivity: timelineItem.timestamp ? new Date(timelineItem.timestamp).toLocaleTimeString() : "Just now",
            logs: logs
          };
        }
      });
      
      // Update global logs
      if (newGlobalLogs.length > 0) {
        setGlobalLogs(prev => {
          // Merge and deduplicate logs
          const combined = [...prev, ...newGlobalLogs];
          const uniqueLogs = Array.from(new Map(combined.map(log => [log.id, log])).values());
          // Sort by timestamp (newest first)
          return uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      }
      
      return updatedAgents;
    });
  };

  const getAgentIdFromStep = (step: string): string => {
    const mapping: Record<string, string> = {
      "discharge_initiated": "hospital",
      "parser_processing": "parser",
      "hospital_validation": "hospital",
      "coordinator_initiated": "coordinator",
      "intake_received": "hospital",
      "coordinator_notified": "coordinator",
      "shelter_search": "shelter",
      "shelter_confirmed": "shelter",
      "transport_requested": "transport",
      "transport_scheduled": "transport",
      "social_worker_assigned": "social",
      "resources_confirmed": "resource",
      "pharmacy_notified": "pharmacy",
      "eligibility_checked": "eligibility",
      "workflow_complete": "coordinator"
    };
    return mapping[step] || "coordinator";
  };

  const getAgentIcon = (type: Agent["type"]) => {
    const iconProps = { className: "w-5 h-5" };
    switch (type) {
      case "ParserAgent": return <FileText {...iconProps} />;
      case "HospitalAgent": return <Activity {...iconProps} />;
      case "CoordinatorAgent": return <Network {...iconProps} />;
      case "SocialWorkerAgent": return <Users {...iconProps} />;
      case "ShelterAgent": return <Home {...iconProps} />;
      case "TransportAgent": return <Truck {...iconProps} />;
      case "ResourceAgent": return <ShoppingBag {...iconProps} />;
      case "PharmacyAgent": return <Pill {...iconProps} />;
      case "EligibilityAgent": return <FileCheck {...iconProps} />;
      case "AnalyticsAgent": return <BarChart3 {...iconProps} />;
      default: return <Brain {...iconProps} />;
    }
  };

  const getAgentColor = (type: Agent["type"], status: Agent["status"]) => {
    const agentColors: Record<Agent["type"], { bg: string; border: string; text: string; glow: string }> = {
      "ParserAgent": { 
        bg: "rgba(139, 92, 246, 0.1)", 
        border: "#8B5CF6", 
        text: "#6B21A8",
        glow: "rgba(139, 92, 246, 0.2)"
      },
      "HospitalAgent": { 
        bg: "rgba(13, 115, 119, 0.1)", 
        border: "#0D7377", 
        text: "#094A4D",
        glow: "rgba(13, 115, 119, 0.2)"
      },
      "CoordinatorAgent": { 
        bg: "rgba(234, 88, 12, 0.1)", 
        border: "#EA580C", 
        text: "#9A3412",
        glow: "rgba(234, 88, 12, 0.2)"
      },
      "SocialWorkerAgent": { 
        bg: "rgba(209, 122, 92, 0.1)", 
        border: "#D17A5C", 
        text: "#8B4513",
        glow: "rgba(209, 122, 92, 0.2)"
      },
      "ShelterAgent": { 
        bg: "rgba(45, 159, 126, 0.1)", 
        border: "#2D9F7E", 
        text: "#1A5F4A",
        glow: "rgba(45, 159, 126, 0.2)"
      },
      "TransportAgent": { 
        bg: "rgba(59, 130, 246, 0.1)", 
        border: "#3B82F6", 
        text: "#1E40AF",
        glow: "rgba(59, 130, 246, 0.2)"
      },
      "ResourceAgent": { 
        bg: "rgba(232, 168, 124, 0.1)", 
        border: "#E8A87C", 
        text: "#8B5A3C",
        glow: "rgba(232, 168, 124, 0.2)"
      },
      "PharmacyAgent": { 
        bg: "rgba(16, 185, 129, 0.1)", 
        border: "#10B981", 
        text: "#065F46",
        glow: "rgba(16, 185, 129, 0.2)"
      },
      "EligibilityAgent": { 
        bg: "rgba(99, 102, 241, 0.1)", 
        border: "#6366F1", 
        text: "#3730A3",
        glow: "rgba(99, 102, 241, 0.2)"
      },
      "AnalyticsAgent": { 
        bg: "rgba(168, 85, 247, 0.1)", 
        border: "#A855F7", 
        text: "#6B21A8",
        glow: "rgba(168, 85, 247, 0.2)"
      },
    };

    const baseColors = agentColors[type];
    
    if (status === "idle") {
      return {
        ...baseColors,
        bg: baseColors.bg.replace("0.1", "0.05"),
        border: baseColors.border + "60",
        text: "#6B7575"
      };
    } else if (status === "error") {
      return {
        bg: "rgba(200, 92, 92, 0.1)",
        border: "#C85C5C",
        text: "#8B3A3A",
        glow: "rgba(200, 92, 92, 0.2)"
      };
    }
    
    return baseColors;
  };

  // Define agent phases for sequential execution
  const agentPhases = [
    {
      id: 0,
      name: "Initial Processing",
      agents: ["parser", "hospital", "coordinator"],
      description: "Document parsing and workflow initialization"
    },
    {
      id: 1,
      name: "Shelter & Social Services",
      agents: ["shelter", "social"],
      description: "Finding shelter and assigning case manager"
    },
    {
      id: 2,
      name: "Transportation",
      agents: ["transport"],
      description: "Arranging wheelchair-accessible transport"
    },
    {
      id: 3,
      name: "Additional Services",
      agents: ["resource", "pharmacy", "eligibility", "analytics"],
      description: "Resource coordination and benefit verification"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8 text-[#D17A5C]" />
          <h2 
            className="text-4xl font-bold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            Multi-Agent Orchestration
          </h2>
        </div>
        <p className="text-lg" style={{ color: '#6B7575' }}>
          Watch AI agents coordinate in real-time to ensure seamless patient care transitions
        </p>
      </motion.div>

      {/* Active Case Banner */}
      {workflowData && workflowData.patient ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(13, 115, 119, 0.1), rgba(45, 159, 126, 0.1))',
            border: '2px solid #0D7377',
            boxShadow: '0 4px 16px rgba(13, 115, 119, 0.15)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-[#2D9F7E]"
                />
                <h3 className="text-lg font-semibold" style={{ color: '#0D7377', fontFamily: 'Crimson Pro, serif' }}>
                  Active Case: {workflowData.case_id}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p style={{ color: '#6B7575' }}>Patient</p>
                  <p className="font-semibold" style={{ color: '#1A1D1E' }}>
                    {workflowData.patient.contact_info?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6B7575' }}>Hospital</p>
                  <p className="font-semibold" style={{ color: '#1A1D1E' }}>
                    {workflowData.patient.discharge_info?.discharging_facility || "N/A"}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6B7575' }}>Status</p>
                  <p className="font-semibold capitalize" style={{ color: '#2D9F7E' }}>
                    {workflowData.status}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6B7575' }}>Current Step</p>
                  <p className="font-semibold capitalize" style={{ color: '#1A1D1E' }}>
                    {workflowData.current_step?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(224, 213, 199, 0.3)',
            border: '1px solid #E0D5C7',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Clock className="w-12 h-12 mx-auto mb-3 text-[#6B7575] opacity-50" />
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            No Active Workflow
          </h3>
          <p className="text-sm" style={{ color: '#6B7575' }}>
            Submit a discharge form on the <strong>Patient Intake</strong> tab to start agent coordination
          </p>
        </motion.div>
      )}

      {/* Global Activity Log - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-3xl p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #0D7377',
          boxShadow: '0 8px 32px rgba(13, 115, 119, 0.12)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="p-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0D7377, #14919B)' }}
            >
              <Activity className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 
                className="text-xl font-semibold"
                style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
              >
                Live Activity Feed
              </h3>
              <p className="text-sm" style={{ color: '#6B7575' }}>
                Real-time logs from all agents
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#2D9F7E]"
            />
            <span className="text-xs font-medium" style={{ color: '#2D9F7E' }}>
              Live
            </span>
          </div>
        </div>

        {/* Log entries with animations */}
        <div 
          className="space-y-2 max-h-96 overflow-y-auto pr-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#0D7377 rgba(224, 213, 199, 0.3)'
          }}
        >
          {globalLogs.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-16 h-16 mx-auto mb-4 text-[#6B7575] opacity-20" />
              <p className="text-sm" style={{ color: '#6B7575' }}>
                Waiting for agent activity...
              </p>
              <p className="text-xs mt-2" style={{ color: '#6B7575' }}>
                Submit a discharge form to see agents in action
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {globalLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className="rounded-xl p-4 transition-all duration-300 hover:shadow-md"
                  style={{
                    background: log.type === "transcription" 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.03))'
                      : log.type === "success"
                      ? 'linear-gradient(135deg, rgba(45, 159, 126, 0.08), rgba(45, 159, 126, 0.03))'
                      : log.type === "error"
                      ? 'linear-gradient(135deg, rgba(200, 92, 92, 0.08), rgba(200, 92, 92, 0.03))'
                      : 'rgba(13, 115, 119, 0.03)',
                    border: `1px solid ${
                      log.type === "transcription" ? '#8B5CF6' :
                      log.type === "success" ? '#2D9F7E' :
                      log.type === "error" ? '#C85C5C' :
                      '#E0D5C7'
                    }`,
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      {/* Agent badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ 
                          background: `${log.agentColor}20`,
                          color: log.agentColor
                        }}
                      >
                        {log.agentName}
                      </motion.div>
                      
                      {/* Type indicator */}
                      {log.type === "transcription" && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Phone className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                        </motion.div>
                      )}
                      {log.type === "success" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          <CheckCircle className="w-4 h-4" style={{ color: '#2D9F7E' }} />
                        </motion.div>
                      )}
                      {log.type === "error" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ delay: 0.2 }}
                        >
                          <XCircle className="w-4 h-4" style={{ color: '#C85C5C' }} />
                        </motion.div>
                      )}
                    </div>
                    
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs font-medium"
                      style={{ color: '#6B7575' }}
                    >
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </motion.span>
                  </div>
                  
                  {/* Log content with staggered animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {log.transcription ? (
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <Users className="w-4 h-4 mt-0.5" style={{ color: '#8B5CF6' }} />
                          <div className="flex-1">
                            <span className="text-sm font-semibold" style={{ color: '#1A1D1E' }}>
                              {log.transcription.speaker}
                            </span>
                            {log.transcription.duration && (
                              <span className="text-xs ml-2" style={{ color: '#6B7575' }}>
                                ({log.transcription.duration})
                              </span>
                            )}
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-sm mt-1 italic"
                              style={{ color: '#1A1D1E' }}
                            >
                              "{log.transcription.text}"
                            </motion.p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: '#1A1D1E' }}>
                        {log.message}
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {globalLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 pt-4 border-t border-gray-200 text-center"
          >
            <p className="text-xs" style={{ color: '#6B7575' }}>
              💡 Click on any agent pill below to view individual agent logs
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Agent Workflow Visualization */}
      <div className="grid grid-cols-1 gap-8">
        {/* Sequential Agent Phases */}
        {agentPhases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: phaseIndex * 0.1 }}
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E0D5C7',
              boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)'
            }}
          >
            {/* Phase Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: `linear-gradient(135deg, #0D7377, #14919B)` }}
                >
                  {phaseIndex + 1}
                </div>
                <div>
              <h3 
                className="text-xl font-semibold"
                style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
              >
                    {phase.name}
              </h3>
                  <p className="text-sm" style={{ color: '#6B7575' }}>
                    {phase.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Agents in this phase */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.filter(agent => phase.agents.includes(agent.id)).map((agent, agentIndex) => {
                  const colors = getAgentColor(agent.type, agent.status);
                  
                  return (
                    <motion.div
                      key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: agentIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-5 cursor-pointer transition-all duration-300"
                      style={{
                        background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      boxShadow: agent.status === "working" ? `0 4px 16px ${colors.glow}` : '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div 
                            className="p-2 rounded-xl"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.9)',
                              color: colors.border
                            }}
                          >
                              {getAgentIcon(agent.type)}
                          </div>
                          <div>
                            <h4 
                              className="font-semibold text-sm mb-1"
                              style={{ color: colors.text }}
                            >
                              {agent.name}
                            </h4>
                            <p className="text-xs" style={{ color: '#6B7575' }}>
                              {agent.currentTask}
                            </p>
                          </div>
                        </div>
                        
                        {agent.status === "working" && (
                          <motion.div
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap className="w-4 h-4" style={{ color: colors.border }} />
                          </motion.div>
                        )}
                        {agent.status === "completed" && (
                        <CheckCircle className="w-5 h-5" style={{ color: colors.border }} />
                        )}
                      </div>
                      
                      {agent.status === "working" && (
                        <div>
                          <div className="flex justify-between text-xs mb-2" style={{ color: '#6B7575' }}>
                            <span>Progress</span>
                            <span className="font-medium">{Math.round(agent.progress)}%</span>
                          </div>
                          <div 
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${colors.border}, ${colors.border}dd)` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${agent.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                      
                    <p className="text-xs mt-3" style={{ color: '#6B7575' }}>
                        {agent.lastActivity}
                      </p>

                    {/* Agent connections */}
                    {agent.connections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs mb-2" style={{ color: '#6B7575' }}>Connects to:</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.connections.slice(0, 3).map(connId => {
                            const connAgent = agents.find(a => a.id === connId);
                            return connAgent ? (
                              <span 
                                key={connId}
                                className="px-2 py-1 rounded-lg text-xs"
            style={{
                                  background: 'rgba(255, 255, 255, 0.6)',
                                  color: '#6B7575'
                                }}
                              >
                                {connAgent.name.replace(' Agent', '')}
                              </span>
                            ) : null;
                          })}
                          {agent.connections.length > 3 && (
                            <span className="text-xs" style={{ color: '#6B7575' }}>
                              +{agent.connections.length - 3} more
                            </span>
                          )}
            </div>
                      </div>
                    )}
                    </motion.div>
                );
              })}
                  </div>

            {/* Phase Connector Arrow */}
            {phaseIndex < agentPhases.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center mt-6"
              >
                      <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight 
                    className="w-8 h-8 transform rotate-90"
                    style={{ color: '#0D7377', opacity: 0.3 }}
                  />
                </motion.div>
                      </motion.div>
                    )}
                </motion.div>
              ))}
      </div>

      {/* Agent Detail Logs Panel */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #E0D5C7',
            boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="p-3 rounded-xl"
                style={{ 
                  background: getAgentColor(selectedAgent.type, selectedAgent.status).bg,
                  color: getAgentColor(selectedAgent.type, selectedAgent.status).border
                }}
              >
                {getAgentIcon(selectedAgent.type)}
              </div>
              <div>
                <h3 
                  className="text-2xl font-semibold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
                  {selectedAgent.name}
          </h3>
                <p className="text-sm" style={{ color: '#6B7575' }}>
                  {selectedAgent.currentTask}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAgent(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: 'rgba(224, 213, 199, 0.5)',
                color: '#1A1D1E'
              }}
            >
              Close
            </motion.button>
          </div>

          {/* Logs Display */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedAgent.logs.length === 0 ? (
              <div className="text-center py-8">
                <Radio className="w-12 h-12 mx-auto mb-3 text-[#6B7575] opacity-30" />
                <p className="text-sm" style={{ color: '#6B7575' }}>
                  No activity logs yet
                </p>
              </div>
            ) : (
              selectedAgent.logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl p-4"
                  style={{
                    background: log.type === "transcription" ? 'rgba(139, 92, 246, 0.05)' : 'rgba(13, 115, 119, 0.03)',
                    border: `1px solid ${log.type === "transcription" ? '#8B5CF6' : '#E0D5C7'}`
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {log.type === "transcription" && (
                        <Phone className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                      )}
                      {log.type === "success" && (
                        <CheckCircle className="w-4 h-4" style={{ color: '#2D9F7E' }} />
                      )}
                      {log.type === "error" && (
                        <XCircle className="w-4 h-4" style={{ color: '#C85C5C' }} />
                      )}
                      <span className="text-xs font-semibold" style={{ color: '#6B7575' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    </div>
                    {log.transcription && (
                      <span 
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ 
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#8B5CF6'
                        }}
                      >
                        VAPI Transcription
                      </span>
                    )}
                  </div>
                  
                  {log.transcription ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                        <span className="text-sm font-medium" style={{ color: '#1A1D1E' }}>
                          {log.transcription.speaker}
                        </span>
                        {log.transcription.duration && (
                    <span className="text-xs" style={{ color: '#6B7575' }}>
                            ({log.transcription.duration})
                    </span>
                        )}
                  </div>
                      <p className="text-sm pl-6" style={{ color: '#1A1D1E' }}>
                        "{log.transcription.text}"
                      </p>
                    </div>
                  ) : (
                  <p className="text-sm" style={{ color: '#1A1D1E' }}>
                      {log.message}
                  </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WorkflowTimeline;
