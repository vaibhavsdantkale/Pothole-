/**
 * PotholeAI - Citizen Complaints Tracking Logic
 */

let allComplaints = [];
let activeFilter = "ALL";

document.addEventListener("DOMContentLoaded", () => {
    loadComplaints();
    initFilters();
    initSearch();
});

async function loadComplaints() {
    const listBody = document.getElementById("complaintsList");
    try {
        const user = API.getUser();
        const userId = user ? user.userId : null;
        allComplaints = await API.getUserComplaints(userId);
        updateCounters();
        renderComplaints();
    } catch (err) {
        console.error("Error loading complaints:", err);
        listBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
                    Could not connect to backend server. Please verify Spring Boot is running on port 8080.
                </td>
            </tr>
        `;
    }
}

function updateCounters() {
    document.getElementById("countAll").textContent = allComplaints.length;
    document.getElementById("countPending").textContent = allComplaints.filter(c => c.status === "PENDING").length;
    document.getElementById("countInProgress").textContent = allComplaints.filter(c => c.status === "IN_PROGRESS").length;
    document.getElementById("countResolved").textContent = allComplaints.filter(c => c.status === "RESOLVED").length;
}

function initFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.getAttribute("data-status");
            renderComplaints();
        });
    });
}

function initSearch() {
    document.getElementById("searchInput").addEventListener("input", (e) => {
        renderComplaints(e.target.value.toLowerCase().trim());
    });
}

function renderComplaints(searchTerm = "") {
    const listBody = document.getElementById("complaintsList");

    let filtered = allComplaints;
    if (activeFilter !== "ALL") {
        filtered = filtered.filter(c => c.status === activeFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.complaintId.toLowerCase().includes(searchTerm) ||
            c.location.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        listBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2 opacity-50"></i>
                    No complaints found matching criteria.
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
                    <img src="${imgUrl}" class="rounded border" style="width: 50px; height: 38px; object-fit: cover;" alt="Road">
                </td>
                <td class="text-truncate" style="max-width: 180px;" title="${c.location}">${c.location}</td>
                <td>
                    <span class="small fw-semibold">${c.aiDetectionResult}</span>
                    <div class="small text-muted">${c.confidenceScore}% conf</div>
                </td>
                <td><span class="badge ${severityClass}">${c.severity}</span></td>
                <td><span class="badge ${statusClass}">${c.status}</span></td>
                <td class="small text-muted">${c.createdAt || 'Just now'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="openDetails('${c.complaintId}')">
                        <i class="bi bi-eye me-1"></i> Details
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function openDetails(complaintId) {
    const complaint = allComplaints.find(c => c.complaintId === complaintId);
    if (!complaint) return;

    document.getElementById("modalDetailId").textContent = complaint.complaintId;
    document.getElementById("detailAnnotatedImg").src = API.resolveImageUrl(complaint.annotatedImagePath || complaint.imagePath);
    document.getElementById("detailRawImg").src = API.resolveImageUrl(complaint.imagePath);

    const statusClass = complaint.status === "PENDING" ? "badge-status-pending" : (complaint.status === "IN_PROGRESS" ? "badge-status-inprogress" : (complaint.status === "RESOLVED" ? "badge-status-resolved" : "badge-status-rejected"));
    document.getElementById("detailStatusBadge").innerHTML = `<span class="badge ${statusClass} fs-6">${complaint.status}</span>`;

    const severityClass = complaint.severity === "HIGH" ? "badge-severity-high" : (complaint.severity === "MEDIUM" ? "badge-severity-medium" : "badge-severity-low");
    document.getElementById("detailSeverityBadge").innerHTML = `<span class="badge ${severityClass} fs-6">${complaint.severity}</span>`;

    document.getElementById("detailConfidence").textContent = `${complaint.aiDetectionResult} (${complaint.confidenceScore}% confidence)`;
    document.getElementById("detailLocation").textContent = complaint.location;
    document.getElementById("detailCoords").textContent = `Lat: ${complaint.latitude}, Lng: ${complaint.longitude}`;
    document.getElementById("detailRemarks").textContent = complaint.adminNotes || "No notes entered by municipality.";

    const modal = new bootstrap.Modal(document.getElementById("detailModal"));
    modal.show();
}
