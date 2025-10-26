# 🔄 Correct Agent Workflow Architecture
## Based on User Requirements

---

## 📊 **Complete Workflow Diagram**

```
USER UPLOADS PDF
        ↓
📄 PARSER AGENT
        │
        ├─ Uses LlamaParse to extract text
        ├─ Uses Gemini AI to extract data
        ├─ Autofills discharge form
        └─ Returns to user for review
        ↓
USER REVIEWS & SUBMITS FORM
        ↓
🎯 COORDINATOR AGENT (initiates workflow)
        ├──────────────┐
        ↓              ↓
   💊 PHARMACY     👥 SOCIAL WORKER AGENT (MAIN HUB)
      AGENT              │
        │                ├─ Reviews filled form
        │                ├─ Approves patient info
        │                ├─ Decides what's needed
        │                │
        └────────────────┤
                         ↓
                   👥 SOCIAL WORKER
                   triggers agents in parallel
                         │
                         ├──────────────┬──────────────┐
                         ↓              ↓              ↓
                   🎫 ELIGIBILITY  📦 RESOURCE   🏠 SHELTER
                      AGENT          AGENT         AGENT
                         │              │              │
                         ├─ Medi-Cal    │              ├─ Calls via VAPI
                         ├─ Gen Assist  │              ├─ Capacity check
                         ├─ CalFresh    │              ├─ Services info
                         ├─ Housing     │              ├─ Accessibility
                         ├─ SSI/SSDI    │              ├─ Confirms address
                         │              │              │
                         │     Resource Agent ←────────┤
                         │     needs shelter address   │
                         │              │              │
                         │              │              ↓
                         │              │        🚐 TRANSPORT AGENT
                                          │               │
                                          │               ├─ Schedules ride
                                          │               ├─ Gets pickup time
                                          │               ├─ Calculates route
                                          │               │
                                          │               ↓
                                          │         🗺️ MAPBOX VISUALIZATION
                                          │               │
                                          │               ├─ Shows shelter location
                                          │               ├─ Shows pickup location
                                          │               ├─ Shows ETA
                                          │               ├─ Shows route
                                          │               │
                                          └───────────────┴───────────┐
                                                                      ↓
                                                          👥 SOCIAL WORKER AGENT
                                                          (verification & final report)
                                                                      │
                                                                      ├─ Verifies all agents completed
                                                                      ├─ Checks all data is correct
                                                                      ├─ Ensures nothing missed
                                                                      │
                                                                      ↓
                                                          📄 FINAL REPORT
                                                                      │
                                                                      ├─ Shelter details
                                                                      ├─ Transport schedule
                                                                      ├─ Pharmacy info
                                                                      ├─ Resources arranged
                                                                      ├─ Benefits eligibility
                                                                      ├─ Follow-up check-up date
                                                                      ├─ Contact number
                                                                      └─ Complete discharge plan

📊 ANALYTICS AGENT (monitors EVERYTHING in parallel)
        │
        ├─ Catches silent errors
        ├─ Ensures agent communication is stable
        ├─ Monitors persona flow consistency
        ├─ Tracks that all agents can talk to each other
        └─ Alerts on any failures
```

---

## 🔢 **Step-by-Step Workflow**

### **Phase 0: PDF Processing (Before Workflow)**
```
1. User uploads discharge PDF document
2. Parser Agent:
   ├─ Uses LlamaParse API to extract text
   ├─ Uses Gemini AI to extract structured data
   ├─ Maps data to discharge form fields
   └─ Returns autofilled form to frontend
3. User reviews autofilled data
4. User makes any corrections/additions
5. User clicks "Start Coordination"
```

### **Phase 1: Initial Coordination**
```
6. Coordinator Agent receives filled form data
7. Coordinator initiates parallel tasks:
   ├─ Pharmacy Agent (check hospital pharmacy inventory)
   └─ Social Worker Agent (review and approve form)
```

