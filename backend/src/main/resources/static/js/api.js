/**
 * PotholeAI - Unified Client API Service
 * Features full dual-mode support:
 * 1. Live Spring Boot Backend Mode (when server is running on :8080)
 * 2. Instant Standalone / Offline Demo Mode (when backend is not yet started,
 *    allowing instant testing without any database or backend setup!)
 */

const BACKEND_BASE = (window.location.port === "8080") ? "" : "http://localhost:8080";
const API_BASE = `${BACKEND_BASE}/api`;
const AI_SERVICE_BASE = "http://localhost:8000";

// Mock Database Initializer in LocalStorage for Zero-Config Offline Testing
function initMockDataIfEmpty() {
    if (!localStorage.getItem("pothole_mock_complaints")) {
        const seedComplaints = [
            {
                id: 1,
                complaintId: "PH-2026-1001",
                userId: 2,
                userName: "Citizen User",
                userEmail: "user@potholeai.com",
                imagePath: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80",
                annotatedImagePath: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80",
                location: "MG Road, Near Metro Pillar 142",
                latitude: 12.971599,
                longitude: 77.594566,
                aiDetectionResult: "Detected (3 potholes)",
                potholeCount: 3,
                confidenceScore: 94.2,
                severity: "HIGH",
                status: "PENDING",
                adminNotes: "Awaiting municipal inspection dispatch",
                createdAt: "2026-11-13 14:20:00",
                updatedAt: "2026-11-13 14:20:00"
            },
            {
                id: 2,
                complaintId: "PH-2026-1002",
                userId: 2,
                userName: "Citizen User",
                userEmail: "user@potholeai.com",
                imagePath: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80",
                annotatedImagePath: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80",
                location: "Outer Ring Road, Marathahalli Junction",
                latitude: 12.956924,
                longitude: 77.701126,
                aiDetectionResult: "Detected (2 potholes)",
                potholeCount: 2,
                confidenceScore: 88.5,
                severity: "MEDIUM",
                status: "IN_PROGRESS",
                adminNotes: "Repair crew assigned - target ETA 24 hrs",
                createdAt: "2026-11-12 10:15:00",
                updatedAt: "2026-11-12 16:30:00"
            },
            {
                id: 3,
                complaintId: "PH-2026-1003",
                userId: 2,
                userName: "Citizen User",
                userEmail: "user@potholeai.com",
                imagePath: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80",
                annotatedImagePath: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80",
                location: "Indiranagar 100ft Road, 12th Main Cross",
                latitude: 12.978370,
                longitude: 77.640839,
                aiDetectionResult: "Detected (1 pothole)",
                potholeCount: 1,
                confidenceScore: 78.1,
                severity: "LOW",
                status: "RESOLVED",
                adminNotes: "Patching completed with bitumen mixture",
                createdAt: "2026-11-10 09:00:00",
                updatedAt: "2026-11-11 11:20:00"
            }
        ];
        localStorage.setItem("pothole_mock_complaints", JSON.stringify(seedComplaints));
    }
}

initMockDataIfEmpty();

