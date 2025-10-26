"""
Agent Registry - Centralized address book for all Fetch.ai agents
Stores agent addresses for inter-agent communication
"""

from typing import Dict, Optional

class AgentRegistry:
    """
    Central registry for agent addresses
    Allows agents to find each other using their names
    """
    
    def __init__(self):
        self._addresses: Dict[str, str] = {}
        self._agents: Dict[str, any] = {}  # Store agent instances
    
    def register(self, name: str, address: str, agent_instance: any = None):
        """Register an agent's address"""
        self._addresses[name] = address
        if agent_instance:
            self._agents[name] = agent_instance
        print(f"✅ Registered agent: {name} at {address}")
    
    def get_address(self, name: str) -> Optional[str]:
        """Get an agent's address by name"""
        address = self._addresses.get(name)
        if not address:
            print(f"⚠️  Agent '{name}' not found in registry")
        return address
    
    def get_agent(self, name: str) -> Optional[any]:
        """Get an agent instance by name"""
        return self._agents.get(name)
    
    def list_agents(self) -> Dict[str, str]:
        """List all registered agents"""
        return self._addresses.copy()
    
    def is_registered(self, name: str) -> bool:
        """Check if an agent is registered"""
        return name in self._addresses

# Global registry instance
registry = AgentRegistry()


# Agent name constants for consistency
class AgentNames:
    """Standardized agent names"""
    COORDINATOR = "coordinator_agent"
    PARSER = "parser_agent"
    SOCIAL_WORKER = "social_worker_agent"
    SHELTER = "shelter_agent"
    TRANSPORT = "transport_agent"
    RESOURCE = "resource_agent"
    PHARMACY = "pharmacy_agent"
    ELIGIBILITY = "eligibility_agent"
    ANALYTICS = "analytics_agent"


def get_agent_address(name: str) -> str:
    """
    Get agent address with fallback
    Returns the address or a placeholder if not found
    """
    address = registry.get_address(name)
    if not address:
        print(f"⚠️  WARNING: Agent '{name}' not registered, using placeholder")
        return f"{name}_address_placeholder"
    return address