### **Phase 2: Parallel Processing - Pharmacy & Social Worker**
```
8. PHARMACY AGENT (runs in parallel):
   ├─ Extracts medication list from form
   ├─ Checks hardcoded hospital pharmacy inventory JSON
   ├─ Verifies all medications are in stock
   ├─ Calculates discharge supply (30-day for homeless patients)
   ├─ Prepares discharge medication package
   └─ Returns status to Coordinator

9. SOCIAL WORKER AGENT (runs in parallel):
   ├─ Reviews filled discharge form (autofilled by Parser)
   ├─ Verifies patient information is complete
   ├─ Approves patient needs assessment
   └─ Determines what services are required
```

### **Phase 3: Social Worker Triggers 3 Agents in Parallel**
```
10. Social Worker triggers THREE agents in parallel:
    ├─ Eligibility Agent: "Check benefit eligibility"
    ├─ Resource Agent: "Patient needs: food, hygiene, clothing"
    └─ Shelter Agent: "Find wheelchair-accessible shelter with capacity"

11. ELIGIBILITY AGENT (runs in parallel):
    ├─ Checks Medi-Cal eligibility
    ├─ Checks General Assistance ($588/month)
    ├─ Checks CalFresh/SNAP ($281/month)
    ├─ Checks Housing Assistance
    ├─ Checks SSI/SSDI
    └─ Returns complete benefits report to Social Worker

12. RESOURCE AGENT (runs in parallel):
    ├─ Starts searching for food/hygiene/clothing providers
    └─ WAITS for shelter address from Shelter Agent

13. SHELTER AGENT (runs in parallel):
    └─ Uses VAPI to call shelters (see Phase 4)
```

### **Phase 4: Shelter Search via Vapi**
```
14. Shelter Agent uses VAPI to call shelters:
   
    VAPI CALL SCRIPT:
    ├─ "Hello, I'm calling to verify bed availability"
    ├─ "How many beds available tonight?"
    ├─ "Do you have wheelchair accessibility?"
    ├─ "What services do you provide?"
    ├─ "Can you accommodate dietary restrictions?"
    ├─ "What's your address?"
    ├─ "Can you accept someone tonight at 6pm?"
   
15. Shelter Agent transcribes VAPI responses
16. Shelter Agent selects best match
17. Shelter Agent sends address to Resource Agent
```

### **Phase 5: Transport Scheduling**
```
18. Shelter Agent → Transport Agent
    └─ "Schedule ride to [shelter address]"

19. Transport Agent:
    ├─ Finds wheelchair-accessible vehicle
    ├─ Schedules pickup from hospital
    ├─ Calculates route to shelter
    └─ Returns: pickup time, ETA, driver info
```

### **Phase 6: MapBox Visualization**
```
20. Transport Agent triggers MapBox:
    ├─ 📍 Pin 1: Hospital (pickup location)
    ├─ 📍 Pin 2: Shelter (dropoff location)
    ├─ 🚗 Route line between locations
    ├─ ⏱️ ETA display
    ├─ 📞 Driver contact info
    └─ 🔄 Real-time tracking updates
```

### **Phase 7: Final Verification**
```
21. All agents report back to Social Worker Agent:
    ├─ Pharmacy Agent: "3 medications ready - 30-day supply prepared"
    ├─ Eligibility Agent: "Qualified for Medi-Cal + $588/mo GA"
    ├─ Resource Agent: "Food + hygiene kit reserved"
    ├─ Shelter Agent: "Bed #12 at Harbor Light, wheelchair accessible"
    └─ Transport Agent: "Pickup at 6:15pm, ETA 7:00pm"

22. Social Worker Agent verifies:
    ├─ ✅ All required services arranged?
    ├─ ✅ All contact information correct?
    ├─ ✅ All accessibility needs met?
    ├─ ✅ Follow-up scheduled?
    └─ ✅ Nothing missed?
```

