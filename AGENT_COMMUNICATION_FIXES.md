# 🔧 Agent Communication Fixes

## ✅ What I Fixed

### **1. Created Agent Registry System**

**New Files:**
- `agents/agent_registry.py` - Central address book for all agents
- Updated `agents/__init__.py` - Auto-registers all agent addresses on import

**How it works:**
```python
# Before (BROKEN):
await ctx.send("coordinator_agent_address", message)  # ❌ String literal

# After (WORKING):
from .agent_registry import get_agent_address, AgentNames
await ctx.send(get_agent_address(AgentNames.COORDINATOR), message)  # ✅ Real address
```

---

## 🔄 **Correct Workflow (From CORRECT_AGENT_WORKFLOW.md)**

### **Phase Breakdown:**

```
1. USER UPLOADS PDF → Parser Agent
2. Parser Agent autofills → User reviews
3. USER SUBMITS → Coordinator Agent (initiates)
4. Coordinator → Pharmacy Agent (check inventory) + Social Worker (review)
5. Social Worker reviews → APPROVES → Triggers 3 agents in PARALLEL:
   ├─ Eligibility Agent (check benefits)
   ├─ Resource Agent (needs shelter address)
   └─ Shelter Agent (Vapi calls)
6. Shelter Agent → finds shelter → sends address to Resource Agent
7. Shelter Agent → Transport Agent (schedule ride)
8. Transport Agent → triggers MapBox visualization
9. ALL AGENTS → report back to Social Worker
10. Social Worker → verifies everything → generates LaTeX PDF report
11. Analytics Agent → monitors everything continuously
```

---

## 🚨 **Current Problems vs Required Fixes**

| Component | Current State | Required State | Priority |
|-----------|--------------|----------------|----------|
| **Agent Addresses** | Hardcoded strings | Real Fetch.ai addresses | 🔴 CRITICAL |
| **Central Hub** | Coordinator Agent | Social Worker Agent | 🔴 CRITICAL |
| **Parallel Execution** | Sequential | Eligibility + Resource + Shelter in parallel | 🟡 HIGH |
| **Shelter → Resource** | No communication | Shelter sends address to Resource | 🟡 HIGH |
| **Shelter → Transport** | Coordinator triggers | Shelter triggers Transport | 🟡 HIGH |
| **Final Report** | No final report | Social Worker generates LaTeX PDF | 🔴 CRITICAL |
| **MapBox Trigger** | Transport doesn't trigger | Transport sends MapBox data | 🟡 HIGH |
| **Pharmacy Inventory** | Queries external | Uses hospital_pharmacy_inventory.json | 🟡 HIGH |
| **Social Worker Approval** | Missing | Social Worker reviews form first | 🔴 CRITICAL |

---

## 📝 **Required Agent Updates**

### **1. Coordinator Agent**
**Current:** Central hub for all messages
**Required:**
- Only initiates workflow
- Sends to Pharmacy + Social Worker in parallel
- Then steps back (Social Worker takes over)

### **2. Social Worker Agent** ⭐ **MAIN HUB**
**Current:** Just handles follow-up
**Required:**
- Reviews discharge form
- Approves patient information
- Triggers Eligibility, Resource, Shelter in PARALLEL
- Receives reports from ALL agents
- Verifies everything is correct
- Generates comprehensive LaTeX PDF report

**New Message Handlers Needed:**
- `SocialWorkerApproval` - After reviewing form
- `FinalVerificationRequest` - Collects all agent results
- `FinalReportData` - Generates LaTeX PDF

### **3. Eligibility Agent**
**Current:** Reports to Coordinator
**Required:** Reports to Social Worker

### **4. Resource Agent**
**Current:** Works independently
**Required:**
- Waits for shelter address from Shelter Agent
- Sends to: `ResourceAddressRequest` → Shelter Agent
- Receives: `ShelterAddressResponse` ← Shelter Agent
- Reports to Social Worker

### **5. Shelter Agent**
**Current:** Reports to Coordinator
**Required:**
- Uses Vapi to call shelters (already implemented ✅)
- Sends address to Resource Agent
- Triggers Transport Agent
- Returns coordinates for MapBox
- Reports to Social Worker

**New Communication:**
```python
# Shelter → Resource
await ctx.send(get_agent_address(AgentNames.RESOURCE), 
    ShelterAddressResponse(case_id, shelter_name, address, coordinates, contact, phone))

# Shelter → Transport
await ctx.send(get_agent_address(AgentNames.TRANSPORT),
    TransportRequest(case_id, pickup_location, dropoff_location, accessibility_needed))
```

### **6. Transport Agent**
**Current:** Doesn't trigger MapBox
**Required:**
- Schedules ride
- Triggers MapBox visualization
- Sends `MapBoxVisualizationTrigger` to frontend
- Reports to Social Worker