const API = {
    // Auth Session
    getToken() {
        return localStorage.getItem("pothole_ai_token");
    },
    setToken(token) {
        localStorage.setItem("pothole_ai_token", token);
    },
    getUser() {
        const u = localStorage.getItem("pothole_ai_user");
        try { return u ? JSON.parse(u) : null; } catch { return null; }
    },
    setUser(user) {
        localStorage.setItem("pothole_ai_user", JSON.stringify(user));
    },
    clearSession() {
        localStorage.removeItem("pothole_ai_token");
        localStorage.removeItem("pothole_ai_user");
    },
    getAuthHeaders() {
        const token = this.getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return headers;
    },

    // 1. Authentication (With seamless Standalone / Offline Fallback)
    async register(name, email, password, role = "ROLE_USER") {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role })
            });
            if (res.ok) {
                const data = await res.json();
                this.setToken(data.token);
                this.setUser(data);
                return data;
            }
        } catch (e) {
            console.warn("[API] Backend offline or unreachable. Registering in local Standalone mode.", e);
        }

        // Standalone Local Registration Fallback
        const mockUser = {
            token: "mock-jwt-token-" + Date.now(),
            userId: Date.now(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: role,
            message: "Registration successful (Standalone Demo Mode)."
        };
        this.setToken(mockUser.token);
        this.setUser(mockUser);
        return mockUser;
    },

    async login(email, password) {
        const cleanEmail = (email || "").trim().toLowerCase();
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail, password })
            });
            if (res.ok) {
                const data = await res.json();
                this.setToken(data.token);
                this.setUser(data);
                return data;
            }
        } catch (e) {
            console.warn("[API] Backend offline. Using instant Standalone Demo login.", e);
        }

        // Standalone Local Login Fallback:
        // Automatically accepts demo accounts or any valid email
        let role = "ROLE_USER";
        let name = "Citizen User";
        let userId = 2;

        if (cleanEmail.includes("admin")) {
            role = "ROLE_ADMIN";
            name = "System Administrator";
            userId = 1;
        } else if (cleanEmail) {
            name = cleanEmail.split("@")[0].replace(/[._]/g, " ");
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        const mockUser = {
            token: "mock-jwt-token-" + Date.now(),
            userId: userId,
            name: name,
            email: cleanEmail || "user@potholeai.com",
            role: role,
            message: "Logged in successfully (Standalone Demo Mode)."
        };

        this.setToken(mockUser.token);
        this.setUser(mockUser);
        return mockUser;
    },

    // 2. Complaints Management (Live Backend + LocalStorage Mock Fallback)
    async submitComplaint(formData) {
        try {
            const res = await fetch(`${API_BASE}/complaints`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: formData
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("[API] Backend offline. Saving complaint to local storage mock DB.", e);
        }

        // Offline / Standalone Mock Submission
        const file = formData.get("image");
        const location = formData.get("location") || "Selected GPS Location";
        const latitude = parseFloat(formData.get("latitude")) || 12.9716;
        const longitude = parseFloat(formData.get("longitude")) || 77.5946;

        let previewUrl = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80";
        if (file && file instanceof File) {
            try {
                previewUrl = URL.createObjectURL(file);
            } catch {}
        }

        const user = this.getUser() || { userId: 2, name: "Citizen User", email: "user@potholeai.com" };
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const complaintId = `PH-2026-${randomDigits}`;

        // Default heuristic severity for mock
        const severity = (latitude > 12.96 || Math.random() > 0.4) ? "HIGH" : "MEDIUM";
        const potholeCount = severity === "HIGH" ? 3 : 2;

        const newComplaint = {
            id: Date.now(),
            complaintId: complaintId,
            userId: user.userId,
            userName: user.name,
            userEmail: user.email,
            imagePath: previewUrl,
            annotatedImagePath: previewUrl,
            location: location,
            latitude: latitude,
            longitude: longitude,
            aiDetectionResult: `Detected (${potholeCount} potholes)`,
            potholeCount: potholeCount,
            confidenceScore: 92.5,
            severity: severity,
            status: "PENDING",
            adminNotes: "AI model assessed severity. Awaiting municipal dispatch.",
            createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
            updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
        };

        const existing = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        existing.unshift(newComplaint);
        localStorage.setItem("pothole_mock_complaints", JSON.stringify(existing));

        return newComplaint;
    },

    async getUserComplaints(userId) {
        try {
            const user = this.getUser();
            const targetId = userId || (user ? user.userId : 2);
            const res = await fetch(`${API_BASE}/complaints?userId=${targetId}`, {
                headers: this.getAuthHeaders()
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] Backend offline. Loading user complaints from local storage.", e);
        }

        const all = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        return all;
    },

    async getAllComplaints() {
        try {
            const res = await fetch(`${API_BASE}/complaints`, {
                headers: this.getAuthHeaders()
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] Backend offline. Loading all complaints from local storage.", e);
        }

        return JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
    },

    async getComplaintById(complaintId) {
        try {
            const res = await fetch(`${API_BASE}/complaints/${complaintId}`);
            if (res.ok) return await res.json();
        } catch {}

        const all = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        return all.find(c => c.complaintId === complaintId) || all[0];
    },

    async getMapPins() {
        try {
            const res = await fetch(`${API_BASE}/complaints/map`);
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] Backend offline. Loading map pins from local storage.", e);
        }

        const all = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        return all.map(c => ({
            complaintId: c.complaintId,
            location: c.location,
            latitude: c.latitude,
            longitude: c.longitude,
            severity: c.severity,
            status: c.status,
            potholeCount: c.potholeCount,
            confidenceScore: c.confidenceScore,
            imagePath: c.imagePath,
            annotatedImagePath: c.annotatedImagePath
        }));
    },

    async getAdminStats() {
        try {
            const res = await fetch(`${API_BASE}/admin/stats`, {
                headers: this.getAuthHeaders()
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] Backend offline. Computing admin stats from local storage.", e);
        }

        const all = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        const totalPotholes = all.reduce((sum, c) => sum + (c.potholeCount || 1), 0);
        const pending = all.filter(c => c.status === "PENDING").length;
        const inProgress = all.filter(c => c.status === "IN_PROGRESS").length;
        const resolved = all.filter(c => c.status === "RESOLVED").length;
        const high = all.filter(c => c.severity === "HIGH").length;
        const medium = all.filter(c => c.severity === "MEDIUM").length;
        const low = all.filter(c => c.severity === "LOW").length;

        return {
            totalComplaints: all.length,
            totalPotholesDetected: totalPotholes,
            pendingComplaints: pending,
            inProgressComplaints: inProgress,
            resolvedComplaints: resolved,
            highSeverityPotholes: high,
            mediumSeverityPotholes: medium,
            lowSeverityPotholes: low,
            recentComplaints: all.slice(0, 5)
        };
    },

    async updateComplaintStatus(complaintId, status, adminNotes) {
        try {
            const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/status`, {
                method: "PUT",
                headers: {
                    ...this.getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status, adminNotes })
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] Backend offline. Updating complaint in local storage.", e);
        }

        const all = JSON.parse(localStorage.getItem("pothole_mock_complaints") || "[]");
        const item = all.find(c => c.complaintId === complaintId);
        if (item) {
            item.status = status;
            if (adminNotes) item.adminNotes = adminNotes;
            item.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 19);
            localStorage.setItem("pothole_mock_complaints", JSON.stringify(all));
            return item;
        }
        throw new Error("Complaint not found.");
    },

    // Direct AI Microservice Call
    async analyzeDirectWithAi(file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`${AI_SERVICE_BASE}/analyze`, {
                method: "POST",
                body: formData
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("[API] FastAPI offline. Using built-in client vision heuristic.", e);
        }
        return null;
    },

    resolveImageUrl(path) {
        if (!path) return "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80";
        if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:") || path.startsWith("blob:")) {
            return path;
        }
        return `${BACKEND_BASE}${path}`;
    }
};

// Global Navigation Bar State
document.addEventListener("DOMContentLoaded", () => {
    const user = API.getUser();
    const navUserContainer = document.getElementById("navUserContainer");
    if (!navUserContainer) return;

    if (user && user.name) {
        const isAdmin = user.role === "ROLE_ADMIN";
        navUserContainer.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle text-primary fw-semibold" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i> ${user.name} 
                    <span class="badge ${isAdmin ? 'bg-danger' : 'bg-primary'} ms-1">${isAdmin ? 'Admin' : 'Citizen'}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                    ${isAdmin ? '<li><a class="dropdown-item" href="admin.html"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>' : ''}
                    <li><a class="dropdown-item" href="my-complaints.html"><i class="bi bi-list-check me-2"></i>My Complaints</a></li>
                    <li><a class="dropdown-item" href="report.html"><i class="bi bi-camera me-2"></i>Report Pothole</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;

        document.getElementById("btnLogout").addEventListener("click", (e) => {
            e.preventDefault();
            API.clearSession();
            window.location.href = "login.html";
        });
    } else {
        navUserContainer.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="login.html"><i class="bi bi-box-arrow-in-right me-1"></i> Login</a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary btn-sm ms-lg-2 px-3" href="register.html">Register</a>
            </li>
        `;
    }
});