### **Phase 8: Final Report Generation (LaTeX)**
```
23. Social Worker Agent creates comprehensive report in LaTeX format:
    ├─ Compiles all agent responses
    ├─ Formats in professional LaTeX template
    ├─ Includes all sections: shelter, transport, meds, resources, benefits
    ├─ Generates PDF using LaTeX compiler
    └─ Returns professional discharge coordination document

╔══════════════════════════════════════════════════════════╗
║         DISCHARGE COORDINATION FINAL REPORT              ║
╠══════════════════════════════════════════════════════════╣
║ Patient: John Doe                                        ║
║ Case ID: CASE-2025-10-26-1730                           ║
║ Discharge Date: October 27, 2025                        ║
╠══════════════════════════════════════════════════════════╣
║ 🏠 SHELTER PLACEMENT                                     ║
║   • Harbor Light Center                                  ║
║   • 123 Main St, San Francisco                          ║
║   • Bed #12 reserved (wheelchair accessible)            ║
║   • Services: Meals, showers, case management           ║
║   • Contact: (415) 555-0100                             ║
╠══════════════════════════════════════════════════════════╣
║ 🚐 TRANSPORTATION                                        ║
║   • Provider: SF Paratransit                            ║
║   • Pickup: UCSF Medical, 6:15 PM                       ║
║   • Arrival: Harbor Light, 7:00 PM (ETA)                ║
║   • Driver: Michael Rodriguez                            ║
║   • Contact: (415) 555-0200                             ║
║   • Vehicle: Wheelchair-accessible van                   ║
╠══════════════════════════════════════════════════════════╣
║ 💊 DISCHARGE MEDICATIONS                                 ║
║   • Hospital Pharmacy: UCSF Medical Center              ║
║   • 30-Day Supply Prepared:                             ║
║     - Lisinopril 10mg (take once daily)                ║
║     - Metformin 500mg (take twice daily)               ║
║     - Aspirin 81mg (take once daily)                   ║
║   • Status: Ready for pickup at discharge               ║
║   • Instructions: Included in discharge packet          ║
╠══════════════════════════════════════════════════════════╣
║ 📦 RESOURCES                                             ║
║   • Food: 3-day meal voucher (SF-Marin Food Bank)       ║
║   • Hygiene: Full kit ready (Lava Mae)                  ║
║   • Clothing: Weather-appropriate outfit (St. Anthony)   ║
║   • All items will be at Harbor Light on arrival        ║
╠══════════════════════════════════════════════════════════╣
║ 🎫 BENEFITS ELIGIBILITY                                  ║
║   • Medi-Cal: ✅ Eligible (coverage starts immediately)  ║
║   • General Assistance: ✅ $588/month                    ║
║   • CalFresh: ✅ $281/month                              ║
║   • Total Monthly Benefits: $869                         ║
║   • Next Steps: Application submitted, expect card in 5d ║
╠══════════════════════════════════════════════════════════╣
║ 📅 FOLLOW-UP CARE                                        ║
║   • Case Manager: Sarah Johnson, MSW                     ║
║   • Department: Homeless Services                        ║
║   • First Contact: October 28, 2025 (10:00 AM)          ║
║   • Follow-up Check-up: November 3, 2025                 ║
║   • Contact Number: (415) 555-0300                       ║
║   • Emergency Line: (415) 555-0999 (24/7)               ║
╠══════════════════════════════════════════════════════════╣
║ ✅ VERIFICATION COMPLETE                                 ║
║   All services confirmed and verified by social worker   ║
║   Report generated: October 26, 2025 5:45 PM            ║
╚══════════════════════════════════════════════════════════╝
```

### **Phase 9: Continuous Monitoring**
```
24. Analytics Agent (running in parallel the ENTIRE time from Phase 0):
    ├─ Monitors all agent communications
    ├─ Catches any silent errors
    ├─ Ensures stable persona flow
    ├─ Verifies all agents can talk to each other
    ├─ Tracks processing times
    ├─ Alerts if any agent fails to respond
    └─ Generates system health report
```

---

## 🔗 **Critical Agent Communication Flows**

### **Resource Agent ↔ Shelter Agent**
```
Resource Agent: "I need to send food, hygiene, clothing to patient"
Shelter Agent: "Patient will be at Harbor Light, 123 Main St"
Resource Agent: "Confirming delivery to Harbor Light at 6:30 PM"
Shelter Agent: "✅ We'll have someone receive the items"
```

