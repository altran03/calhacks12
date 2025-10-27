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
  ExternalLink
} from "lucide-react";
import AgentMapBox from "./AgentMapBox";
import CaseWorkflowInterface from "./CaseWorkflowInterface";
import { mockAgentData, generateRandomRoute } from "../utils/mockData";

interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "transcription" | "vapi_transcription" | "transport_scheduled" | "resource_ready" | "pharmacy_ready" | "eligibility_verified" | "social_worker_assigned" | "analytics_complete";
  transcription?: {
    speaker: string;
    text: string;
    duration?: string;
  };
  conversationLogs?: any[];
  agent?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  details?: any;
  agentName: string;
  agentColor: string;
}

interface Agent {
  id: string;
  name: string;
  type: "ParserAgent" | "HospitalAgent" | "CoordinatorAgent" | "SocialWorkerAgent" | "ShelterAgent" | "TransportAgent" | "ResourceAgent" | "PharmacyAgent" | "EligibilityAgent" | "AnalyticsAgent";
  status: "idle" | "working" | "completed" | "pending" | "in_progress";
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
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCaseInterface, setShowCaseInterface] = useState<boolean>(false);
  const shouldPollRef = useRef(true);
  const lastStatusRef = useRef<string>("");
  const initializedRef = useRef(false);

  useEffect(() => {
    // Set mock mode to prevent duplicate case creation
    localStorage.setItem('mock_mode', 'true');
    
    // Clean up old case IDs and set a realistic case ID
    const realisticCaseId = `CASE_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    localStorage.setItem('current_case_id', realisticCaseId);
    setCaseId(realisticCaseId);
    
    // Clear any old case submission flags
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('case_submitted_') && key !== `case_submitted_${realisticCaseId}`) {
        localStorage.removeItem(key);
      }
    });
    
    // Only initialize agents if they haven't been initialized yet
    if (!initializedRef.current) {
      initializeAgents();
      initializedRef.current = true;
    }
    
    console.log("🎯 Agent coordination system initialized");
    
    return () => {
      shouldPollRef.current = false;
    };
  }, []);

  // Debug selectedAgent changes
  useEffect(() => {
    console.log("🎯 selectedAgent changed:", selectedAgent);
  }, [selectedAgent]);

  // Debug agents changes
  useEffect(() => {
    console.log("🎯 agents changed:", agents.length, agents.map(a => a.name));
  }, [agents]);

  // SSE connection for live agent logs
  useEffect(() => {
    if (!caseId) return;
    
    const storedCaseId = localStorage.getItem('current_case_id');
    if (!storedCaseId) return;
    
    console.log("🔌 Connecting to SSE stream for case:", storedCaseId);
    
    const eventSource = new EventSource(`http://localhost:8000/api/workflow-stream/${storedCaseId}`);
    
    eventSource.onopen = () => {
      console.log("✅ SSE connection opened");
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE message received:", data);
        
        if (data.type === 'timeline_update') {
          handleTimelineUpdate(data);
        } else if (data.type === 'agent_log') {
          handleAgentLog(data);
        } else if (data.type === 'conversation_log') {
          handleConversationLog(data);
        }
      } catch (error) {
        console.error("❌ Error parsing SSE message:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
    };
    
    return () => {
      console.log("🔌 Closing SSE connection");
      eventSource.close();
    };
  }, [caseId]);

  const handleTimelineUpdate = (data: any) => {
    console.log("📝 Timeline update received:", data);
    
    // Extract agent-specific logs
    const agentLogs = data.agent_logs || {};
    const newLogs: AgentLog[] = [];
    
    // Process each agent's logs
    Object.entries(agentLogs).forEach(([agentName, logs]: [string, any]) => {
      if (Array.isArray(logs)) {
        logs.forEach((log: any) => {
          newLogs.push({
            id: `${agentName}_${Date.now()}_${Math.random()}`,
            agent: agentName,
            message: log.message || log,
            timestamp: log.timestamp || new Date().toISOString(),
            type: log.status === 'success' ? 'success' : 'info',
            status: log.status || 'info',
            details: log.details || {},
            conversationLogs: log.conversation_logs || [],
            agentName: agentName,
            agentColor: getAgentColorByName(agentName)
          });
        });
      }
    });
    
    // Process conversation logs separately
    if (data.conversation_logs) {
      data.conversation_logs.forEach((log: any) => {
        newLogs.push({
          id: `conversation_${Date.now()}_${Math.random()}`,
          agent: log.agent || 'system',
          message: log.message || log.action,
          timestamp: log.timestamp || new Date().toISOString(),
          type: 'info',
          status: 'info',
          details: log,
          conversationLogs: [log],
          agentName: log.agent || 'system',
          agentColor: getAgentColorByName(log.agent || 'system')
        });
      });
    }
    
    // Update global logs
    setGlobalLogs(prev => [...prev, ...newLogs]);
  };

  const handleAgentLog = (data: any) => {
    console.log("🤖 Agent log received:", data);
    
    const newLog: AgentLog & { agentName: string; agentColor: string } = {
      id: `agent_${Date.now()}_${Math.random()}`,
      agent: data.agent || 'unknown',
      message: data.message || data.action,
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.status === 'success' ? 'success' : 'info',
      status: data.status || 'info',
      details: data.details || {},
      conversationLogs: data.conversation_logs || [],
      agentName: data.agent || 'unknown',
      agentColor: getAgentColorByName(data.agent || 'unknown')
    };
    
    setGlobalLogs(prev => [...prev, newLog]);
  };

  const handleConversationLog = (data: any) => {
    console.log("💬 Conversation log received:", data);
    
    const newLog: AgentLog & { agentName: string; agentColor: string } = {
      id: `conversation_${Date.now()}_${Math.random()}`,
      agent: data.agent || 'system',
      message: data.message || data.action,
      timestamp: data.timestamp || new Date().toISOString(),
      type: 'info',
      status: 'info',
      details: data,
      conversationLogs: [data],
      agentName: data.agent || 'system',
      agentColor: getAgentColorByName(data.agent || 'unknown')
    };
    
    setGlobalLogs(prev => [...prev, newLog]);
  };

  const fetchWorkflowData = async (currentCaseId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${currentCaseId}`);
      if (response.ok) {
        const workflow = await response.json();
        
        if (workflow) {
          // Only log on status changes to reduce console spam
          if (lastStatusRef.current !== workflow.status) {
            console.log("📊 Workflow status changed:", workflow.status);
            lastStatusRef.current = workflow.status;
          }
          setWorkflowData(workflow);
          updateAgentsFromWorkflow(workflow);
          
          // Stop polling if workflow is complete
          if (workflow.status === 'coordinated' || workflow.status === 'completed') {
            console.log("✅ Workflow complete, stopping polling");
            shouldPollRef.current = false;
            localStorage.setItem(`case_submitted_${currentCaseId}`, 'false');
          }
        }
      }
    } catch (error) {
      console.log("Workflow data not yet available:", error);
    }
  };

  const startAgentCoordination = () => {
    console.log("🎯 Starting agent coordination workflow!");
    console.log("🎯 Current agents count:", agents.length);
    
    // Dispatch event to hide routes when starting coordination
    const startEvent = new CustomEvent('startCoordination');
    window.dispatchEvent(startEvent);
    
    // Always show mock responses regardless of backend status
    // This ensures the demo works even if there are backend errors
    
    // Update agents with workflow data in sequence
    const updateSequence = [
      // Phase 1: Initial Processing (completed before VAPI call)
      { id: "parser", status: "completed", task: "Document parsed successfully", activity: "Patient data extracted from discharge form" },
      { id: "hospital", status: "completed", task: "Discharge request processed", activity: "Medical clearance confirmed" },
      { id: "coordinator", status: "in_progress", task: "Initiating VAPI call", activity: "Starting shelter contact process" },
      
      // Phase 2: VAPI Call in Progress (all other agents wait)
      { id: "shelter", status: "in_progress", task: "Making VAPI call to shelter", activity: "Calling Harbor Light Center..." },
      { id: "social", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" },
      { id: "transport", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" },
      { id: "resource", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" },
      { id: "pharmacy", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" },
      { id: "eligibility", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" },
      { id: "analytics", status: "pending", task: "Waiting for VAPI call completion", activity: "Standby - VAPI call in progress" }
    ];

    // Apply initial updates
    console.log("🎯 Applying initial agent updates...");
    setAgents(prev => {
      console.log("🎯 Previous agents count:", prev.length);
      const updated = prev.map(agent => {
        const update = updateSequence.find(u => u.id === agent.id);
        if (update) {
          console.log(`🎯 Updating agent ${agent.id}: ${update.status} - ${update.task}`);
          return {
            ...agent,
            status: update.status as "idle" | "working" | "completed" | "pending" | "in_progress",
            currentTask: update.task,
            lastActivity: update.activity,
            progress: update.status === "completed" ? 100 : update.status === "working" || update.status === "in_progress" ? 50 : 0
          };
        }
        return agent;
      });
      console.log("🎯 Updated agents count:", updated.length);
      return updated;
    });

    // Simulate the workflow sequence with delays - ALL MOCK DATA
    // Phase 1: VAPI Call in Progress (3 seconds)
    setTimeout(() => {
      // Shelter agent completes VAPI call
      setAgents(prev => prev.map(agent => {
        if (agent.id === "shelter") {
          return {
            ...agent,
            status: "completed",
            currentTask: "VAPI call completed - Shelter confirmed",
            progress: 100,
            lastActivity: "Harbor Light Center confirmed - 6-7 beds available",
            logs: [
              {
                id: "1",
                timestamp: new Date().toISOString(),
                message: "🎤 Vapi Call Transcription: AI: Hello. This is CareLink. Calling from San Francisco General Hospital. We have a homeless patient being discharged tonight and need to check if you have available beds and can accommodate them. You have a moment to discuss capacity and services? User: Yes. I do. Yes to all of your questions and also we have 6-7 beds available at the shelter, and we can accommodate to anyone if even people in a wheelchair. Yeah. And, also, I'm very I'm very busy. So AI: Thanks for the User: see you there.",
                type: "vapi_transcription",
                agent: "shelter",
                agentName: "Shelter Agent",
                agentColor: "#10B981",
                transcription: {
                  speaker: "AI",
                  text: "AI: Hello. This is CareLink. Calling from San Francisco General Hospital. We have a homeless patient being discharged tonight and need to check if you have available beds and can accommodate them. You have a moment to discuss capacity and services? User: Yes. I do. Yes to all of your questions and also we have 6-7 beds available at the shelter, and we can accommodate to anyone if even people in a wheelchair. Yeah. And, also, I'm very I'm very busy. So AI: Thanks for the User: see you there.",
                  duration: "2:15"
                }
              },
              {
                id: "2",
                timestamp: new Date().toISOString(),
                message: "✅ VAPI call completed successfully - Shelter confirmed availability",
                type: "success",
                agent: "shelter",
                agentName: "Shelter Agent",
                agentColor: "#10B981"
              },
              {
                id: "3",
                timestamp: new Date().toISOString(),
                message: "📞 Notifying Coordinator Agent of successful placement",
                type: "info",
                agent: "shelter",
                agentName: "Shelter Agent",
                agentColor: "#10B981"
              }
            ]
          };
        }
        return agent;
      }));
    }, 1000);

      setTimeout(() => {
        // Coordinator completes orchestration after VAPI call
        setAgents(prev => prev.map(agent => {
          if (agent.id === "coordinator") {
            return {
              ...agent,
              status: "completed",
              currentTask: "VAPI call completed - Orchestrating remaining agents",
              progress: 100,
              lastActivity: "VAPI call successful - Coordinating remaining agents",
              logs: [
                {
                  id: "3",
                  timestamp: new Date().toISOString(),
                  message: "🤖 Initiating VAPI call to Shelter Agent",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "4",
                  timestamp: new Date().toISOString(),
                  message: "📞 VAPI call in progress - waiting for shelter response",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "5",
                  timestamp: new Date().toISOString(),
                  message: "✅ VAPI call completed - Shelter confirmed availability",
                  type: "success",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "6",
                  timestamp: new Date().toISOString(),
                  message: "🛏️ Available beds: 6-7 (confirmed by VAPI call)",
                  type: "success",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "7",
                  timestamp: new Date().toISOString(),
                  message: "📞 Now notifying Social Worker Agent about shelter confirmation",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "8",
                  timestamp: new Date().toISOString(),
                  message: "🚛 Alerting Transport Agent for pickup scheduling",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "9",
                  timestamp: new Date().toISOString(),
                  message: "📦 Coordinating with Resource Agent for care package",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "10",
                  timestamp: new Date().toISOString(),
                  message: "💊 Notifying Pharmacy Agent about medication needs",
                  type: "info",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "11",
                  timestamp: new Date().toISOString(),
                  message: "✅ All agents coordinated successfully after VAPI completion",
                  type: "success",
                  agent: "coordinator",
                  agentName: "Coordinator Agent",
                  agentColor: "#8B5CF6"
                }
              ]
            };
          }
          return agent;
        }));
      }, 2000);

    setTimeout(() => {
      // Social worker assigns case manager after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "social") {
          return {
            ...agent,
            status: "completed",
            currentTask: "Case manager assigned after VAPI confirmation",
            progress: 100,
            lastActivity: "Sarah Johnson assigned - VAPI call successful, follow-up scheduled",
              logs: [
                {
                  id: "12",
                  timestamp: new Date().toISOString(),
                  message: "📞 Received notification from Coordinator Agent - VAPI call completed, shelter confirmed",
                  type: "info",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "13",
                  timestamp: new Date().toISOString(),
                  message: "👥 Case manager Sarah Johnson assigned - follow-up scheduled for 1/22/25",
                  type: "social_worker_assigned",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "14",
                  timestamp: new Date().toISOString(),
                  message: "🏥 Primary care appointment scheduled within 7 days (URGENT)",
                  type: "success",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "15",
                  timestamp: new Date().toISOString(),
                  message: "🫁 Pulmonology appointment scheduled within 2 weeks",
                  type: "success",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "16",
                  timestamp: new Date().toISOString(),
                  message: "📋 Coordinating with Eligibility Agent for benefit verification",
                  type: "info",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "17",
                  timestamp: new Date().toISOString(),
                  message: "✅ Social services coordination complete",
                  type: "success",
                  agent: "social",
                  agentName: "Social Worker Agent",
                  agentColor: "#8B5CF6"
                }
              ]
          };
        }
        return agent;
      }));
    }, 3000);

    setTimeout(() => {
      // Transport agent schedules ride after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "transport") {
          return {
            ...agent,
            status: "completed",
            currentTask: "Transport scheduled after VAPI confirmation",
            progress: 100,
            lastActivity: "Mike Johnson - Wheelchair accessible van at 2:30 PM (VAPI confirmed)",
              logs: [
                {
                  id: "18",
                  timestamp: new Date().toISOString(),
                  message: "📞 Received alert from Coordinator Agent - VAPI call completed, scheduling pickup",
                  type: "info",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                },
                {
                  id: "19",
                  timestamp: new Date().toISOString(),
                  message: "🚛 Transport scheduled with Mike Johnson",
                  type: "transport_scheduled",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                },
                {
                  id: "20",
                  timestamp: new Date().toISOString(),
                  message: "🚐 Vehicle: Wheelchair accessible medical transport",
                  type: "info",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                },
                {
                  id: "21",
                  timestamp: new Date().toISOString(),
                  message: "📞 Driver contact: (415) 555-1234",
                  type: "info",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                },
                {
                  id: "22",
                  timestamp: new Date().toISOString(),
                  message: "⏰ Pickup time: 2:30 PM, ETA: 2:55 PM",
                  type: "success",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                },
                {
                  id: "23",
                  timestamp: new Date().toISOString(),
                  message: "📋 Notifying Resource Agent about delivery coordination",
                  type: "info",
                  agent: "transport",
                  agentName: "Transport Agent",
                  agentColor: "#3B82F6"
                }
              ]
          };
        }
        return agent;
      }));
    }, 4000);

    setTimeout(() => {
      // Resource agent prepares care package after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "resource") {
          return {
            ...agent,
            status: "completed",
            currentTask: "Care package prepared after VAPI confirmation",
            progress: 100,
            lastActivity: "Hygiene kit, clothing, food supplies ready (VAPI confirmed)",
              logs: [
                {
                  id: "24",
                  timestamp: new Date().toISOString(),
                  message: "📞 Received coordination request from Coordinator Agent - VAPI call completed",
                  type: "info",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                },
                {
                  id: "25",
                  timestamp: new Date().toISOString(),
                  message: "📦 Care package prepared with winter clothing and supplies",
                  type: "resource_ready",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                },
                {
                  id: "26",
                  timestamp: new Date().toISOString(),
                  message: "🧥 Items: Warm jacket, thermal underwear, wool socks, waterproof boots",
                  type: "info",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                },
                {
                  id: "27",
                  timestamp: new Date().toISOString(),
                  message: "🍽️ Food vouchers for 3 days provided",
                  type: "info",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                },
                {
                  id: "28",
                  timestamp: new Date().toISOString(),
                  message: "📦 Delivery to Harbor Light Center at 3:00 PM",
                  type: "success",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                },
                {
                  id: "29",
                  timestamp: new Date().toISOString(),
                  message: "🚛 Coordinating delivery timing with Transport Agent",
                  type: "info",
                  agent: "resource",
                  agentName: "Resource Agent",
                  agentColor: "#EF4444"
                }
              ]
          };
        }
        return agent;
      }));
    }, 5000);

    setTimeout(() => {
      // Pharmacy agent prepares medications after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "pharmacy") {
          return {
            ...agent,
            status: "completed",
            currentTask: "Medications ready after VAPI confirmation",
            progress: 100,
            lastActivity: "Methadone 50mg, Lisinopril 10mg ready for pickup (VAPI confirmed)",
              logs: [
                {
                  id: "30",
                  timestamp: new Date().toISOString(),
                  message: "📞 Received medication notification from Coordinator Agent - VAPI call completed",
                  type: "info",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "31",
                  timestamp: new Date().toISOString(),
                  message: "💊 Medications ready: Albuterol inhaler, Spiriva, Prednisone, Metformin, Lisinopril, Aspirin",
                  type: "pharmacy_ready",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "32",
                  timestamp: new Date().toISOString(),
                  message: "🏥 Pickup location: SF General Hospital Pharmacy",
                  type: "info",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "33",
                  timestamp: new Date().toISOString(),
                  message: "📞 Pharmacy contact: (415) 206-8387",
                  type: "info",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "34",
                  timestamp: new Date().toISOString(),
                  message: "⏰ Ready for pickup at 2:30 PM",
                  type: "success",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                },
                {
                  id: "35",
                  timestamp: new Date().toISOString(),
                  message: "🚛 Coordinating pickup timing with Transport Agent",
                  type: "info",
                  agent: "pharmacy",
                  agentName: "Pharmacy Agent",
                  agentColor: "#8B5CF6"
                }
              ]
          };
        }
        return agent;
      }));
    }, 6000);

    setTimeout(() => {
      // Eligibility agent verifies benefits after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "eligibility") {
          return {
            ...agent,
            status: "completed",
            currentTask: "Benefits verified after VAPI confirmation",
            progress: 100,
            lastActivity: "Medi-Cal, SNAP, General Assistance confirmed (VAPI confirmed)",
              logs: [
                {
                  id: "36",
                  timestamp: new Date().toISOString(),
                  message: "📞 Received coordination request from Social Worker Agent - VAPI call completed",
                  type: "info",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                },
                {
                  id: "37",
                  timestamp: new Date().toISOString(),
                  message: "✅ Benefits verified: Medi-Cal (Emergency enrollment), SNAP, General Assistance",
                  type: "eligibility_verified",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                },
                {
                  id: "38",
                  timestamp: new Date().toISOString(),
                  message: "🏥 Emergency Medi-Cal enrollment completed",
                  type: "success",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                },
                {
                  id: "39",
                  timestamp: new Date().toISOString(),
                  message: "💳 Insurance card provided and effective immediately",
                  type: "success",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                },
                {
                  id: "40",
                  timestamp: new Date().toISOString(),
                  message: "📞 Case worker: Jane Smith, (415) 206-5555",
                  type: "info",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                },
                {
                  id: "41",
                  timestamp: new Date().toISOString(),
                  message: "📋 Sharing benefit status with all coordinating agents",
                  type: "info",
                  agent: "eligibility",
                  agentName: "Eligibility Agent",
                  agentColor: "#F59E0B"
                }
              ]
          };
        }
        return agent;
      }));
    }, 7000);

    setTimeout(() => {
      // Analytics agent monitors system after VAPI call completion
      setAgents(prev => prev.map(agent => {
        if (agent.id === "analytics") {
          return {
            ...agent,
            status: "completed",
            currentTask: "System health monitored after VAPI completion",
            progress: 100,
            lastActivity: "All systems operational - 7/7 agents successful (VAPI completed)",
              logs: [
                {
                  id: "42",
                  timestamp: new Date().toISOString(),
                  message: "📊 Monitoring all agent communications and status updates - VAPI call completed",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "43",
                  timestamp: new Date().toISOString(),
                  message: "📈 Tracking Coordinator → Shelter Agent communication",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "44",
                  timestamp: new Date().toISOString(),
                  message: "📈 Tracking Social Worker ↔ Eligibility Agent coordination",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "45",
                  timestamp: new Date().toISOString(),
                  message: "📈 Tracking Transport ↔ Resource Agent delivery coordination",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "46",
                  timestamp: new Date().toISOString(),
                  message: "📈 Tracking Transport ↔ Pharmacy Agent pickup coordination",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "47",
                  timestamp: new Date().toISOString(),
                  message: "📊 System health: Excellent - 7/7 agents successful, avg response 2.3min",
                  type: "analytics_complete",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "48",
                  timestamp: new Date().toISOString(),
                  message: "🎯 Coordination efficiency: 100% success rate",
                  type: "success",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "49",
                  timestamp: new Date().toISOString(),
                  message: "⏱️ Average response time: 2.3 minutes per agent",
                  type: "info",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                },
                {
                  id: "50",
                  timestamp: new Date().toISOString(),
                  message: "✅ All systems operational - workflow complete",
                  type: "success",
                  agent: "analytics",
                  agentName: "Analytics Agent",
                  agentColor: "#10B981"
                }
              ]
          };
        }
        return agent;
      }));
    }, 8000);

      // Navigate to final report after workflow completes
      setTimeout(() => {
        // Set workflow data with Marcus Thompson
        setWorkflowData({
          case_id: "mock-case",
          patient: {
            contact_info: {
              name: "Marcus Thompson",
              phone1: "(415) 555-0100",
              date_of_birth: "1978-03-22",
              address: "123 Mission St",
              city: "San Francisco",
              state: "CA",
              zip: "94103"
            }
          },
          status: "coordinated",
          current_step: "All agents completed successfully",
          shelter: {
            name: "Harbor Light Center",
            address: "1275 Howard St, San Francisco, CA 94103",
            available_beds: 6,
            accessibility: true
          },
          transport: {
            driver: "Mike Johnson",
            phone: "(415) 555-1234",
            vehicle_type: "Wheelchair accessible medical transport",
            pickup_time: "2:30 PM",
            eta: "2:55 PM",
            route: [
              { lat: 37.7749, lng: -122.4194 }, // SF General Hospital
              { lat: 37.7755, lng: -122.4180 }, // Waypoint 1
              { lat: 37.7760, lng: -122.4165 }, // Waypoint 2
              { lat: 37.7765, lng: -122.4150 }, // Waypoint 3
              { lat: 37.7770, lng: -122.4135 }, // Waypoint 4
              { lat: 37.7775, lng: -122.4120 }  // Harbor Light Center
            ]
          }
        });

        // Trigger navigation to final report and update map
        const reportEvent = new CustomEvent('navigateToReport');
        const mapUpdateEvent = new CustomEvent('updateMapData');
        window.dispatchEvent(reportEvent);
        window.dispatchEvent(mapUpdateEvent);
      }, 9000);
  };

  const initializeAgents = () => {
    console.log("🎯 Initializing agents...");
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
    console.log("🎯 Setting initial agents:", initialAgents.length);
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
              type: isTranscription ? "transcription" : log.includes("✅") ? "success" : "info",
              agentName: agent.name,
              agentColor: colors.border
            };
            
            // Parse transcription if present
            if (isTranscription) {
              // Handle Vapi transcription format
              const vapiTranscriptionMatch = log.match(/🎤 Vapi Call Transcription: (.+)/);
              if (vapiTranscriptionMatch) {
                const fullTranscription = vapiTranscriptionMatch[1];
                
                // Parse the conversation format (AI: ... User: ...)
                const lines = fullTranscription.split('\n');
                const conversation = lines.map(line => {
                  if (line.startsWith('AI:')) {
                    return { speaker: 'AI', text: line.substring(3).trim() };
                  } else if (line.startsWith('User:')) {
                    return { speaker: 'User', text: line.substring(5).trim() };
                  }
                  return null;
                }).filter(Boolean);
                
                if (conversation.length > 0) {
                  // Use the first speaker for the main transcription
                  logEntry.transcription = {
                    speaker: conversation[0]?.speaker || 'AI',
                    text: conversation.map(c => c?.text || '').join(' ')
                  };
                } else {
                  // Fallback to full transcription
                  logEntry.transcription = {
                    speaker: 'AI',
                    text: fullTranscription
                  };
                }
              } else {
                // Handle old format
                const transcriptionMatch = log.match(/🎙️ TRANSCRIPTION - ([^:]+): '([^']+)'/);
                if (transcriptionMatch) {
                  logEntry.transcription = {
                    speaker: transcriptionMatch[1],
                    text: transcriptionMatch[2]
                  };
                }
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

  const getAgentColorByName = (agentName: string): string => {
    const agentColorMap: Record<string, string> = {
      'parser_agent': '#8B5CF6',
      'coordinator_agent': '#3B82F6',
      'social_worker_agent': '#10B981',
      'shelter_agent': '#F59E0B',
      'transport_agent': '#EF4444',
      'resource_agent': '#8B5CF6',
      'pharmacy_agent': '#06B6D4',
      'eligibility_agent': '#84CC16',
      'analytics_agent': '#F97316',
      'system': '#6B7575'
    };
    return agentColorMap[agentName] || '#6B7575';
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

  // Show case interface if a case is selected
  if (showCaseInterface && caseId) {
    return (
      <CaseWorkflowInterface 
        caseId={caseId} 
        onBack={() => setShowCaseInterface(false)} 
      />
    );
  }

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
        
        {/* Start Coordination Button */}
        {caseId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex space-x-4"
          >
            <button
              onClick={() => setShowCaseInterface(true)}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#0D7377] to-[#14919B] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">Open Case Workflow Interface</span>
            </button>
            <button
              onClick={startAgentCoordination}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#D17A5C] to-[#E8A87C] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Start Agent Coordination</span>
            </button>
          </motion.div>
        )}
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
                    {workflowData.patient.contact_info?.name || "Marcus Thompson"}
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
                      : false
                      ? 'linear-gradient(135deg, rgba(200, 92, 92, 0.08), rgba(200, 92, 92, 0.03))'
                      : 'rgba(13, 115, 119, 0.03)',
                    border: `1px solid ${
                      log.type === "transcription" ? '#8B5CF6' :
                      log.type === "success" ? '#2D9F7E' :
                      '#0D7377'
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
                      {false && (
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
                              {log.transcription.speaker === 'AI' ? 'CareLink Bot' : log.transcription.speaker}
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
        {/* Debug info */}
        {agents.length === 0 && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">No agents loaded. Click "Start Agent Coordination" to begin.</p>
          </div>
        )}
        {agents.length > 0 && (
          <div className="text-center p-2 bg-green-50 rounded-lg mb-4">
            <p className="text-green-800">✅ {agents.length} agents loaded and ready</p>
          </div>
        )}
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
                      onClick={() => {
                        console.log("🎯 Agent clicked:", agent.name, agent.id);
                        setSelectedAgent(agent);
                      }}
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

                      {/* Agent-specific MapBox for agents that use maps */}
                      {(agent.id === "shelter" || agent.id === "transport" || agent.id === "resource") && 
                       (agent.status === "working" || agent.status === "completed") && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.3 }}
                          className="mt-4"
                        >
                          <AgentMapBox
                            agentType={agent.type}
                            agentData={agent}
                            workflowData={workflowData}
                            className="w-full"
                          />
                        </motion.div>
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
      {selectedAgent ? (
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
                      {false && (
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
                  ) : log.conversationLogs && log.conversationLogs.length > 0 ? (
                    <div className="space-y-2">
                      {log.conversationLogs.map((conversationLog: any, idx: number) => (
                        <div key={idx} className="bg-green-50 p-3 rounded border-l-2 border-green-400">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {conversationLog.agent}: {conversationLog.action}
                            </span>
                          </div>
                          <div className="text-sm text-green-700 mb-2">
                            {conversationLog.message}
                          </div>
                          {conversationLog.transcription && (
                            <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                              <div className="font-medium text-blue-800 text-xs">Vapi Transcription:</div>
                              <div className="text-blue-700 text-sm">{conversationLog.transcription}</div>
                            </div>
                          )}
                          <div className="text-xs text-green-600">
                            {new Date(conversationLog.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
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
      ) : (
        <div className="mt-8 text-center p-8 bg-gray-50 rounded-3xl">
          <p className="text-gray-600">Click on any agent above to view detailed logs</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowTimeline;
