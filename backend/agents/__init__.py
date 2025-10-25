"""
CareLink Agents Package
Fetch.ai uAgent framework implementation for healthcare discharge coordination

This package contains all the specialized agents for the CareLink system:
- Coordinator Agent: Central workflow orchestrator
- Shelter Agent: Shelter capacity and availability management
- Transport Agent: Transportation scheduling and tracking
- Social Worker Agent: Case assignments and follow-up care
- Parser Agent: Document intelligence and PDF processing
- Resource Agent: Food, hygiene, clothing coordination
- Pharmacy Agent: Medication continuity and access
- Eligibility Agent: Benefit verification and eligibility checking
- Analytics Agent: System metrics and reporting
"""

# Import models module using direct file loading
import sys
import os
import importlib.util

# Get the directory containing this __init__.py file
current_dir = os.path.dirname(os.path.abspath(__file__))
models_path = os.path.join(current_dir, 'models.py')

# Load models.py directly
spec = importlib.util.spec_from_file_location('models', models_path)
models_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_module)

# Import all classes from models
for name in dir(models_module):
    if not name.startswith('_') and name[0].isupper():
        globals()[name] = getattr(models_module, name)
from .coordinator_agent import coordinator_agent
from .shelter_agent import shelter_agent
from .transport_agent import transport_agent
from .social_worker_agent import social_worker_agent
from .parser_agent import parser_agent
from .resource_agent import resource_agent
from .pharmacy_agent import pharmacy_agent
from .eligibility_agent import eligibility_agent
from .analytics_agent import analytics_agent

# Export all agents
__all__ = [
    # Models
    'DischargeRequest', 'WorkflowUpdate', 'ShelterMatch', 'TransportRequest',
    'SocialWorkerAssignment', 'ResourceRequest', 'PharmacyRequest', 
    'EligibilityRequest', 'DocumentParseRequest', 'PDFProcessingRequest',
    'ParsedDischargeData', 'AutofillData', 'AnalyticsData',
    
    # Agents
    'coordinator_agent', 'shelter_agent', 'transport_agent', 
    'social_worker_agent', 'parser_agent', 'resource_agent',
    'pharmacy_agent', 'eligibility_agent', 'analytics_agent'
]

# Agent registry for easy access
AGENT_REGISTRY = {
    'coordinator': coordinator_agent,
    'shelter': shelter_agent,
    'transport': transport_agent,
    'social_worker': social_worker_agent,
    'parser': parser_agent,
    'resource': resource_agent,
    'pharmacy': pharmacy_agent,
    'eligibility': eligibility_agent,
    'analytics': analytics_agent
}

def get_agent(agent_name: str):
    """Get agent by name"""
    return AGENT_REGISTRY.get(agent_name)

def list_agents():
    """List all available agents"""
    return list(AGENT_REGISTRY.keys())

def run_all_agents():
    """Run all agents (for development/testing)"""
    for agent_name, agent in AGENT_REGISTRY.items():
        print(f"Starting {agent_name} agent...")
        # In production, agents would be run as separate processes
        # agent.run()
