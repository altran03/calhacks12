# 🛠️ YOUR SETUP CHECKLIST
## What You Need to Set Up On Your End

---

## 🔑 **1. API Keys & Environment Variables**

### **Required API Keys:**

Create `/Users/amybihag/Calhacks12.0/calhacks12/backend/.env` with:

```bash
# PDF Processing (Parser Agent)
LLAMAPARSE_API_KEY=your_llamaparse_key_here
GEMINI_API_KEY=your_gemini_key_here

# Voice Calls (Shelter Agent, Transport Agent, etc.)
VAPI_API_KEY=your_vapi_key_here
VAPI_PHONE_NUMBER=your_vapi_phone_number

# Web Scraping (Shelter, Pharmacy, Resource Agents)
BRIGHT_DATA_API_KEY=your_bright_data_key_here
BRIGHT_DATA_ZONE=your_bright_data_zone

# Map Visualization (Frontend)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Database (if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### **Where to Get These:**
- **LlamaParse**: https://cloud.llamaindex.ai/ ✅ (You probably have this)
- **Gemini API**: https://ai.google.dev/ ✅ (You probably have this)
- **VAPI**: https://vapi.ai/ - Sign up for voice AI calls
- **Bright Data**: https://brightdata.com/ - Sign up for web scraping
- **MapBox**: https://www.mapbox.com/ - Sign up for free tier

---

## 🗺️ **2. MapBox Setup**

### **Create MapBox Account:**
1. Go to https://www.mapbox.com/
2. Sign up (free tier is fine for demo)
3. Get your Access Token
4. Add to `.env` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### **Enable These MapBox APIs:**
- ✅ Directions API (for route visualization)
- ✅ Geocoding API (for address lookups)
- ✅ Static Images API (optional, for report generation)

### **Install MapBox SDK in Frontend:**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/frontend
npm install mapbox-gl @mapbox/mapbox-gl-directions
npm install -D @types/mapbox-gl
```

---

## 📞 **3. VAPI Setup (Voice Calls)**

### **Create VAPI Account:**
1. Sign up at https://vapi.ai/
2. Get API key
3. Set up phone number (or use their test numbers)

### **Create VAPI Assistants:**

You need to create assistants for:

#### **Shelter Verification Assistant:**
```json
{
  "name": "Shelter Verification Assistant",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are calling to verify homeless shelter bed availability. Ask: 1) How many beds are available tonight? 2) Do you have wheelchair accessibility? 3) What services do you provide? 4) Can you accommodate dietary restrictions? 5) What's your address? Be professional and concise."
      }
    ]
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "professional_female"
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2"
  }
}
```

#### **Transport Confirmation Assistant:**
```json
{
  "name": "Transport Confirmation Assistant",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are confirming wheelchair-accessible transportation. Ask: 1) Can you pick up from UCSF Medical at [TIME]? 2) Destination is [ADDRESS]. 3) Wheelchair-accessible vehicle required. 4) Get driver name and ETA."
      }
    ]
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "professional_female"
  }
}
```

### **For Demo (Without Real Calls):**
Set up a test phone number you control, and VAPI will call it during demo.

---

## 🌐 **4. Bright Data Setup (Web Scraping)**

### **Create Bright Data Account:**
1. Sign up at https://brightdata.com/
2. Create a Scraping Browser or Web Scraper IDE instance
3. Get API credentials

### **Create Scrapers For:**

#### **Shelter Scraper:**
- Target: SF homeless shelter websites
- Extract: Name, address, capacity, services, accessibility
- Save as JSON

#### **Pharmacy Scraper:**
- Target: Nearby pharmacy locations (Google Maps, Yelp)
- Extract: Name, address, phone, hours

#### **Resource Scraper:**
- Target: SF food banks, clothing closets
- Extract: Name, address, hours, items available

### **Or Use Mock Data for Demo:**
I can create hardcoded JSON files for shelters/pharmacies/resources if you don't have time to set up Bright Data.

---

## 📄 **5. LaTeX Setup (Final Report Generation)**

### **Install LaTeX on Backend Server:**

```bash
# macOS
brew install --cask mactex

# Or minimal version
brew install basictex
```

### **Install Python LaTeX Package:**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
pip install pylatex
```

### **Test LaTeX Installation:**
```bash
pdflatex --version
```

---

## 🤖 **6. Fetch.ai uAgents Setup**

### **Already Installed:**
Your agents already have the uAgents framework installed.

### **What You Need to Do:**

1. **Fund Agents (Optional for local testing):**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend/agents
python3 -c "from uagents.setup import fund_agent_if_low; import asyncio; asyncio.run(fund_agent_if_low('your_agent_address'))"
```

2. **Test Agent Communication:**
I'll create a test script for you to verify all agents can talk to each other.

---

## 🗄️ **7. Database Setup (Optional)**

