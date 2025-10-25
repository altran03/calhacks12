"use client";

import { Heart, Shield, Users, MapPin, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="bg-white/70 backdrop-blur-xl border-b border-[#E0D5C7] sticky top-0 z-50"
      style={{
        boxShadow: '0 4px 24px rgba(13, 115, 119, 0.06)'
      }}
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              className="relative flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0D7377 0%, #14919B 100%)',
                boxShadow: '0 8px 24px rgba(13, 115, 119, 0.25)'
              }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Heart className="w-7 h-7 text-white" fill="white" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            </motion.div>
            <div>
              <h1 
                className="text-3xl font-bold tracking-tight"
                style={{ 
                  fontFamily: 'Crimson Pro, serif',
                  background: 'linear-gradient(135deg, #0D7377, #D17A5C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                CareLink
              </h1>
              <p className="text-sm font-medium" style={{ color: '#6B7575' }}>
                AI-Powered Healthcare Coordination
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <motion.div 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0D7377]/5"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(13, 115, 119, 0.1)' }}
            >
              <Shield className="w-4 h-4" style={{ color: '#0D7377' }} />
              <span className="text-sm font-medium" style={{ color: '#0D7377' }}>HIPAA Compliant</span>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#D17A5C]/5"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(209, 122, 92, 0.1)' }}
            >
              <Activity className="w-4 h-4" style={{ color: '#D17A5C' }} />
              <span className="text-sm font-medium" style={{ color: '#D17A5C' }}>Live Agents</span>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#E8A87C]/5"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(232, 168, 124, 0.1)' }}
            >
              <MapPin className="w-4 h-4" style={{ color: '#E8A87C' }} />
              <span className="text-sm font-medium" style={{ color: '#E8A87C' }}>San Francisco</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
