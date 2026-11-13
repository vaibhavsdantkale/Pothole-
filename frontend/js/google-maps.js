/**
 * PotholeAI - Google Maps API Integration Manager
 * Provides:
 * 1. Google Maps JS API Dynamic Loader
 * 2. Dual Map Engine: Google Maps (Roadmap/Satellite/Hybrid) & Leaflet OpenStreetMap
 * 3. Custom Google Maps SVG Severity Markers & Rich InfoWindows
 * 4. Draggable Google Maps Marker for Report Page with Geocoder
 */

const GoogleMapsManager = {
    apiKey: localStorage.getItem("pothole_google_maps_key") || "",
    isLoaded: false,
    googleMap: null,
    activeMarkers: [],
    infoWindow: null,
    currentEngine: localStorage.getItem("pothole_map_engine") || "leaflet", // 'google' or 'leaflet'

    // Get stored API key
    getApiKey() {
        return this.apiKey;
    },

    // Save API key
    setApiKey(key) {
        this.apiKey = key.trim();
        localStorage.setItem("pothole_google_maps_key", this.apiKey);
    },

    // Set map engine preference
    setEngine(engine) {
        this.currentEngine = engine;
        localStorage.setItem("pothole_map_engine", engine);
    },

    // Load Google Maps API script dynamically
    loadScript(callback) {
        if (window.google && window.google.maps) {
            this.isLoaded = true;
            if (callback) callback();
            return;
        }

        const key = this.getApiKey();
        const scriptId = "google-maps-api-script";

        if (document.getElementById(scriptId)) {
            // Already injected, wait for load
            const checkInterval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    this.isLoaded = true;
                    if (callback) callback();
                }
            }, 100);
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        // If no user key, use standard bootstrap or callback
        const url = key 
            ? `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=onGoogleMapsApiLoaded`
            : `https://maps.googleapis.com/maps/api/js?libraries=places,geometry&callback=onGoogleMapsApiLoaded`;
        
        script.src = url;
        script.async = true;
        script.defer = true;

        window.onGoogleMapsApiLoaded = () => {
            console.log("[GoogleMapsManager] Google Maps JavaScript API loaded successfully.");
            this.isLoaded = true;
            if (callback) callback();
        };

        script.onerror = () => {
            console.warn("[GoogleMapsManager] Failed to load Google Maps script. Falling back to Leaflet.");
        };

        document.head.appendChild(script);
    },

    // 1. Initialize Fullscreen / Main City GIS Map in Google Maps mode
    initCityMap(containerId, centerLat = 12.9716, centerLng = 77.5946, pins = []) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!window.google || !window.google.maps) {
            console.warn("Google Maps not ready yet.");
            return;
        }

        const center = { lat: parseFloat(centerLat), lng: parseFloat(centerLng) };

        this.googleMap = new google.maps.Map(container, {
            center: center,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: true,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            fullscreenControl: true
        });

        this.infoWindow = new google.maps.InfoWindow();
        this.renderCityPins(pins);
    },

    // Render Pothole Pins on Google Maps
    renderCityPins(pins) {
        if (!this.googleMap || !window.google) return;

        // Clear existing markers
        this.activeMarkers.forEach(m => m.setMap(null));
        this.activeMarkers = [];

        const bounds = new google.maps.LatLngBounds();

        pins.forEach(pin => {
            const lat = parseFloat(pin.latitude);
            const lng = parseFloat(pin.longitude);
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

            const pos = { lat: lat, lng: lng };
            bounds.extend(pos);

            // Severity color pin
            const color = pin.severity === "HIGH" ? "#ef4444" : (pin.severity === "MEDIUM" ? "#f59e0b" : "#10b981");

            // Custom SVG Pin Symbol for Google Maps
            const markerIcon = {
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 Z",
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 1.2
            };

            const marker = new google.maps.Marker({
                position: pos,
                map: this.googleMap,
                title: `${pin.complaintId} - ${pin.severity} Severity`,
                icon: markerIcon,
                animation: pin.severity === "HIGH" ? google.maps.Animation.DROP : null
            });

            // InfoWindow Content
            const imgUrl = (window.API && API.resolveImageUrl) ? API.resolveImageUrl(pin.annotatedImagePath || pin.imagePath) : pin.imagePath;
            const contentHtml = `
                <div style="max-width: 240px; font-family: Inter, sans-serif; padding: 4px;">
                    <div style="height: 110px; overflow: hidden; border-radius: 6px; background: #0f172a; margin-bottom: 8px;">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Pothole">
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <b style="color: #2563eb; font-family: monospace;">${pin.complaintId}</b>
                        <span style="background: ${color}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                            ${pin.severity}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #1e293b; font-weight: 600; margin-bottom: 4px;">${pin.location}</div>
                    <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                        ${pin.potholeCount || 1} Potholes • ${pin.confidenceScore || 90}% AI Confidence
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; font-weight: bold; color: ${pin.status === 'RESOLVED' ? '#10b981' : '#f59e0b'};">
                            Status: ${pin.status}
                        </span>
                        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="font-size: 11px; color: #2563eb; text-decoration: none; font-weight: bold;">
                            Navigate ↗
                        </a>
                    </div>
                </div>
            `;

            marker.addListener("click", () => {
                this.infoWindow.setContent(contentHtml);
                this.infoWindow.open(this.googleMap, marker);
            });

            this.activeMarkers.push(marker);
        });

        if (pins.length > 0 && !bounds.isEmpty()) {
            this.googleMap.fitBounds(bounds);
        }
    },

    // 2. Initialize Draggable Map Picker on Report Page in Google Maps mode
    initPickerMap(containerId, initialLat, initialLng, onLocationChanged) {
        const container = document.getElementById(containerId);
        if (!container || !window.google || !window.google.maps) return null;

        const pos = { lat: parseFloat(initialLat), lng: parseFloat(initialLng) };

        const pickerMap = new google.maps.Map(container, {
            center: pos,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: false
        });

        const marker = new google.maps.Marker({
            position: pos,
            map: pickerMap,
            draggable: true,
            title: "Drag to pinpoint exact pothole location"
        });

        const geocoder = new google.maps.Geocoder();

        // Dragend updates coordinates
        marker.addListener("dragend", (e) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();

            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                let address = "Selected Location";
                if (status === "OK" && results[0]) {
                    address = results[0].formatted_address;
                }
                if (onLocationChanged) onLocationChanged(newLat, newLng, address);
            });
        });

        // Click map moves marker
        pickerMap.addListener("click", (e) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            marker.setPosition(e.latLng);

            geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                let address = "Selected Location";
                if (status === "OK" && results[0]) {
                    address = results[0].formatted_address;
                }
                if (onLocationChanged) onLocationChanged(newLat, newLng, address);
            });
        });

        return { map: pickerMap, marker: marker };
    }
};

window.GoogleMapsManager = GoogleMapsManager;
