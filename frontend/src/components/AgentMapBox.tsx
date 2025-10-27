"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Truck, Home, Users } from "lucide-react";
import { mockAgentData, generateRandomRoute } from "../utils/mockData";

// Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";

// Dynamically import Map components to avoid SSR issues
const Map = dynamic(() => import("react-map-gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-xs text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

const Marker = dynamic(() => import("react-map-gl").then((mod) => mod.Marker), {
  ssr: false,
});

const Source = dynamic(() => import("react-map-gl").then((mod) => mod.Source), {
  ssr: false,
});

const Layer = dynamic(() => import("react-map-gl").then((mod) => mod.Layer), {
  ssr: false,
});

interface AgentMapBoxProps {
  agentType: string;
  agentData?: any;
  workflowData?: any;
  className?: string;
}

const AgentMapBox: React.FC<AgentMapBoxProps> = ({ 
  agentType, 
  agentData, 
  workflowData, 
  className = "" 
}) => {
  const [mapData, setMapData] = useState<any>(null);
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });
  const [showRoute, setShowRoute] = useState(false);

  // Get MapBox token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (workflowData && agentType) {
      generateAgentMapData(agentType, workflowData);
    }
  }, [agentType, workflowData]);

  // Listen for navigation to report to show route
  useEffect(() => {
    const handleNavigateToReport = () => {
      setShowRoute(true);
    };

    const handleStartCoordination = () => {
      setShowRoute(false);
    };

    window.addEventListener('navigateToReport', handleNavigateToReport);
    window.addEventListener('startCoordination', handleStartCoordination);
    
    return () => {
      window.removeEventListener('navigateToReport', handleNavigateToReport);
      window.removeEventListener('startCoordination', handleStartCoordination);
    };
  }, []);

  const generateAgentMapData = (type: string, workflow: any) => {
    const baseData = {
      shelters: [],
      routes: [],
      pickup: null,
      dropoff: null,
      vehicle: null
    };

    switch (type) {
      case "ShelterAgent":
        // Show available shelters with real coordinates from Supabase
        if (workflow.shelter) {
          baseData.shelters = [{
            name: workflow.shelter.name,
            address: workflow.shelter.address,
            coordinates: workflow.shelter.location || [37.7749, -122.4194],
            available_beds: workflow.shelter.available_beds,
            accessibility: workflow.shelter.accessibility,
            services: workflow.shelter.services || [],
            status: "selected"
          }];
          
          // Add other available shelters (from Supabase data)
          baseData.shelters.push(
            {
              name: "St. Anthony's Foundation",
              address: "150 Golden Gate Ave, San Francisco, CA 94102",
              coordinates: [37.7835, -122.4144],
              available_beds: 5,
              accessibility: true,
              services: ["meals", "clothing"],
              status: "available"
            },
            {
              name: "MSC South",
              address: "525 5th St, San Francisco, CA 94107",
              coordinates: [37.7694, -122.4092],
              available_beds: 3,
              accessibility: false,
              services: ["meals"],
              status: "available"
            }
          );
        }
        break;

      case "TransportAgent":
        // Show transport route with mock data and random routing
        if (workflow.transport) {
          const hospitalCoords = workflow.transport.route?.[0] || [37.7625, -122.4580];
          const shelterCoords = workflow.transport.route?.[workflow.transport.route.length - 1] || [37.7749, -122.4194];
          
          baseData.pickup = {
            name: "UCSF Medical Center",
            coordinates: hospitalCoords,
            time: workflow.transport.pickup_time || "6:15 PM"
          };
          
          baseData.dropoff = {
            name: workflow.shelter?.name || "Harbor Light Center",
            coordinates: shelterCoords,
            eta: workflow.transport.eta || "7:00 PM"
          };
          
          baseData.routes = [{
            coordinates: workflow.transport.route || [hospitalCoords, shelterCoords],
            distance: "3.2 miles",
            duration: workflow.transport.eta || "45 minutes",
            traffic: "moderate"
          }];
          
          baseData.vehicle = {
            driver: workflow.transport.driver_name || "Michael Rodriguez",
            phone: workflow.transport.driver_phone || "(415) 555-0200",
            vehicle_type: workflow.transport.vehicle_type || "Wheelchair-accessible van",
            license_plate: "CA 7ABC123"
          };
        } else {
          // Use mock data with hardcoded route
          const hospitalLocation = { lat: 37.7749, lng: -122.4194 };
          const shelterLocation = { lat: mockAgentData.shelter.location.lat, lng: mockAgentData.shelter.location.lng };
          
          // Hardcoded route from SF General Hospital to Harbor Light Center
          const hardcodedRoute = [
            { lat: 37.7749, lng: -122.4194 }, // SF General Hospital
            { lat: 37.7755, lng: -122.4180 }, // Waypoint 1: Mission District
            { lat: 37.7760, lng: -122.4165 }, // Waypoint 2: Mission Street
            { lat: 37.7765, lng: -122.4150 }, // Waypoint 3: Howard Street
            { lat: 37.7770, lng: -122.4135 }, // Waypoint 4: Near shelter
            { lat: 37.7775, lng: -122.4120 }  // Harbor Light Center
          ];
          
          baseData.pickup = {
            name: "SF General Hospital",
            coordinates: [hospitalLocation.lng, hospitalLocation.lat],
            time: mockAgentData.transport.pickup_time
          };
          
          baseData.dropoff = {
            name: mockAgentData.shelter.name,
            coordinates: [shelterLocation.lng, shelterLocation.lat],
            eta: mockAgentData.transport.eta
          };
          
          baseData.routes = [{
            coordinates: hardcodedRoute.map(point => [point.lng, point.lat]),
            distance: "2.1 miles",
            duration: mockAgentData.transport.estimated_duration,
            traffic: "light"
          }];
          
          baseData.vehicle = {
            driver: mockAgentData.transport.driver,
            phone: mockAgentData.transport.phone,
            vehicle_type: mockAgentData.transport.vehicle_type,
            license_plate: "CA 7ABC123"
          };
        }
        break;

      case "ResourceAgent":
        // Show resource delivery locations
        if (workflow.resources) {
          baseData.shelters = [{
            name: "Resource Delivery Location",
            address: workflow.shelter?.address || "123 Main St, San Francisco",
            coordinates: workflow.shelter?.location || [37.7749, -122.4194],
            services: ["food", "hygiene", "clothing"],
            status: "delivery"
          }];
        }
        break;

      default:
        // Default view for other agents
        baseData.shelters = [{
          name: "San Francisco",
          address: "San Francisco, CA",
          coordinates: [37.7749, -122.4194],
          available_beds: 0,
          accessibility: false,
          services: [],
          status: "default"
        }];
    }

    setMapData(baseData);
    
    // Update map center based on data
    if (baseData.shelters.length > 0) {
      const coords = baseData.shelters[0].coordinates;
      setViewState(prev => ({
        ...prev,
        longitude: coords[1],
        latitude: coords[0],
        zoom: 13
      }));
    }
  };

  const getAgentMapIcon = (type: string) => {
    switch (type) {
      case "ShelterAgent": return <Home className="w-4 h-4" />;
      case "TransportAgent": return <Truck className="w-4 h-4" />;
      case "ResourceAgent": return <Users className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getAgentMapColor = (type: string) => {
    switch (type) {
      case "ShelterAgent": return "#2D9F7E";
      case "TransportAgent": return "#3B82F6";
      case "ResourceAgent": return "#E8A87C";
      default: return "#6B7575";
    }
  };

  if (!mapboxToken) {
    return (
      <div className={`h-48 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-600">MapBox token not configured</p>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className={`h-48 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative h-48 rounded-lg overflow-hidden ${className}`}
      style={{ border: `2px solid ${getAgentMapColor(agentType)}` }}
    >
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {/* Shelter markers */}
        {mapData.shelters?.map((shelter: any, index: number) => (
          <Marker
            key={index}
            longitude={shelter.coordinates[1]}
            latitude={shelter.coordinates[0]}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg"
              style={{ 
                backgroundColor: shelter.status === "selected" ? "#2D9F7E" : 
                               shelter.status === "available" ? "#F59E0B" : 
                               shelter.status === "delivery" ? "#E8A87C" : "#6B7575"
              }}
            >
              {getAgentMapIcon(agentType)}
            </motion.div>
          </Marker>
        ))}

        {/* Pickup marker */}
        {mapData.pickup && (
          <Marker
            longitude={mapData.pickup.coordinates[1]}
            latitude={mapData.pickup.coordinates[0]}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg bg-blue-500"
            >
              <Navigation className="w-4 h-4" />
            </motion.div>
          </Marker>
        )}

        {/* Moving car marker */}
        {showRoute && mapData.routes?.[0] && (
          <Marker
            longitude={mapData.routes[0].coordinates[2][0]}
            latitude={mapData.routes[0].coordinates[2][1]}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg bg-blue-600 animate-pulse"
            >
              <Truck className="w-5 h-5" />
            </motion.div>
          </Marker>
        )}

        {/* Dropoff marker */}
        {mapData.dropoff && (
          <Marker
            longitude={mapData.dropoff.coordinates[1]}
            latitude={mapData.dropoff.coordinates[0]}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg bg-green-500"
            >
              <MapPin className="w-4 h-4" />
            </motion.div>
          </Marker>
        )}

        {/* Route lines - only show after coordination is complete */}
        {showRoute && mapData.routes?.map((route: any, index: number) => (
          <Source
            key={index}
            id={`route-${index}`}
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: route.coordinates
              }
            }}
          >
            <Layer
              id={`route-line-${index}`}
              type="line"
              paint={{
                "line-color": getAgentMapColor(agentType),
                "line-width": 4,
                "line-opacity": 0.8
              }}
            />
          </Source>
        ))}
      </Map>

      {/* Agent info overlay */}
      <div className="absolute top-2 left-2 right-2">
        <div 
          className="px-3 py-2 rounded-lg text-white text-xs font-medium shadow-lg"
          style={{ backgroundColor: getAgentMapColor(agentType) }}
        >
          {agentType === "ShelterAgent" && (
            <div className="flex items-center space-x-2">
              <Home className="w-3 h-3" />
              <span>
                {mapData.shelters?.length || 0} shelters found
                {mapData.shelters?.find(s => s.status === "selected") && " • 1 selected"}
              </span>
            </div>
          )}
          
          {agentType === "TransportAgent" && (
            <div className="flex items-center space-x-2">
              <Truck className="w-3 h-3" />
              <span>
                Route: {mapData.routes?.[0]?.distance || "3.2 miles"} • 
                ETA: {mapData.dropoff?.eta || "45 min"}
              </span>
            </div>
          )}
          
          {agentType === "ResourceAgent" && (
            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3" />
              <span>
                Delivery to: {mapData.shelters?.[0]?.name || "Shelter"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle tracking info for Transport Agent */}
      {agentType === "TransportAgent" && mapData.vehicle && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{mapData.vehicle.driver}</span>
                <span className="text-gray-600 ml-2">{mapData.vehicle.vehicle_type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {mapData.dropoff?.eta || "45 min"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AgentMapBox;
