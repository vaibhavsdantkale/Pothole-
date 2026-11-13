#!/bin/bash
echo "====================================================================="
echo " Launching PotholeAI Web Interface on http://localhost:3000"
echo "====================================================================="

cd "$(dirname "$0")"
python3 -m http.server 3000 --directory frontend
