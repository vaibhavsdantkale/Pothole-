@echo off
echo =====================================================================
echo  Starting PotholeAI - Python FastAPI YOLO Microservice
echo =====================================================================

cd /d "%~dp0"

echo [1/2] Checking and installing Python dependencies...
python -m pip install -r requirements.txt

echo [2/2] Launching FastAPI AI Server on http://localhost:8000...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
