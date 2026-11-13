import os
import io
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Try to import cv2 and ultralytics, with safe fallback handling
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class PotholeDetector:
    """
    YOLO-based Pothole Detection and Severity Assessment Engine.
    Combines YOLO deep learning with road surface heuristic analysis
    to ensure high-precision pothole detection and severity estimation.
    """

    def __init__(self, model_path="models/pothole_yolov8.pt"):
        self.model_path = model_path
        self.model = None
        self._initialize_model()

    def _initialize_model(self):
        if YOLO_AVAILABLE:
            try:
                # 1. Check if custom trained pothole weights exist
                if os.path.exists(self.model_path):
                    print(f"[AI Service] Loading custom pothole YOLO model: {self.model_path}")
                    self.model = YOLO(self.model_path)
                elif os.path.exists("models/best.pt"):
                    print("[AI Service] Loading models/best.pt")
                    self.model = YOLO("models/best.pt")
                else:
                    # 2. Fallback to standard lightweight YOLOv8n
                    print("[AI Service] Custom weights not found. Loading standard yolov8n.pt...")
                    self.model = YOLO("yolov8n.pt")
                print("[AI Service] YOLO Model successfully initialized.")
            except Exception as e:
                print(f"[AI Service] Warning: Could not initialize YOLO model directly: {e}")
                self.model = None
        else:
            print("[AI Service] Ultralytics YOLO not installed in current environment. Using heuristic CV detector.")

    def analyze_image(self, image_bytes: bytes) -> dict:
        """
        Analyzes the uploaded road image, detects potholes, draws bounding boxes,
        calculates confidence score and classifies severity.
        """
        # Convert bytes to PIL Image
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = pil_image.size
        total_image_area = width * height

        detections = []
        model_used = "heuristic"

        # 1. Try YOLO Inference if available
        if self.model is not None:
            try:
                # Run YOLO inference
                results = self.model(pil_image, conf=0.25, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name = r.names.get(cls_id, f"class_{cls_id}").lower()
                        conf = float(box.conf[0].item())

                        # If model has specific pothole class or defect/hole classes
                        # or if custom fine-tuned model was provided:
                        if "pothole" in cls_name or "hole" in cls_name or "crack" in cls_name or len(r.names) == 1:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            box_w = max(0, x2 - x1)
                            box_h = max(0, y2 - y1)
                            box_area = box_w * box_h
                            area_pct = (box_area / total_image_area) * 100

                            detections.append({
                                "x1": int(x1),
                                "y1": int(y1),
                                "x2": int(x2),
                                "y2": int(y2),
                                "confidence": round(conf * 100, 1),
                                "area_percent": round(area_pct, 2)
                            })
                            model_used = "yolo_custom"
            except Exception as e:
                print(f"[AI Service] YOLO inference error: {e}")

        # 2. If YOLO did not yield pothole detections (e.g. running generic COCO weights or offline road texture),
        # use Computer Vision road texture & dark cavity analysis to identify pothole regions.
        if len(detections) == 0:
            cv_detections = self._detect_road_cavities(pil_image)
            if cv_detections:
                detections.extend(cv_detections)
                model_used = "cv_texture_analysis"

        # 3. Handle No Potholes Detected
        if not detections:
            return {
                "detected": False,
                "pothole_count": 0,
                "confidence": 0.0,
                "severity": "NONE",
                "message": "No potholes detected in this image.",
                "model_engine": model_used,
                "detections": [],
                "annotated_image_base64": self._image_to_base64(pil_image)
            }

        # 4. Severity Assessment Rules
        # Rules combine total damaged area %, maximum single pothole size %, and count
        total_pothole_area_pct = sum(d["area_percent"] for d in detections)
        max_single_area_pct = max(d["area_percent"] for d in detections)
        pothole_count = len(detections)
        avg_confidence = round(sum(d["confidence"] for d in detections) / pothole_count, 1)

        # Classification rules:
        # HIGH: Large single crater (>6% image) OR widespread damage (>9% total) OR >=3 potholes
        # MEDIUM: Moderate crater (2% - 6% area) OR 2 potholes
        # LOW: Small defect (<2% area) AND single pothole
        if max_single_area_pct >= 6.0 or total_pothole_area_pct >= 9.0 or pothole_count >= 3:
            severity = "HIGH"
        elif max_single_area_pct >= 2.0 or total_pothole_area_pct >= 3.5 or pothole_count == 2:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # 5. Draw Bounding Boxes and Annotations
        annotated_image = self._draw_annotations(pil_image, detections, severity)
        annotated_base64 = self._image_to_base64(annotated_image)

        return {
            "detected": True,
            "pothole_count": pothole_count,
            "confidence": avg_confidence,
            "severity": severity,
            "message": f"Detected {pothole_count} pothole(s) with {severity} severity.",
            "model_engine": model_used,
            "detections": detections,
            "annotated_image_base64": annotated_base64
        }

    def _detect_road_cavities(self, pil_image: Image.Image) -> list:
        """
        Road cavity & contrast defect detector for asphalt road surfaces.
        Finds darker irregular hollows representing asphalt breakage / potholes.
        """
        np_img = np.array(pil_image)
        height, width, _ = np_img.shape
        total_area = width * height

        # Convert to grayscale
        if CV2_AVAILABLE:
            gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
            # Apply Gaussian Blur to smooth asphalt grain
            blurred = cv2.GaussianBlur(gray, (7, 7), 0)
            # Threshold to find significant depressions / dark road depressions
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, 25, 9
            )
            # Morphological operations to group broken road fragments
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            detections = []
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                area = w * h
                area_pct = (area / total_area) * 100

                # Filter reasonable pothole dimensions (exclude full screen or tiny gravel specs)
                aspect_ratio = float(w) / max(1, h)
                if 1.0 <= area_pct <= 45.0 and 0.25 <= aspect_ratio <= 4.0:
                    # Calculate pseudo-confidence based on darkness and shape density
                    cnt_area = cv2.contourArea(cnt)
                    solidity = float(cnt_area) / max(1, area)
                    conf = min(98.5, max(65.0, 70.0 + (solidity * 25.0)))

                    detections.append({
                        "x1": int(x),
                        "y1": int(y),
                        "x2": int(x + w),
                        "y2": int(y + h),
                        "confidence": round(conf, 1),
                        "area_percent": round(area_pct, 2)
                    })

            # Sort by area descending and take top candidates (up to 4)
            detections = sorted(detections, key=lambda d: d["area_percent"], reverse=True)[:4]
            return detections
        else:
            # Basic fallback if cv2 is not present
            return []

    def _draw_annotations(self, image: Image.Image, detections: list, severity: str) -> Image.Image:
        """
        Draws glowing bounding boxes, corner accents, and informative labels.
        Color depends on severity:
        - HIGH: Vivid Red / Coral
        - MEDIUM: Bright Amber / Orange
        - LOW: Lime Emerald / Yellow-Green
        """
        img_copy = image.copy()
        draw = ImageDraw.Draw(img_copy)

        color_map = {
            "HIGH": (239, 68, 68),      # Tailwind Red-500
            "MEDIUM": (245, 158, 11),   # Tailwind Amber-500
            "LOW": (16, 185, 129)       # Tailwind Emerald-500
        }
        primary_color = color_map.get(severity, (239, 68, 68))
        box_thickness = max(3, int(min(image.size) * 0.005))

        # Try to load a clean font or use default
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

        for idx, det in enumerate(detections, 1):
            x1, y1, x2, y2 = det["x1"], det["y1"], det["x2"], det["y2"]

            # Draw outer rectangle with thickness
            for t in range(box_thickness):
                draw.rectangle([x1 - t, y1 - t, x2 + t, y2 + t], outline=primary_color)

            # Label text
            label_text = f"Pothole #{idx} | {det['confidence']}% | {severity}"
            
            # Label background pill
            text_bbox = draw.textbbox((x1, y1 - 22), label_text, font=font) if font else (x1, y1 - 22, x1 + 140, y1)
            pill_y1 = max(0, text_bbox[1] - 4)
            pill_y2 = pill_y1 + 22
            pill_x2 = min(image.width, text_bbox[2] + 8)

            draw.rectangle([x1, pill_y1, pill_x2, pill_y2], fill=primary_color)
            draw.text((x1 + 4, pill_y1 + 3), label_text, fill=(255, 255, 255), font=font)

        return img_copy

    def _image_to_base64(self, image: Image.Image) -> str:
        """Encodes PIL Image to JPEG Base64 string for quick API transmission."""
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
