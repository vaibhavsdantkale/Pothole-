/**
 * PotholeAI - Interactive GIS Map with Dual Engine (Google Maps & Leaflet)
 */

let map = null;
let markersLayer = null;
let allPins = [];
let activeMapFilter = "ALL";
let currentEngine = localStorage.getItem("pothole_map_engine") || "leaflet";

function fixLeafletIconPaths() {
    if (typeof L !== "undefined" && L.Icon && L.Icon.Default) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
    }
}

function createSvgPin(severity) {
    const color = severity === "HIGH" ? "#ef4444" : (severity === "MEDIUM" ? "#f59e0b" : "#10b981");
    const pulseClass = severity === "HIGH" ? "marker-high" : "";

    const svgHtml = `
        <div class="custom-svg-marker ${pulseClass}" style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        ">
            <span style="
                transform: rotate(45deg);
                color: #ffffff;
                font-weight: bold;
                font-size: 14px;
            ">⚠️</span>
        </div>
    `;

    return L.divIcon({
        className: "custom-pin-icon",
        html: svgHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fixLeafletIconPaths();
    updateEngineButtonUI();
    loadMapData();
    initMapFilters();
});

function updateEngineButtonUI() {
    const btnOsm = document.getElementById("btnEngineOsm");
    const btnGoogle = document.getElementById("btnEngineGoogle");

    if (currentEngine === "google") {
        btnGoogle?.classList.add("active");
        btnOsm?.classList.remove("active");
    } else {
        btnOsm?.classList.add("active");
        btnGoogle?.classList.remove("active");
    }
}

window.switchMapEngine = function(engine) {
    currentEngine = engine;
    localStorage.setItem("pothole_map_engine", engine);
    updateEngineButtonUI();

    const mapContainer = document.getElementById("map");
    mapContainer.innerHTML = ""; // Clear existing map container

    if (engine === "google") {
        loadGoogleMap();
    } else {
        initLeafletMap();
        renderMapPins();
    }
};

function initLeafletMap() {
    if (typeof L === "undefined") {
        console.error("Leaflet not available.");
        return;
    }

    try {
        map = L.map("map", {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([12.9716, 77.5946], 12);

        const cartoLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; CARTO, &copy; OpenStreetMap',
            maxZoom: 19,
            subdomains: 'abcd'
        });

        const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });

        cartoLayer.addTo(map);

        cartoLayer.on("tileerror", function() {
            if (!map.hasLayer(osmLayer)) {
                osmLayer.addTo(map);
            }
        });

        markersLayer = L.layerGroup().addTo(map);

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);

        window.addEventListener("resize", () => {
            if (map) map.invalidateSize();
        });
    } catch (err) {
        console.error("Leaflet init error:", err);
    }
}

function loadGoogleMap() {
    const key = GoogleMapsManager.getApiKey();
    if (!key) {
        const modal = new bootstrap.Modal(document.getElementById("gmapsKeyModal"));
        modal.show();
    }

    GoogleMapsManager.loadScript(() => {
        let filtered = getFilteredPins();
        GoogleMapsManager.initCityMap("map", 12.9716, 77.5946, filtered);
    });
}

function getFilteredPins() {
    let filtered = allPins;
    if (activeMapFilter === "HIGH") {
        filtered = filtered.filter(p => p.severity === "HIGH");
    } else if (activeMapFilter === "PENDING") {
        filtered = filtered.filter(p => p.status === "PENDING");
    } else if (activeMapFilter === "RESOLVED") {
        filtered = filtered.filter(p => p.status === "RESOLVED");
    }
    return filtered;
}

