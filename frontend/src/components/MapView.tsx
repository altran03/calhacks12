"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Phone, Clock, CheckCircle, AlertCircle, Truck } from "lucide-react";

// Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import("react-map-gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

const Marker = dynamic(() => import("react-map-gl").then((mod) => mod.Marker), {
  ssr: false,
});

const Popup = dynamic(() => import("react-map-gl").then((mod) => mod.Popup), {
  ssr: false,
});

const NavigationControl = dynamic(() => import("react-map-gl").then((mod) => mod.NavigationControl), {
  ssr: false,
});

const FullscreenControl = dynamic(() => import("react-map-gl").then((mod) => mod.FullscreenControl), {
  ssr: false,
});

const Source = dynamic(() => import("react-map-gl").then((mod) => mod.Source), {
  ssr: false,
});

const Layer = dynamic(() => import("react-map-gl").then((mod) => mod.Layer), {
  ssr: false,
});

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
  transport?: {
    provider: string;
    vehicle_type: string;
    eta: string;
    route: Array<{lat: number; lng: number}>;
    status: string;
  };
}

export default function MapView() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");
  const [mapError, setMapError] = useState<string | null>(null);

  // Mapbox token - using a valid public token for development
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

  // Validate Mapbox token
  useEffect(() => {
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "your_mapbox_token_here") {
      setMapError("Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.");
    }
  }, [MAPBOX_TOKEN]);

  useEffect(() => {
    setIsClient(true);
    fetchShelters();
    fetchWorkflows();
    
    // Poll for workflow updates every 3 seconds
    const pollInterval = setInterval(() => {
      fetchWorkflows();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const fetchShelters = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/shelters");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setShelters(data);
    } catch (error) {
      console.error("Error fetching shelters:", error);
      // Fallback to mock data if API is not available
      setShelters([
        {
          name: "Mission Neighborhood Resource Center",
          address: "165 Capp St, San Francisco, CA 94110",
          capacity: 50,
          available_beds: 12,
          accessibility: true,
          phone: "(415) 431-4000",
          services: ["medical respite", "case management", "meals"],
          location: { lat: 37.7749, lng: -122.4194 }
        },
        {
          name: "Hamilton Family Center",
          address: "260 Golden Gate Ave, San Francisco, CA 94102",
          capacity: 30,
          available_beds: 8,
          accessibility: true,
          phone: "(415) 292-5222",
          services: ["family shelter", "childcare", "counseling"],
          location: { lat: 37.7849, lng: -122.4094 }
        },
        {
          name: "St. Anthony's Foundation",
          address: "150 Golden Gate Ave, San Francisco, CA 94102",
          capacity: 100,
          available_beds: 25,
          accessibility: true,
          phone: "(415) 241-2600",
          services: ["emergency shelter", "medical clinic", "dining room"],
          location: { lat: 37.7849, lng: -122.4094 }
        }
      ]);
    }
  };

  const fetchWorkflows = async () => {
    try {
      // Fetch real workflow data
      const storedCaseId = localStorage.getItem('current_case_id');
      if (storedCaseId) {
        const response = await fetch(`http://localhost:8000/api/workflows/${storedCaseId}`);
        if (response.ok) {
          const workflowData = await response.json();
          
          // Convert backend workflow to frontend format
          const workflow: Workflow = {
            id: workflowData.case_id,
            patientName: workflowData.patient?.contact_info?.name || "Unknown",
            status: workflowData.status === "coordinated" ? "completed" : "in_progress",
            currentStep: workflowData.current_step?.replace(/_/g, ' ') || "Processing",
            assignedShelter: workflowData.shelter?.name,
            eta: workflowData.transport?.eta,
            transport: workflowData.transport
          };
          
          setWorkflows([workflow]);
          return;
        }
      }
      
      // Fallback to mock data
      const mockWorkflows: Workflow[] = [
        {
          id: "WF001",
          patientName: "John Doe",
          status: "in_progress",
          currentStep: "Transport Coordination",
          assignedShelter: "Mission Neighborhood Resource Center",
          eta: "15 mins",
          transport: {
            provider: "SF Paratransit",
            vehicle_type: "wheelchair_accessible",
            eta: "30 minutes",
            route: [
              {lat: 37.7749, lng: -122.4194},
              {lat: 37.7799, lng: -122.4144},
              {lat: 37.7824, lng: -122.4119},
              {lat: 37.7849, lng: -122.4094}
            ],
            status: "scheduled"
          }
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

          {/* Transport Details */}
          {workflows.some(w => w.transport) && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transport Details</h3>
              {workflows.filter(w => w.transport).map((workflow) => (
                <div key={workflow.id} className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{workflow.transport!.provider}</p>
                        <p className="text-xs text-gray-600 capitalize">{workflow.transport!.vehicle_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">ETA</p>
                      <p className="font-semibold text-sm text-blue-600">{workflow.transport!.eta}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Pickup</p>
                        <p className="font-medium text-gray-900">Hospital</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Dropoff</p>
                        <p className="font-medium text-gray-900">{workflow.assignedShelter || "Shelter"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Pickup</span>
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-blue-300"></div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Dropoff</span>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg text-center text-xs font-medium"
                    style={{
                      background: workflow.transport!.status === "scheduled" ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      color: workflow.transport!.status === "scheduled" ? "#3B82F6" : "#10B981"
                    }}
                  >
                    Status: {workflow.transport!.status.charAt(0).toUpperCase() + workflow.transport!.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          )}

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
            {mapError ? (
              <div className="flex items-center justify-center h-[600px] bg-gray-100">
                <div className="text-center p-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h3>
                  <p className="text-gray-600 mb-4">{mapError}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-blue-800 mb-2">To fix this issue:</p>
                    <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                      <li>Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in the frontend directory</li>
                      <li>Add <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code></li>
                      <li>Get a free token from <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Mapbox</a></li>
                      <li>Restart the development server</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : !isClient ? (
              <div className="flex items-center justify-center h-[600px] bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: -122.4194,
                  latitude: 37.7749,
                  zoom: 12,
                }}
                style={{ width: "100%", height: "600px" }}
                mapStyle={mapStyle}
                onError={(e) => {
                  console.error("Mapbox error:", e);
                  setMapError("Failed to load map. Please check your Mapbox token.");
                }}
              >
                <NavigationControl position="top-left" />
                <FullscreenControl position="top-left" />

                {/* Render transport routes */}
                {workflows.filter(w => w.transport?.route).map((workflow) => {
                  const route = workflow.transport!.route;
                  
                  // Create GeoJSON for the route
                  const routeGeoJSON = {
                    type: 'Feature' as const,
                    geometry: {
                      type: 'LineString' as const,
                      coordinates: route.map(point => [point.lng, point.lat])
                    },
                    properties: {}
                  };
                  
                  return (
                    <React.Fragment key={workflow.id}>
                      {/* Route line */}
                      <Source
                        id={`route-${workflow.id}`}
                        type="geojson"
                        data={routeGeoJSON}
                      >
                        <Layer
                          id={`route-line-${workflow.id}`}
                          type="line"
                          paint={{
                            'line-color': '#3B82F6',
                            'line-width': 4,
                            'line-opacity': 0.8
                          }}
                        />
                        <Layer
                          id={`route-line-outline-${workflow.id}`}
                          type="line"
                          paint={{
                            'line-color': '#1E40AF',
                            'line-width': 6,
                            'line-opacity': 0.4
                          }}
                        />
                      </Source>
                      
                      {/* Pickup marker */}
                      <Marker
                        longitude={route[0].lng}
                        latitude={route[0].lat}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                            Pickup
                          </div>
                        </div>
                      </Marker>
                      
                      {/* Dropoff marker */}
                      <Marker
                        longitude={route[route.length - 1].lng}
                        latitude={route[route.length - 1].lat}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                            Dropoff
                          </div>
                        </div>
                      </Marker>
                    </React.Fragment>
                  );
                })}

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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}