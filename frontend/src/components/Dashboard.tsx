"use client";

import { motion, AnimatePresence } from "framer-motion";
import DischargeIntake from "./DischargeIntake";
import WorkflowTimeline from "./WorkflowTimeline";
import MapView from "./MapView";
import TransportTracker from "./TransportTracker";
import CaseSummary from "./CaseSummary";
import { 
  LayoutGrid, 
  FileText, 
  Activity, 
  Map, 
  Truck,
  Sparkles
} from "lucide-react";

interface DashboardProps {
  activeView: "dashboard" | "intake" | "timeline" | "map" | "transport";
  setActiveView: (view: "dashboard" | "intake" | "timeline" | "map" | "transport") => void;
}

export default function Dashboard({ activeView, setActiveView }: DashboardProps) {
  const views = [
    { id: "dashboard", label: "Overview", icon: LayoutGrid, gradient: "from-[#0D7377] to-[#14919B]" },
    { id: "intake", label: "Patient Intake", icon: FileText, gradient: "from-[#D17A5C] to-[#E8A87C]" },
    { id: "timeline", label: "Agent Workflow", icon: Activity, gradient: "from-[#2D9F7E] to-[#3DB896]" },
    { id: "map", label: "Resource Map", icon: Map, gradient: "from-[#E8A87C] to-[#F4C490]" },
    { id: "transport", label: "Transport Hub", icon: Truck, gradient: "from-[#C85C5C] to-[#D17A7A]" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Hero Section with Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative"
      >
        <div className="mb-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl font-bold mb-3"
            style={{ 
              fontFamily: 'Crimson Pro, serif',
              color: '#1A1D1E',
              letterSpacing: '-0.02em'
            }}
          >
            Healthcare Coordination
            <span className="ml-3 inline-block">
              <Sparkles className="w-10 h-10 text-[#D17A5C] inline" />
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg"
            style={{ color: '#6B7575', fontWeight: 400 }}
          >
            Multi-agent AI orchestration for seamless patient discharge workflows
          </motion.p>
        </div>

        {/* Navigation Tabs */}
        <div 
          className="relative p-3 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #E0D5C7',
            boxShadow: '0 8px 32px rgba(13, 115, 119, 0.08)'
          }}
        >
          <div className="grid grid-cols-5 gap-2">
            {views.map((view, index) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <motion.button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`
                      relative px-6 py-4 rounded-2xl transition-all duration-300
                      ${isActive ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
                    `}
                    style={{
                      background: isActive 
                        ? `linear-gradient(135deg, ${view.gradient.includes('0D7377') ? '#0D7377' : view.gradient.includes('D17A5C') ? '#D17A5C' : view.gradient.includes('2D9F7E') ? '#2D9F7E' : view.gradient.includes('E8A87C') ? '#E8A87C' : '#C85C5C'}, ${view.gradient.includes('14919B') ? '#14919B' : view.gradient.includes('E8A87C') ? '#E8A87C' : view.gradient.includes('3DB896') ? '#3DB896' : view.gradient.includes('F4C490') ? '#F4C490' : '#D17A7A'})`
                        : 'rgba(255, 255, 255, 0.5)',
                      color: isActive ? 'white' : '#1A1D1E',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: isActive ? 'transparent' : '#E0D5C7'
                    }}
                  >
                    {/* Glow effect when active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: `linear-gradient(135deg, ${view.gradient.includes('0D7377') ? 'rgba(13, 115, 119, 0.3)' : view.gradient.includes('D17A5C') ? 'rgba(209, 122, 92, 0.3)' : view.gradient.includes('2D9F7E') ? 'rgba(45, 159, 126, 0.3)' : view.gradient.includes('E8A87C') ? 'rgba(232, 168, 124, 0.3)' : 'rgba(200, 92, 92, 0.3)'}, transparent)`,
                          filter: 'blur(20px)',
                          transform: 'scale(1.1)',
                          zIndex: -1
                        }}
                      />
                    )}
                    
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#1A1D1E]'}`} />
                      <span className="text-sm font-semibold">{view.label}</span>
                    </div>

                    {/* Subtle shimmer on hover */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Content Area with Smooth Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #E0D5C7',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 8px 32px rgba(13, 115, 119, 0.08)'
          }}
        >
          {/* Decorative corner accents */}
          <div 
            className="absolute top-0 left-0 w-24 h-24 opacity-10"
            style={{
              background: 'linear-gradient(135deg, #0D7377 0%, transparent 100%)',
              borderTopLeftRadius: '24px'
            }}
          />
          <div 
            className="absolute bottom-0 right-0 w-32 h-32 opacity-10"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, #D17A5C 100%)',
              borderBottomRightRadius: '24px'
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {activeView === "dashboard" && <CaseSummary />}
            {activeView === "intake" && <DischargeIntake />}
            {activeView === "timeline" && <WorkflowTimeline />}
            {activeView === "map" && <MapView />}
            {activeView === "transport" && <TransportTracker />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
