/**
 * PotholeAI - Municipal Admin Dashboard Logic
 */

let adminComplaints = [];
let activeAdminFilter = "ALL";
let severityChartInstance = null;
let statusChartInstance = null;
let adminMiniMap = null;
let currentEditingComplaintId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    initAdminFilters();
    initAdminSearch();
    initAdminModalForm();
});

async function loadDashboardData() {
    try {
        const stats = await API.getAdminStats();
        renderStats(stats);
        renderCharts(stats);

        adminComplaints = await API.getAllComplaints();
        renderAdminComplaints();
        initMiniMap(adminComplaints);
    } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
        renderSampleData();
    }
}

function renderStats(stats) {
    document.getElementById("statPotholes").textContent = stats.totalPotholesDetected || 0;
    document.getElementById("statPending").textContent = stats.pendingComplaints || 0;
    document.getElementById("statInProgress").textContent = stats.inProgressComplaints || 0;
    document.getElementById("statResolved").textContent = stats.resolvedComplaints || 0;
    document.getElementById("statHighSeverity").textContent = stats.highSeverityPotholes || 0;
}

function renderCharts(stats) {
    const ctxSev = document.getElementById("severityChart")?.getContext("2d");
    if (!ctxSev) return;
    if (severityChartInstance) severityChartInstance.destroy();

    severityChartInstance = new Chart(ctxSev, {
        type: "doughnut",
        data: {
            labels: ["High Severity", "Medium Severity", "Low Severity"],
            datasets: [{
                data: [
                    stats.highSeverityPotholes || 3,
                    stats.mediumSeverityPotholes || 2,
                    stats.lowSeverityPotholes || 1
                ],
                backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });

    const ctxStat = document.getElementById("statusChart")?.getContext("2d");
    if (!ctxStat) return;
    if (statusChartInstance) statusChartInstance.destroy();

    statusChartInstance = new Chart(ctxStat, {
        type: "bar",
        data: {
            labels: ["Pending", "In Progress", "Resolved"],
            datasets: [{
                label: "Complaints",
                data: [
                    stats.pendingComplaints || 4,
                    stats.inProgressComplaints || 2,
                    stats.resolvedComplaints || 5
                ],
                backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function initMiniMap(complaints) {
    if (typeof L === "undefined") {
        console.warn("Leaflet not available for mini-map.");
        return;
    }

    try {
        if (!adminMiniMap) {
            adminMiniMap = L.map("adminMiniMap", {
                zoomControl: false
            }).setView([12.9716, 77.5946], 11);

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; CARTO',
                subdomains: 'abcd'
            }).addTo(adminMiniMap);

            setTimeout(() => {
                if (adminMiniMap) adminMiniMap.invalidateSize();
            }, 300);
        }

        // Add circle pins
        complaints.forEach(c => {
            const lat = parseFloat(c.latitude);
            const lng = parseFloat(c.longitude);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
                const color = c.severity === "HIGH" ? "#ef4444" : (c.severity === "MEDIUM" ? "#f59e0b" : "#10b981");
                L.circleMarker([lat, lng], {
                    radius: 7,
                    fillColor: color,
                    color: "#ffffff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).bindPopup(`<b>${c.complaintId}</b><br>${c.location}<br>Severity: <b>${c.severity}</b>`).addTo(adminMiniMap);
            }
        });
    } catch (e) {
        console.error("Mini-map initialization error:", e);
    }
}

function initAdminFilters() {
    const filterButtons = document.querySelectorAll(".admin-filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeAdminFilter = btn.getAttribute("data-status");
            renderAdminComplaints();
        });
    });
}

function initAdminSearch() {
    document.getElementById("adminSearchInput")?.addEventListener("input", (e) => {
        renderAdminComplaints(e.target.value.toLowerCase().trim());
    });
}

function renderAdminComplaints(searchTerm = "") {
    const listBody = document.getElementById("adminComplaintsList");
    if (!listBody) return;

    let filtered = adminComplaints;
    if (activeAdminFilter !== "ALL") {
        filtered = filtered.filter(c => c.status === activeAdminFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.complaintId.toLowerCase().includes(searchTerm) ||
            c.location.toLowerCase().includes(searchTerm) ||
            (c.userName && c.userName.toLowerCase().includes(searchTerm))
        );
    }

    if (filtered.length === 0) {
        listBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    No matching complaints found.
                </td>
            </tr>
        `;
        return;
    }

    listBody.innerHTML = filtered.map(c => {
        const severityClass = c.severity === "HIGH" ? "badge-severity-high" : (c.severity === "MEDIUM" ? "badge-severity-medium" : "badge-severity-low");
        const statusClass = c.status === "PENDING" ? "badge-status-pending" : (c.status === "IN_PROGRESS" ? "badge-status-inprogress" : (c.status === "RESOLVED" ? "badge-status-resolved" : "badge-status-rejected"));

        const imgUrl = API.resolveImageUrl(c.annotatedImagePath || c.imagePath);

        return `
            <tr>
                <td class="fw-bold font-monospace text-primary">${c.complaintId}</td>
                <td>
                    <img src="${imgUrl}" class="rounded border" style="width: 48px; height: 36px; object-fit: cover;" alt="Pothole">
                </td>
                <td class="small">
                    <div class="fw-semibold text-dark">${c.userName || 'Citizen'}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${c.userEmail || ''}</div>
                </td>
                <td class="text-truncate" style="max-width: 170px;" title="${c.location}">${c.location}</td>
                <td class="small">
                    <span class="fw-semibold">${c.aiDetectionResult}</span>
                    <div class="text-muted" style="font-size: 0.75rem;">${c.confidenceScore}% conf</div>
                </td>
                <td><span class="badge ${severityClass}">${c.severity}</span></td>
                <td><span class="badge ${statusClass}">${c.status}</span></td>
                <td class="small text-muted">${c.createdAt || 'Just now'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary py-1 px-2" onclick="openAdminModal('${c.complaintId}')">
                        <i class="bi bi-gear me-1"></i> Manage
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function openAdminModal(complaintId) {
    currentEditingComplaintId = complaintId;
    const complaint = adminComplaints.find(c => c.complaintId === complaintId);
    if (!complaint) return;

    document.getElementById("modalAdminComplaintId").textContent = complaint.complaintId;
    document.getElementById("adminModalImg").src = API.resolveImageUrl(complaint.annotatedImagePath || complaint.imagePath);
    document.getElementById("adminViewRawLink").href = API.resolveImageUrl(complaint.imagePath);
    document.getElementById("modalAdminUser").textContent = `${complaint.userName || 'Citizen'} (${complaint.userEmail || 'N/A'})`;
    document.getElementById("modalAdminLocation").textContent = `${complaint.location} (${complaint.latitude}, ${complaint.longitude})`;

    const severityClass = complaint.severity === "HIGH" ? "badge-severity-high" : (complaint.severity === "MEDIUM" ? "badge-severity-medium" : "badge-severity-low");
    document.getElementById("modalAdminSeverity").innerHTML = `<span class="badge ${severityClass}">${complaint.severity}</span>`;
    document.getElementById("modalAdminConfidence").textContent = `${complaint.confidenceScore}% (${complaint.aiDetectionResult})`;

    document.getElementById("modalAdminStatusSelect").value = complaint.status;
    document.getElementById("modalAdminNotes").value = complaint.adminNotes || "";

    const alertBox = document.getElementById("adminModalAlert");
    alertBox.className = "alert d-none";

    const modal = new bootstrap.Modal(document.getElementById("adminManageModal"));
    modal.show();
}

function initAdminModalForm() {
    document.getElementById("adminUpdateForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentEditingComplaintId) return;

        const status = document.getElementById("modalAdminStatusSelect").value;
        const notes = document.getElementById("modalAdminNotes").value;
        const btnSave = document.getElementById("btnAdminSave");
        const spinner = document.getElementById("adminSaveSpinner");
        const alertBox = document.getElementById("adminModalAlert");

        btnSave.disabled = true;
        spinner.classList.remove("d-none");
        alertBox.className = "alert d-none";

        try {
            const updated = await API.updateComplaintStatus(currentEditingComplaintId, status, notes);

            const idx = adminComplaints.findIndex(c => c.complaintId === currentEditingComplaintId);
            if (idx >= 0) {
                adminComplaints[idx] = updated;
            }

            alertBox.className = "alert alert-success py-2 small";
            alertBox.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Status updated to <b>${status}</b> and Telegram alert dispatched!`;

            renderAdminComplaints();
            const stats = await API.getAdminStats();
            renderStats(stats);
            renderCharts(stats);

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById("adminManageModal"));
                if (modal) modal.hide();
            }, 1200);
        } catch (err) {
            alertBox.className = "alert alert-danger py-2 small";
            alertBox.textContent = err.message || "Failed to update complaint status.";
        } finally {
            btnSave.disabled = false;
            spinner.classList.add("d-none");
        }
    });
}

function renderSampleData() {
    renderStats({
        totalPotholesDetected: 8,
        pendingComplaints: 2,
        inProgressComplaints: 1,
        resolvedComplaints: 3,
        highSeverityPotholes: 3,
        mediumSeverityPotholes: 2,
        lowSeverityPotholes: 1
    });
}
