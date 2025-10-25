# 🚀 Agentverse Setup Guide

## Step 1: Go to Agentverse
1. Open [Agentverse](https://agentverse.ai/) in your browser
2. Click "Sign Up" or "Get Started"
3. Create account with your email
4. Verify your email address
5. Log into the dashboard

## Step 2: Create Your 9 Agents

In the Agentverse dashboard, create these agents one by one:

### Agent 1: Hospital Agent
- **Name**: `Hospital Agent`
- **Description**: `Hospital coordination and patient management`
- **Type**: `Healthcare`
- **Copy the address** (looks like `fetch1abc123...`)

### Agent 2: Coordinator Agent
- **Name**: `Coordinator Agent`
- **Description**: `Central workflow orchestrator`
- **Type**: `Coordination`
- **Copy the address**

### Agent 3: Shelter Agent
- **Name**: `Shelter Agent`
- **Description**: `Shelter capacity and availability management`
- **Type**: `Housing`
- **Copy the address**

### Agent 4: Transport Agent
- **Name**: `Transport Agent`
- **Description**: `Transportation scheduling and tracking`
- **Type**: `Transportation`
- **Copy the address**

### Agent 5: Social Worker Agent
- **Name**: `Social Worker Agent`
- **Description**: `Case assignments and follow-up care`
- **Type**: `Social Services`
- **Copy the address**

### Agent 6: Parser Agent
- **Name**: `Parser Agent`
- **Description**: `Document intelligence and PDF processing`
- **Type**: `AI/ML`
- **Copy the address**

### Agent 7: Resource Agent
- **Name**: `Resource Agent`
- **Description**: `Food, hygiene, clothing coordination`
- **Type**: `Resources`
- **Copy the address**

### Agent 8: Pharmacy Agent
- **Name**: `Pharmacy Agent`
- **Description**: `Medication continuity and access`
- **Type**: `Healthcare`
- **Copy the address**

### Agent 9: Eligibility Agent
- **Name**: `Eligibility Agent`
- **Description**: `Benefit verification and eligibility checking`
- **Type**: `Benefits`
- **Copy the address**

### Agent 10: Analytics Agent
- **Name**: `Analytics Agent`
- **Description**: `System metrics and reporting`
- **Type**: `Analytics`
- **Copy the address**

## Step 3: Collect All Addresses

Write down all 10 agent addresses in this format:

```
HOSPITAL_AGENT_ADDRESS = "fetch1abc123..."
COORDINATOR_AGENT_ADDRESS = "fetch1def456..."
SHELTER_AGENT_ADDRESS = "fetch1ghi789..."
TRANSPORT_AGENT_ADDRESS = "fetch1jkl012..."
SOCIAL_WORKER_AGENT_ADDRESS = "fetch1mno345..."
PARSER_AGENT_ADDRESS = "fetch1pqr678..."
RESOURCE_AGENT_ADDRESS = "fetch1stu901..."
PHARMACY_AGENT_ADDRESS = "fetch1vwx234..."
ELIGIBILITY_AGENT_ADDRESS = "fetch1yza567..."
ANALYTICS_AGENT_ADDRESS = "fetch1bcd890..."
```

## Step 4: Update Your Environment

Add these addresses to your `backend/.env` file:

```bash
# Fetch.ai Agent Addresses (from Agentverse)
HOSPITAL_AGENT_ADDRESS=fetch1abc123...
COORDINATOR_AGENT_ADDRESS=fetch1def456...
SHELTER_AGENT_ADDRESS=fetch1ghi789...
TRANSPORT_AGENT_ADDRESS=fetch1jkl012...
SOCIAL_WORKER_AGENT_ADDRESS=fetch1mno345...
PARSER_AGENT_ADDRESS=fetch1pqr678...
RESOURCE_AGENT_ADDRESS=fetch1stu901...
PHARMACY_AGENT_ADDRESS=fetch1vwx234...
ELIGIBILITY_AGENT_ADDRESS=fetch1yza567...
ANALYTICS_AGENT_ADDRESS=fetch1bcd890...
```

## Step 5: Test the Setup

```bash
cd backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

addresses = [
    'HOSPITAL_AGENT_ADDRESS',
    'COORDINATOR_AGENT_ADDRESS',
    'SHELTER_AGENT_ADDRESS',
    'TRANSPORT_AGENT_ADDRESS',
    'SOCIAL_WORKER_AGENT_ADDRESS',
    'PARSER_AGENT_ADDRESS',
    'RESOURCE_AGENT_ADDRESS',
    'PHARMACY_AGENT_ADDRESS',
    'ELIGIBILITY_AGENT_ADDRESS',
    'ANALYTICS_AGENT_ADDRESS'
]

print('Checking agent addresses...')
for addr in addresses:
    value = os.getenv(addr)
    if value and value.startswith('fetch1'):
        print(f'✅ {addr}: {value}')
    else:
        print(f'❌ {addr}: Not configured')
"
```

## Step 6: Run the Agents

```bash
cd backend
python agents/run_agents.py
```

## What You'll See

- ✅ **Agents connect to Fetch.ai network**
- ✅ **Real agent-to-agent communication**
- ✅ **Blockchain-based coordination**
- ✅ **Production-ready deployment**

## Troubleshooting

If you get errors:
1. **Check addresses** - Make sure they start with `fetch1`
2. **Check .env file** - Make sure addresses are saved
3. **Check network** - Make sure you're connected to internet
4. **Check Agentverse** - Make sure agents are active in dashboard

## Next Steps

Once agents are running:
1. **Test communication** between agents
2. **Deploy to production** if needed
3. **Monitor agent activity** in Agentverse dashboard
4. **Scale up** as needed

---

**Result**: Real Fetch.ai agents running on the network! 🚀
