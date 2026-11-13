package com.potholeai.service;

import com.potholeai.entity.Complaint;
import com.potholeai.entity.ComplaintStatus;
import com.potholeai.entity.Severity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class TelegramNotificationService {

    @Value("${telegram.bot.enabled:true}")
    private boolean enabled;

    @Value("${telegram.bot.token:YOUR_TELEGRAM_BOT_TOKEN}")
    private String botToken;

    @Value("${telegram.bot.chat-id:YOUR_TELEGRAM_CHAT_ID}")
    private String chatId;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Notification 1: A new pothole complaint has been reported.
     */
    public void notifyNewComplaint(Complaint complaint) {
        StringBuilder msg = new StringBuilder();
        msg.append("🚨 <b>NEW POTHOLE REPORTED</b>\n\n");
        msg.append("🆔 <b>Complaint ID:</b> <code>").append(complaint.getComplaintId()).append("</code>\n");
        msg.append("📍 <b>Location:</b> ").append(complaint.getLocation()).append("\n");
        msg.append("🌐 <b>Coordinates:</b> ").append(complaint.getLatitude()).append(", ").append(complaint.getLongitude()).append("\n");
        msg.append("🤖 <b>AI Result:</b> ").append(complaint.getAiDetectionResult()).append("\n");
        msg.append("🔢 <b>Potholes Count:</b> ").append(complaint.getPotholeCount()).append("\n");
        msg.append("🎯 <b>Confidence:</b> ").append(complaint.getConfidenceScore()).append("%\n");
        msg.append("⚠️ <b>Severity:</b> ").append(getSeverityBadge(complaint.getSeverity())).append("\n");
        msg.append("👤 <b>Reported By:</b> ").append(complaint.getUser() != null ? complaint.getUser().getName() : "Anonymous Citizen").append("\n");
        msg.append("📅 <b>Time:</b> ").append(complaint.getCreatedAt()).append("\n");

        sendMessage(msg.toString());

        // Check if also triggers High Severity alert
        if (complaint.getSeverity() == Severity.HIGH) {
            notifyHighSeverityAlert(complaint);
        }
    }

    /**
     * Notification 2: A HIGH-severity pothole is detected (Priority Emergency Alert).
     */
    public void notifyHighSeverityAlert(Complaint complaint) {
        StringBuilder msg = new StringBuilder();
        msg.append("⚠️⚠️ <b>URGENT: HIGH-SEVERITY POTHOLE HAZARD</b> ⚠️⚠️\n\n");
        msg.append("Critical road defect identified by AI YOLO model that poses imminent danger to vehicles and pedestrians!\n\n");
        msg.append("🆔 <b>Complaint ID:</b> <code>").append(complaint.getComplaintId()).append("</code>\n");
        msg.append("📍 <b>Location:</b> ").append(complaint.getLocation()).append("\n");
        msg.append("🗺️ <a href=\"https://www.google.com/maps?q=")
                .append(complaint.getLatitude()).append(",").append(complaint.getLongitude())
                .append("\">Open in Google Maps / Navigation</a>\n\n");
        msg.append("🚨 <i>Immediate road maintenance crew dispatch recommended.</i>");

        sendMessage(msg.toString());
    }

    /**
     * Notification 3: Admin updates complaint status (e.g., IN_PROGRESS, REJECTED).
     */
    public void notifyStatusUpdate(Complaint complaint, ComplaintStatus previousStatus) {
        if (complaint.getStatus() == ComplaintStatus.RESOLVED) {
            notifyComplaintResolved(complaint);
            return;
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🔄 <b>COMPLAINT STATUS UPDATED</b>\n\n");
        msg.append("🆔 <b>Complaint ID:</b> <code>").append(complaint.getComplaintId()).append("</code>\n");
        msg.append("📍 <b>Location:</b> ").append(complaint.getLocation()).append("\n");
        msg.append("📊 <b>Status Changed:</b> <s>").append(previousStatus).append("</s> ➡️ <b>").append(complaint.getStatus()).append("</b>\n");
        if (complaint.getAdminNotes() != null && !complaint.getAdminNotes().trim().isEmpty()) {
            msg.append("📝 <b>Admin Remarks:</b> ").append(complaint.getAdminNotes()).append("\n");
        }
        msg.append("📅 <b>Updated At:</b> ").append(complaint.getUpdatedAt()).append("\n");

        sendMessage(msg.toString());
    }

    /**
     * Notification 4: A complaint is marked as RESOLVED (Repairs Complete).
     */
    public void notifyComplaintResolved(Complaint complaint) {
        StringBuilder msg = new StringBuilder();
        msg.append("✅ <b>POTHOLE REPAIRED & RESOLVED</b>\n\n");
        msg.append("Road damage has been successfully repaired and verified!\n\n");
        msg.append("🆔 <b>Complaint ID:</b> <code>").append(complaint.getComplaintId()).append("</code>\n");
        msg.append("📍 <b>Location:</b> ").append(complaint.getLocation()).append("\n");
        msg.append("🎉 <b>Status:</b> RESOLVED / CLOSED\n");
        if (complaint.getAdminNotes() != null && !complaint.getAdminNotes().trim().isEmpty()) {
            msg.append("📝 <b>Completion Notes:</b> ").append(complaint.getAdminNotes()).append("\n");
        }
        msg.append("🙏 <i>Thank you for helping keep our roads safe!</i>");

        sendMessage(msg.toString());
    }

    /**
     * Helper method to send Telegram message via HTTP Bot API.
     */
    private void sendMessage(String textHtml) {
        if (!enabled) {
            return;
        }

        // If credentials are left as placeholders, log to console gracefully
        if ("YOUR_TELEGRAM_BOT_TOKEN".equals(botToken) || "YOUR_TELEGRAM_CHAT_ID".equals(chatId) || botToken.trim().isEmpty()) {
            System.out.println("\n[TelegramNotificationService] (Mock/Dry-Run Notification):");
            System.out.println(textHtml.replaceAll("<[^>]*>", ""));
            System.out.println("[Telegram] Tip: Set 'telegram.bot.token' & 'telegram.bot.chat-id' in application.properties to receive real-time Telegram messages.\n");
            return;
        }

        try {
            String telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";

            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", textHtml);
            body.put("parse_mode", "HTML");
            body.put("disable_web_page_preview", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(telegramUrl, entity, String.class);
            System.out.println("[TelegramNotificationService] Notification dispatched successfully to chat: " + chatId);
        } catch (Exception e) {
            System.err.println("[TelegramNotificationService] Warning: Failed to send Telegram alert: " + e.getMessage());
        }
    }

    private String getSeverityBadge(Severity severity) {
        if (severity == null) return "Unknown";
        switch (severity) {
            case HIGH:
                return "🔴 HIGH (Danger)";
            case MEDIUM:
                return "🟠 MEDIUM (Moderate)";
            case LOW:
                return "🟡 LOW (Minor)";
            default:
                return "⚪ " + severity.name();
        }
    }
}
