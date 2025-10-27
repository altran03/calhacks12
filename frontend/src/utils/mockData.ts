// Mock data for all agents
export interface MockAgentData {
  shelter: any;
  transport: any;
  resource: any;
  pharmacy: any;
  eligibility: any;
  socialWorker: any;
  analytics: any;
}

export const mockAgentData: MockAgentData = {
  shelter: {
    name: "Harbor Light Center",
    address: "1275 Howard St, San Francisco, CA 94103",
    phone: "(415) 555-1234",
    available_beds: 6,
    accessibility: true,
    services: ["emergency_shelter", "meals", "case_management", "medical_referrals", "wheelchair_access", "medical_respite"],
    location: {
      lat: 37.7775,
      lng: -122.4120
    },
    vapi_transcription: "AI: Hello. This is CareLink. Calling from San Francisco General Hospital. We have a homeless patient being discharged tonight and need to check if you have available beds and can accommodate them. You have a moment to discuss capacity and services? User: Yes. I do. Yes to all of your questions and also we have 6-7 beds available at the shelter, and we can accommodate to anyone if even people in a wheelchair. Yeah. So AI: Thanks for the User: see you there."
  },

  transport: {
    driver: "Mike Johnson",
    phone: "(415) 555-1234",
    vehicle_type: "Wheelchair accessible medical transport",
    pickup_time: "2:30 PM",
    estimated_duration: "25 minutes",
    route: [
      { lat: 37.7749, lng: -122.4194 }, // SF General Hospital
      { lat: 37.7755, lng: -122.4180 }, // Waypoint 1: Mission District
      { lat: 37.7760, lng: -122.4165 }, // Waypoint 2: Mission Street
      { lat: 37.7765, lng: -122.4150 }, // Waypoint 3: Howard Street
      { lat: 37.7770, lng: -122.4135 }, // Waypoint 4: Near shelter
      { lat: 37.7775, lng: -122.4120 }  // Harbor Light Center
    ],
    status: "scheduled",
    eta: "2:55 PM"
  },

  resource: {
    items: [
      "warm_winter_jacket",
      "thermal_underwear", 
      "wool_socks_2_pairs",
      "waterproof_boots",
      "knit_hat",
      "gloves",
      "food_vouchers_3_days",
      "hygiene_kit"
    ],
    delivery_address: "1275 Howard St, San Francisco, CA 94103",
    delivery_time: "3:00 PM",
    provider: "Hospital Donation Program",
    provider_phone: "(415) 206-8000"
  },

  pharmacy: {
    name: "SF General Hospital Pharmacy",
    address: "1001 Potrero Ave, San Francisco, CA 94110",
    phone: "(415) 206-8387",
    medications: [
      {
        name: "Albuterol inhaler",
        dosage: "90mcg",
        frequency: "2 puffs every 4-6 hours as needed",
        ready: true
      },
      {
        name: "Tiotropium bromide (Spiriva)", 
        dosage: "18mcg",
        frequency: "1 inhalation daily",
        ready: true
      },
      {
        name: "Prednisone",
        dosage: "20mg",
        frequency: "once daily for 5 days",
        ready: true
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "twice daily with meals",
        ready: true
      },
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "once daily in morning",
        ready: true
      },
      {
        name: "Aspirin",
        dosage: "81mg",
        frequency: "once daily",
        ready: true
      }
    ],
    pickup_time: "2:30 PM",
    delivery_arranged: true
  },

  eligibility: {
    status: "verified",
    benefits: ["Medi-Cal (Emergency enrollment)", "SNAP", "General Assistance"],
    case_worker: "Jane Smith",
    phone: "(415) 206-5555",
    verification_date: "2025-01-15",
    insurance_card: "Provided and effective immediately"
  },

  socialWorker: {
    assigned_worker: "Sarah Johnson",
    department: "Social Work - SF General Hospital",
    contact: "(415) 206-5555",
    follow_up_scheduled: "2025-01-22T10:00:00",
    case_manager: "David Wilson",
    case_manager_phone: "(415) 206-5555",
    primary_care_appointment: "Within 7 days (URGENT)",
    pulmonology_appointment: "Within 2 weeks"
  },

  analytics: {
    total_agents_activated: 7,
    successful_coordinations: 6,
    failed_coordinations: 0,
    average_response_time: "2.3 minutes",
    system_health: "excellent"
  }
};

export const generateRandomRoute = (startLat: number, startLng: number, endLat: number, endLng: number) => {
  // Generate a random route with waypoints
  const waypoints = [];
  const numWaypoints = Math.floor(Math.random() * 3) + 2; // 2-4 waypoints
  
  for (let i = 0; i < numWaypoints; i++) {
    const progress = (i + 1) / (numWaypoints + 1);
    const lat = startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.01;
    const lng = startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.01;
    waypoints.push({ lat, lng });
  }
  
  return [
    { lat: startLat, lng: startLng },
    ...waypoints,
    { lat: endLat, lng: endLng }
  ];
};

export const mockShelterData = [
  {
    id: "shelter-001",
    name: "Harbor Light Center",
    address: "1275 Howard St, San Francisco, CA 94103",
    capacity: 50,
    available_beds: 37,
    accessibility: true,
    phone: "(415) 555-1234",
    services: ["emergency_shelter", "meals", "case_management", "medical_referrals", "wheelchair_access"],
    location: {
      lat: 37.7775,
      lng: -122.4120
    }
  },
  {
    id: "shelter-002",
    name: "St. Anthony's Foundation",
    address: "150 Golden Gate Ave, San Francisco, CA 94102",
    capacity: 40,
    available_beds: 12,
    accessibility: true,
    phone: "(415) 555-2345",
    services: ["emergency_shelter", "meals", "clothing", "shower_facilities"],
    location: {
      lat: 37.7835,
      lng: -122.4144
    }
  },
  {
    id: "shelter-003",
    name: "MSC South",
    address: "525 5th St, San Francisco, CA 94107",
    capacity: 30,
    available_beds: 8,
    accessibility: false,
    phone: "(415) 555-3456",
    services: ["emergency_shelter", "meals"],
    location: {
      lat: 37.7694,
      lng: -122.4092
    }
  }
];
