package com.potholeai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AiAnalysisResponse {

    private boolean detected;
    private int pothole_count;
    private double confidence;
    private String severity;
    private String message;
    private String annotated_image_base64;
    private List<Map<String, Object>> detections;

    public AiAnalysisResponse() {
    }

    public boolean isDetected() {
        return detected;
    }

    public void setDetected(boolean detected) {
        this.detected = detected;
    }

    public int getPothole_count() {
        return pothole_count;
    }

    public void setPothole_count(int pothole_count) {
        this.pothole_count = pothole_count;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAnnotated_image_base64() {
        return annotated_image_base64;
    }

    public void setAnnotated_image_base64(String annotated_image_base64) {
        this.annotated_image_base64 = annotated_image_base64;
    }

    public List<Map<String, Object>> getDetections() {
        return detections;
    }

    public void setDetections(List<Map<String, Object>> detections) {
        this.detections = detections;
    }
}