### **Shelter Agent → Transport Agent**
```
Shelter Agent: "Patient needs ride to Harbor Light Center"
                "Address: 123 Main St, San Francisco"
                "Pickup: UCSF Medical at 6:15 PM"
                "Accessibility: Wheelchair required"

Transport Agent: "✅ SF Paratransit scheduled"
                 "Driver: Michael Rodriguez"
                 "ETA: 7:00 PM"
                 "Triggering MapBox visualization..."
```

### **All Agents → Social Worker Agent (Final Verification)**
```
Social Worker: "Pharmacy Agent, did you prepare discharge medications?"
Pharmacy: "✅ Yes, 30-day supply ready - Lisinopril, Metformin, Aspirin"

Social Worker: "Eligibility Agent, what benefits qualified?"
Eligibility: "✅ Medi-Cal + GA + CalFresh = $869/month"

Social Worker: "Resource Agent, what items secured?"
Resource: "✅ Food, hygiene, clothing - all to Harbor Light"

Social Worker: "Shelter Agent, confirm placement?"
Shelter: "✅ Bed #12, wheelchair accessible, meals included"

Social Worker: "Transport Agent, confirm ride?"
Transport: "✅ Pickup 6:15 PM, arrive 7:00 PM, wheelchair van"

Social Worker: "✅✅✅ ALL VERIFIED - Generating final report..."
```

---

## 🗺️ **MapBox Visualization Requirements**

### **Phase 1: Shelter Agent Marks Available Shelters**
When Shelter Agent finds available shelters via Vapi calls:
```javascript
{
  "available_shelters": [
    {
      "name": "Harbor Light Center",
      "coordinates": [37.7749, -122.4194],
      "icon": "🏠",
      "color": "green",
      "beds_available": 12,
      "wheelchair_accessible": true,
      "services": ["meals", "showers", "case_management"],
      "status": "selected"
    },
    {
      "name": "St. Anthony's Foundation",
      "coordinates": [37.7835, -122.4144],
      "icon": "🏠",
      "color": "yellow",
      "beds_available": 5,
      "wheelchair_accessible": true,
      "services": ["meals", "clothing"],
      "status": "available"
    },
    {
      "name": "MSC South",
      "coordinates": [37.7694, -122.4092],
      "icon": "🏠",
      "color": "yellow",
      "beds_available": 3,
      "wheelchair_accessible": false,
      "services": ["meals"],
      "status": "available"
    }
  ]
}
```

### **Phase 2: Transport Agent Shows Route with Live ETA**
When Transport Agent schedules ride:
```javascript
{
  "pickup_location": {
    "name": "UCSF Medical Center",
    "coordinates": [37.7625, -122.4580],
    "icon": "🏥",
    "label": "Pickup: 6:15 PM"
  },
  "dropoff_location": {
    "name": "Harbor Light Center",
    "coordinates": [37.7749, -122.4194],
    "icon": "🏠",
    "label": "Arrival: 7:00 PM (ETA)"
  },
  "route": {
    "polyline": "encoded_polyline_data",
    "distance": "3.2 miles",
    "duration": "45 minutes",
    "traffic_level": "moderate",
    "animated": true
  },
  "vehicle_tracking": {
    "current_position": [37.7625, -122.4580],
    "heading": 45,
    "speed": "25 mph",
    "eta_minutes": 45,
    "real_time_updates": true,
    "update_interval_seconds": 10
  },
  "transport_details": {
    "driver": "Michael Rodriguez",
    "phone": "(415) 555-0200",
    "vehicle": "Wheelchair-accessible van",
    "license_plate": "CA 7ABC123"
  }
}
```

### **MapBox UI Features:**
1. **Available Shelters Layer**:
   - Green pins for selected shelter
   - Yellow pins for other available shelters
   - Click pin to see shelter details
   
2. **Route Visualization**:
   - Animated blue line from hospital to shelter
   - Live vehicle position marker (car icon)
   - ETA countdown timer
   
