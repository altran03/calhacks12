#!/bin/bash
echo "🚀 Starting CareLink Backend..."
cd /Users/amybihag/Calhacks12.0/calhacks12/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
