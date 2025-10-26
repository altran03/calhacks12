"""
Fetch.ai uAgents Initialization
Registers all agents and makes them available for coordination
"""

from .models import *
from .agent_registry import registry, AgentNames, get_agent_address

# Import agents in dependency order to avoid circular import warnings
from .analytics_agent import analytics_agent
from .parser_agent import parser_agent, parser_protocol
from .eligibility_agent import eligibility_agent, eligibility_protocol
from .pharmacy_agent import pharmacy_agent, pharmacy_protocol
from .resource_agent import resource_agent, resource_protocol
from .shelter_agent import shelter_agent, shelter_protocol
from .transport_agent import transport_agent, transport_protocol
from .social_worker_agent import social_worker_agent, social_worker_protocol
from .coordinator_agent import coordinator_agent, coordinator_protocol

# Register all agents with their addresses
def initialize_agents():
    """
    Initialize and register all agents
    Must be called before agents start communicating
    """
    print("\n" + "="*60)
    print("🤖 INITIALIZING FETCH.AI AGENTS")
    print("="*60)
    
    # Register all agents
    registry.register(AgentNames.COORDINATOR, coordinator_agent.address, coordinator_agent)
    registry.register(AgentNames.PARSER, parser_agent.address, parser_agent)
    registry.register(AgentNames.SOCIAL_WORKER, social_worker_agent.address, social_worker_agent)
    registry.register(AgentNames.SHELTER, shelter_agent.address, shelter_agent)
    registry.register(AgentNames.TRANSPORT, transport_agent.address, transport_agent)
    registry.register(AgentNames.RESOURCE, resource_agent.address, resource_agent)
    registry.register(AgentNames.PHARMACY, pharmacy_agent.address, pharmacy_agent)
    registry.register(AgentNames.ELIGIBILITY, eligibility_agent.address, eligibility_agent)
    registry.register(AgentNames.ANALYTICS, analytics_agent.address, analytics_agent)
    
    print(f"\n✅ Registered {len(registry.list_agents())} agents")
    print("\n📋 Agent Registry:")
    for name, address in registry.list_agents().items():
        print(f"   • {name}: {address}")
    print("\n" + "="*60 + "\n")
    
    return registry

# Auto-initialize on import
initialize_agents()

# Export for convenience
__all__ = [
    # Agents
    'coordinator_agent',
    'parser_agent',
    'social_worker_agent',
    'shelter_agent',
    'transport_agent',
    'resource_agent',
    'pharmacy_agent',
    'eligibility_agent',
    'analytics_agent',
    
    # Protocols
    'coordinator_protocol',
    'parser_protocol',
    'social_worker_protocol',
    'shelter_protocol',
    'transport_protocol',
    'resource_protocol',
    'pharmacy_protocol',
    'eligibility_protocol',
    
    # Models (all from models.py)
    'DischargeRequest',
    'WorkflowUpdate',
    'PDFProcessingRequest',
    'AutofillData',
    'ShelterMatch',
    'TransportRequest',
    'SocialWorkerAssignment',
    'ResourceRequest',
    'PharmacyRequest',
    'EligibilityRequest',
    
    # Registry
    'registry',
    'AgentNames',
    'get_agent_address',
    'initialize_agents'
]
