# CareLink Agents

This directory contains all the specialized agents for the CareLink healthcare discharge coordination system, built using the Fetch.ai uAgent framework.

## 🏗️ Architecture

The CareLink system uses a multi-agent architecture where each agent specializes in a specific aspect of the discharge workflow:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Coordinator    │    │    Shelter      │    │   Transport     │
│    Agent        │◄──►│    Agent        │◄──►│    Agent        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Social Worker   │    │    Parser       │    │    Resource     │
│    Agent        │    │    Agent        │    │    Agent        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pharmacy      │    │  Eligibility   │    │   Analytics     │
│    Agent        │    │    Agent       │    │    Agent        │
│                 │    │                │    │                 │
└─────────────────┘    └────────────────┘    └─────────────────┘
```

## 🤖 Agents Overview

### 1. **Coordinator Agent** (`coordinator_agent.py`)
- **Port**: 8002
- **Role**: Central workflow orchestrator
- **Responsibilities**:
  - Manages the entire discharge workflow
  - Coordinates between all other agents
  - Handles workflow updates and status tracking
  - Triggers agent coordination for complex cases

### 2. **Shelter Agent** (`shelter_agent.py`)
- **Port**: 8003
- **Role**: Shelter capacity and availability management
- **Responsibilities**:
  - Manages shelter matching and bed reservations
  - Verifies shelter availability via Vapi calls
  - Handles alternative shelter searches
  - Coordinates with shelter providers

### 3. **Transport Agent** (`transport_agent.py`)
- **Port**: 8004
- **Role**: Transportation scheduling and tracking
- **Responsibilities**:
  - Schedules patient transport from hospital to shelter
  - Manages accessibility requirements
  - Coordinates with transport providers (Paratransit, Lyft Access, Uber WAV)
  - Tracks transport status and ETAs

### 4. **Social Worker Agent** (`social_worker_agent.py`)
- **Port**: 8005
- **Role**: Case assignments and follow-up care
- **Responsibilities**:
  - Assigns social workers to cases
  - Schedules follow-up care and check-ins
  - Manages case management coordination
  - Handles expedited benefit notifications

### 5. **Parser Agent** (`parser_agent.py`)
- **Port**: 8011
- **Role**: Document intelligence and PDF processing
- **Responsibilities**:
  - Processes uploaded PDF documents using LlamaParse
  - Extracts structured data using Gemini AI
  - Formats data for autofill functionality
  - Handles document parsing errors and fallbacks

### 6. **Resource Agent** (`resource_agent.py`)
- **Port**: 8007
- **Role**: Food, hygiene, clothing coordination
- **Responsibilities**:
  - Coordinates post-discharge necessities
  - Matches patient needs with available resources
  - Handles dietary restrictions and accommodations
  - Manages resource reservations and pickups

### 7. **Pharmacy Agent** (`pharmacy_agent.py`)
- **Port**: 8008
- **Role**: Medication continuity and access
- **Responsibilities**:
  - Ensures post-discharge medication access
  - Finds pharmacies with required medications
  - Handles insurance and cost estimates
  - Coordinates with pharmacy providers

### 8. **Eligibility Agent** (`eligibility_agent.py`)
- **Port**: 8009
- **Role**: Benefit verification and eligibility checking
- **Responsibilities**:
  - Verifies public benefit eligibility (Medi-Cal, GA, SNAP)
  - Handles expedited benefit processing
  - Coordinates with benefit systems
  - Manages eligibility documentation

### 9. **Analytics Agent** (`analytics_agent.py`)
- **Port**: 8010
- **Role**: System metrics and reporting
- **Responsibilities**:
  - Collects non-PII metrics and performance data
  - Monitors system health and agent performance
  - Generates alerts for critical issues
  - Tracks workflow completion rates and processing times

## 📋 Models

All agents share common models defined in `models.py`:

- **Workflow Models**: `DischargeRequest`, `WorkflowUpdate`
- **Shelter Models**: `ShelterMatch`, `ShelterAvailabilityRequest`
- **Transport Models**: `TransportRequest`, `TransportConfirmation`
- **Social Worker Models**: `SocialWorkerAssignment`, `SocialWorkerConfirmation`
- **Resource Models**: `ResourceRequest`, `ResourceMatch`
- **Pharmacy Models**: `PharmacyRequest`, `PharmacyMatch`
- **Eligibility Models**: `EligibilityRequest`, `EligibilityResult`
- **Parser Models**: `DocumentParseRequest`, `PDFProcessingRequest`, `AutofillData`
- **Analytics Models**: `AnalyticsData`, `SystemHealthCheck`

## 🚀 Getting Started

### 1. **Install Dependencies**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
pip install -r requirements.txt
```

