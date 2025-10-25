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
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ShoppingBag,
  Pill,
  FileCheck,
  BarChart3,
  FileText
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: "HospitalAgent" | "CoordinatorAgent" | "SocialWorkerAgent" | "ShelterAgent" | "TransportAgent" | "FollowUpCareAgent" | "ResourceAgent" | "PharmacyAgent" | "EligibilityAgent" | "AnalyticsAgent" | "ParserAgent";
  status: "idle" | "working" | "completed" | "error";
  currentTask: string;
  progress: number;
  lastActivity: string;
  messages: AgentMessage[];
}

interface AgentMessage {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type: "request" | "response" | "notification" | "error";
}

interface WorkflowStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  description: string;
  agent: string;
  duration: string;
  logs: string[];
}

const WorkflowTimeline: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    initializeAgents();
    initializeSteps();
    startSimulation();
  }, []);

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
        messages: []
      },
      {
        id: "hospital",
        name: "Hospital Agent",
        type: "HospitalAgent",
        status: "completed",
        currentTask: "Discharge details submitted",
        progress: 100,
        lastActivity: "2 minutes ago",
        messages: [
          {
            id: "1",
            timestamp: "10:00 AM",
            from: "HospitalAgent",
            to: "CoordinatorAgent",
            message: "Patient John Doe ready for discharge. Medical condition: stable, accessibility needs: wheelchair access",
            type: "request"
          }
        ]
      },
      {
        id: "coordinator",
        name: "Coordinator Agent",
        type: "CoordinatorAgent",
        status: "working",
        currentTask: "Querying Bright Data for shelter availability",
        progress: 65,
        lastActivity: "1 minute ago",
        messages: [
          {
            id: "2",
            timestamp: "10:01 AM",
            from: "CoordinatorAgent",
            to: "BrightData",
            message: "Querying SF shelter database for wheelchair accessible beds",
            type: "request"
          },
          {
            id: "3",
            timestamp: "10:02 AM",
            from: "BrightData",
            to: "CoordinatorAgent",
            message: "Found 3 suitable shelters: Mission Center (5 beds), Hamilton Center (2 beds), St. Anthony's (8 beds)",
            type: "response"
          }
        ]
      },
      {
        id: "shelter",
        name: "Shelter Agent",
        type: "ShelterAgent",
        status: "working",
        currentTask: "Confirming bed availability via Vapi call",
        progress: 40,
        lastActivity: "30 seconds ago",
        messages: [
          {
            id: "4",
            timestamp: "10:03 AM",
            from: "CoordinatorAgent",
            to: "ShelterAgent",
            message: "Please confirm availability for Mission Neighborhood Resource Center",
            type: "request"
          },
          {
            id: "5",
            timestamp: "10:04 AM",
            from: "ShelterAgent",
            to: "Vapi",
            message: "Initiating voice call to Mission Center to confirm bed availability",
            type: "notification"
          }
        ]
      },
      {
        id: "social",
        name: "Social Worker Agent",
        type: "SocialWorkerAgent",
        status: "pending",
        currentTask: "Awaiting shelter confirmation",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "transport",
        name: "Transport Agent",
        type: "TransportAgent",
        status: "pending",
        currentTask: "Awaiting assignment",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "followup",
        name: "Follow-up Care Agent",
        type: "FollowUpCareAgent",
        status: "idle",
        currentTask: "Scheduling post-discharge check-in",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "resource",
        name: "Resource Agent",
        type: "ResourceAgent",
        status: "idle",
        currentTask: "Ready to coordinate food, hygiene, clothing",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "pharmacy",
        name: "Pharmacy Agent",
        type: "PharmacyAgent",
        status: "idle",
        currentTask: "Ready to ensure medication continuity",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "eligibility",
        name: "Eligibility Agent",
        type: "EligibilityAgent",
        status: "idle",
        currentTask: "Ready to verify benefit eligibility",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "analytics",
        name: "Analytics Agent",
        type: "AnalyticsAgent",
        status: "working",
        currentTask: "Collecting system metrics",
        progress: 15,
        lastActivity: "Just now",
        messages: [
          {
            id: "a1",
            timestamp: "10:00 AM",
            from: "AnalyticsAgent",
            to: "System",
            message: "Recording workflow metrics for case #12345",
            type: "notification"
          }
        ]
      }
    ];
    setAgents(initialAgents);
  };

  const initializeSteps = () => {
    const initialSteps: WorkflowStep[] = [
      {
        id: "1",
        name: "Discharge Intake",
        status: "completed",
        description: "Patient details submitted by hospital staff",
        agent: "HospitalAgent",
        duration: "2 min",
        logs: [
          "Patient John Doe registered",
          "Medical condition: Stable post-surgery",
          "Accessibility needs: Wheelchair access required",
          "Social needs: Mental health support needed"
        ]
      },
      {
        id: "2",
        name: "Data Intelligence Query",
        status: "in_progress",
        description: "Fetch.ai agents querying Bright Data for real-time shelter information",
        agent: "CoordinatorAgent",
        duration: "3 min",
        logs: [
          "Querying SF HSH database",
          "Filtering for wheelchair accessible shelters",
          "Found 3 suitable options",
          "Checking real-time availability..."
        ]
      },
      {
        id: "3",
        name: "Shelter Verification",
        status: "in_progress",
        description: "Vapi voice calls confirming bed availability with shelters",
        agent: "ShelterAgent",
        duration: "2 min",
        logs: [
          "Calling Mission Neighborhood Resource Center",
          "Verifying bed availability",
          "Confirming accessibility features",
          "Awaiting shelter response..."
        ]
      },
      {
        id: "4",
        name: "Social Worker Assignment",
        status: "pending",
        description: "Connecting patient with appropriate social worker",
        agent: "SocialWorkerAgent",
        duration: "1 min",
        logs: []
      },
      {
        id: "5",
        name: "Transport Coordination",
        status: "pending",
        description: "Arranging wheelchair-accessible transport",
        agent: "TransportAgent",
        duration: "2 min",
        logs: []
      },
      {
        id: "6",
        name: "Follow-up Care Setup",
        status: "pending",
        description: "Scheduling post-discharge check-ins and support",
        agent: "FollowUpCareAgent",
        duration: "1 min",
        logs: []
      }
    ];
    setSteps(initialSteps);
  };

  const startSimulation = () => {
    const interval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.status === "working" && agent.progress < 100) {
            const newProgress = Math.min(agent.progress + Math.random() * 10, 100);
            const newStatus = newProgress >= 100 ? "completed" : "working";
            
            return {
              ...agent,
              progress: newProgress,
              status: newStatus,
              lastActivity: "Just now"
            };
          }
          return agent;
        })
      );

      setSteps(prevSteps =>
        prevSteps.map((step, index) => {
          if (step.status === "in_progress") {
            const currentAgent = agents.find(a => a.type === step.agent);
            if (currentAgent?.status === "completed") {
              return {
                ...step,
                status: "completed",
                logs: [...step.logs, "✅ Task completed successfully"]
              };
            }
          } else if (step.status === "pending" && index > 0) {
            const prevStep = prevSteps[index - 1];
            if (prevStep.status === "completed") {
              return {
                ...step,
                status: "in_progress",
                logs: ["🔄 Task initiated"]
              };
            }
          }
          return step;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  };

  const getAgentIcon = (type: Agent["type"]) => {
    switch (type) {
      case "ParserAgent":
        return <FileText className="w-5 h-5" />;
      case "HospitalAgent":
        return <Home className="w-5 h-5" />;
      case "CoordinatorAgent":
        return <Network className="w-5 h-5" />;
      case "SocialWorkerAgent":
        return <Users className="w-5 h-5" />;
      case "ShelterAgent":
        return <Home className="w-5 h-5" />;
      case "TransportAgent":
        return <Truck className="w-5 h-5" />;
      case "FollowUpCareAgent":
        return <MessageSquare className="w-5 h-5" />;
      case "ResourceAgent":
        return <ShoppingBag className="w-5 h-5" />;
      case "PharmacyAgent":
        return <Pill className="w-5 h-5" />;
      case "EligibilityAgent":
        return <FileCheck className="w-5 h-5" />;
      case "AnalyticsAgent":
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getAgentStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "working":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "idle":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStepStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "in_progress":
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      case "failed":
        return <XCircle className="text-red-500" size={20} />;
      case "pending":
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStepStatusColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Fetch.ai Agentic Dashboard</h2>
        <p className="text-gray-600">Real-time multi-agent coordination workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Agent Status
            </h3>
        <div className="space-y-4">
              <AnimatePresence>
                {agents.map((agent) => (
            <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border ${getAgentStatusColor(agent.status)} cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => setSelectedAgent(agent)}
            >
              <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-white rounded-lg">
                          {getAgentIcon(agent.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm opacity-75">{agent.currentTask}</p>
                        </div>
                      </div>
                      {agent.status === "working" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4 text-blue-500" />
                        </motion.div>
                      )}
                    </div>
                    
                    {agent.status === "working" && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{Math.round(agent.progress)}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <motion.div
                            className="bg-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${agent.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
              </div>
                    )}
                    
                    <p className="text-xs mt-2 opacity-60">Last activity: {agent.lastActivity}</p>
            </motion.div>
          ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-500" />
              Workflow Timeline
              </h3>

            <div className="relative pl-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="mb-8 last:mb-0"
                >
                  <div className="flex items-center mb-3">
                    <div className="absolute -left-3 bg-white rounded-full p-1 z-10">
                      {getStepStatusIcon(step.status)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-6">{step.name}</h3>
                    <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getStepStatusColor(step.status)}`}>
                      {step.status.replace('_', ' ')}
                    </span>
                    <span className="ml-4 text-sm text-gray-500">({step.duration})</span>
                  </div>
                  
                  <p className="text-gray-600 ml-6 mb-2">{step.description}</p>
                  
                  <div className="ml-6 flex items-center text-sm text-gray-500 mb-3">
                    <span className="mr-2">Agent:</span>
                    <span className="font-medium">{step.agent}</span>
                  </div>

                  {step.logs && step.logs.length > 0 && (
                    <div className="ml-6 mt-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Activity Log:</h4>
                        <div className="space-y-1">
                          <AnimatePresence>
                            {step.logs.map((log, logIndex) => (
                              <motion.p
                                key={logIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: logIndex * 0.1 }}
                                className="text-sm text-gray-600"
                              >
                                {log}
                              </motion.p>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Message Panel */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedAgent.name} - Message History
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            <AnimatePresence>
              {selectedAgent.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {message.from} → {message.to}
                    </span>
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600">{message.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WorkflowTimeline;