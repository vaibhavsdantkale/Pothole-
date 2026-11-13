package com.potholeai.dto;

import com.potholeai.entity.Complaint;
import com.potholeai.entity.ComplaintStatus;
import com.potholeai.entity.Severity;

import java.time.format.DateTimeFormatter;

public class ComplaintResponse {

    private Long id;
    private String complaintId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String imagePath;
    private String annotatedImagePath;
    private String location;
    private Double latitude;
    private Double longitude;
    private String aiDetectionResult;
    private Integer potholeCount;
    private Double confidenceScore;
    private Severity severity;
    private ComplaintStatus status;
    private String adminNotes;
    private String createdAt;
    private String updatedAt;

    public ComplaintResponse() {
    }

    public static ComplaintResponse fromEntity(Complaint complaint) {
        ComplaintResponse dto = new ComplaintResponse();
        dto.setId(complaint.getId());
        dto.setComplaintId(complaint.getComplaintId());
        if (complaint.getUser() != null) {
            dto.setUserId(complaint.getUser().getId());
            dto.setUserName(complaint.getUser().getName());
            dto.setUserEmail(complaint.getUser().getEmail());
        }
        dto.setImagePath(complaint.getImagePath());
        dto.setAnnotatedImagePath(complaint.getAnnotatedImagePath());
        dto.setLocation(complaint.getLocation());
        dto.setLatitude(complaint.getLatitude());
        dto.setLongitude(complaint.getLongitude());
        dto.setAiDetectionResult(complaint.getAiDetectionResult());
        dto.setPotholeCount(complaint.getPotholeCount());
        dto.setConfidenceScore(complaint.getConfidenceScore());
        dto.setSeverity(complaint.getSeverity());
        dto.setStatus(complaint.getStatus());
        dto.setAdminNotes(complaint.getAdminNotes());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        if (complaint.getCreatedAt() != null) {
            dto.setCreatedAt(complaint.getCreatedAt().format(formatter));
        }
        if (complaint.getUpdatedAt() != null) {
            dto.setUpdatedAt(complaint.getUpdatedAt().format(formatter));
        }
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getAnnotatedImagePath() {
        return annotatedImagePath;
    }

    public void setAnnotatedImagePath(String annotatedImagePath) {
        this.annotatedImagePath = annotatedImagePath;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAiDetectionResult() {
        return aiDetectionResult;
    }

    public void setAiDetectionResult(String aiDetectionResult) {
        this.aiDetectionResult = aiDetectionResult;
    }

    public Integer getPotholeCount() {
        return potholeCount;
    }

    public void setPotholeCount(Integer potholeCount) {
        this.potholeCount = potholeCount;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
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

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
