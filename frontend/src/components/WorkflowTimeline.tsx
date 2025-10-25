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
  Radio
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

  useEffect(() => {
    initializeAgents();
    initializeSteps();
    const cleanup = startSimulation();
    return cleanup;
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
        status: "idle",
        currentTask: "Awaiting shelter confirmation",
        progress: 0,
        lastActivity: "Waiting",
        messages: []
      },
      {
        id: "transport",
        name: "Transport Agent",
        type: "TransportAgent",
        status: "idle",
        currentTask: "Awaiting assignment",
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
    const iconProps = { className: "w-5 h-5" };
    switch (type) {
      case "ParserAgent": return <FileText {...iconProps} />;
      case "HospitalAgent": return <Home {...iconProps} />;
      case "CoordinatorAgent": return <Network {...iconProps} />;
      case "SocialWorkerAgent": return <Users {...iconProps} />;
      case "ShelterAgent": return <Home {...iconProps} />;
      case "TransportAgent": return <Truck {...iconProps} />;
      case "FollowUpCareAgent": return <MessageSquare {...iconProps} />;
      case "ResourceAgent": return <ShoppingBag {...iconProps} />;
      case "PharmacyAgent": return <Pill {...iconProps} />;
      case "EligibilityAgent": return <FileCheck {...iconProps} />;
      case "AnalyticsAgent": return <BarChart3 {...iconProps} />;
      default: return <Brain {...iconProps} />;
    }
  };

  const getAgentColor = (type: Agent["type"], status: Agent["status"]) => {
    // Each agent type gets its own color scheme
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
      "FollowUpCareAgent": { 
        bg: "rgba(236, 72, 153, 0.1)", 
        border: "#EC4899", 
        text: "#9D174D",
        glow: "rgba(236, 72, 153, 0.2)"
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
    
    // Adjust opacity for status
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

  const getStepStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="text-[#2D9F7E]" size={24} />;
      case "in_progress": return <Clock className="text-[#E8A87C]" size={24} />;
      case "failed": return <XCircle className="text-[#C85C5C]" size={24} />;
      default: return <Clock className="text-[#6B7575] opacity-40" size={24} />;
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Status Panel */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-3xl p-6 sticky top-24"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E0D5C7',
              boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)'
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <Radio className="w-5 h-5 text-[#0D7377]" />
              <h3 
                className="text-xl font-semibold"
                style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
              >
                Active Agents
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              <AnimatePresence>
                {agents.map((agent, index) => {
                  const colors = getAgentColor(agent.type, agent.status);
                  
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="rounded-2xl p-4 cursor-pointer transition-all duration-300"
                      style={{
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        boxShadow: agent.status === "working" ? `0 4px 16px ${colors.glow}` : 'none'
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
                            <div style={{ color: colors.border }}>
                              {getAgentIcon(agent.type)}
                            </div>
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
                          <CheckCircle className="w-4 h-4" style={{ color: colors.border }} />
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
                      
                      <p className="text-xs mt-2" style={{ color: '#6B7575' }}>
                        {agent.lastActivity}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="lg:col-span-2">
          <div 
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E0D5C7',
              boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)'
            }}
          >
            <div className="flex items-center space-x-2 mb-8">
              <Activity className="w-5 h-5 text-[#D17A5C]" />
              <h3 
                className="text-xl font-semibold"
                style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
              >
                Workflow Progress
              </h3>
            </div>

            <div className="relative pl-10">
              {/* Timeline line */}
              <div 
                className="absolute left-3 top-0 bottom-0 w-0.5"
                style={{ background: 'linear-gradient(180deg, #0D7377, #E8A87C)' }}
              />

              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="mb-8 last:mb-0"
                >
                  {/* Timeline node */}
                  <div className="absolute -left-1">
                    <motion.div
                      className="p-1 rounded-full"
                      style={{ 
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                      animate={step.status === "in_progress" ? {
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 2px 8px rgba(232, 168, 124, 0.3)',
                          '0 4px 16px rgba(232, 168, 124, 0.6)',
                          '0 2px 8px rgba(232, 168, 124, 0.3)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getStepStatusIcon(step.status)}
                    </motion.div>
                  </div>

                  {/* Step content */}
                  <div className="ml-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 
                          className="text-lg font-semibold mb-1"
                          style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
                        >
                          {step.name}
                        </h4>
                        <p className="text-sm mb-2" style={{ color: '#6B7575' }}>
                          {step.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs" style={{ color: '#6B7575' }}>
                          <span>Agent: <span className="font-medium">{step.agent}</span></span>
                          <span>Duration: <span className="font-medium">{step.duration}</span></span>
                        </div>
                      </div>
                      
                      <div
                        className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                        style={{
                          background: step.status === "completed" ? "rgba(45, 159, 126, 0.1)" : step.status === "in_progress" ? "rgba(232, 168, 124, 0.1)" : "rgba(224, 213, 199, 0.3)",
                          color: step.status === "completed" ? "#1A5F4A" : step.status === "in_progress" ? "#8B5A3C" : "#6B7575",
                          border: `1px solid ${step.status === "completed" ? "#2D9F7E" : step.status === "in_progress" ? "#E8A87C" : "#E0D5C7"}`
                        }}
                      >
                        {step.status.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Activity logs */}
                    {step.logs && step.logs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 rounded-xl p-4"
                        style={{
                          background: 'rgba(13, 115, 119, 0.03)',
                          border: '1px solid #E0D5C7'
                        }}
                      >
                        <h5 className="text-xs font-semibold mb-2" style={{ color: '#6B7575' }}>
                          Activity Log:
                        </h5>
                        <div className="space-y-1">
                          <AnimatePresence>
                            {step.logs.map((log, logIndex) => (
                              <motion.p
                                key={logIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: logIndex * 0.05 }}
                                className="text-xs font-mono"
                                style={{ color: '#6B7575' }}
                              >
                                {log}
                              </motion.p>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Agent Messages */}
      {selectedAgent && selectedAgent.messages.length > 0 && (
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
          <h3 
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            {selectedAgent.name} - Communication Log
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {selectedAgent.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(13, 115, 119, 0.03)',
                    border: '1px solid #E0D5C7'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold" style={{ color: '#0D7377' }}>
                      {message.from} → {message.to}
                    </span>
                    <span className="text-xs" style={{ color: '#6B7575' }}>
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#1A1D1E' }}>
                    {message.message}
                  </p>
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