### 2. **Set Environment Variables**
```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys
# - FETCH_AI_API_KEY (for uAgent framework)
# - GEMINI_API_KEY (for AI processing)
# - LLAMA_CLOUD_API_KEY (for document parsing)
# - VAPI_API_KEY (for voice calls)
# - BRIGHTDATA_API_KEY (for web scraping)
```

### 3. **Run All Agents**
```bash
# Start all agents
python agents/run_agents.py

# Or run individual agents
python agents/coordinator_agent.py
python agents/shelter_agent.py
# ... etc
```

### 4. **Start Main API**
```bash
# In another terminal
uvicorn main:app --reload
```

## 🔄 Workflow Example

Here's how the agents work together for a typical discharge:

1. **Patient Discharge Request** → Coordinator Agent
2. **Coordinator Agent** → Triggers multiple agents:
   - Shelter Agent (find available beds)
   - Transport Agent (schedule pickup)
   - Social Worker Agent (assign case worker)
   - Eligibility Agent (check benefits)
   - Resource Agent (coordinate necessities)
   - Pharmacy Agent (ensure medication access)
3. **Parser Agent** → Processes uploaded PDFs for autofill
4. **Analytics Agent** → Tracks all workflow metrics

## 🛠️ Development

### **Adding New Agents**
1. Create new agent file in `agents/` directory
2. Define agent models in `models.py`
3. Add agent to `__init__.py`
4. Update `run_agents.py` to include new agent

### **Testing Agents**
```bash
# Test individual agent
python agents/parser_agent.py

# Test agent communication
python test_agent_communication.py
```

### **Monitoring**
- All agents log to console
- Analytics agent collects metrics
- System health checks available
- Error handling and fallbacks implemented

## 📊 Agent Status

| Agent | Status | Port | Endpoint |
|-------|--------|------|----------|
| Coordinator | ✅ Ready | 8002 | http://127.0.0.1:8002/submit |
| Shelter | ✅ Ready | 8003 | http://127.0.0.1:8003/submit |
| Transport | ✅ Ready | 8004 | http://127.0.0.1:8004/submit |
| Social Worker | ✅ Ready | 8005 | http://127.0.0.1:8005/submit |
| Parser | ✅ Ready | 8011 | http://127.0.0.1:8011/submit |
| Resource | ✅ Ready | 8007 | http://127.0.0.1:8007/submit |
| Pharmacy | ✅ Ready | 8008 | http://127.0.0.1:8008/submit |
| Eligibility | ✅ Ready | 8009 | http://127.0.0.1:8009/submit |
| Analytics | ✅ Ready | 8010 | http://127.0.0.1:8010/submit |

## 🔗 Integration Points

- **Frontend**: React/Next.js discharge intake form
- **Backend**: FastAPI main application
- **AI Services**: Gemini 1.5 Pro for document processing
- **Document Processing**: LlamaParse for PDF parsing
- **Voice Services**: Vapi for automated phone calls
- **Web Scraping**: Bright Data for real-time information
- **Analytics**: System metrics and performance monitoring

## 📚 Documentation

- **Fetch.ai uAgent Framework**: https://docs.fetch.ai/agent/
- **Agent Communication**: Inter-agent messaging and coordination
- **Error Handling**: Graceful fallbacks and error recovery
- **Performance**: Optimized for healthcare workflow requirements

---

**CareLink Agent System** - Built with Fetch.ai uAgent framework for healthcare discharge coordination.
