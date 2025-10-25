# 🏥 CareLink

Empowering hospitals, shelters, transport services, and social workers through Fetch.ai agents, Bright Data intelligence, and Vapi voice coordination.

## 💡 Problem

Every day, hospitals discharge unhoused patients with nowhere safe to go. Manual coordination between hospitals, shelters, transport providers, and social workers is slow, fragmented, and error-prone.

📊 Studies show that over 50–70% of homeless patients in U.S. hospitals are discharged to unsafe or unstable environments without a clear care plan.

## 💡 Solution — CareLink

CareLink is a decentralized, voice-enabled coordination system that connects hospitals, shelters, transport services, and social workers through Fetch.ai agents, Bright Data, and Vapi voice calls.

It automates discharge planning, verifies real shelter availability, arranges transportation, and connects social workers — all through a human-centered, AI-assisted workflow.

## 🧭 Vision

Ensure every unhoused patient leaving a hospital has:
- A verified shelter placement
- A coordinated transport route
- A connected social worker for continuity of care
- Access to basic post-discharge needs like meals, clothing, and medication

All orchestrated seamlessly through voice, automation, and community data.

## ⚙️ How It Works

### 🧠 Fetch.ai Multi-Agent Network

| Agent | Role |
|-------|------|
| 🏥 HospitalAgent | Collects discharge details and starts coordination |
| 🧭 CoordinatorAgent | Manages agent communication and Bright Data queries |
| 🧑‍🤝‍🧑 SocialWorkerAgent | Connects to follow-up care and approves placement |
| 🏠 ShelterAgent | Manages capacity info retrieved from Bright Data or voice calls |
| 🚐 TransportAgent | Schedules transport and tracks progress |
| ❤️ FollowUpCareAgent | Conducts post-discharge check-ins via voice |

### 🌐 Bright Data Integration (Data Intelligence Layer)

Instead of relying on static or outdated lists, Bright Data continuously retrieves and refreshes real-world information such as:
- Live San Francisco shelter listings from HSH and other local sources
- Publicly available community resource databases (food banks, medical respite, outreach centers)
- Transport provider schedules (municipal and nonprofit)

### 🔊 Vapi Voice Integration

Vapi powers the human interaction layer — ensuring accessibility for shelters and social workers who rely on phone communication.

- **Shelter Availability Calls**: Vapi contacts shelters automatically each evening
- **Social Worker Outreach**: Vapi calls social workers to confirm patient assignments
- **Transport Coordination**: Calls transport providers to schedule patient pickup/drop-off
- **Follow-Up Calls**: Conducts post-discharge voice check-ins with patients

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carelink
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your API keys
   ```

4. **Start the development servers**
   ```bash
   npm run dev:full
   ```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Fetch.ai Agents: Multiple ports (8001-8006)

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| AI Agents | Fetch.ai uAgents | Decentralized, autonomous coordination |
| Voice AI | Vapi | Voice communication with real-world entities |
| Data Intelligence | Bright Data | Live web data on shelters & resources |
| Backend | FastAPI + ngrok | Agent orchestration + Vapi webhook handling |
| Frontend | React + Tailwind + Framer Motion + React Leaflet | Interactive visualization |
| Data Source | San Francisco HSH + Bright Data | Real-world sample environment |

## 📱 Dashboard Features

### 1️⃣ Discharge Intake Panel
- Patient info form (medical condition, accessibility, dietary needs, social needs)
- Option to attach files (medications, discharge summary)
- "Start Coordination" triggers Fetch.ai agents

### 2️⃣ Workflow Timeline View
- Stepwise vertical animation: Discharge → Shelter Matching → Social Worker → Transport → Follow-Up
- Status chips ("In Progress", "Confirmed", "Awaiting Voice Verification")
- Hovering over a step opens transcript snippets or agent logs

### 3️⃣ San Francisco Map View
- Interactive map of HSH shelter locations and social service providers
- Shelter pins glow based on capacity (green = open, red = full)
- Click a pin → shows Bright Data-sourced info + latest Vapi transcript

### 4️⃣ Transport Tracker View
- Animated vehicle path from hospital → shelter
- Real-time ETA updates via TransportAgent

### 5️⃣ Case Summary & Logs
- Compact summary card with patient name, shelter assigned, social worker contact
- Transport route + ETA, follow-up schedule
- Click "Expand" → full chat-style feed of agent communications and voice call transcripts

## 🔧 Development

### Available Scripts

- `npm run dev` - Start Next.js frontend
- `npm run backend` - Start FastAPI backend
- `npm run agents` - Start Fetch.ai agents
- `npm run dev:full` - Start both frontend and backend concurrently
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Project Structure

```
carelink/
├── src/
│   ├── app/                 # Next.js app directory
│   └── components/          # React components
├── backend/
│   ├── main.py             # FastAPI server
│   ├── agents.py           # Fetch.ai agents
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment variables template
└── package.json            # Node.js dependencies
```

## 🌍 Community Coordination Reinvented

CareLink connects:
- Hospitals initiating safe discharge
- Shelters updating real-time availability
- Social workers ensuring continuity of care
- Transport providers guaranteeing safe arrival
- Patients who communicate via simple phone conversations

It's the digital backbone for community-based healthcare coordination — scalable, voice-driven, and human-centered.

## ❤️ Social Impact

✅ Prevents unsafe discharges for unhoused patients  
✅ Automates coordination among hospitals, shelters, and social workers  
✅ Uses live data to ensure real-time accuracy  
✅ Enables low-tech accessibility via voice calls  
✅ Saves hospitals money and improves patient outcomes  

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.