**New Message:**
```python
await ctx.send(get_agent_address(AgentNames.SOCIAL_WORKER),
    MapBoxVisualizationTrigger(
        case_id=case_id,
        pickup_location={"name": "UCSF", "coordinates": [lat, lon]},
        dropoff_location={"name": "Harbor Light", "coordinates": [lat, lon]},
        route={...},
        transport_details={...},
        eta_minutes=45
    ))
```

### **7. Pharmacy Agent**
**Current:** Queries external pharmacies
**Required:**
- Reads `hospital_pharmacy_inventory.json`
- Checks hospital's internal pharmacy stock
- Prepares 30-day discharge supply
- Reports to Coordinator (still correct)

### **8. Analytics Agent**
**Current:** Monitors workflows
**Required:** Same, but continuously runs in parallel

---

## 🔨 **Implementation Steps**

### **Step 1: Update All Agent Imports** ✅ DONE
```python
# Add to every agent file:
from .agent_registry import get_agent_address, AgentNames
```

### **Step 2: Replace Hardcoded Addresses** 🔄 TODO
```python
# Find and replace in ALL agent files:
"coordinator_agent_address" → get_agent_address(AgentNames.COORDINATOR)
"social_worker_agent_address" → get_agent_address(AgentNames.SOCIAL_WORKER)
"shelter_agent_address" → get_agent_address(AgentNames.SHELTER)
"transport_agent_address" → get_agent_address(AgentNames.TRANSPORT)
"resource_agent_address" → get_agent_address(AgentNames.RESOURCE)
"pharmacy_agent_address" → get_agent_address(AgentNames.PHARMACY)
"eligibility_agent_address" → get_agent_address(AgentNames.ELIGIBILITY)
```

### **Step 3: Update Social Worker to Central Hub** 🔄 TODO
- Add `@social_worker_protocol.on_message(model=SocialWorkerApproval)`
- Add parallel agent triggering logic
- Add final verification handler
- Add LaTeX report generation

### **Step 4: Add Inter-Agent Communication** 🔄 TODO
- Shelter → Resource (address sharing)
- Shelter → Transport (ride scheduling)
- All → Social Worker (final reporting)

### **Step 5: Update Pharmacy Agent** 🔄 TODO
- Remove external pharmacy queries
- Add `hospital_pharmacy_inventory.json` reader
- Check hospital stock for discharge medications

### **Step 6: Add MapBox Trigger** 🔄 TODO
- Transport Agent sends `MapBoxVisualizationTrigger`
- Frontend receives and displays map

---

## 🧪 **How to Test Agent Communication**

### **1. Start All Agents**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend/agents
python run_all.py
```

### **2. Check Agent Registration**
Look for:
```
🤖 INITIALIZING FETCH.AI AGENTS
✅ Registered agent: coordinator_agent at agent1q...
✅ Registered agent: social_worker_agent at agent1q...
...
✅ Registered 9 agents
```

### **3. Send Test Message**
```python
from agents import registry, AgentNames
print(registry.get_address(AgentNames.COORDINATOR))
# Should print: agent1q2kxet3vh0d...
```

### **4. Monitor Agent Logs**
Each agent should log:
```
✅ Received message from agent1q2kxet3vh0d...
📤 Sending message to agent1q7sdgj2ka9...
```

---

## 📊 **Benefits of This Fix**

1. ✅ **Real Agent Communication** - Agents use actual Fetch.ai addresses
2. ✅ **Correct Workflow** - Matches CORRECT_AGENT_WORKFLOW.md exactly
3. ✅ **Social Worker Central Hub** - All agents report to Social Worker
4. ✅ **Parallel Execution** - Eligibility, Resource, Shelter run simultaneously
5. ✅ **Inter-Agent Communication** - Shelter ↔ Resource, Shelter → Transport
6. ✅ **Final Report** - Social Worker generates LaTeX PDF
7. ✅ **MapBox Integration** - Transport triggers visualization
8. ✅ **Analytics Monitoring** - Catches silent errors continuously

---

## 🚀 **Next Steps**

1. ✅ **Agent Registry Created**
2. 🔄 **Update All Agents** - Replace hardcoded addresses
3. 🔄 **Refactor Social Worker** - Make it the central hub
4. 🔄 **Add Inter-Agent Messages** - Shelter → Resource, Shelter → Transport
5. 🔄 **Update Pharmacy** - Use hospital inventory
6. 🔄 **Add LaTeX Report** - Social Worker final report
7. 🔄 **Add MapBox Trigger** - Transport → Frontend

Once all agents are updated, they will communicate properly using Fetch.ai's messaging system! 🎉

