# 🔧 Agent Fixes Being Applied

## Progress: Fixing All Agents According to CORRECT_AGENT_WORKFLOW.md

---

## ✅ **Completed:**

### 1. Parser Agent ✅
- ✅ Added agent_registry imports
- ✅ Fixed 2 hardcoded addresses to use `get_agent_address(AgentNames.COORDINATOR)`

### 2. Eligibility Agent ✅
- ✅ Added agent_registry imports
- ✅ Fixed 4 hardcoded addresses
- ✅ **Changed to report to Social Worker** (not Coordinator) per workflow

---

## 🔄 **In Progress:**

### 3. Shelter Agent 🔄
**Changes Needed:**
- ✅ Add agent_registry imports
- ✅ Fix 5 hardcoded addresses → report to Social Worker
- ✅ Add communication to Resource Agent (send shelter address)
- ✅ Add communication to Transport Agent (trigger ride scheduling)
- ✅ Return coordinates for MapBox pins

### 4. Resource Agent 🔄
**Changes Needed:**
- ✅ Add agent_registry imports
- ✅ Fix 5 hardcoded addresses → report to Social Worker
- ✅ Add message handler to receive shelter address
- ✅ Wait for shelter address before confirming resources

### 5. Transport Agent 🔄
**Changes Needed:**
- ✅ Add agent_registry imports
- ✅ Fix 4 hardcoded addresses → report to Social Worker
- ✅ Add MapBox visualization trigger
- ✅ Send `MapBoxVisualizationTrigger` with route data

---

## ⏳ **Pending:**

### 6. Social Worker Agent (MAJOR REFACTOR)
**Changes Needed:**
- Add agent_registry imports
- Add approval handler after form review
- Add parallel agent triggering (Eligibility + Resource + Shelter)
- Add final verification logic
- Add LaTeX report generation
- Become central hub for all agents

### 7. Pharmacy Agent
**Changes Needed:**
- Add agent_registry imports
- Fix hardcoded addresses
- **Read `hospital_pharmacy_inventory.json`**
- Check hospital stock instead of external pharmacies

### 8. Coordinator Agent
**Changes Needed:**
- Verify it triggers Pharmacy + Social Worker in parallel
- Then steps back (Social Worker takes over)

---

## 📝 **Implementation Notes:**

### Workflow Flow (Source of Truth):
```
1. Coordinator → Pharmacy + Social Worker (parallel)
2. Social Worker reviews → triggers Eligibility + Resource + Shelter (parallel)
3. Shelter → Resource (sends address)
4. Shelter → Transport (schedules ride)
5. Transport → MapBox trigger
6. ALL → Social Worker (final verification)
7. Social Worker → LaTeX report
```

### Key Pattern Changes:
- **OLD:** All agents → Coordinator
- **NEW:** All agents → Social Worker (except Pharmacy still reports to Coordinator)

### MapBox Coordinates:
- Shelter Agent must include `coordinates: [lat, lon]` in responses
- Transport Agent sends full MapBox visualization data
- Frontend displays route, ETA, pins

---

Proceeding with fixes now...

