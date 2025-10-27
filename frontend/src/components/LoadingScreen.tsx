"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, Brain, Truck, Home, Users, Pill, FileCheck } from "lucide-react";

interface LoadingScreenProps {
  message: string;
  agent?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, agent, progress = 0 }) => {
  const getAgentIcon = (agentName?: string) => {
    switch (agentName?.toLowerCase()) {
      case "shelter":
        return <Home className="w-8 h-8 text-blue-500" />;
      case "transport":
        return <Truck className="w-8 h-8 text-green-500" />;
      case "social worker":
        return <Users className="w-8 h-8 text-purple-500" />;
      case "pharmacy":
        return <Pill className="w-8 h-8 text-red-500" />;
      case "parser":
        return <FileCheck className="w-8 h-8 text-orange-500" />;
      default:
        return <Brain className="w-8 h-8 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl"
      >
        <div className="text-center">
          {/* Agent Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            {getAgentIcon(agent)}
          </motion.div>

          {/* Loading Spinner */}
          <div className="mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {agent ? `${agent} Agent` : "AI Agent"} Processing
          </h3>
          <p className="text-gray-600 mb-4">{message}</p>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Status Text */}
          <p className="text-sm text-gray-500">
            {progress > 0 ? `${Math.round(progress)}% Complete` : "Please wait..."}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