3. **Real-time Updates**:
   - Vehicle position updates every 10 seconds
   - ETA recalculates based on traffic
   - Route adjusts for traffic conditions

---

## 📊 **Analytics Agent Monitoring**

The Analytics Agent runs in parallel and monitors:

### **Silent Error Detection**
```
❌ Shelter Agent took >30s to respond → ALERT
❌ Resource Agent couldn't reach provider → ALERT
❌ Pharmacy Agent found 0 medications → ESCALATE to Social Worker
❌ Transport Agent failed to schedule → CRITICAL ALERT
```

### **Communication Health**
```
✅ Coordinator → Pharmacy: 0.3s response time
✅ Social Worker → Resource: 1.2s response time
✅ Resource → Shelter: 2.1s response time
✅ Shelter → Transport: 0.8s response time
⚠️ Transport → MapBox: 5.3s response time (SLOW)
```

### **Persona Flow Consistency**
```
✅ All agents using proper message models
✅ All agents responding with WorkflowUpdate
✅ No agents skipping required steps
✅ All agents can communicate via Fetch.ai messaging
```

---

## 🎯 **Implementation Checklist**

### **Agent Communication Updates Needed:**
- [ ] Parser Agent processes PDF and autofills form (Phase 0)
- [ ] Coordinator sends to Pharmacy + Social Worker (parallel)
- [ ] Pharmacy Agent checks hardcoded hospital inventory JSON
- [ ] Social Worker reviews form and approves
- [ ] Social Worker triggers Eligibility + Resource + Shelter (parallel)
- [ ] Resource Agent requests address from Shelter Agent
- [ ] Shelter Agent calls via Vapi and gets detailed info
- [ ] Shelter Agent sends details to Transport Agent
- [ ] Transport Agent triggers MapBox visualization
- [ ] All agents report back to Social Worker for verification
- [ ] Social Worker generates comprehensive final report
- [ ] Analytics Agent monitors all communications in real-time

### **New Message Models Needed:**
- [ ] `PDFProcessingRequest` (User → Parser) ✅ EXISTS
- [ ] `AutofillData` (Parser → Frontend) ✅ EXISTS
- [ ] `HospitalPharmacyCheck` (Coordinator → Pharmacy)
- [ ] `PharmacyInventoryResponse` (Pharmacy → Coordinator)
- [ ] `SocialWorkerApproval` (form review result)
- [ ] `ResourceAddressRequest` (Resource → Shelter)
- [ ] `ShelterAddressResponse` (Shelter → Resource)
- [ ] `MapBoxVisualizationTrigger` (Transport → Frontend)
- [ ] `FinalVerificationRequest` (Social Worker → All Agents)
- [ ] `FinalReportData` (Social Worker → Frontend)

### **Frontend Updates Needed:**
- [ ] PDF upload and parsing loading indicator ✅ EXISTS
- [ ] Form autofill from Parser Agent ✅ EXISTS
- [ ] MapBox component with:
  - [ ] Available shelters layer (green/yellow pins)
  - [ ] Selected shelter highlight
  - [ ] Route visualization with animation
  - [ ] Live vehicle tracking with car icon
  - [ ] Real-time ETA countdown
  - [ ] Traffic-aware route updates
- [ ] Final report display (rendered LaTeX PDF)
- [ ] Follow-up contact information display

### **Backend Data Files Needed:**
- [x] `hospital_pharmacy_inventory.json` ✅ CREATED
- [ ] LaTeX report template for Social Worker Agent
- [ ] MapBox API integration for route and tracking

---

## 💡 **Key Differences from Original Understanding**

| Original | Corrected |
|----------|-----------|
| Coordinator is central hub | Social Worker is central reviewer |
| All agents report to Coordinator | All agents report to Social Worker for verification |
| Resource Agent works independently | Resource Agent NEEDS Shelter Agent for address |
| Transport is standalone | Transport triggers MapBox visualization |
| No final report | Social Worker generates comprehensive final report |
| Analytics is optional | Analytics monitors EVERYTHING to catch silent errors |

---

## ✅ **This is the CORRECT workflow architecture**

