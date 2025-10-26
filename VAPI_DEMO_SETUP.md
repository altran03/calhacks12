# 📞 VAPI Demo Setup Guide
## How to Use Your Personal Number for Shelter Calls

---

## 🎯 **Overview**

During the demo, when the Shelter Agent needs to verify bed availability, VAPI will call **YOUR personal number** instead of real shelter numbers. You'll answer the call and simulate a shelter staff member responding to the agent's questions.

---

## ⚙️ **Setup Steps**

### **1. Add Your Phone Number to .env**

Edit `/Users/amybihag/Calhacks12.0/calhacks12/backend/.env`:

```bash
# Demo Phone Number Configuration
# Format: +1234567890 (include country code, no spaces or dashes)
DEMO_PHONE_NUMBER=+15551234567  # 👈 Replace with YOUR actual number
DEMO_MODE=True

# Your VAPI API Key
VAPI_API_KEY=your_actual_vapi_key_here
```

**Phone Number Format:**
- ✅ `+15551234567` - Correct (country code + number, no spaces)
- ❌ `555-123-4567` - Wrong (no dashes)
- ❌ `(555) 123-4567` - Wrong (no parentheses)
- ❌ `5551234567` - Wrong (missing country code)

---

## 🎬 **Demo Flow**

### **What Happens:**

1. **User submits discharge form**
2. **Shelter Agent starts:**
   - Queries Supabase for wheelchair-accessible shelters
   - Gets top 3 shelters (e.g., Harbor Light, St. Anthony's, MSC South)
3. **Shelter Agent calls via VAPI:**
   - 📞 VAPI calls **YOUR phone number** (not the shelter's)
   - You see "CareLink Assistant" calling
4. **You answer as "shelter staff":**
   - Agent asks: "How many beds available tonight?"
   - You respond: "We have 12 beds available"
   - Agent asks: "Do you have wheelchair accessibility?"
   - You respond: "Yes, we're fully wheelchair accessible"
   - Agent asks: "What services do you provide?"
   - You respond: "We provide meals, showers, and case management"
5. **Agent transcribes your responses**
6. **Shelter Agent updates database and sends to MapBox**

---

## 🎭 **Script for Answering VAPI Calls**

### **Scenario 1: Harbor Light Center (Best Match)**
```
VAPI: "Hello, I'm calling to verify bed availability at Harbor Light Center. 
      Do you have a moment?"

YOU: "Yes, this is Harbor Light."

VAPI: "How many beds are available tonight?"

YOU: "We have 12 beds available."

VAPI: "Do you have wheelchair accessibility?"

YOU: "Yes, we're fully wheelchair accessible with ramps and accessible 
     bathrooms."

VAPI: "What services do you provide?"

YOU: "We provide three meals a day, showers, case management, and medical 
     respite care."

VAPI: "Can you accept someone tonight at 6pm?"

YOU: "Yes, we can accept them. Please have them check in at the front desk."

VAPI: "Thank you!"
```

### **Scenario 2: Alternative Shelter (If first is full)**
```
YOU: "We only have 3 beds available, and one requires stairs."

VAPI: "Is there wheelchair access?"

YOU: "Unfortunately not on the ground floor. We'd recommend Harbor Light 
     or St. Anthony's for wheelchair accessibility."
```

---

## 🗺️ **What You'll See in the Frontend**

After your call:

1. **Map View Tab:**
   - Green pin appears on Harbor Light Center location
   - Yellow pins on other available shelters
   - Click pins to see details

2. **Agent Workflow Tab:**
```
🏠 SHELTER AGENT
├─ 📞 Calling Harbor Light Center via VAPI...
├─ ✅ Call connected - verifying availability
├─ 🎙️ Transcript: "We have 12 beds available..."
├─ ✅ Harbor Light confirmed: 12 beds, wheelchair accessible
└─ 📍 Sending coordinates to MapBox (37.7749, -122.4194)
```

3. **MapBox shows:**
   - Green pin at Harbor Light
   - Yellow pins at 2 other shelters
   - Popup with: "12 beds available, wheelchair accessible"

---

## 🔧 **Testing the Setup**

### **Quick Test:**

```bash
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
python3 -c "
from vapi_integration import VapiIntegration
import os
from dotenv import load_dotenv

load_dotenv()
vapi = VapiIntegration(api_key=os.getenv('VAPI_API_KEY'))

print(f'Demo Mode: {vapi.demo_mode}')
print(f'Demo Phone: {vapi.demo_phone}')
print(f'Will call: {vapi.demo_phone}')
"
```

**Expected Output:**
```
Demo Mode: True
Demo Phone: +15551234567
Will call: +15551234567
```

---

## 📋 **During Your Demo Presentation**

### **Setup Before Demo:**
1. ✅ Make sure your phone is on and has good signal
2. ✅ Turn off Do Not Disturb
3. ✅ Have the script nearby for reference
4. ✅ Test that VAPI calls work (call yourself once before presenting)

### **During Demo:**
1. **Upload PDF** → Parser autofills form
2. **Submit form** → Agents start coordinating
3. **Your phone rings** → Answer confidently as "Harbor Light"
4. **Follow the script** → Give realistic shelter responses
5. **Show MapBox** → Audience sees green pin appear in real-time!
6. **Show agent logs** → "12 beds available, wheelchair accessible"

### **Pro Tips:**
- 📱 Put your phone on speaker so judges can hear
- 🎤 Speak clearly for VAPI transcription
- ⏱️ Keep responses brief and natural
- 😊 Be professional but friendly as "shelter staff"

---

## 🚨 **Troubleshooting**

### **Call doesn't come through:**
```bash
# Check your .env
cat backend/.env | grep DEMO_PHONE_NUMBER
cat backend/.env | grep VAPI_API_KEY

# Verify phone format
# Should be: +1XXXXXXXXXX (with + and country code)
```

### **Wrong number being called:**
```bash
# Make sure DEMO_MODE=True
cat backend/.env | grep DEMO_MODE

# Restart backend
# Kill old process, start new one to reload .env
```

### **VAPI call fails:**
- Check VAPI_API_KEY is correct
- Verify you have VAPI credits
- Check your VAPI account status

---

## 🎉 **Why This Works Great for Demos**

✅ **Full control** - You control the shelter's response  
✅ **Reliable** - No dependency on real shelters answering  
✅ **Impressive** - Judges see real voice AI in action  
✅ **Flexible** - You can simulate different scenarios  
✅ **Professional** - Shows complete workflow end-to-end  

---

## 🔄 **Switching to Production**

When ready for production:

```bash
# In .env, change:
DEMO_MODE=False

# Now it will call actual shelter phone numbers from Supabase
```

---

## ✅ **You're Ready!**

1. Add your phone number to `.env`
2. Test with: `python3 test_vapi_call.py` (I'll create this)
3. Practice answering as shelter staff
4. Demo with confidence! 🎯

