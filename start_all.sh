#!/bin/bash
echo "====================================================================="
echo " PotholeAI - AI-Powered Road Damage Detection and Reporting System"
echo "====================================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/2] Starting Python FastAPI AI Service..."
cd "$ROOT_DIR/ai_service" && ./run_ai.sh &

sleep 3

echo "[2/2] Starting Java Spring Boot Backend..."
cd "$ROOT_DIR/backend" && ./run_backend.sh &

echo ""
echo "Services started in background."
echo "Frontend Web UI: http://localhost:8080/"
echo "Python AI API:   http://localhost:8000/docs"
wait
