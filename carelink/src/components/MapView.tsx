"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Phone, Clock, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Fix for default markers in react-leaflet
if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface Shelter {
  name: string;
  address: string;
  capacity: number;
  available_beds: number;
  accessibility: boolean;
  phone: string;
  services: string[];
  location: { lat: number; lng: number };
}

export default function MapView() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

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
      const response = await fetch("http://localhost:8000/api/workflows");
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const getShelterColor = (shelter: Shelter) => {
    const availability = shelter.available_beds / shelter.capacity;
    if (availability > 0.5) return "green";
    if (availability > 0.2) return "yellow";
    return "red";
  };

  const getShelterIcon = (shelter: Shelter) => {
    if (typeof window === "undefined") return null;
    
    const color = getShelterColor(shelter);
    const L = require("leaflet");
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">San Francisco Shelter Map</h2>
        <p className="text-gray-600">Real-time shelter availability and patient placements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Legend and Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Shelter Status</h3>
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

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Active Cases</h3>
            <div className="space-y-2">
              {workflows.slice(0, 3).map((workflow) => (
                <div key={workflow.case_id} className="p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-900">{workflow.patient.name}</p>
                  <p className="text-xs text-gray-600">{workflow.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {!isClient ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[37.7749, -122.4194]}
                zoom={12}
                style={{ height: "600px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {shelters.map((shelter) => (
                  <Marker
                    key={shelter.name}
                    position={[shelter.location.lat, shelter.location.lng]}
                    icon={getShelterIcon(shelter)}
                    eventHandlers={{
                      click: () => setSelectedShelter(shelter),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-gray-900">{shelter.name}</h3>
                        <p className="text-sm text-gray-600">{shelter.address}</p>
                        <p className="text-sm text-gray-600">
                          Available: {shelter.available_beds}/{shelter.capacity} beds
                        </p>
                        <p className="text-sm text-gray-600">Phone: {shelter.phone}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>

      {/* Shelter Details Modal */}
      {selectedShelter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedShelter(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedShelter.name}</h3>
              <button
                onClick={() => setSelectedShelter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{selectedShelter.address}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedShelter.available_beds}/{selectedShelter.capacity} beds available
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{selectedShelter.phone}</span>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedShelter.accessibility ? "Wheelchair accessible" : "Not wheelchair accessible"}
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedShelter.services.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
