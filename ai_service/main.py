import os
import requests
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from detector import PotholeDetector

app = FastAPI(
    title="PotholeAI - YOLO Road Damage Detection Microservice",
    description="Analyzes road imagery to detect potholes, bounding boxes, confidence score, and severity rating.",
    version="1.0.0"
)

# Enable CORS for frontend and Spring Boot backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector instance
detector = PotholeDetector()


@app.get("/")
def read_root():
    return {
        "service": "PotholeAI Computer Vision & YOLO Service",
        "status": "ONLINE",
        "model_loaded": detector.model is not None,
        "endpoints": {
            "health": "/health",
            "analyze": "POST /analyze",
            "analyze_and_notify": "POST /analyze-and-notify"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "engine": "YOLOv8 + Road Morphology Severity Classifier"
    }


@app.post("/analyze")
async def analyze_road_image(file: UploadFile = File(...)):
    """
    Accepts road image file and returns:
    - detected (boolean)
    - pothole_count (int)
    - confidence (float)
    - severity (LOW, MEDIUM, HIGH, NONE)
    - bounding_boxes
    - annotated_image_base64
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")

    try:
        contents = await file.read()
        analysis = detector.analyze_image(contents)
        return JSONResponse(status_code=200, content=analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Detection failed: {str(e)}")


@app.post("/analyze-and-notify")
async def analyze_and_notify(
    file: UploadFile = File(...),
    complaint_id: str = Form(None),
    backend_webhook_url: str = Form("http://localhost:8080/api/ai/webhook")
):
    """
    Analyzes the image and automatically forwards the AI detection result
    directly to the Java Spring Boot backend webhook.
    """
    try:
        contents = await file.read()
        analysis = detector.analyze_image(contents)

        # Forward to Java Backend if complaint_id is provided
        backend_response = None
        if complaint_id and backend_webhook_url:
            payload = {
                "complaintId": complaint_id,
                "detected": analysis["detected"],
                "potholeCount": analysis["pothole_count"],
                "confidenceScore": analysis["confidence"],
                "severity": analysis["severity"],
                "detectionMessage": analysis["message"],
                "annotatedImageBase64": analysis["annotated_image_base64"]
            }
            try:
                res = requests.post(backend_webhook_url, json=payload, timeout=5)
                backend_response = {
                    "status_code": res.status_code,
                    "text": res.text
                }
            except Exception as net_err:
                backend_response = {
                    "status": "Failed to connect to backend webhook",
                    "error": str(net_err)
                }

        return {
            "analysis": analysis,
            "backend_notification": backend_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
