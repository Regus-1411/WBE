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
     * Asynchronously sends password reset notification.
     */
    void sendPasswordResetEmail(String toEmail, String fullName, String resetToken);

    /**
     * Asynchronously sends general society announcement or notification.
     */
    void sendCustomNotification(String toEmail, String subject, String bodyHtml);
}
