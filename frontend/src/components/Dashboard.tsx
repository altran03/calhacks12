"use client";

import { motion } from "framer-motion";
import DischargeIntake from "./DischargeIntake";
import WorkflowTimeline from "./WorkflowTimeline";
import MapView from "./MapView";
import TransportTracker from "./TransportTracker";
import CaseSummary from "./CaseSummary";

interface DashboardProps {
  activeView: "dashboard" | "intake" | "timeline" | "map" | "transport";
  setActiveView: (view: "dashboard" | "intake" | "timeline" | "map" | "transport") => void;
}

export default function Dashboard({ activeView, setActiveView }: DashboardProps) {
  const views = [
    { id: "dashboard", label: "Overview", icon: "📊" },
    { id: "intake", label: "Discharge Intake", icon: "📝" },
    { id: "timeline", label: "Workflow Timeline", icon: "⏱️" },
    { id: "map", label: "SF Map View", icon: "🗺️" },
    { id: "transport", label: "Transport Tracker", icon: "🚐" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-gray-200">
        <div className="flex space-x-2">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeView === view.id
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{view.icon}</span>
              <span className="font-medium">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6"
      >
        {activeView === "dashboard" && <CaseSummary />}
        {activeView === "intake" && <DischargeIntake />}
        {activeView === "timeline" && <WorkflowTimeline />}
        {activeView === "map" && <MapView />}
        {activeView === "transport" && <TransportTracker />}
      </motion.div>
    </div>
  );
}
