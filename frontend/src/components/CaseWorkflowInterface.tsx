"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import AgentMapBox from "./AgentMapBox";

interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning" | "vapi_call" | "vapi_transcription";
  agent: string;
  details?: any;
  conversationLogs?: any[];
  agentName?: string;
  agentColor?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: "pending" | "working" | "completed" | "failed" | "waiting";
  progress: number;
  lastActivity: string;
  logs: AgentLog[];
  startTime?: string;
  endTime?: string;
  error?: string;
}

interface CaseWorkflowInterfaceProps {
  caseId: string;
  onBack: () => void;
}

const CaseWorkflowInterface: React.FC<CaseWorkflowInterfaceProps> = ({ 
  caseId, 
  onBack 
}) => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<string>("initializing");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [vapiCalls, setVapiCalls] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Agent configuration
  const agentConfig = {
    parser: { name: "Parser Agent", icon: FileText, color: "#8B5CF6" },
    coordinator: { name: "Coordinator Agent", icon: Network, color: "#3B82F6" },
    shelter: { name: "Shelter Agent", icon: Home, color: "#2D9F7E" },
    transport: { name: "Transport Agent", icon: Truck, color: "#F59E0B" },
    resource: { name: "Resource Agent", icon: ShoppingBag, color: "#E8A87C" },
    pharmacy: { name: "Pharmacy Agent", icon: Pill, color: "#EF4444" },
    eligibility: { name: "Eligibility Agent", icon: FileCheck, color: "#10B981" },
    social_worker: { name: "Social Worker Agent", icon: Users, color: "#6366F1" },
    analytics: { name: "Analytics Agent", icon: BarChart3, color: "#6B7280" }
  };

  useEffect(() => {
    initializeWorkflow();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [caseId]);

  const initializeWorkflow = async () => {
    try {
      // Get initial workflow data
      const response = await fetch(`http://localhost:8000/api/workflows/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowData(data);
        setWorkflowStatus(data.status || "initializing");
        setCurrentStep(data.current_step || "Starting coordination...");
        
        // Start SSE connection for real-time updates
        startSSEConnection();
      }

      // Initialize agents
      const initialAgents: AgentStatus[] = Object.keys(agentConfig).map(agentId => ({
        id: agentId,
        name: agentConfig[agentId as keyof typeof agentConfig].name,
        type: agentId,
        status: "pending",
        progress: 0,
        lastActivity: "Waiting to start...",
        logs: []
      }));
      setAgents(initialAgents);

      // Start SSE stream
      startEventStream();
    } catch (error) {
      console.error("Error initializing workflow:", error);
    }
  };

  const startSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`http://localhost:8000/api/workflow-stream/${caseId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("✅ SSE connection opened for case:", caseId);
      setIsStreaming(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE message received:", data);
        
        if (data.type === 'connected') {
          console.log("🔌 Connected to workflow stream");
        } else if (data.type === 'timeline_update') {
          handleTimelineUpdate(data);
        } else if (data.type === 'agent_log') {
          handleAgentLog(data);
        } else if (data.type === 'conversation_log') {
          handleConversationLog(data);
        } else if (data.type === 'complete') {
          console.log("✅ Workflow completed:", data.status);
          setWorkflowStatus(data.status);
          setIsStreaming(false);
        } else if (data.type === 'error') {
          console.error("❌ Workflow error:", data.message);
          setWorkflowStatus('error');
        }
      } catch (error) {
        console.error("❌ Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      setIsStreaming(false);
    };
  };

  const handleTimelineUpdate = (data: any) => {
    console.log("📝 Timeline update received:", data);
    setCurrentStep(data.event?.message || data.event?.step || "Processing...");
    
    // Update workflow status
    if (data.workflow_status) {
      setWorkflowStatus(data.workflow_status);
    }
  };

  const handleAgentLog = (data: any) => {
    console.log("🤖 Agent log received:", data);
    
    // Update agent logs in real-time
    setAgents(prev => prev.map(agent => {
      if (agent.id === data.agent) {
        const newLog: AgentLog = {
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: data.timestamp || new Date().toISOString(),
          message: data.message || '',
          type: data.status === 'error' ? 'error' : data.status === 'success' ? 'success' : 'info',
          agent: data.agent,
          details: data.details || {},
          conversationLogs: data.conversation_logs || [],
          agentName: data.agent,
          agentColor: getAgentColor(data.agent),
          status: data.status || 'info'
        };
        
        return {
          ...agent,
          logs: [...agent.logs, newLog],
          lastActivity: new Date().toISOString(),
          status: data.status === 'error' ? 'failed' : 'working'
        };
      }
      return agent;
    }));
  };

  const handleConversationLog = (data: any) => {
    console.log("💬 Conversation log received:", data);
    
    // Add conversation log to appropriate agent
    setAgents(prev => prev.map(agent => {
      if (agent.id === data.agent) {
        const conversationLog: AgentLog = {
          id: `conversation_${Date.now()}_${Math.random()}`,
          timestamp: data.timestamp || new Date().toISOString(),
          message: data.message || data.action || '',
          type: data.action?.includes('error') ? 'error' : 'info',
          agent: data.agent,
          details: data,
          conversationLogs: [data],
          agentName: data.agent,
          agentColor: getAgentColor(data.agent),
          status: data.action?.includes('error') ? 'error' : 'info'
        };
        
        return {
          ...agent,
          logs: [...agent.logs, conversationLog],
          lastActivity: new Date().toISOString()
        };
      }
      return agent;
    }));
  };

  const getAgentColor = (agentName: string): string => {
    const colors: Record<string, string> = {
      'parser_agent': '#8B5CF6',
      'coordinator_agent': '#3B82F6',
      'social_worker_agent': '#10B981',
      'shelter_agent': '#F59E0B',
      'transport_agent': '#EF4444',
      'resource_agent': '#8B5CF6',
      'pharmacy_agent': '#06B6D4',
      'eligibility_agent': '#84CC16',
      'analytics_agent': '#F97316'
    };
    return colors[agentName] || '#6B7575';
  };

  const startEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsStreaming(true);
    eventSourceRef.current = new EventSource(`http://localhost:8000/api/workflow-stream/${caseId}`);

    eventSourceRef.current.onopen = () => {
      console.log("✅ Connected to workflow stream");
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWorkflowEvent(data);
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsStreaming(false);
    };
  };

  const handleWorkflowEvent = (data: any) => {
    switch (data.type) {
      case "connected":
        console.log("Connected to workflow stream");
        break;
      
      case "timeline_update":
        handleTimelineUpdate(data);
        break;
      
      case "agent_update":
        handleAgentUpdate(data);
        break;
      
      case "vapi_call":
        handleVapiCall(data);
        break;
      
      case "vapi_transcription":
        handleVapiTranscription(data);
        break;
      
      case "complete":
        handleWorkflowComplete(data);
        break;
      
      case "error":
        handleWorkflowError(data);
        break;
    }
  };

  const handleTimelineUpdate = (data: any) => {
    const { step, status, description, logs, agent } = data;
    
    setCurrentStep(description);
    
    if (agent) {
      updateAgentLogs(agent, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: description,
        type: status === "completed" ? "success" : status === "failed" ? "error" : "info",
        agent,
        details: { step, logs }
      });
    }
  };

  const handleAgentUpdate = (data: any) => {
    const { agent_id, status, progress, activity, error } = data;
    
    setAgents(prev => prev.map(agent => {
      if (agent.id === agent_id) {
        return {
          ...agent,
          status,
          progress: progress || agent.progress,
          lastActivity: activity || agent.lastActivity,
          error: error || agent.error,
          startTime: status === "working" && !agent.startTime ? new Date().toISOString() : agent.startTime,
          endTime: (status === "completed" || status === "failed") && !agent.endTime ? new Date().toISOString() : agent.endTime
        };
      }
      return agent;
    }));
  };

  const handleVapiCall = (data: any) => {
    const { agent, phone_number, shelter_name, call_id } = data;
    
    setVapiCalls(prev => [...prev, {
      id: call_id,
      agent,
      phone_number,
      shelter_name,
      status: "calling",
      start_time: new Date().toISOString(),
      transcript: ""
    }]);

    updateAgentLogs(agent, {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: `📞 Calling ${shelter_name} at ${phone_number}`,
      type: "vapi_call",
      agent,
      details: { call_id, phone_number, shelter_name }
    });
  };

  const handleVapiTranscription = (data: any) => {
    const { call_id, transcript, status } = data;
    
    setVapiCalls(prev => prev.map(call => 
      call.id === call_id 
        ? { ...call, transcript, status }
        : call
    ));

    // Find which agent made this call
    const call = vapiCalls.find(c => c.id === call_id);
    if (call) {
      updateAgentLogs(call.agent, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: `🎙️ Call transcript: "${transcript}"`,
        type: "vapi_transcription",
        agent: call.agent,
        details: { call_id, transcript, status }
      });
    }
  };

  const handleWorkflowComplete = (data: any) => {
    setWorkflowStatus("completed");
    setCurrentStep("Workflow completed successfully");
    setIsStreaming(false);
    
    if (data.final_report) {
      setFinalReport(data.final_report);
    }
  };

  const handleWorkflowError = (data: any) => {
    setWorkflowStatus("failed");
    setCurrentStep(`Error: ${data.message}`);
    setIsStreaming(false);
    
    // Mark failed agents
    if (data.failed_agent) {
      setAgents(prev => prev.map(agent => 
        agent.id === data.failed_agent 
          ? { ...agent, status: "failed", error: data.message }
          : agent
      ));
    }
  };

  const updateAgentLogs = (agentId: string, log: AgentLog) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          logs: [...agent.logs, log],
          lastActivity: log.message
        };
      }
      return agent;
    }));
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const getAgentIcon = (agentType: string) => {
    const config = agentConfig[agentType as keyof typeof agentConfig];
    return config ? config.icon : Activity;
  };

  const getAgentColor = (agentType: string) => {
    const config = agentConfig[agentType as keyof typeof agentConfig];
    return config ? config.color : "#6B7280";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "working": return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-500" />;
      case "waiting": return <Pause className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "vapi_call": return <Phone className="w-4 h-4 text-blue-500" />;
      case "vapi_transcription": return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Case Workflow</h1>
              <p className="text-sm text-gray-600">Case ID: {caseId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isStreaming ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Status: <span className="font-medium capitalize">{workflowStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">{currentStep}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Agent Status Panel */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Status</h3>
            <div className="space-y-3">
              {agents.map((agent) => {
                const Icon = getAgentIcon(agent.type);
                const color = getAgentColor(agent.type);
                
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      agent.status === "working" ? "border-blue-200 bg-blue-50" :
                      agent.status === "completed" ? "border-green-200 bg-green-50" :
                      agent.status === "failed" ? "border-red-200 bg-red-50" :
                      "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" style={{ color }} />
                        <span className="font-medium text-gray-900">{agent.name}</span>
                      </div>
                      {getStatusIcon(agent.status)}
                    </div>
                    
                    {agent.status === "working" && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(agent.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${agent.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-2">{agent.lastActivity}</p>
                    
                    {agent.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ❌ {agent.error}
                      </div>
                    )}
                    
                    {/* Agent-specific MapBox for relevant agents */}
                    {(agent.type === "shelter" || agent.type === "transport" || agent.type === "resource") && 
                     (agent.status === "working" || agent.status === "completed") && (
                      <div className="mt-3">
                        <AgentMapBox
                          agentType={agent.name}
                          agentData={agent}
                          workflowData={workflowData}
                          className="w-full h-32"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Logs Panel */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="space-y-2">
                  {agent.logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{log.message}</p>
                        
                        {log.type === "vapi_transcription" && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <strong>Call Transcript:</strong> {log.details?.transcript}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Final Report Modal */}
      {finalReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Final Discharge Report</h3>
              <button
                onClick={() => setFinalReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{finalReport}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWorkflowInterface;
