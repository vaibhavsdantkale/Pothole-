package com.potholeai.dto;

import com.potholeai.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public class ComplaintStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ComplaintStatus status;

    private String adminNotes;

    public ComplaintStatusUpdateRequest() {
    }

    public ComplaintStatusUpdateRequest(ComplaintStatus status, String adminNotes) {
        this.status = status;
        this.adminNotes = adminNotes;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
