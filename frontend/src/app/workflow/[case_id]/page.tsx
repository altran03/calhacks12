"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Bot,
  FileText,
  Home,
  Truck,
  Users,
  Package,
  Activity
} from "lucide-react";

interface TimelineEvent {
  step: string;
  status: "in_progress" | "completed" | "error";
  timestamp: string;
  description: string;
  logs: string[];
  agent?: string;
}

interface AgentConfig {
  name: string;
  icon: any;
  color: string;
  gradient: string;
}

const agentConfigs: Record<string, AgentConfig> = {
  system: {
    name: "System",
    icon: Activity,
    color: "#0D7377",
    gradient: "from-[#0D7377] to-[#14919B]"
  },
  parser_agent: {
    name: "Parser Agent",
    icon: FileText,
    color: "#D17A5C",
    gradient: "from-[#D17A5C] to-[#E8A87C]"
  },
  coordinator_agent: {
    name: "Coordinator Agent",
    icon: Bot,
    color: "#2D9F7E",
    gradient: "from-[#2D9F7E] to-[#3DB896]"
  },
  shelter_agent: {
    name: "Shelter Agent",
    icon: Home,
    color: "#E8A87C",
    gradient: "from-[#E8A87C] to-[#F4C490]"
  },
  transport_agent: {
    name: "Transport Agent",
    icon: Truck,
    color: "#C85C5C",
    gradient: "from-[#C85C5C] to-[#D17A7A]"
  },
  social_worker_agent: {
    name: "Social Worker Agent",
    icon: Users,
    color: "#7C9885",
    gradient: "from-[#7C9885] to-[#A5B8A8]"
  },
  resource_agent: {
    name: "Resource Agent",
    icon: Package,
    color: "#9B7EDE",
    gradient: "from-[#9B7EDE] to-[#B8A3E8]"
  }
};

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const case_id = params.case_id as string;
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<string>("starting");
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource(`http://localhost:8000/api/workflow-stream/${case_id}`);
    
    eventSource.onopen = () => {
      console.log("SSE connection opened");
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE event received:", data);
        
        if (data.type === "connected") {
          setIsConnected(true);
        } else if (data.type === "timeline_update") {
          setEvents((prev) => [...prev, data.event]);
          setWorkflowStatus(data.workflow_status);
        } else if (data.type === "complete") {
          setIsComplete(true);
          setWorkflowStatus(data.status);
          eventSource.close();
        } else if (data.type === "error") {
          console.error("SSE error:", data.message);
          eventSource.close();
        }
      } catch (error) {
        console.error("Error parsing SSE event:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [case_id]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #F5F0E8 0%, #E8F4F2 100%)" }}>
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          borderColor: "#E0D5C7"
        }}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" style={{ color: "#1A1D1E" }} />
              </button>
              <div>
                <h1 
                  className="text-3xl font-bold"
                  style={{ fontFamily: "Crimson Pro, serif", color: "#1A1D1E" }}
                >
                  Agent Workflow
                </h1>
                <p className="text-sm mt-1" style={{ color: "#6B7575" }}>
                  Case ID: {case_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isComplete && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-50">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-600">Coordinating...</span>
                </div>
              )}
              {isComplete && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Complete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => {
              const agentConfig = agentConfigs[event.agent || "system"] || agentConfigs.system;
              const Icon = agentConfig.icon;
              
              return (
                <motion.div
                  key={`${event.step}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  className="relative"
                >
                  {/* Agent Card */}
                  <div
                    className="rounded-3xl p-6 shadow-lg border"
                    style={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(20px)",
                      borderColor: "#E0D5C7"
                    }}
                  >
                    {/* Agent Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="p-3 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${agentConfig.gradient.split(" ")[0].replace("from-[", "").replace("]", "")}, ${agentConfig.gradient.split(" ")[1].replace("to-[", "").replace("]", "")})`
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 
                            className="text-xl font-bold"
                            style={{ fontFamily: "Crimson Pro, serif", color: "#1A1D1E" }}
                          >
                            {agentConfig.name}
                          </h3>
                          <p className="text-sm" style={{ color: "#6B7575" }}>
                            {event.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Indicator */}
                      <div>
                        {event.status === "in_progress" && (
                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-xs font-medium text-blue-600">Processing</span>
                          </div>
                        )}
                        {event.status === "completed" && (
                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-green-50">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Completed</span>
                          </div>
                        )}
                        {event.status === "error" && (
                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-50">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-red-600">Error</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent Logs */}
                    <div 
                      className="rounded-2xl p-4 space-y-2"
                      style={{
                        background: "rgba(13, 115, 119, 0.05)",
                        border: "1px solid rgba(13, 115, 119, 0.1)"
                      }}
                    >
                      <AnimatePresence mode="popLayout">
                        {event.logs.map((log, logIndex) => (
                          <motion.div
                            key={`${event.step}-log-${logIndex}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              duration: 0.3, 
                              delay: logIndex * 0.05 
                            }}
                            className="flex items-start space-x-2"
                          >
                            <div 
                              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                              style={{ background: agentConfig.color }}
                            />
                            <p 
                              className="text-sm leading-relaxed"
                              style={{ color: "#1A1D1E" }}
                            >
                              {log}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-3 text-xs" style={{ color: "#6B7575" }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Connection Line to Next Card */}
                  {index < events.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div 
                        className="w-0.5 h-6"
                        style={{ background: "linear-gradient(180deg, #0D7377 0%, transparent 100%)" }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading State */}
          {events.length === 0 && !isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#0D7377] animate-spin" />
              <p className="text-lg font-medium" style={{ color: "#1A1D1E" }}>
                Connecting to workflow stream...
              </p>
              <p className="text-sm mt-2" style={{ color: "#6B7575" }}>
                Initializing multi-agent coordination
              </p>
            </motion.div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div
                className="inline-block p-4 rounded-2xl mb-4"
                style={{
                  background: "linear-gradient(135deg, #2D9F7E 0%, #3DB896 100%)"
                }}
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "Crimson Pro, serif", color: "#1A1D1E" }}
              >
                Workflow Completed Successfully
              </h2>
              <p className="text-sm" style={{ color: "#6B7575" }}>
                All agents have completed their tasks
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

