#!/usr/bin/env python3
"""
FetchAI Agent Communication System
Uses the actual FetchAI ecosystem to log and track agent conversations
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from uagents import Agent, Model
from uagents.context import Context
import httpx

class AgentCommunicationLogger:
    """Logs agent communications using FetchAI ecosystem"""
    
    def __init__(self):
        self.conversations = []
        self.start_time = datetime.now()
        
    def log_agent_message(self, from_agent: str, to_agent: str, message_type: str, content: Any, context: Optional[Context] = None):
        """Log a message between agents with FetchAI context"""
        timestamp = datetime.now()
        conversation_id = f"CONV_{int(timestamp.timestamp())}"
        
        # Extract agent addresses if available from context
        from_address = "unknown"
        to_address = "unknown"
        
        if context:
            from_address = getattr(context, 'agent_address', 'unknown')
        
        log_entry = {
            "conversation_id": conversation_id,
            "timestamp": timestamp.isoformat(),
            "from_agent": from_agent,
            "to_agent": to_agent,
            "from_address": from_address,
            "to_address": to_address,
            "message_type": message_type,
            "content": content,
            "status": "sent",
            "fetchai_context": {
                "agent_address": from_address,
                "message_id": getattr(context, 'message_id', None) if context else None,
                "session_id": getattr(context, 'session_id', None) if context else None
            }
        }
        
        self.conversations.append(log_entry)
        
        # Format for terminal display
        agent_emoji = self._get_agent_emoji(from_agent)
        agent_name = self._format_agent_name(from_agent)
        
        print(f"\n{'='*80}")
        print(f"{agent_emoji} {agent_name} FETCH.AI AGENT")
        print(f"{'='*80}")
        print(f"📅 Time: {timestamp.strftime('%H:%M:%S')}")
        print(f"📤 Sending to: {self._format_agent_name(to_agent)}")
        print(f"📋 Message Type: {message_type}")
        print(f"🔗 Agent Address: {from_address}")
        print(f"💬 Content: {json.dumps(content, indent=2, default=str)}")
        print(f"{'='*80}\n")
        
        return conversation_id
    
    def log_agent_response(self, conversation_id: str, response: Any, status: str = "received", context: Optional[Context] = None):
        """Log a response from an agent"""
        for conv in self.conversations:
            if conv["conversation_id"] == conversation_id:
                conv["response"] = response
                conv["status"] = status
                conv["response_time"] = datetime.now().isoformat()
                
                if context:
                    conv["fetchai_context"]["response_agent_address"] = getattr(context, 'agent_address', 'unknown')
                
                # Format response for terminal display
                agent_emoji = self._get_agent_emoji(conv["to_agent"])
                agent_name = self._format_agent_name(conv["to_agent"])
                
                print(f"\n{'='*80}")
                print(f"{agent_emoji} {agent_name} FETCH.AI AGENT RESPONSE")
                print(f"{'='*80}")
                print(f"📅 Time: {datetime.now().strftime('%H:%M:%S')}")
                print(f"🔄 Status: {status}")
                
                # Special handling for VAPI transcriptions
                if isinstance(response, dict) and "transcription" in response and response.get("vapi_call_completed"):
                    print(f"🎤 VAPI Call Transcription: {response.get('transcription', '')}")
                    print(f"✅ Call Successful: {response.get('call_successful', False)}")
                    print(f"🛏️ Beds Available: {response.get('beds_available', 0)}")
                    print(f"♿ Accessibility: {response.get('accessibility', False)}")
                else:
                    print(f"💬 Response: {json.dumps(response, indent=2, default=str)}")
                print(f"{'='*80}\n")
                break
    
    def _get_agent_emoji(self, agent_name: str) -> str:
        """Get emoji for agent type"""
        emojis = {
            "coordinator": "🏥",
            "shelter": "🏠", 
            "transport": "🚗",
            "social_worker": "👥",
            "resource": "📦",
            "pharmacy": "💊",
            "eligibility": "📋",
            "analytics": "📊",
            "parser": "📄"
        }
        return emojis.get(agent_name.lower().replace("_", ""), "🤖")
    
    def _format_agent_name(self, agent_name: str) -> str:
        """Format agent name for display"""
        return agent_name.replace("_", " ").title()
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get summary of all conversations"""
        return {
            "total_conversations": len(self.conversations),
            "start_time": self.start_time.isoformat(),
            "duration": (datetime.now() - self.start_time).total_seconds(),
            "conversations": self.conversations
        }

# Global logger instance
agent_logger = AgentCommunicationLogger()

async def send_agent_message(from_agent: str, to_agent: str, message_type: str, content: Any, context: Optional[Context] = None) -> str:
    """Send a message between agents and log it"""
    conversation_id = agent_logger.log_agent_message(from_agent, to_agent, message_type, content, context)
    
    # Here you would implement actual FetchAI agent messaging
    # For now, we'll simulate the message sending
    await asyncio.sleep(0.1)  # Simulate network delay
    
    return conversation_id

async def log_agent_response(conversation_id: str, response: Any, status: str = "received", context: Optional[Context] = None):
    """Log a response from an agent"""
    agent_logger.log_agent_response(conversation_id, response, status, context)

def get_agent_conversations() -> List[Dict[str, Any]]:
    """Get all agent conversations"""
    return agent_logger.conversations

def get_conversation_summary() -> Dict[str, Any]:
    """Get conversation summary"""
    return agent_logger.get_conversation_summary()
