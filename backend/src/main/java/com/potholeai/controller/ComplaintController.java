package com.potholeai.controller;

import com.potholeai.dto.ComplaintResponse;
import com.potholeai.dto.MapPinResponse;
import com.potholeai.service.ComplaintService;
import com.potholeai.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final JwtUtil jwtUtil;

    public ComplaintController(ComplaintService complaintService, JwtUtil jwtUtil) {
        this.complaintService = complaintService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> submitComplaint(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "location", defaultValue = "GPS Location") String location,
            @RequestParam(value = "latitude", defaultValue = "0.0") Double latitude,
            @RequestParam(value = "longitude", defaultValue = "0.0") Double longitude,
            @RequestParam(value = "userId", required = false) Long userIdParam,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = userIdParam;

            // Extract userId from JWT if available
            if (userId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtil.validateToken(token)) {
                    userId = jwtUtil.getUserIdFromToken(token);
                }
            }

            // Default to demo citizen (ID 2) if anonymous/demo test
            if (userId == null) {
                userId = 2L;
            }

            ComplaintResponse response = complaintService.submitComplaint(
                    image, location, latitude, longitude, userId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Failed to submit complaint: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getComplaints(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (userId != null) {
            return ResponseEntity.ok(complaintService.getUserComplaints(userId));
        }

        // Check if JWT token provides user identity
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String role = jwtUtil.getRoleFromToken(token);
                if ("ROLE_ADMIN".equals(role)) {
                    return ResponseEntity.ok(complaintService.getAllComplaints());
                } else {
                    Long tokenUserId = jwtUtil.getUserIdFromToken(token);
                    return ResponseEntity.ok(complaintService.getUserComplaints(tokenUserId));
                }
            }
        }

        // Default: return all complaints
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/{complaintId}")
    public ResponseEntity<?> getComplaintById(@PathVariable String complaintId) {
        try {
            ComplaintResponse response = complaintService.getByComplaintId(complaintId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/map")
    public ResponseEntity<List<MapPinResponse>> getMapPins() {
        return ResponseEntity.ok(complaintService.getMapPins());
    }
}
