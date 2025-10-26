#!/usr/bin/env python3
"""Simplified VAPI test - check VAPI docs for correct format"""
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
TEST_PHONE = os.getenv("TEST_PHONE_NUMBER", "")
VAPI_BASE_URL = "https://api.vapi.ai"

print(f"📞 VAPI Test")
print(f"🔑 API Key: {VAPI_API_KEY[:15]}...")
print(f"📱 Test Phone: {TEST_PHONE}")
print(f"\n⚠️  ACTION REQUIRED:")
print(f"1. Go to: https://docs.vapi.ai")
print(f"2. Find the correct API format for outbound calls")
print(f"3. Update the test_vapi.py file with correct format")
print(f"\nCurrent issue: API format not matching VAPI's requirements")
print(f"\nTry checking:")
print(f"- https://docs.vapi.ai/api-reference/call/create-phone-call")
print(f"- Your VAPI dashboard for examples")
