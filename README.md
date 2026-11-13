# 🛣️ PotholeAI – AI-Powered Road Damage Detection and Reporting System

> An end-to-end civic infrastructure platform connecting citizen road hazard reporting with **Ultralytics YOLO computer vision**, **Java Spring Boot**, **MySQL**, **Leaflet GIS mapping**, and real-time **Telegram Bot API notifications**.

---

## 🌟 Key Features

1. **AI Vision & Severity Assessment (Python FastAPI + YOLO)**:
   - Automated road surface defect detection using YOLO deep learning.
   - Precise bounding boxes drawn around detected craters with confidence scores.
   - Smart image-area severity rule engine classifying hazards as **LOW**, **MEDIUM**, or **HIGH**.
   - Friendly citizen notice when an uploaded photo has no road defects detected.

2. **Full-Stack Java Spring Boot Microservice**:
   - Secure citizen and municipal administrator authentication with BCrypt password hashing and JWT.
   - Multipart file upload engine with original and AI-annotated image storage.
   - Unique tracking code generator (e.g. `PH-2026-78412`).
   - Dynamic complaint lifecycle management (`PENDING` ➡️ `IN_PROGRESS` ➡️ `RESOLVED` / `REJECTED`).

3. **Telegram Bot API Instant Dispatch**:
   - 🚨 **New Complaint Alert**: Triggered when a citizen reports a pothole.
   - ⚠️ **High-Severity Hazard Priority Alert**: Instant warning with Google Maps navigation link when severe damage is detected.
   - 🔄 **Status Change Notification**: Broadcasts when municipal crews are dispatched.
   - ✅ **Resolution Notice**: Dispatches when bitumen patch repair is completed.

4. **Modern Responsive Frontend (Bootstrap 5 & Leaflet GIS)**:
   - **Home Page**: System introduction, live workflow steps, and AI vision preview.
   - **Report Page**: Drag-and-drop road photo uploader, HTML5 Geolocation, and interactive Leaflet map pin picker.
   - **Citizen Tracker ("My Complaints")**: Real-time status badges, original vs. YOLO annotated image inspection.
   - **Municipal Admin Dashboard**: High-level KPI counters, Chart.js visual analytics, and status update controls.
   - **City-Wide GIS Map**: Interactive OpenStreetMap with pulsing, color-coded markers (Red = High, Amber = Medium, Green = Low).

---

## 🏛️ System Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │                Modern Frontend UI                     │
       │    HTML5, CSS3, Bootstrap 5, Leaflet OpenStreetMap     │
       └──────────────────────────┬─────────────────────────────┘
                                  │ REST API / Multipart Upload
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │             Java Spring Boot Backend (Port 8080)       │
       │  - JWT Auth & Security       - Unique ID Generator     │
       │  - Complaint Service         - File Storage Engine     │
       │  - Telegram Bot Notifier     - REST Controllers        │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
      Internal REST   │                          │ MySQL Database
      Inference Call  ▼                          ▼
┌───────────────────────────────┐      ┌─────────────────────────┐
│ Python FastAPI (Port 8000)    │      │ MySQL Database          │
│ - Ultralytics YOLO            │      │ - users table           │
│ - OpenCV & Pillow             │      │ - complaints table      │
│ - Bounding Box Annotation     │      └─────────────────────────┘
│ - Severity Rule Engine        │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  Telegram Bot API Alerts      │
│  - New Pothole Reported       │
│  - High Severity Alerts       │
│  - Status Updates & Resolved  │
└───────────────────────────────┘
```

---

## 📁 Project Directory Structure

```text
pothole-ai/
├── backend/                             # Java Spring Boot 3 Backend
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd                   # Maven wrapper
│   ├── run_backend.bat, run_backend.sh  # Backend launcher
│   └── src/main/
│       ├── java/com/potholeai/
│       │   ├── PotholeAiApplication.java
│       │   ├── config/                  # WebMvc, CORS & Security configs
│       │   ├── controller/              # Auth, Complaint, Admin & AI Webhook controllers
│       │   ├── dto/                     # Requests, responses and dashboard DTOs
│       │   ├── entity/                  # JPA entities (User, Complaint, Enums)
│       │   ├── repository/              # Spring Data JPA repositories
│       │   ├── service/                 # Complaint, AI, File & Telegram services
│       │   └── util/                    # JWT utility & Complaint ID generator
│       └── resources/
│           ├── application.properties   # DB & Telegram configuration
│           └── static/                  # Bundled frontend served on :8080
├── ai_service/                          # Python FastAPI YOLO Microservice
│   ├── requirements.txt                 # Dependencies (fastapi, uvicorn, ultralytics, etc.)
│   ├── detector.py                      # YOLO inference & severity scoring engine
│   ├── main.py                          # FastAPI endpoints (/analyze, /health)
│   ├── test_ai.py                       # Self-test script with synthetic road image
│   └── run_ai.bat, run_ai.sh            # FastAPI launcher
├── frontend/                            # Standalone web app (Bootstrap 5 & Leaflet)
│   ├── index.html                       # Home page with features & workflow
│   ├── login.html                       # Login page with 1-click demo logins
│   ├── register.html                    # Registration page (Citizen / Admin)
│   ├── report.html                      # Pothole report page with GPS & AI preview
│   ├── my-complaints.html               # Citizen complaints tracking table
│   ├── admin.html                       # Municipal Admin Dashboard with Chart.js
│   ├── map.html                         # Fullscreen city road damage map
│   ├── css/style.css                    # Polished design system
│   └── js/                              # api.js, report.js, complaints.js, admin.js, map.js
├── database/
│   └── pothole_ai_schema.sql            # MySQL database schema & sample seed data
├── start_all.bat, start_all.sh          # One-click launcher for all services
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Java JDK**: Version 17 or higher
- **Python**: Version 3.10 or higher (with `pip`)
- **MySQL**: Version 8.0 or higher *(or use the included zero-config H2 in-memory mode)*