async function loadMapData() {
    try {
        allPins = await API.getMapPins();
    } catch (err) {
        console.error("Failed to load map pins from backend:", err);
        allPins = [
            {
                complaintId: "PH-2026-1001",
                location: "MG Road, Near Metro Pillar 142",
                latitude: 12.971599,
                longitude: 77.594566,
                severity: "HIGH",
                status: "PENDING",
                potholeCount: 3,
                confidenceScore: 94.2,
                imagePath: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80"
            },
            {
                complaintId: "PH-2026-1002",
                location: "Outer Ring Road, Marathahalli",
                latitude: 12.956924,
                longitude: 77.701126,
                severity: "MEDIUM",
                status: "IN_PROGRESS",
                potholeCount: 2,
                confidenceScore: 88.5,
                imagePath: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80"
            },
            {
                complaintId: "PH-2026-1003",
                location: "Indiranagar 100ft Road",
                latitude: 12.978370,
                longitude: 77.640839,
                severity: "LOW",
                status: "RESOLVED",
                potholeCount: 1,
                confidenceScore: 78.1,
                imagePath: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80"
            }
        ];
    }

    if (currentEngine === "google" && GoogleMapsManager.getApiKey()) {
        loadGoogleMap();
    } else {
        initLeafletMap();
        renderMapPins();
    }
}

function initMapFilters() {
    const buttons = document.querySelectorAll(".map-filter-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeMapFilter = btn.getAttribute("data-filter");

            if (currentEngine === "google" && GoogleMapsManager.googleMap) {
                GoogleMapsManager.renderCityPins(getFilteredPins());
            } else {
                renderMapPins();
            }
        });
    });
}

function renderMapPins() {
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filtered = getFilteredPins();

    const counter = document.getElementById("mapPotholesCount");
    if (counter) {
        counter.textContent = `Showing ${filtered.length} reported pothole locations`;
    }

    const bounds = [];

    filtered.forEach(pin => {
        const lat = parseFloat(pin.latitude);
        const lng = parseFloat(pin.longitude);

        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

        bounds.push([lat, lng]);

        const customIcon = createSvgPin(pin.severity);
        const marker = L.marker([lat, lng], { icon: customIcon });

        const imgUrl = API.resolveImageUrl(pin.annotatedImagePath || pin.imagePath);
        const severityClass = pin.severity === "HIGH" ? "badge-severity-high" : (pin.severity === "MEDIUM" ? "badge-severity-medium" : "badge-severity-low");
        const statusClass = pin.status === "PENDING" ? "badge-status-pending" : (pin.status === "IN_PROGRESS" ? "badge-status-inprogress" : (pin.status === "RESOLVED" ? "badge-status-resolved" : "badge-status-rejected"));

        const popupContent = `
            <div style="min-width: 230px; font-family: Inter, sans-serif;">
                <div style="height: 120px; overflow: hidden; border-radius: 8px 8px 0 0; background: #1e293b; text-align: center;">
                    <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Road">
                </div>
                <div class="p-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold font-monospace text-primary">${pin.complaintId}</span>
                        <span class="badge ${severityClass}" style="font-size: 0.7rem;">${pin.severity}</span>
                    </div>
                    <div class="small fw-semibold text-dark mb-1 text-truncate" title="${pin.location}">${pin.location}</div>
                    <div class="small text-muted mb-2">
                        <span>${pin.potholeCount || 1} Pothole(s)</span> • 
                        <span>${pin.confidenceScore || 90}% AI Conf</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span class="badge ${statusClass}" style="font-size: 0.7rem;">${pin.status}</span>
                        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="btn btn-sm btn-outline-primary py-0" style="font-size: 0.75rem;">
                            <i class="bi bi-geo-alt me-1"></i> Google Maps
                        </a>
                    </div>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
}

// Google Maps Key Config Helpers
window.saveGoogleMapsKey = function() {
    const input = document.getElementById("inputGoogleMapsKey");
    if (!input || !input.value.trim()) {
        alert("Please enter a valid Google Maps API Key.");
        return;
    }
    GoogleMapsManager.setApiKey(input.value.trim());
    switchMapEngine("google");
    const modalElem = document.getElementById("gmapsKeyModal");
    const modal = bootstrap.Modal.getInstance(modalElem);
    if (modal) modal.hide();
};

window.clearGoogleMapsKey = function() {
    GoogleMapsManager.setApiKey("");
    switchMapEngine("leaflet");
    const modalElem = document.getElementById("gmapsKeyModal");
    const modal = bootstrap.Modal.getInstance(modalElem);
    if (modal) modal.hide();
};
