package com.potholeai.service;

import com.potholeai.dto.*;
import com.potholeai.entity.*;
import com.potholeai.repository.ComplaintRepository;
import com.potholeai.repository.UserRepository;
import com.potholeai.util.ComplaintIdGenerator;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AiIntegrationService aiIntegrationService;
    private final TelegramNotificationService telegramNotificationService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            AiIntegrationService aiIntegrationService,
            TelegramNotificationService telegramNotificationService
    ) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.aiIntegrationService = aiIntegrationService;
        this.telegramNotificationService = telegramNotificationService;
    }

    @PostConstruct
    public void seedInitialComplaints() {
        if (complaintRepository.count() == 0) {
            User citizen = userRepository.findByEmail("user@potholeai.com").orElse(null);
            if (citizen == null) {
                citizen = new User("Citizen User", "user@potholeai.com", "password", Role.ROLE_USER);
                citizen = userRepository.save(citizen);
            }

            Complaint c1 = new Complaint();
            c1.setComplaintId("PH-2026-1001");
            c1.setUser(citizen);
            c1.setImagePath("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80");
            c1.setAnnotatedImagePath("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80");
            c1.setLocation("MG Road, Near Metro Pillar 142");
            c1.setLatitude(12.971599);
            c1.setLongitude(77.594566);
            c1.setAiDetectionResult("Detected (3 potholes)");
            c1.setPotholeCount(3);
            c1.setConfidenceScore(94.2);
            c1.setSeverity(Severity.HIGH);
            c1.setStatus(ComplaintStatus.PENDING);
            c1.setAdminNotes("Awaiting field engineer inspection dispatch");

            Complaint c2 = new Complaint();
            c2.setComplaintId("PH-2026-1002");
            c2.setUser(citizen);
            c2.setImagePath("https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80");
            c2.setAnnotatedImagePath("https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80");
            c2.setLocation("Outer Ring Road, Marathahalli Junction");
            c2.setLatitude(12.956924);
            c2.setLongitude(77.701126);
            c2.setAiDetectionResult("Detected (2 potholes)");
            c2.setPotholeCount(2);
            c2.setConfidenceScore(88.5);
            c2.setSeverity(Severity.MEDIUM);
            c2.setStatus(ComplaintStatus.IN_PROGRESS);
            c2.setAdminNotes("Repair crew assigned - target ETA 24 hrs");

            Complaint c3 = new Complaint();
            c3.setComplaintId("PH-2026-1003");
            c3.setUser(citizen);
            c3.setImagePath("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80");
            c3.setAnnotatedImagePath("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80");
            c3.setLocation("Indiranagar 100ft Road, 12th Main Cross");
            c3.setLatitude(12.978370);
            c3.setLongitude(77.640839);
            c3.setAiDetectionResult("Detected (1 pothole)");
            c3.setPotholeCount(1);
            c3.setConfidenceScore(78.1);
            c3.setSeverity(Severity.LOW);
            c3.setStatus(ComplaintStatus.RESOLVED);
            c3.setAdminNotes("Patching completed with bitumen mixture");

            complaintRepository.save(c1);
            complaintRepository.save(c2);
            complaintRepository.save(c3);
            System.out.println("[ComplaintService] Seeded 3 initial demo complaints with GPS and AI metrics.");
        }
    }

    @Transactional
    public ComplaintResponse submitComplaint(
            MultipartFile imageFile,
            String location,
            Double latitude,
            Double longitude,
            Long userId
    ) throws IOException {

        User user = userRepository.findById(userId)
                .orElseGet(() -> userRepository.findByEmail("user@potholeai.com")
                        .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId)));

        // 1. Store Original Image
        String rawImagePath = fileStorageService.saveOriginalFile(imageFile);

        // 2. Call Python YOLO AI Microservice
        AiAnalysisResponse aiResult = aiIntegrationService.analyzeRoadImage(imageFile);

        // 3. Process AI Detection Results
        String annotatedPath = null;
        if (aiResult.getAnnotated_image_base64() != null) {
            annotatedPath = fileStorageService.saveBase64Image(aiResult.getAnnotated_image_base64(), "annotated");
        }

        Severity severity;
        try {
            severity = Severity.valueOf(aiResult.getSeverity().toUpperCase());
        } catch (Exception e) {
            severity = Severity.LOW;
        }

        String detectionSummary;
        if (aiResult.isDetected()) {
            detectionSummary = String.format("Detected (%d pothole%s)",
                    aiResult.getPothole_count(),
                    aiResult.getPothole_count() > 1 ? "s" : "");
        } else {
            detectionSummary = "No Potholes Detected";
        }

        // 4. Create and Populate Complaint Entity
        Complaint complaint = new Complaint();
        complaint.setComplaintId(ComplaintIdGenerator.generate());
        complaint.setUser(user);
        complaint.setImagePath(rawImagePath);
        complaint.setAnnotatedImagePath(annotatedPath != null ? annotatedPath : rawImagePath);
        complaint.setLocation(location != null && !location.trim().isEmpty() ? location : "Unknown Location");
        complaint.setLatitude(latitude != null ? latitude : 12.9716);
        complaint.setLongitude(longitude != null ? longitude : 77.5946);
        complaint.setAiDetectionResult(detectionSummary);
        complaint.setPotholeCount(aiResult.getPothole_count());
        complaint.setConfidenceScore(aiResult.getConfidence());
        complaint.setSeverity(severity);
        complaint.setStatus(ComplaintStatus.PENDING);
        complaint.setAdminNotes(aiResult.getMessage());

        Complaint savedComplaint = complaintRepository.save(complaint);

        // 5. Send Telegram Notification
        try {
            telegramNotificationService.notifyNewComplaint(savedComplaint);
        } catch (Exception e) {
            System.err.println("[ComplaintService] Telegram dispatch failed: " + e.getMessage());
        }

        return ComplaintResponse.fromEntity(savedComplaint);
    }

    @Transactional
    public ComplaintResponse updateStatus(String complaintId, ComplaintStatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        ComplaintStatus previousStatus = complaint.getStatus();
        complaint.setStatus(request.getStatus());
        if (request.getAdminNotes() != null) {
            complaint.setAdminNotes(request.getAdminNotes());
        }

        Complaint updated = complaintRepository.save(complaint);

        // Send Telegram notification on status change
        try {
            telegramNotificationService.notifyStatusUpdate(updated, previousStatus);
        } catch (Exception e) {
            System.err.println("[ComplaintService] Telegram status notification failed: " + e.getMessage());
        }

        return ComplaintResponse.fromEntity(updated);
    }

    public List<ComplaintResponse> getUserComplaints(Long userId) {
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ComplaintResponse getByComplaintId(String complaintId) {
        Complaint complaint = complaintRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));
        return ComplaintResponse.fromEntity(complaint);
    }

    public List<MapPinResponse> getMapPins() {
        return complaintRepository.findAll()
                .stream()
                .map(MapPinResponse::fromComplaint)
                .collect(Collectors.toList());
    }

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalComplaints(complaintRepository.count());
        stats.setTotalPotholesDetected(complaintRepository.sumTotalPotholes());
        stats.setPendingComplaints(complaintRepository.countByStatus(ComplaintStatus.PENDING));
        stats.setInProgressComplaints(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
        stats.setResolvedComplaints(complaintRepository.countByStatus(ComplaintStatus.RESOLVED));
        stats.setHighSeverityPotholes(complaintRepository.countBySeverity(Severity.HIGH));
        stats.setMediumSeverityPotholes(complaintRepository.countBySeverity(Severity.MEDIUM));
        stats.setLowSeverityPotholes(complaintRepository.countBySeverity(Severity.LOW));

        List<ComplaintResponse> recent = complaintRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
        stats.setRecentComplaints(recent);

        return stats;
    }
}