---

### Step 1: Database Setup (MySQL)

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or Command Line):
   ```sql
   mysql -u root -p
   ```
2. Run the provided database script:
   ```sql
   SOURCE C:/Users/Admin/.gemini/antigravity/scratch/pothole-ai/database/pothole_ai_schema.sql;
   ```
   *This automatically creates `pothole_ai_db`, builds the `users` and `complaints` tables, and seeds sample complaints.*

> 💡 **Tip (Zero-Config H2 Database):** If you don't have MySQL installed, open `backend/src/main/resources/application.properties` and uncomment the H2 configuration lines. The application will start in in-memory mode without any setup!

---

### Step 2: Configure Telegram Notifications (Optional)

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, name your bot (e.g., `CityPotholeBot`), and copy the **Bot Token**.
3. Start a chat with your bot or add it to a Telegram channel.
4. Search for `@userinfobot` to find your numeric **Chat ID**.
5. Open `backend/src/main/resources/application.properties` and paste:
   ```properties
   telegram.bot.enabled=true
   telegram.bot.token=YOUR_BOT_TOKEN_HERE
   telegram.bot.chat-id=YOUR_CHAT_ID_HERE
   ```
   *(If left as defaults, notifications will print cleanly to the console in mock mode.)*

---

### Step 3: Run the Python AI YOLO Microservice

Open a terminal and execute:
```bash
cd pothole-ai/ai_service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*(On Windows, you can also double-click `run_ai.bat`)*

Verify at: `http://localhost:8000/docs` (Swagger UI).

---

### Step 4: Run the Java Spring Boot Backend

Open a second terminal and execute:
```bash
cd pothole-ai/backend
mvn spring-boot:run
```
*(On Windows, you can also double-click `run_backend.bat`)*

Verify at: `http://localhost:8080/`

---

### Step 5: Access the Web Application

Open your browser and navigate to:
👉 **[http://localhost:8080/](http://localhost:8080/)**

#### Pre-configured Test Accounts:
| Role | Email | Password | Quick Action |
|---|---|---|---|
| 👤 **Citizen User** | `user@potholeai.com` | `user123` | Click "Citizen Demo" button on login page |
| 🛡️ **Municipal Admin** | `admin@potholeai.com` | `admin123` | Click "Admin Demo" button on login page |

---

## 🧪 Testing the Complete Workflow

1. **Sign In** as `user@potholeai.com`.
2. Navigate to **Report Pothole** (`report.html`):
   - Click the test preset **"Severe Pothole"** or upload any road photo.
   - Click **"Detect My GPS"** or click on the interactive Leaflet map to position the marker.
   - Watch the live YOLO AI panel identify the defect, compute confidence %, and calculate the severity badge.
   - Click **"Submit Complaint & Trigger AI"**.
3. View the modal displaying your new tracking code (e.g. `PH-2026-1004`).
4. Check your **Telegram channel** or console to see the formatted notification with emojis and GPS coordinates!
5. Open **My Complaints** (`my-complaints.html`) to track status updates.
6. Log in as **Admin** (`admin@potholeai.com`) to inspect the complaint in the **Admin Dashboard** (`admin.html`), review the side-by-side YOLO bounding boxes, update status to `IN_PROGRESS` or `RESOLVED`, and dispatch resolution alerts.
7. Visit the **Live Map** (`map.html`) to see color-coded pins across the city.

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` – Register new citizen or admin
- `POST /api/auth/login` – Authenticate and receive JWT token
- `GET  /api/auth/me` – Retrieve authenticated profile

### Complaints
- `POST /api/complaints` – Multipart form upload (file, location, lat, lng, userId)
- `GET  /api/complaints` – List user or all complaints
- `GET  /api/complaints/{complaintId}` – Get complaint details
- `GET  /api/complaints/map` – List GPS pins and severity coordinates

### Administration
- `GET  /api/admin/stats` – Aggregate counters and dashboard KPI metrics
- `GET  /api/admin/complaints` – Filterable city-wide complaint list
- `PUT  /api/admin/complaints/{id}/status` – Update complaint status & notes (triggers Telegram alert)

### Python AI Service
- `GET  /health` – Health check endpoint
- `POST /analyze` – Multipart image YOLO detection and severity scoring
