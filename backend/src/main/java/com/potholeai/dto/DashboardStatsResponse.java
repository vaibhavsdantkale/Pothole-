package com.potholeai.dto;

import java.util.List;

public class DashboardStatsResponse {

    private long totalComplaints;
    private long totalPotholesDetected;
    private long pendingComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long highSeverityPotholes;
    private long mediumSeverityPotholes;
    private long lowSeverityPotholes;
    private List<ComplaintResponse> recentComplaints;

    public DashboardStatsResponse() {
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public long getTotalPotholesDetected() {
        return totalPotholesDetected;
    }

    public void setTotalPotholesDetected(long totalPotholesDetected) {
        this.totalPotholesDetected = totalPotholesDetected;
    }

    public long getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(long pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public long getInProgressComplaints() {
        return inProgressComplaints;
    }

    public void setInProgressComplaints(long inProgressComplaints) {
        this.inProgressComplaints = inProgressComplaints;
    }

    public long getResolvedComplaints() {
        return resolvedComplaints;
    }

    public void setResolvedComplaints(long resolvedComplaints) {
        this.resolvedComplaints = resolvedComplaints;
    }

    public long getHighSeverityPotholes() {
        return highSeverityPotholes;
    }

    public void setHighSeverityPotholes(long highSeverityPotholes) {
        this.highSeverityPotholes = highSeverityPotholes;
    }

    public long getMediumSeverityPotholes() {
        return mediumSeverityPotholes;
    }

    public void setMediumSeverityPotholes(long mediumSeverityPotholes) {
        this.mediumSeverityPotholes = mediumSeverityPotholes;
    }

    public long getLowSeverityPotholes() {
        return lowSeverityPotholes;
    }

    public void setLowSeverityPotholes(long lowSeverityPotholes) {
        this.lowSeverityPotholes = lowSeverityPotholes;
    }

    public List<ComplaintResponse> getRecentComplaints() {
        return recentComplaints;
    }

    public void setRecentComplaints(List<ComplaintResponse> recentComplaints) {
        this.recentComplaints = recentComplaints;
    }
}
