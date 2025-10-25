# 🤖 Parser Agent Integration Guide

## ✅ You're Now Using Fetch.ai Parser Agent!

Your system has been updated to use **proper Fetch.ai uAgent messaging** for PDF processing.

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Frontend Uploads PDF                                     │
│     http://localhost:3000                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FastAPI Backend Receives PDF                            │
│     POST /api/process-pdf                                   │
│     (main.py on port 8000)                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
                 📤 HTTP POST REQUEST
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 🤖 PARSER AGENT (Fetch.ai uAgent)                       │
│     http://127.0.0.1:8011/submit                           │
│     - Receives PDFProcessingRequest                         │
│     - Runs LlamaParse                                       │
│     - Runs Gemini AI                                        │
│     - Returns AutofillData                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
                 📥 HTTP RESPONSE
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Backend Returns Autofill Data                           │
│     Frontend auto-fills form                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Start the System

### **Step 1: Start Parser Agent**

Open a NEW terminal:

```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
python agents/parser_agent.py
```

You should see:
```
🤖 Parser Agent starting on port 8011
Agent address: agent1q...
🌐 REST endpoint available at http://127.0.0.1:8011/submit
```

**Leave this terminal running!**

### **Step 2: Start Backend API**

Open ANOTHER terminal:

```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
python main.py
```

You should see:
```
✅ Agents imported successfully
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Leave this terminal running!**

### **Step 3: Start Frontend**

Open a THIRD terminal:

```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/frontend
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

---

## 🔍 How to Verify Parser Agent is Working

### **Test 1: Check Agent is Running**

Visit in browser: **http://127.0.0.1:8011/**

You should see Fetch.ai agent info.

### **Test 2: Upload a PDF**

1. Go to http://localhost:3000
2. Upload a PDF file
3. Click "Process PDFs & Autofill Form"

### **Test 3: Watch the Logs**

In the **Parser Agent terminal**, you should see:

```
============================================================
🤖 PARSER AGENT RECEIVED HTTP REQUEST
============================================================
📋 Case ID: CASE_1234567890
📄 File: discharge_summary.pdf
📍 Path: /tmp/tmp123.pdf
📝 Type: discharge_summary

🔄 Step 1: Parsing PDF with LlamaParse...
✅ Parsed 2543 characters

🔄 Step 2: Extracting data with Gemini AI...
✅ Extracted 42 fields

🔄 Step 3: Formatting for autofill...
✅ Formatted with confidence 0.85

============================================================
✅ PARSER AGENT COMPLETED SUCCESSFULLY
============================================================
```

In the **Backend API terminal**, you should see:

```
============================================================
🤖 USING FETCH.AI PARSER AGENT
============================================================

📄 Processing: discharge_summary.pdf
📍 Temp file: /tmp/tmp123.pdf
🔗 Sending message to Parser Agent on port 8011...
📤 Sending to Parser Agent: http://127.0.0.1:8011
✅ Parser Agent responded successfully
📊 Confidence Score: 0.85

============================================================
✅ All PDFs processed via Parser Agent
============================================================
```

---

## ✅ Confirmation You're Using the Agent

The API response now includes:

```json
{
  "status": "success",
  "agent_used": "parser_agent",    ← THIS CONFIRMS AGENT IS BEING USED
  "agent_port": 8011,               ← THIS SHOWS WHICH PORT
  "autofill_data": { ... }
}
```

---

## 🎯 Key Differences: Before vs. After

### ❌ **BEFORE (Direct Function Calls)**
```python
# main.py - NOT using agents
from agents.parser_agent import parse_document_with_llamaparse
parsed_text = await parse_document_with_llamaparse(...)
```
- No agent communication
- Parser agent doesn't need to run
- Not a true multi-agent system

### ✅ **AFTER (Fetch.ai Agent Messaging)**
```python
# main.py - USING agents
response = await send_message_to_parser_agent(
    case_id=case_id,
    file_path=temp_file_path,
    file_name=file.filename,
    document_type="discharge_summary"
)
```
- True Fetch.ai uAgent communication
- Parser agent MUST be running on port 8011
- Proper multi-agent architecture

---

## 🛠️ Troubleshooting

### **Error: "Parser Agent not running"**

```
❌ Cannot connect to Parser Agent at http://127.0.0.1:8011
⚠️ Make sure Parser Agent is running: python agents/run_all.py
```

**Solution:**
```bash
# Start the parser agent
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
python agents/parser_agent.py
```

### **Error: "Connection refused"**

- Make sure parser agent is running BEFORE you upload PDFs
- Check port 8011 is not being used by another process
- Restart the parser agent

### **No logs appearing**

- Make sure you're looking at the right terminal (parser agent terminal)
- Try uploading a PDF again
- Check for errors in backend API terminal

---

## 🎉 Success Indicators

You'll know it's working when you see:

1. ✅ Parser agent terminal shows "PARSER AGENT RECEIVED HTTP REQUEST"
2. ✅ Backend terminal shows "USING FETCH.AI PARSER AGENT"
3. ✅ API response includes `"agent_used": "parser_agent"`
4. ✅ Form auto-fills with extracted data
5. ✅ No connection errors in logs

---

## 📊 Running All Agents Together

To run ALL 9 agents at once (recommended for full system):

```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
source venv/bin/activate
python agents/run_all.py
```

This starts:
- Coordinator Agent (port 8002)
- Shelter Agent (port 8003)
- Transport Agent (port 8004)
- Social Worker Agent (port 8005)
- Resource Agent (port 8007)
- Pharmacy Agent (port 8008)
- Eligibility Agent (port 8009)
- Analytics Agent (port 8010)
- **Parser Agent (port 8011)** ← Your PDF processor

---

## 🔑 Required Environment Variables

Make sure you have in `.env`:

```bash
# Required for PDF parsing
GEMINI_API_KEY=AIzaSyC-your-key-here        # CRITICAL!
LLAMA_CLOUD_API_KEY=llx-your-key-here       # Optional

# For full agent system
FETCH_AI_API_KEY=your_fetch_ai_key_here     # Optional for dev
```

Get keys from:
- Gemini: https://ai.google.dev/
- LlamaParse: https://cloud.llamaindex.ai/
- Fetch.ai: https://developer.fetch.ai/

---

## 🎯 Next Steps

1. ✅ Start parser agent: `python agents/parser_agent.py`
2. ✅ Start backend: `python main.py`
3. ✅ Upload a PDF
4. ✅ Watch the logs prove it's using the agent!
5. 🎉 Show off your multi-agent system!

---

**You're now using a TRUE Fetch.ai multi-agent system! 🚀**