### **If Using Supabase:**
- Already set up in your `supabase_client.py`
- Just need to add credentials to `.env`

### **For Agent Logs/Analytics:**
- Decide if you want to store agent logs in database
- Or just keep them in memory for demo

---

## 📦 **8. Install Missing Dependencies**

### **Backend:**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
pip install pylatex
pip install httpx  # For making HTTP calls to agents
```

### **Frontend:**
```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/frontend
npm install mapbox-gl @mapbox/mapbox-gl-directions
npm install @types/mapbox-gl --save-dev
npm install framer-motion  # For animations (if not already installed)
```

---

## 🎯 **9. Mock Data for Demo (If No Time for Real APIs)**

If you don't have time to set up VAPI/Bright Data, I can create:

### **Option A: Fully Mocked Demo**
- ✅ Hardcoded shelter data with coordinates
- ✅ Simulated VAPI call logs
- ✅ Bright Data results from JSON files
- ⚠️ Still professional-looking, just no real external calls

### **Option B: Hybrid Demo**
- ✅ Real LlamaParse + Gemini (Parser Agent works)
- ✅ Real MapBox visualization
- ⚠️ Mocked VAPI calls (show logs but don't actually call)
- ⚠️ Hardcoded shelter/resource data

**Which would you prefer?**

---

## 📋 **10. Testing Checklist**

### **Phase 0: PDF Processing**
- [ ] Upload PDF → Parser Agent extracts data
- [ ] Form autofills correctly
- [ ] Can edit autofilled data

### **Phase 1-2: Coordinator + Pharmacy + Social Worker**
- [ ] Submit form → Coordinator receives
- [ ] Pharmacy checks hospital_pharmacy_inventory.json
- [ ] Social Worker reviews form

### **Phase 3: Parallel Agents**
- [ ] Eligibility Agent checks benefits
- [ ] Resource Agent searches providers
- [ ] Shelter Agent calls shelters (or mocks)

### **Phase 4: Shelter Search**
- [ ] Shelter Agent marks shelters on MapBox (green/yellow pins)
- [ ] Can click pins to see details
- [ ] Selected shelter highlighted in green

### **Phase 5-6: Transport + MapBox**
- [ ] Transport Agent schedules ride
- [ ] Route animates on MapBox
- [ ] Live vehicle tracking (simulated)
- [ ] ETA countdown timer

### **Phase 7-8: Final Report**
- [ ] Social Worker verifies all agents
- [ ] Generates LaTeX PDF
- [ ] PDF displays professionally

### **Phase 9: Analytics**
- [ ] Analytics Agent logs all activity
- [ ] Catches errors
- [ ] Shows system health

---

## ⏱️ **Time Estimates**

| Task | Time | Priority |
|------|------|----------|
| MapBox setup + basic map | 30 min | HIGH |
| Hospital pharmacy JSON | ✅ DONE | HIGH |
| LaTeX template creation | 1 hour | HIGH |
| VAPI setup (real calls) | 1-2 hours | MEDIUM |
| Bright Data scrapers | 2-3 hours | MEDIUM |
| Mock data for demo | 30 min | HIGH (if no time for real APIs) |
| Agent orchestration updates | 3-4 hours | HIGH (I'll do this) |
| MapBox shelter pins | 1 hour | HIGH (I'll help) |
| MapBox route animation | 1 hour | HIGH (I'll help) |
| Frontend final report display | 1 hour | HIGH (I'll help) |

---

## 🚀 **Quick Start (Minimum Viable Demo)**

### **If you have LIMITED time, do this:**

1. ✅ Get MapBox token (15 min)
2. ✅ Get VAPI key (just for show, can mock calls) (15 min)
3. ⚠️ Use mock shelter/resource data (I'll create)
4. ✅ LaTeX template (I'll create)
5. ✅ Agent orchestration (I'll implement)
6. ✅ MapBox visualization (I'll implement)

**Total time: ~2-3 hours for you, I'll handle the rest**

---

## 📞 **What I Need From You RIGHT NOW:**

1. **Do you want REAL VAPI calls or mocked?**
   - Real = More impressive but takes setup time
   - Mocked = Faster, still looks professional

2. **Do you want REAL Bright Data scraping or mocked?**
   - Real = Live shelter/resource data
   - Mocked = Hardcoded but realistic data

3. **MapBox token** - Can you get this? (Takes 5 min to sign up)

4. **Do you already have VAPI/Bright Data accounts?**

---

## ✅ **Once You Tell Me, I'll:**

1. Create all mock data files (if needed)
2. Implement full agent orchestration
3. Create LaTeX report template
4. Build MapBox visualization components
5. Update all agents to follow correct workflow
6. Create test scripts to verify everything works

**Reply with your preferences and I'll start implementing immediately!** 🚀

