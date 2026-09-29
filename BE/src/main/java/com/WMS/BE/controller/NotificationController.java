package com.WMS.BE.controller;

import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final EmailService emailService;

    /**
     * Diagnostic endpoint to test live SMTP connectivity.
     */
    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse<String>> testEmail(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Target email address is required"));
        }

        try {
            boolean sent = emailService.sendTestEmail(email.trim());
            if (sent) {
                return ResponseEntity.ok(ApiResponse.success("✅ Real test email successfully dispatched to " + email, "OK"));
            } else {
                return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to send test email"));
            }
        } catch (Exception ex) {
            log.error("SMTP Test Error: {}", ex.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("SMTP Connection Error: " + ex.getMessage()));
        }
    }

    /**
     * Dispatches monthly water bill invoice to a resident.
     */
    @PostMapping("/send-bill")
    public ResponseEntity<ApiResponse<String>> sendBillNotification(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String residentName = (String) payload.getOrDefault("residentName", "Resident");
        String unitNumber = (String) payload.getOrDefault("unitNumber", "");
        String invoiceNumber = (String) payload.getOrDefault("invoiceNumber", "INV");
        String period = (String) payload.getOrDefault("period", "Current Cycle");
        double consumptionKL = Double.parseDouble(payload.getOrDefault("consumptionKL", "0").toString());
        double totalAmount = Double.parseDouble(payload.getOrDefault("totalAmount", "0").toString());
        String dueDate = (String) payload.getOrDefault("dueDate", "10 days from issuance");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "DROP Water");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendBillNotification(toEmail.trim(), residentName, unitNumber, invoiceNumber, period, consumptionKL, totalAmount, dueDate, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Bill notification queued for " + toEmail, "DISPATCHED"));
    }

    /**
     * Dispatches overdue / payment reminder to a resident.
     */
    @PostMapping("/send-reminder")
    public ResponseEntity<ApiResponse<String>> sendPaymentReminder(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String residentName = (String) payload.getOrDefault("residentName", "Resident");
        String unitNumber = (String) payload.getOrDefault("unitNumber", "");
        String invoiceNumber = (String) payload.getOrDefault("invoiceNumber", "INV");
        String period = (String) payload.getOrDefault("period", "Current Cycle");
        double totalAmount = Double.parseDouble(payload.getOrDefault("totalAmount", "0").toString());
        String dueDate = (String) payload.getOrDefault("dueDate", "Immediate");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "DROP Water");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendPaymentReminder(toEmail.trim(), residentName, unitNumber, invoiceNumber, period, totalAmount, dueDate, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Payment reminder queued for " + toEmail, "DISPATCHED"));
    }

    /**
     * Dispatches leak anomaly alert to a resident.
     */
    @PostMapping("/send-leak-alert")
    public ResponseEntity<ApiResponse<String>> sendLeakAlert(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String residentName = (String) payload.getOrDefault("residentName", "Resident");
        String unitNumber = (String) payload.getOrDefault("unitNumber", "");
        String severity = (String) payload.getOrDefault("severity", "High");
        String description = (String) payload.getOrDefault("description", "Abnormal water flow detected");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "DROP Water");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendLeakAlert(toEmail.trim(), residentName, unitNumber, severity, description, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Leak alert email queued for " + toEmail, "DISPATCHED"));
    }

    /**
     * Dispatches resident credentials email upon allocation.
     */
    @PostMapping("/send-credentials")
    public ResponseEntity<ApiResponse<String>> sendResidentCredentials(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String fullName = (String) payload.getOrDefault("fullName", "Resident");
        String username = (String) payload.getOrDefault("username", "resident");
        String password = (String) payload.getOrDefault("password", "Drop@2026");
        String unitNumber = (String) payload.getOrDefault("unitNumber", "Assigned Unit");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "DROP Water");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendResidentCredentials(toEmail.trim(), fullName, username, password, unitNumber, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Credentials email dispatched to " + toEmail, "DISPATCHED"));
    }

    /**
     * Dispatches confirmation of account creation & approval to apartment admin.
     */
    @PostMapping("/send-admin-approval")
    public ResponseEntity<ApiResponse<String>> sendAdminApproval(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String adminName = (String) payload.getOrDefault("adminName", "Society Admin");
        String username = (String) payload.getOrDefault("username", "admin");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "Society Management");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendAdminApprovalConfirmation(toEmail.trim(), adminName, username, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Admin approval confirmation email dispatched to " + toEmail, "DISPATCHED"));
    }

    /**
     * Dispatches registration acknowledgement to apartment admin.
     */
    @PostMapping("/send-admin-registration-submitted")
    public ResponseEntity<ApiResponse<String>> sendAdminRegistrationSubmitted(@RequestBody Map<String, Object> payload) {
        String toEmail = (String) payload.get("email");
        String adminName = (String) payload.getOrDefault("adminName", "Society Admin");
        String apartmentName = (String) payload.getOrDefault("apartmentName", "Society Management");

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        emailService.sendAdminRegistrationSubmitted(toEmail.trim(), adminName, apartmentName);
        return ResponseEntity.ok(ApiResponse.success("Admin registration acknowledgement dispatched to " + toEmail, "DISPATCHED"));
    }

}
