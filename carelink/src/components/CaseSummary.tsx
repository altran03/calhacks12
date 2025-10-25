"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Home, Truck, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react";

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
      
      // Calculate stats
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "coordinated":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "initiated":
        return <Clock className="w-4 h-4" />;
      case "coordinated":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">CareLink Dashboard</h2>
        <p className="text-gray-600">Overview of patient discharge coordination workflows</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCases}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCases}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageTime}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {workflows.slice(0, 5).map((workflow, index) => (
            <motion.div
              key={workflow.case_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{workflow.patient.name}</h4>
                    <p className="text-sm text-gray-600">
                      {workflow.patient.hospital} • {workflow.patient.medical_condition}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(workflow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {workflow.shelter?.name || "Shelter TBD"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {workflow.transport?.provider || "Transport TBD"}
                    </p>
                  </div>
                  
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(workflow.status)}`}>
                    {getStatusIcon(workflow.status)}
                    <span className="text-sm font-medium">{workflow.status}</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${workflow.shelter ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-600">Shelter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${workflow.transport ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-600">Transport</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${workflow.social_worker ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-600">Social Worker</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {workflows.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Yet</h3>
            <p className="text-gray-600">Start by creating a new discharge intake to see cases here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
