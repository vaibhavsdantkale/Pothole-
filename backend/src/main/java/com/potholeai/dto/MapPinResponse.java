package com.potholeai.dto;

import com.potholeai.entity.Complaint;
import com.potholeai.entity.ComplaintStatus;
import com.potholeai.entity.Severity;

public class MapPinResponse {

    private String complaintId;
    private String location;
    private Double latitude;
    private Double longitude;
    private Severity severity;
    private ComplaintStatus status;
    private Integer potholeCount;
    private Double confidenceScore;
    private String imagePath;
    private String annotatedImagePath;

    public MapPinResponse() {
    }

    public static MapPinResponse fromComplaint(Complaint c) {
        MapPinResponse pin = new MapPinResponse();
        pin.setComplaintId(c.getComplaintId());
        pin.setLocation(c.getLocation());
        pin.setLatitude(c.getLatitude());
        pin.setLongitude(c.getLongitude());
        pin.setSeverity(c.getSeverity());
        pin.setStatus(c.getStatus());
        pin.setPotholeCount(c.getPotholeCount());
        pin.setConfidenceScore(c.getConfidenceScore());
        pin.setImagePath(c.getImagePath());
        pin.setAnnotatedImagePath(c.getAnnotatedImagePath());
        return pin;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
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
}
