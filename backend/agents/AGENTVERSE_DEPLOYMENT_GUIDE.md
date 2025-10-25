# Agentverse Deployment Guide

## ✅ All Agents Updated for Agentverse Deployment

All 8 agents have been updated to use proper **Chat Protocols** according to Fetch.ai documentation, making them ready for **Agentverse deployment**.

## 📋 Updated Agents

### 1. **Coordinator Agent** (`coordinator_agent.py`)
- ✅ Protocol: `CoordinatorProtocol v1.0.0`
- ✅ Handles: `DischargeRequest`, `WorkflowUpdate`
- ✅ Replies: `WorkflowUpdate`
- ✅ Manifest published: Yes

### 2. **Parser Agent** (`parser_agent.py`)
- ✅ Protocol: `ParserProtocol v1.0.0`
- ✅ Handles: `DocumentParseRequest`, `PDFProcessingRequest`
- ✅ Replies: `WorkflowUpdate`, `AutofillData`
- ✅ Manifest published: Yes

### 3. **Shelter Agent** (`shelter_agent.py`)
- ✅ Protocol: `ShelterProtocol v1.0.0`
- ✅ Handles: `ShelterMatch`, `ShelterAvailabilityRequest`
- ✅ Replies: `WorkflowUpdate`, `ShelterAvailabilityResponse`
- ✅ Manifest published: Yes

### 4. **Transport Agent** (`transport_agent.py`)
- ✅ Protocol: `TransportProtocol v1.0.0`
- ✅ Handles: `TransportRequest`
- ✅ Replies: `TransportConfirmation`, `WorkflowUpdate`
- ✅ Manifest published: Yes

### 5. **Social Worker Agent** (`social_worker_agent.py`)
- ✅ Protocol: `SocialWorkerProtocol v1.0.0`
- ✅ Handles: `SocialWorkerAssignment`, `WorkflowUpdate`
- ✅ Replies: `SocialWorkerConfirmation`, `WorkflowUpdate`
- ✅ Manifest published: Yes

### 6. **Resource Agent** (`resource_agent.py`)
- ✅ Protocol: `ResourceProtocol v1.0.0`
- ✅ Handles: `ResourceRequest`
- ✅ Replies: `WorkflowUpdate`
- ✅ Manifest published: Yes

### 7. **Pharmacy Agent** (`pharmacy_agent.py`)
- ✅ Protocol: `PharmacyProtocol v1.0.0`
- ✅ Handles: `PharmacyRequest`
- ✅ Replies: `PharmacyMatch`, `WorkflowUpdate`
- ✅ Manifest published: Yes

### 8. **Eligibility Agent** (`eligibility_agent.py`)
- ✅ Protocol: `EligibilityProtocol v1.0.0`
- ✅ Handles: `EligibilityRequest`
- ✅ Replies: `EligibilityResult`, `WorkflowUpdate`
- ✅ Manifest published: Yes

## 🎯 What Changed

### Before (Not Agentverse Compatible)
```python
@agent.on_message(model=SomeMessage)
async def handler(ctx: Context, sender: str, msg: SomeMessage):
    ...
```

### After (Agentverse Ready ✅)
```python
# 1. Define Protocol
my_protocol = Protocol(name="MyProtocol", version="1.0.0")

# 2. Use protocol handlers with reply types
@my_protocol.on_message(model=RequestMessage, replies={ResponseMessage})
async def handler(ctx: Context, sender: str, msg: RequestMessage):
    ...

# 3. Include protocol with manifest publishing
agent.include(my_protocol, publish_manifest=True)
```

## 🚀 Deploying to Agentverse

### Step 1: Test Locally
```bash
cd backend
python3 -m agents.coordinator_agent  # Test each agent
```

### Step 2: Register with Almanac
When you run each agent with `publish_manifest=True`, it will:
- ✅ Generate a protocol manifest
- ✅ Register with the Almanac contract
- ✅ Make agent discoverable by other agents
- ✅ Publish message schemas and interaction patterns

### Step 3: Deploy to Agentverse
1. Go to https://agentverse.ai
2. Create new agent
3. Copy agent code
4. Deploy with provided seed phrase
5. Agent will automatically register its protocol manifest

## 📊 Manifest Example

When deployed, each agent publishes a manifest like this:

```json
{
  "version": "1.0",
  "metadata": {
    "name": "CoordinatorProtocol",
    "version": "1.0.0",
    "digest": "proto:2a34b5504c58f43b2932cdd73358cebe0b668ea10e6796abba3dec8a4c50f25b"
  },
  "models": [
    {
      "digest": "model:465d2d900b616bb4082d4d7fcd9cc558643bb1b9b45660a7f546d5b5b5c0aba5",
      "schema": {
        "properties": {
          "case_id": {"title": "Case ID", "type": "string"},
          "patient_name": {"title": "Patient Name", "type": "string"}
        },
        "required": ["case_id", "patient_name"],
        "title": "DischargeRequest",
        "type": "object"
      }
    }
  ],
  "interactions": [
    {
      "type": "normal",
      "request": "model:ae2de187153cc7a80641a52927aa2852a820cd56bbbdb8671a0d1e643472f9b7",
      "responses": [
        "model:465d2d900b616bb4082d4d7fcd9cc558643bb1b9b45660a7f546d5b5b5c0aba5"
      ]
    }
  ]
}
```

## 🔗 Benefits of Chat Protocol Implementation

### ✅ Agentverse Deployment
- Agents can now be deployed to Fetch.ai's hosted Agentverse platform
- No need to manage your own infrastructure
- Automatic scaling and availability

### ✅ Agent Discovery
- Other agents can discover your agents via the Almanac
- Protocol manifests make capabilities clear
- Standardized message formats

### ✅ Interoperability
- Any agent following the same protocol can communicate
- External systems can integrate easily
- Version management built-in

### ✅ Production Ready
- Follows Fetch.ai best practices
- Manifest-based validation
- Type-safe message handling

## 🎓 Further Reading

- [Fetch.ai uAgents Documentation](https://docs.fetch.ai/uagents)
- [Agentverse Platform](https://agentverse.ai)
- [Protocol Reference](https://docs.fetch.ai/guides/agents/intermediate/protocols)
- [Almanac Contract](https://docs.fetch.ai/guides/agents/intermediate/almanac-contract)

---

**All agents are now ready for Agentverse deployment! 🚀**

