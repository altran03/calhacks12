#!/usr/bin/env python3
"""
Find Free Ports Script
Finds available ports for running agents
"""

import socket
import sys

def find_free_port(start_port=8000, max_attempts=100):
    """Find a free port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

def check_port(port):
    """Check if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('127.0.0.1', port))
            return True
    except OSError:
        return False

if __name__ == "__main__":
    print("🔍 Checking agent ports...")
    
    agent_ports = {
        "Coordinator": 8002,
        "Shelter": 8003,
        "Transport": 8004,
        "Social Worker": 8005,
        "Resource": 8007,
        "Pharmacy": 8008,
        "Eligibility": 8009,
        "Analytics": 8010,
        "Parser": 8011
    }
    
    print("\n📊 Port Status:")
    for agent, port in agent_ports.items():
        status = "✅ FREE" if check_port(port) else "❌ BUSY"
        print(f"  {agent:15} Port {port:4} - {status}")
    
    print("\n🔧 Available Commands:")
    print("  # Kill all processes using agent ports:")
    print("  sudo lsof -ti:8002,8003,8004,8005,8007,8008,8009,8010,8011 | xargs kill -9")
    print("\n  # Or use alternative ports (9000+ range)")
    print("  python3 run_coordinator_alt.py  # Port 9002")
