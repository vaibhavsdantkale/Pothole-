package com.potholeai.controller;

import com.potholeai.dto.ComplaintResponse;
import com.potholeai.dto.ComplaintStatusUpdateRequest;
import com.potholeai.entity.ComplaintStatus;
import com.potholeai.service.ComplaintService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiWebhookController {

    private final ComplaintService complaintService;

    public AiWebhookController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> receiveAiCallback(@RequestBody Map<String, Object> payload) {
        try {
            String complaintId = (String) payload.get("complaintId");
            if (complaintId != null) {
                String message = (String) payload.get("detectionMessage");
                // Update complaint record if needed
                ComplaintStatusUpdateRequest update = new ComplaintStatusUpdateRequest(
                        ComplaintStatus.PENDING,
                        "AI Callback: " + message
                );
                ComplaintResponse updated = complaintService.updateStatus(complaintId, update);
                return ResponseEntity.ok(Map.of("status", "SUCCESS", "complaintId", updated.getComplaintId()));
            }
            return ResponseEntity.ok(Map.of("status", "ACKNOWLEDGED"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
