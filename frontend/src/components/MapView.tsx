"use client";

import React, { useState, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";

interface Shelter {
  name: string;
  address: string;
  capacity: number;
  available_beds: number;
  accessibility: boolean;
  phone: string;
  services: string[];
  location: {
    lat: number;
    lng: number;
  };
}

interface Workflow {
  id: string;
  patientName: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  currentStep: string;
  assignedShelter?: string;
  eta?: string;
}

export default function MapView() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");

  // Mapbox token - you'll need to add this to your environment variables
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

  useEffect(() => {
    setIsClient(true);
    fetchShelters();
    fetchWorkflows();
  }, []);

  const fetchShelters = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/shelters");
      const data = await response.json();
      setShelters(data);
    } catch (error) {
      console.error("Error fetching shelters:", error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      // Simulate fetching workflow data
      const mockWorkflows: Workflow[] = [
        {
          id: "WF001",
          patientName: "John Doe",
          status: "in_progress",
          currentStep: "Transport Coordination",
          assignedShelter: "Mission Neighborhood Resource Center",
          eta: "15 mins",
        },
        {
          id: "WF002",
          patientName: "Jane Smith",
          status: "completed",
          currentStep: "Follow-up Care",
          assignedShelter: "Hamilton Family Center",
        },
      ];
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const getShelterColor = (shelter: Shelter) => {
    const availability = shelter.available_beds / shelter.capacity;
    if (availability > 0.5) return "#10B981"; // green
    if (availability > 0.2) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  const getShelterIcon = (shelter: Shelter) => {
    const color = getShelterColor(shelter);
    return (
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <MapPin className="w-3 h-3 text-white" />
      </div>
    );
  };

  const getWorkflowStatusColor = (status: Workflow["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getWorkflowStatusIcon = (status: Workflow["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isClient) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">San Francisco Shelter Map</h2>
        <p className="text-gray-600">Real-time shelter availability and patient coordination</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Workflows */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Workflows</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {workflows.map((workflow) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-3 rounded-lg border ${getWorkflowStatusColor(workflow.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{workflow.patientName}</span>
                      {getWorkflowStatusIcon(workflow.status)}
                    </div>
                    <p className="text-sm opacity-75">{workflow.currentStep}</p>
                    {workflow.assignedShelter && (
                      <p className="text-xs mt-1 opacity-60">Shelter: {workflow.assignedShelter}</p>
                    )}
                    {workflow.eta && (
                      <p className="text-xs mt-1 opacity-60">ETA: {workflow.eta}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Shelter Legend */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shelter Status</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Good Availability (&gt;50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Limited Availability (20-50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Low Availability (&lt;20%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: -122.4194,
                latitude: 37.7749,
                zoom: 12,
              }}
              style={{ width: "100%", height: "600px" }}
              mapStyle={mapStyle}
            >
              <NavigationControl position="top-left" />
              <FullscreenControl position="top-left" />

              {shelters.map((shelter) => (
                <Marker
                  key={shelter.name}
                  longitude={shelter.location.lng}
                  latitude={shelter.location.lat}
                  onClick={() => setSelectedShelter(shelter)}
                >
                  {getShelterIcon(shelter)}
                </Marker>
              ))}

              {selectedShelter && (
                <Popup
                  longitude={selectedShelter.location.lng}
                  latitude={selectedShelter.location.lat}
                  onClose={() => setSelectedShelter(null)}
                  closeButton={true}
                  closeOnClick={false}
                >
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedShelter.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedShelter.address}</p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-500" />
                        Available: {selectedShelter.available_beds}/{selectedShelter.capacity} beds
                      </p>
                      <p className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Accessibility: {selectedShelter.accessibility ? "Yes" : "No"}
                      </p>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-purple-500" />
                        {selectedShelter.phone}
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Services:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedShelter.services.map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>
      </div>
    </div>
  );
}