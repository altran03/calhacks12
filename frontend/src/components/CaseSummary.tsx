"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Building2,
  Heart,
  MapPin,
  Phone,
  Calendar,
  Activity
} from "lucide-react";

export default function CaseSummary() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    averageTime: "2.5 hours"
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/workflows");
      const data = await response.json();
      setWorkflows(data);
      
      const totalCases = data.length;
      const activeCases = data.filter((w: any) => w.status === "coordinated" || w.status === "initiated").length;
      const completedCases = data.filter((w: any) => w.status === "completed").length;
      
      setStats({
        totalCases,
        activeCases,
        completedCases,
        averageTime: "2.5 hours"
      });
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "initiated":
        return { bg: "#E8A87C", text: "#8B5A3C" };
      case "coordinated":
        return { bg: "#2D9F7E", text: "#1A5F4A" };
      case "completed":
        return { bg: "#0D7377", text: "#FFFFFF" };
      default:
        return { bg: "#E0D5C7", text: "#6B7575" };
    }
  };

  const statsCards = [
    { 
      label: "Total Cases", 
      value: stats.totalCases, 
      icon: Users, 
      gradient: "from-[#0D7377] to-[#14919B]",
      bg: "rgba(13, 115, 119, 0.08)"
    },
    { 
      label: "Active Cases", 
      value: stats.activeCases, 
      icon: Activity, 
      gradient: "from-[#E8A87C] to-[#F4C490]",
      bg: "rgba(232, 168, 124, 0.08)"
    },
    { 
      label: "Completed", 
      value: stats.completedCases, 
      icon: CheckCircle, 
      gradient: "from-[#2D9F7E] to-[#3DB896]",
      bg: "rgba(45, 159, 126, 0.08)"
    },
    { 
      label: "Avg. Coordination Time", 
      value: stats.averageTime, 
      icon: TrendingUp, 
      gradient: "from-[#D17A5C] to-[#E8A87C]",
      bg: "rgba(209, 122, 92, 0.08)"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 
          className="text-4xl font-bold mb-3"
          style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
        >
          Coordination Dashboard
        </h2>
        <p style={{ color: '#6B7575', fontSize: '1.125rem' }}>
          Real-time overview of patient discharge coordination workflows
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              <div
                className="relative overflow-hidden rounded-2xl p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #E0D5C7',
                  boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {/* Gradient overlay on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradient.includes('0D7377') ? 'rgba(13, 115, 119, 0.05)' : stat.gradient.includes('E8A87C') ? 'rgba(232, 168, 124, 0.05)' : stat.gradient.includes('2D9F7E') ? 'rgba(45, 159, 126, 0.05)' : 'rgba(209, 122, 92, 0.05)'}, transparent)`
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="p-3 rounded-xl"
                      style={{
                        background: stat.bg,
                        transition: 'transform 0.4s ease'
                      }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ 
                          color: stat.gradient.includes('0D7377') ? '#0D7377' : stat.gradient.includes('E8A87C') ? '#E8A87C' : stat.gradient.includes('2D9F7E') ? '#2D9F7E' : '#D17A5C'
                        }} 
                      />
                    </div>
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        background: stat.gradient.includes('0D7377') ? '#0D7377' : stat.gradient.includes('E8A87C') ? '#E8A87C' : stat.gradient.includes('2D9F7E') ? '#2D9F7E' : '#D17A5C'
                      }}
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  
                  <p className="text-sm font-medium mb-2" style={{ color: '#6B7575' }}>
                    {stat.label}
                  </p>
                  <p 
                    className="text-3xl font-bold"
                    style={{ 
                      fontFamily: 'Crimson Pro, serif',
                      color: '#1A1D1E'
                    }}
                  >
                    {stat.value}
                  </p>
                </div>

                {/* Decorative corner */}
                <div 
                  className="absolute bottom-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 100% 100%, ${stat.gradient.includes('0D7377') ? 'rgba(13, 115, 119, 0.1)' : stat.gradient.includes('E8A87C') ? 'rgba(232, 168, 124, 0.1)' : stat.gradient.includes('2D9F7E') ? 'rgba(45, 159, 126, 0.1)' : 'rgba(209, 122, 92, 0.1)'}, transparent 70%)`,
                    borderBottomRightRadius: '1rem'
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Cases */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #E0D5C7',
          boxShadow: '0 4px 16px rgba(13, 115, 119, 0.08)'
        }}
      >
        <div 
          className="p-8 border-b"
          style={{ borderColor: '#E0D5C7' }}
        >
          <h3 
            className="text-2xl font-bold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
          >
            Recent Patient Cases
          </h3>
        </div>
        
        <div className="divide-y" style={{ divideColor: '#E0D5C7' }}>
          {workflows.slice(0, 5).map((workflow, index) => {
            const statusColors = getStatusColor(workflow.status);
            
            return (
              <motion.div
                key={workflow.case_id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (index * 0.1), duration: 0.4 }}
                whileHover={{ 
                  backgroundColor: 'rgba(13, 115, 119, 0.02)',
                  x: 8
                }}
                className="p-6 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #0D7377, #14919B)',
                        boxShadow: '0 4px 12px rgba(13, 115, 119, 0.2)'
                      }}
                    >
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Patient Info */}
                    <div className="flex-1">
                      <h4 
                        className="text-xl font-semibold mb-2"
                        style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
                      >
                        {workflow.patient.name}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" style={{ color: '#6B7575' }} />
                          <span className="text-sm" style={{ color: '#6B7575' }}>
                            {workflow.patient.hospital}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4" style={{ color: '#6B7575' }} />
                          <span className="text-sm" style={{ color: '#6B7575' }}>
                            {workflow.patient.medical_condition}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" style={{ color: '#6B7575' }} />
                          <span className="text-sm" style={{ color: '#6B7575' }}>
                            {new Date(workflow.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" style={{ color: '#6B7575' }} />
                          <span className="text-sm" style={{ color: '#6B7575' }}>
                            {workflow.shelter?.name || "Shelter TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Indicators */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ 
                              background: workflow.shelter ? '#2D9F7E' : '#E0D5C7',
                              boxShadow: workflow.shelter ? '0 0 8px rgba(45, 159, 126, 0.5)' : 'none'
                            }}
                          />
                          <span className="text-xs font-medium" style={{ color: '#6B7575' }}>
                            Shelter
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ 
                              background: workflow.transport ? '#2D9F7E' : '#E0D5C7',
                              boxShadow: workflow.transport ? '0 0 8px rgba(45, 159, 126, 0.5)' : 'none'
                            }}
                          />
                          <span className="text-xs font-medium" style={{ color: '#6B7575' }}>
                            Transport
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ 
                              background: workflow.social_worker ? '#2D9F7E' : '#E0D5C7',
                              boxShadow: workflow.social_worker ? '0 0 8px rgba(45, 159, 126, 0.5)' : 'none'
                            }}
                          />
                          <span className="text-xs font-medium" style={{ color: '#6B7575' }}>
                            Social Worker
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap"
                    style={{
                      background: statusColors.bg,
                      color: statusColors.text,
                      boxShadow: `0 2px 8px ${statusColors.bg}40`
                    }}
                  >
                    {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {workflows.length === 0 && (
          <div className="p-20 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(13, 115, 119, 0.1), rgba(209, 122, 92, 0.05))',
              }}
            >
              <Users className="w-12 h-12" style={{ color: '#6B7575' }} />
            </motion.div>
            <h3 
              className="text-2xl font-semibold mb-3"
              style={{ fontFamily: 'Crimson Pro, serif', color: '#1A1D1E' }}
            >
              No Cases Yet
            </h3>
            <p style={{ color: '#6B7575' }}>
              Start by creating a new discharge intake to see cases here.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
