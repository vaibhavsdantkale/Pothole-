@echo off
echo =====================================================================
echo  Launching PotholeAI Web Interface on http://localhost:3000
echo =====================================================================

cd /d "%~dp0"
python -m http.server 3000 --directory frontend

pause
