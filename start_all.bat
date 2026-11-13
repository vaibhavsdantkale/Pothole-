@echo off
title PotholeAI - Full Stack Launcher
echo =====================================================================
echo  PotholeAI - AI-Powered Road Damage Detection and Reporting System
echo =====================================================================
echo.
echo Launching services...
echo.

echo [1/3] Starting Python FastAPI AI Service in separate window...
start "PotholeAI - Python FastAPI YOLO" cmd /k "cd /d %~dp0ai_service && run_ai.bat"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Java Spring Boot Backend in separate window...
start "PotholeAI - Spring Boot Server" cmd /k "cd /d %~dp0backend && run_backend.bat"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Local Web Interface Server (Port 3000)...
start "PotholeAI - Web Frontend Server" cmd /k "cd /d %~dp0 && python -m http.server 3000 --directory frontend"

echo.
echo =====================================================================
echo  Services launched successfully!
echo.
echo  - Frontend Web UI:  http://localhost:3000/
echo  - Spring Boot API:  http://localhost:8080/
echo  - Python FastAPI:   http://localhost:8000/docs
echo =====================================================================
echo.
pause
