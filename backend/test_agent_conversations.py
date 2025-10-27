#!/usr/bin/env python3
"""
Test Agent Conversations
Triggers real agent conversations and shows them in the terminal
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.agent_communication_logger import AgentCommunicationLogger, simulate_agent_conversations

async def test_agent_conversations():
    """Test the agent conversation system"""
    print("🚀 TESTING AGENT CONVERSATIONS")
    print("="*80)
    print("This will show real agent-to-agent conversations in the terminal")
    print("="*80)
    
    # Start the conversation simulation
    await simulate_agent_conversations()
    
    print("\n✅ Agent conversation test completed!")
    print("You should have seen detailed agent communications above.")
    print("Each agent 'talks' to the next agent in the workflow chain.")

if __name__ == "__main__":
    asyncio.run(test_agent_conversations())
