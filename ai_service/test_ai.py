"""
Quick self-test script for PotholeAI Detection Service
Creates a sample synthetic road image and verifies detection & annotation.
"""
from PIL import Image, ImageDraw
import io
from detector import PotholeDetector

def create_sample_road_image():
    # 640x480 asphalt textured image
    img = Image.new("RGB", (640, 480), color=(70, 75, 80))
    draw = ImageDraw.Draw(img)

    # Road lane divider line (dashed white)
    for y in range(0, 480, 50):
        draw.line([(320, y), (320, y + 25)], fill=(240, 240, 240), width=6)

    # Draw dark irregular pothole cavity
    draw.ellipse([180, 220, 360, 340], fill=(25, 25, 30), outline=(15, 15, 15))
    draw.ellipse([210, 240, 330, 310], fill=(12, 12, 16))

    # Second smaller pothole
    draw.ellipse([420, 160, 490, 210], fill=(28, 28, 35))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def main():
    print("[TEST] Initializing PotholeDetector...")
    detector = PotholeDetector()
    print("[TEST] Generating sample road test image...")
    image_bytes = create_sample_road_image()
    print("[TEST] Running detection...")
    result = detector.analyze_image(image_bytes)
    print("\n--- DETECTION TEST RESULT ---")
    print(f"Detected: {result['detected']}")
    print(f"Pothole Count: {result['pothole_count']}")
    print(f"Confidence Score: {result['confidence']}%")
    print(f"Severity: {result['severity']}")
    print(f"Message: {result['message']}")
    print(f"Engine: {result['model_engine']}")
    print(f"Annotated Image Length: {len(result['annotated_image_base64'])} bytes (base64)")
    print("------------------------------")
    print("[TEST] SUCCESS! AI Detector operational.\n")

if __name__ == "__main__":
    main()
