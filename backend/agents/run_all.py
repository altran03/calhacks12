#!/usr/bin/env python3
"""
Run All CareLink Agents
Starts all 9 agents in separate processes
"""

import subprocess
import sys
import time
import threading
from pathlib import Path

# Get the agents directory
agents_dir = Path(__file__).parent

# List of all agent files
agents = [
    ("Coordinator", "coordinator_agent.py", 8002),
    ("Shelter", "shelter_agent.py", 8003),
    ("Transport", "transport_agent.py", 8004),
    ("Social Worker", "social_worker_agent.py", 8005),
    ("Resource", "resource_agent.py", 8007),
    ("Pharmacy", "pharmacy_agent.py", 8008),
    ("Eligibility", "eligibility_agent.py", 8009),
    ("Analytics", "analytics_agent.py", 8010),
    ("Parser", "parser_agent.py", 8011),
]

def start_fetchai_agent_monitoring():
    """Start FetchAI agent communication monitoring"""
    time.sleep(15)  # Wait for agents to initialize
    
    print("\n" + "=" * 80)
    print("🤖 FETCH.AI AGENT COMMUNICATION MONITORING")
    print("=" * 80)
    print("📡 Monitoring real agent conversations...")
    print("🔄 Agents will communicate when workflows are triggered")
    print("📞 Vapi calls will be made to verify shelter availability")
    print("=" * 80)
    
    # Import the FetchAI agent communication system
    try:
        from agents.fetchai_agent_communication import get_agent_conversations, get_conversation_summary
        
        # Monitor conversations in real-time
        while True:
            time.sleep(5)  # Check every 5 seconds
            conversations = get_agent_conversations()
            if conversations:
                print(f"\n📊 Total conversations: {len(conversations)}")
                # Show latest conversation
                latest = conversations[-1]
                print(f"🔄 Latest: {latest['from_agent']} → {latest['to_agent']}")
                print(f"📋 Type: {latest['message_type']}")
                print(f"⏰ Time: {latest['timestamp']}")
    except ImportError:
        print("⚠️ FetchAI agent communication system not available")
        print("🔄 Agents will still communicate, but logging may be limited")

def cleanup_old_agents():
    """Kill any existing agent processes to avoid conflicts"""
    try:
        subprocess.run(
            ["pkill", "-f", "agents.coordinator_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.shelter_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.transport_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.social_worker_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.parser_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.resource_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.pharmacy_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.eligibility_agent"],
            stderr=subprocess.DEVNULL
        )
        subprocess.run(
            ["pkill", "-f", "agents.analytics_agent"],
            stderr=subprocess.DEVNULL
        )
        time.sleep(2)  # Give processes time to die
    except Exception as e:
        print(f"⚠️ Warning: Could not cleanup old processes: {e}")

def main():
    """Start all agents"""
    print("🏥 CareLink Multi-Agent System")
    print("=" * 60)
    
    # Cleanup any old agent processes
    print("🧹 Cleaning up old agent processes...")
    cleanup_old_agents()
    print("✅ Cleanup complete")
    
    print("\nStarting all agents...")
    print("=" * 60)
    print("\n⏳ Please wait, agents are starting...\n")
    
    # Agent communication will be shown in real-time
    print("🤖 Agent communication will be shown in real-time as agents interact")
    print("📡 Watch for agent messages and interactions below...")
    print("=" * 60)
    
    processes = []
    
    # Start each agent without capturing output so they can run properly
    for name, filename, port in agents:
        module_name = filename.replace('.py', '')
        
        try:
            # Run agent as module so relative imports work
            process = subprocess.Popen(
                [sys.executable, '-m', f'agents.{module_name}'],
                cwd=agents_dir.parent,  # Run from backend directory
                # Don't capture output - let it print to terminal
            )
            processes.append((name, process, port))
            print(f"✅ {name} Agent starting on port {port} (PID: {process.pid})")
            time.sleep(3)  # Longer delay to avoid websocket/bridge collisions
            
        except Exception as e:
            print(f"❌ Failed to start {name} Agent: {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ Started {len(processes)}/{len(agents)} agents")
    print("=" * 60)
    print("\n⏳ Waiting for agents to initialize (10 seconds)...")
    time.sleep(10)
    
    # Display agent information
    print("\n" + "=" * 60)
    print("📊 Agent Information:")
    print("=" * 60)
    
    for name, process, port in processes:
        status = "🟢 RUNNING" if process.poll() is None else "🔴 STOPPED"
        print(f"\n{name:15} | Port {port} | {status}")
        print(f"                | 🌐 Check terminal output above for Agent Inspector link")
        print(f"                | Look for: https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A{port}...")
    
    print("=" * 60)
    print("📋 Instructions:")
    print("1. Click on the Agentverse Inspector links above")
    print("2. Click 'Connect' in Agentverse for each agent")
    print("3. Your agents will be registered on Fetch.ai network")
    print("=" * 60)
    print("🔍 Agents are running. Press Ctrl+C to stop all agents")
    print("=" * 60)
    
    # Start FetchAI agent communication monitoring in background
    comm_thread = threading.Thread(target=start_fetchai_agent_monitoring, daemon=True)
    comm_thread.start()
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
            # Check if any processes have died
            for name, process, port in processes:
                if process.poll() is not None:
                    print(f"\n⚠️ {name} Agent stopped unexpectedly")
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all agents...")
        
        # Stop all agents
        for name, process, port in processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ {name} Agent stopped")
            except Exception as e:
                print(f"⚠️ Error stopping {name} Agent: {e}")
                try:
                    process.kill()
                except:
                    pass
        print("\n👋 All agents stopped. Goodbye!")

if __name__ == "__main__":
    main()
