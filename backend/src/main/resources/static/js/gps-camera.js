/**
 * PotholeAI - Live GPS Camera & EXIF Geotagging Engine
 * Provides:
 * 1. Live Device Camera Stream with Real-time GPS Telemetry HUD
 * 2. Automated GPS Geotag Stamping onto captured photos (Address, Lat/Lng, Time)
 * 3. EXIF GPS Metadata Auto-Extraction from uploaded photos taken with smartphone/GPS cameras
 */

const GpsCamera = {
    stream: null,
    currentLocation: {
        lat: 12.9716,
        lng: 77.5946,
        address: "MG Road Central, Bengaluru",
        accuracy: 12
    },
    watchId: null,

    // Initialize GPS Watcher
    initLocationWatch() {
        if ("geolocation" in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    this.currentLocation.lat = pos.coords.latitude;
                    this.currentLocation.lng = pos.coords.longitude;
                    this.currentLocation.accuracy = Math.round(pos.coords.accuracy || 10);
                    this.updateCameraHud();
                    this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn("GPS Camera geolocation watch notice:", err.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
        }
    },

    // Reverse geocode to get street name
    async reverseGeocode(lat, lng) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.display_name) {
                    const parts = data.display_name.split(",");
                    this.currentLocation.address = parts.slice(0, 3).join(",").trim();
                    this.updateCameraHud();
                }
            }
        } catch {}
    },

    // Start live device camera stream (prioritizing back/rear camera on mobile)
    async startCamera(videoElementId) {
        const video = document.getElementById(videoElementId);
        if (!video) return;

        this.initLocationWatch();

        const constraints = {
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = this.stream;
            await video.play();
            this.updateCameraHud();
            return true;
        } catch (err) {
            console.error("Camera access error:", err);
            // Fallback to any available video input
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                video.srcObject = this.stream;
                await video.play();
                this.updateCameraHud();
                return true;
            } catch (fallbackErr) {
                alert("Could not access camera: " + fallbackErr.message + "\n\nPlease ensure camera permissions are granted in your browser settings.");
                return false;
            }
        }
    },

    // Stop camera stream and release hardware
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    },

    // Update real-time GPS telemetry HUD on camera overlay
    updateCameraHud() {
        const hudCoords = document.getElementById("hudCoords");
        const hudAddress = document.getElementById("hudAddress");
        const hudTime = document.getElementById("hudTime");

        if (hudCoords) {
            hudCoords.textContent = `${this.currentLocation.lat.toFixed(6)}° N, ${this.currentLocation.lng.toFixed(6)}° E (±${this.currentLocation.accuracy}m)`;
        }
        if (hudAddress) {
            hudAddress.textContent = this.currentLocation.address;
        }
        if (hudTime) {
            const now = new Date();
            hudTime.textContent = now.toLocaleDateString() + " " + now.toLocaleTimeString();
        }
    },

    // Capture photo from video stream and burn the GPS Watermark Stamp
    captureStampedPhoto(videoElementId) {
        const video = document.getElementById(videoElementId);
        if (!video) return null;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");

        // Draw camera frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Burn real GPS Map Camera banner watermark
        this.drawGpsStamp(ctx, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const file = new File([blob], `GPS_ROAD_CAM_${timestamp}.jpg`, { type: "image/jpeg" });
                resolve({
                    file: file,
                    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
                    location: { ...this.currentLocation }
                });
            }, "image/jpeg", 0.92);
        });
    },

    // Draws genuine GPS Map Camera banner stamp on the image
    drawGpsStamp(ctx, w, h) {
        const bannerHeight = Math.max(90, Math.round(h * 0.16));
        const yStart = h - bannerHeight;

        // Dark gradient banner
        const gradient = ctx.createLinearGradient(0, yStart, 0, h);
        gradient.addColorStop(0, "rgba(15, 23, 42, 0.88)");
        gradient.addColorStop(1, "rgba(10, 15, 29, 0.96)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, yStart, w, bannerHeight);

        // Top decorative accent bar
        ctx.fillStyle = "#ef4444"; // Red road hazard highlight
        ctx.fillRect(0, yStart, w, 4);

        // Left GPS Pin Icon Indicator
        ctx.fillStyle = "#ffffff";
        const baseFontSize = Math.max(14, Math.round(w * 0.018));
        ctx.font = `bold ${baseFontSize + 2}px Inter, sans-serif`;

        // Address & Location Title
        ctx.fillText(`📍 ${this.currentLocation.address}`, 20, yStart + (baseFontSize * 1.6));

        // GPS Coordinates & Telemetry
        ctx.font = `600 ${baseFontSize}px 'Courier New', monospace`;
        ctx.fillStyle = "#38bdf8"; // Light Sky Blue
        const coordsText = `GPS: ${this.currentLocation.lat.toFixed(6)}° N, ${this.currentLocation.lng.toFixed(6)}° E  |  ACCURACY: ±${this.currentLocation.accuracy}m`;
        ctx.fillText(coordsText, 20, yStart + (baseFontSize * 3.0));

        // Timestamp & PotholeAI Branding
        const now = new Date();
        const dateStr = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0") + " " +
            now.toLocaleTimeString();

        ctx.font = `500 ${baseFontSize - 1}px Inter, sans-serif`;
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`🕒 ${dateStr}  •  PotholeAI Autonomous Road Inspection`, 20, yStart + (baseFontSize * 4.4));

        // Right side badge: "GPS CAMERA"
        ctx.fillStyle = "#10b981";
        ctx.font = `bold ${baseFontSize}px Inter, sans-serif`;
        const badgeText = "GPS CAMERA ACTIVE";
        const badgeWidth = ctx.measureText(badgeText).width;
        ctx.fillText(badgeText, w - badgeWidth - 25, yStart + (baseFontSize * 2.2));
    },

    // Extract EXIF GPS data if user uploads a photo taken by a smartphone/GPS camera app
    async extractExifGps(file) {
        return new Promise((resolve) => {
            if (!window.EXIF) {
                resolve(null);
                return;
            }

            try {
                EXIF.getData(file, function() {
                    const lat = EXIF.getTag(this, "GPSLatitude");
                    const latRef = EXIF.getTag(this, "GPSLatitudeRef");
                    const lng = EXIF.getTag(this, "GPSLongitude");
                    const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

                    if (lat && lng) {
                        const decimalLat = GpsCamera.convertDmsToDecimal(lat, latRef);
                        const decimalLng = GpsCamera.convertDmsToDecimal(lng, lngRef);
                        resolve({
                            lat: decimalLat,
                            lng: decimalLng
                        });
                    } else {
                        resolve(null);
                    }
                });
            } catch (e) {
                console.warn("EXIF extraction error:", e);
                resolve(null);
            }
        });
    },

    convertDmsToDecimal(dms, ref) {
        if (!dms || dms.length < 3) return 0;
        let dec = dms[0] + (dms[1] / 60) + (dms[2] / 3600);
        if (ref === "S" || ref === "W") {
            dec = -dec;
        }
        return dec;
    }
};

window.GpsCamera = GpsCamera;
