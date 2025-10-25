# 🔑 Fetch.ai API Key Guide

## ❌ **Current Issue: Wrong API Key Type**

I can see the problem! You have a **Google API key** in your `.env` file:
```bash
FETCH_AI_API_KEY=AIzaSyB0nXWuFcpyMXKTZcgyYxYdaxMEWUTqsbs
```

This is a **Google API key** (starts with `AIza`), but you need a **Fetch.ai API key** (starts with `fetch`).

## 🔧 **How to Fix This**

### **1. Get the Correct Fetch.ai API Key**

#### **Option A: Get Real Fetch.ai API Key (Recommended for Production)**
1. Go to [Fetch.ai Developer Portal](https://developer.fetch.ai/)
2. Sign up for a free account
3. Go to **API Keys** section
4. Generate a new API key
5. Copy the key (it looks like: `fetch_xxxxxxxxxxxxxxxx`)

#### **Option B: Use Demo Mode (For Development)**
You can run the system without a Fetch.ai API key - it will work in demo mode with mock data.

### **2. Update Your .env File**

```bash
# In backend/.env, replace the Google API key with:
FETCH_AI_API_KEY=your_actual_fetch_ai_api_key_here

# Or for demo mode, leave it empty:
# FETCH_AI_API_KEY=
```

### **3. Test the Configuration**

```bash
cd backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('FETCH_AI_API_KEY')
if api_key:
    if api_key.startswith('fetch_'):
        print('✅ Fetch.ai API Key configured correctly')
    elif api_key.startswith('AIza'):
        print('❌ This is a Google API key, not Fetch.ai')
    else:
        print('⚠️ Unknown API key format')
else:
    print('ℹ️ No API key - will run in demo mode')
"
```

## 🚀 **What Each API Key Does**

### **Google API Key (AIza...)**
- Used for **Google services** (Maps, Gemini, etc.)
- **NOT** for Fetch.ai agents
- Should be in `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY`

### **Fetch.ai API Key (fetch_...)**
- Used for **Fetch.ai agent network**
- Connects agents to the Fetch.ai blockchain
- Required for production deployment

## 🎯 **Current Status**

| Service | API Key | Status |
|---------|---------|--------|
| **Google Gemini** | `GEMINI_API_KEY` | ✅ Working |
| **Fetch.ai Agents** | `FETCH_AI_API_KEY` | ❌ Wrong key type |
| **Mapbox** | `NEXT_PUBLIC_MAPBOX_TOKEN` | ✅ Working |
| **Vapi** | `VAPI_API_KEY` | ✅ Working |

## 🔄 **Quick Fix Options**

### **Option 1: Get Real Fetch.ai Key**
1. Sign up at [developer.fetch.ai](https://developer.fetch.ai/)
2. Get your API key
3. Update `.env` file
4. Restart agents

### **Option 2: Run in Demo Mode**
1. Comment out the `FETCH_AI_API_KEY` line
2. System will use mock data
3. All features work, just with simulated data

### **Option 3: Use Google Key for Gemini**
```bash
# In backend/.env
GEMINI_API_KEY=AIzaSyB0nXWuFcpyMXKTZcgyYxYdaxMEWUTqsbs
FETCH_AI_API_KEY=  # Leave empty for demo mode
```

## 🧪 **Test the Fix**

```bash
# Test environment loading
cd backend
python -c "
from dotenv import load_dotenv
load_dotenv()
import os
print('FETCH_AI_API_KEY:', os.getenv('FETCH_AI_API_KEY'))
print('GEMINI_API_KEY:', os.getenv('GEMINI_API_KEY'))
"

# Test agents
python agents/run_agents.py
```

---

**Result**: You need a Fetch.ai API key, not a Google API key! 🔑
