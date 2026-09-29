package com.WMS.BE.service;

public interface EmailService {

    /**
     * Asynchronously sends welcome email with account login credentials to a newly registered resident.
     */
    void sendResidentCredentials(
            String toEmail,
            String fullName,
            String username,
            String plainPassword,
            String unitNumber,
            String apartmentName
    );

    /**
     * Asynchronously sends monthly water bill invoice notification.
     */
    void sendBillNotification(
            String toEmail,
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double consumptionKL,
            double totalAmount,
            String dueDate,
            String apartmentName
    );

    /**
     * Asynchronously sends payment overdue / due date reminder.
     */
    void sendPaymentReminder(
            String toEmail,
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double totalAmount,
            String dueDate,
            String apartmentName
    );

    /**
     * Asynchronously sends abnormal water consumption or leak anomaly alert.
     */
    void sendLeakAlert(
            String toEmail,
            String residentName,
            String unitNumber,
            String severity,
            String description,
            String apartmentName
    );

    /**
     * Asynchronously sends password reset notification.
     */
    void sendPasswordResetEmail(String toEmail, String fullName, String resetToken);

    /**
     * Asynchronously sends general society announcement or notification.
     */
    void sendCustomNotification(String toEmail, String subject, String bodyHtml);

    /**
     * Asynchronously sends confirmation of account creation & approval to an apartment administrator.
     */
    void sendAdminApprovalConfirmation(
            String toEmail,
            String adminName,
            String username,
            String apartmentName
    );

    /**
     * Asynchronously sends acknowledgement email upon apartment administrator registration submission.
     */
    void sendAdminRegistrationSubmitted(
            String toEmail,
            String adminName,
            String apartmentName
    );

    /**
     * Synchronously sends a test diagnostic email to verify SMTP credentials and network connectivity.
     */
    boolean sendTestEmail(String toEmail);
}
