package com.WMS.BE.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from-email:noreply@dropwater.app}")
    private String fromEmail;

    @Value("${app.mail.from-name:DROP Water Management}")
    private String fromName;

    @Value("${app.mail.app-url:http://localhost:5173}")
    private String appUrl;

    @Override
    @Async
    public void sendResidentCredentials(
            String toEmail,
            String fullName,
            String username,
            String plainPassword,
            String unitNumber,
            String apartmentName
    ) {
        log.info("📧 [EmailService] Preparing resident credentials email for: {} ({})", toEmail, fullName);

        if (!mailEnabled) {
            log.info("📧 [EmailService] Mail is disabled in properties. Simulating dispatch:\n" +
                    "To: {}\nUsername: {}\nPassword: {}\nUnit: {}\nApartment: {}",
                    toEmail, username, plainPassword, unitNumber, apartmentName);
            return;
        }

        String subject = "💧 Welcome to " + (apartmentName != null ? apartmentName : "DROP") + " — Your Resident Account Credentials";
        String htmlContent = buildCredentialsEmailTemplate(fullName, username, plainPassword, unitNumber, apartmentName);

        sendHtmlEmail(toEmail, subject, htmlContent, username, plainPassword);
    }

    @Override
    @Async
    public void sendBillNotification(
            String toEmail,
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double consumptionKL,
            double totalAmount,
            String dueDate,
            String apartmentName
    ) {
        log.info("📧 [EmailService] Preparing water bill notification for: {} (Unit: {}, Inv: {})", toEmail, unitNumber, invoiceNumber);

        if (!mailEnabled) {
            log.info("📧 [EmailService] Mail disabled. Bill simulation -> Recipient: {}, Amount: ₹{}", toEmail, totalAmount);
            return;
        }

        String subject = "🧾 Water Bill for " + period + " [Invoice #" + invoiceNumber + "] - Flat " + unitNumber;
        String htmlContent = buildBillEmailTemplate(residentName, unitNumber, invoiceNumber, period, consumptionKL, totalAmount, dueDate, apartmentName);

        sendHtmlEmail(toEmail, subject, htmlContent, null, null);
    }

    @Override
    @Async
    public void sendPaymentReminder(
            String toEmail,
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double totalAmount,
            String dueDate,
            String apartmentName
    ) {
        log.info("📧 [EmailService] Preparing payment reminder for: {} (Unit: {}, Due: ₹{})", toEmail, unitNumber, totalAmount);

        if (!mailEnabled) {
            log.info("📧 [EmailService] Mail disabled. Payment reminder simulation -> Recipient: {}, Due: ₹{}", toEmail, totalAmount);
            return;
        }

        String subject = "🔔 Payment Reminder: Outstanding Water Bill of ₹" + totalAmount + " for Unit " + unitNumber;
        String htmlContent = buildReminderEmailTemplate(residentName, unitNumber, invoiceNumber, period, totalAmount, dueDate, apartmentName);

        sendHtmlEmail(toEmail, subject, htmlContent, null, null);
    }

    @Override
    @Async
    public void sendLeakAlert(
            String toEmail,
            String residentName,
            String unitNumber,
            String severity,
            String description,
            String apartmentName
    ) {
        log.info("📧 [EmailService] Preparing leak anomaly alert for: {} (Unit: {}, Severity: {})", toEmail, unitNumber, severity);

        if (!mailEnabled) {
            log.info("📧 [EmailService] Mail disabled. Leak alert simulation -> Recipient: {}, Severity: {}", toEmail, severity);
            return;
        }

        String subject = "🚨 URGENT: Water Leakage / High Consumption Alert for Unit " + unitNumber;
        String htmlContent = buildLeakAlertTemplate(residentName, unitNumber, severity, description, apartmentName);

        sendHtmlEmail(toEmail, subject, htmlContent, null, null);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String resetToken) {
        log.info("📧 [EmailService] Preparing password reset email for: {}", toEmail);
        String subject = "🔒 DROP Water System - Password Reset Request";
        String resetLink = appUrl + "/reset-password?token=" + resetToken;

        String htmlContent = buildResetPasswordTemplate(fullName, resetLink);
        sendHtmlEmail(toEmail, subject, htmlContent, null, null);
    }

    @Override
    @Async
    public void sendCustomNotification(String toEmail, String subject, String bodyHtml) {
        sendHtmlEmail(toEmail, subject, bodyHtml, null, null);
    }

    @Override
    public boolean sendTestEmail(String toEmail) {
        log.info("📧 [EmailService] Sending live SMTP diagnostic test email to: {}", toEmail);
        String subject = "💧 DROP Water System — SMTP Diagnostic Test Email";
        String htmlContent = "<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; background:#f8fafc; padding:30px;'>" +
                "<div style='max-width:550px; margin:auto; background:#ffffff; border-radius:12px; padding:30px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05);'>" +
                "  <div style='display:inline-block; background:#10b981; color:#fff; font-size:12px; font-weight:bold; padding:4px 10px; border-radius:12px; text-transform:uppercase;'>✓ SMTP Connection Verified</div>" +
                "  <h2 style='color:#0f172a; margin:16px 0 8px;'>Real Email Delivery is Working!</h2>" +
                "  <p style='color:#475569; font-size:15px; line-height:1.6;'>This test email confirms that your SMTP mail server is correctly configured in DROP Water Management System.</p>" +
                "  <div style='background:#f1f5f9; padding:15px; border-radius:8px; font-size:13px; color:#334155; margin:20px 0;'>" +
                "    <strong>Sender:</strong> " + escapeHtml(fromEmail) + "<br>" +
                "    <strong>Recipient:</strong> " + escapeHtml(toEmail) + "<br>" +
                "    <strong>Timestamp:</strong> " + java.time.LocalDateTime.now() +
                "  </div>" +
                "  <p style='font-size:12px; color:#94a3b8; margin-top:24px;'>© 2026 DROP Water Management System</p>" +
                "</div></body></html>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ [EmailService] Test diagnostic email successfully delivered to: {}", toEmail);
            return true;
        } catch (Exception ex) {
            log.error("❌ [EmailService] SMTP Diagnostic Failed: {}", ex.getMessage(), ex);
            throw new RuntimeException("SMTP delivery failed: " + ex.getMessage(), ex);
        }
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent, String fallbackUser, String fallbackPass) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ [EmailService] Confirmation email successfully dispatched to: {}", toEmail);

        } catch (MessagingException me) {
            log.warn("⚠️ [EmailService] SMTP error while sending email to {}: {}. Falling back to console log.", toEmail, me.getMessage());
            logFallbackCredentials(toEmail, fallbackUser, fallbackPass);
        } catch (Exception ex) {
            log.warn("⚠️ [EmailService] Could not deliver email to {}: {}. (Will not fail operation)", toEmail, ex.getMessage());
            logFallbackCredentials(toEmail, fallbackUser, fallbackPass);
        }
    }

    private void logFallbackCredentials(String toEmail, String username, String password) {
        if (username != null && password != null) {
            log.info("══════════════════════════════════════════════════════════");
            log.info("🔑 [CREDENTIALS DISPATCH FALLBACK LOG]");
            log.info("   Recipient: {}", toEmail);
            log.info("   Username : {}", username);
            log.info("   Password : {}", password);
            log.info("══════════════════════════════════════════════════════════");
        }
    }

    private String buildCredentialsEmailTemplate(
            String fullName,
            String username,
            String plainPassword,
            String unitNumber,
            String apartmentName
    ) {
        String societyTitle = (apartmentName != null && !apartmentName.isBlank()) ? apartmentName : "Community Water System";
        String flatInfo = (unitNumber != null && !unitNumber.isBlank()) ? "Flat / Unit: " + unitNumber : "Resident Portal";
        String loginUrl = appUrl + "/login";

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='utf-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Welcome to DROP</title>" +
                "</head>" +
                "<body style='margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>" +
                "  <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#f1f5f9; padding: 40px 16px;'>" +
                "    <tr>" +
                "      <td align='center'>" +
                "        <table width='100%' border='0' cellspacing='0' cellpadding='0' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;'>" +
                "          <tr>" +
                "            <td style='background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 36px 32px; text-align: left;'>" +
                "              <div style='display:inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;'>" +
                "                💧 Smart Water Management" +
                "              </div>" +
                "              <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;'>" +
                "                Welcome to " + escapeHtml(societyTitle) +
                "              </h1>" +
                "              <p style='margin: 6px 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;'>" +
                "                " + escapeHtml(flatInfo) + " • Your resident account is ready" +
                "              </p>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style='padding: 36px 32px; color: #334155; font-size: 15px; line-height: 1.6;'>" +
                "              <p style='margin-top: 0; font-size: 16px; color: #0f172a; font-weight: 600;'>" +
                "                Hello " + escapeHtml(fullName) + "," +
                "              </p>" +
                "              <p style='color: #475569; margin-bottom: 24px;'>" +
                "                An administrator has registered you as a resident on the <strong>DROP Water Management Portal</strong>. You can now monitor your live smart meter consumption, view billing surcharges, review historical telemetry, and pay invoices online." +
                "              </p>" +
                "              <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; margin: 24px 0; overflow: hidden;'>" +
                "                <tr>" +
                "                  <td style='background: #f1f5f9; padding: 12px 20px; border-bottom: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;'>" +
                "                    🔑 Your Access Credentials" +
                "                  </td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style='padding: 20px;'>" +
                "                    <table width='100%' border='0' cellspacing='0' cellpadding='6'>" +
                "                      <tr>" +
                "                        <td width='35%' style='font-size: 13px; color: #64748b; font-weight: 600;'>Username:</td>" +
                "                        <td style='font-size: 15px; color: #0284c7; font-weight: 700; font-family: monospace;'>" + escapeHtml(username) + "</td>" +
                "                      </tr>" +
                "                      <tr>" +
                "                        <td width='35%' style='font-size: 13px; color: #64748b; font-weight: 600;'>Temporary Password:</td>" +
                "                        <td style='font-size: 15px; color: #0f172a; font-weight: 700; font-family: monospace; background: #e2e8f0; padding: 4px 10px; border-radius: 6px; display: inline-block;'>" + escapeHtml(plainPassword) + "</td>" +
                "                      </tr>" +
                "                      <tr>" +
                "                        <td width='35%' style='font-size: 13px; color: #64748b; font-weight: 600;'>Assigned Unit:</td>" +
                "                        <td style='font-size: 14px; color: #334155; font-weight: 600;'>" + escapeHtml(unitNumber != null ? unitNumber : "Assigned") + "</td>" +
                "                      </tr>" +
                "                    </table>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              <div style='text-align: center; margin: 32px 0 24px;'>" +
                "                <a href='" + loginUrl + "' target='_blank' style='display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);'>" +
                "                  Sign In to Resident Dashboard →" +
                "                </a>" +
                "              </div>" +
                "              <div style='background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #92400e; margin-top: 24px;'>" +
                "                <strong>🛡️ Security Advice:</strong> For your security, please update your temporary password in your account profile after logging in." +
                "              </div>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8;'>" +
                "              <p style='margin: 0 0 6px;'>© 2026 DROP Smart Water Management System. All rights reserved.</p>" +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }

    private String buildBillEmailTemplate(
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double consumptionKL,
            double totalAmount,
            String dueDate,
            String apartmentName
    ) {
        String societyTitle = (apartmentName != null && !apartmentName.isBlank()) ? apartmentName : "DROP Water";
        String billsUrl = appUrl + "/resident/bills";

        return "<!DOCTYPE html><html><body style='margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f1f5f9; padding:36px 16px;'>" +
                "  <tr><td align='center'>" +
                "    <table width='100%' cellpadding='0' cellspacing='0' style='max-width:580px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 8px 24px rgba(15,23,42,0.06);'>" +
                "      <tr><td style='background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding:28px 30px; color:#ffffff;'>" +
                "        <div style='background:rgba(255,255,255,0.2); display:inline-block; padding:4px 10px; border-radius:16px; font-size:11px; font-weight:bold; text-transform:uppercase;'>🧾 Water Consumption Invoice</div>" +
                "        <h2 style='margin:10px 0 4px; font-size:22px;'>" + escapeHtml(societyTitle) + "</h2>" +
                "        <p style='margin:0; opacity:0.9; font-size:13px;'>Invoice Cycle: " + escapeHtml(period) + " • Unit " + escapeHtml(unitNumber) + "</p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:30px; color:#334155; font-size:14px; line-height:1.6;'>" +
                "        <p style='margin-top:0;'>Hello <strong>" + escapeHtml(residentName) + "</strong>,</p>" +
                "        <p>Your monthly water consumption invoice has been generated. Here is a summary of your usage and charges:</p>" +
                "        <table width='100%' cellpadding='10' cellspacing='0' style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin:20px 0;'>" +
                "          <tr style='border-bottom:1px solid #e2e8f0;'><td><strong>Invoice Number:</strong></td><td align='right' style='font-family:monospace; font-weight:bold; color:#0284c7;'>#" + escapeHtml(invoiceNumber) + "</td></tr>" +
                "          <tr style='border-bottom:1px solid #e2e8f0;'><td><strong>Water Metered:</strong></td><td align='right'><strong>" + consumptionKL + " kL</strong> (" + String.format("%,d", (long)(consumptionKL * 1000)) + " Litres)</td></tr>" +
                "          <tr style='border-bottom:1px solid #e2e8f0;'><td><strong>Due Date:</strong></td><td align='right' style='color:#dc2626; font-weight:600;'>" + escapeHtml(dueDate) + "</td></tr>" +
                "          <tr style='background:#f1f5f9;'><td style='font-size:16px; font-weight:bold; color:#0f172a;'>Total Amount Payable:</td><td align='right' style='font-size:18px; font-weight:bold; color:#059669;'>₹" + String.format("%,.2f", totalAmount) + "</td></tr>" +
                "        </table>" +
                "        <div style='text-align:center; margin:28px 0;'>" +
                "          <a href='" + billsUrl + "' target='_blank' style='background:#0284c7; color:#ffffff; padding:12px 30px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;'>View Detailed Breakdown & Pay →</a>" +
                "        </div>" +
                "        <p style='font-size:12px; color:#64748b;'>Prompt payment helps maintain uninterrupted automated utility operations for the entire society.</p>" +
                "      </td></tr>" +
                "      <tr><td style='background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 30px; text-align:center; font-size:12px; color:#94a3b8;'>" +
                "        © 2026 DROP Water Management System" +
                "      </td></tr>" +
                "    </table>" +
                "  </td></tr>" +
                "</table></body></html>";
    }

    private String buildReminderEmailTemplate(
            String residentName,
            String unitNumber,
            String invoiceNumber,
            String period,
            double totalAmount,
            String dueDate,
            String apartmentName
    ) {
        String billsUrl = appUrl + "/resident/bills";

        return "<!DOCTYPE html><html><body style='margin:0; padding:0; background:#f1f5f9; font-family:sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='padding:36px 16px;'>" +
                "  <tr><td align='center'>" +
                "    <table width='100%' cellpadding='0' cellspacing='0' style='max-width:580px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0;'>" +
                "      <tr><td style='background:linear-gradient(135deg, #d97706 0%, #b45309 100%); padding:24px 30px; color:#ffffff;'>" +
                "        <div style='background:rgba(255,255,255,0.2); display:inline-block; padding:4px 10px; border-radius:16px; font-size:11px; font-weight:bold;'>🔔 PAYMENT DUE REMINDER</div>" +
                "        <h2 style='margin:10px 0 4px;'>Water Bill Payment Notice</h2>" +
                "        <p style='margin:0; opacity:0.9; font-size:13px;'>Unit " + escapeHtml(unitNumber) + " • Invoice #" + escapeHtml(invoiceNumber) + "</p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:28px 30px; color:#334155; font-size:14px; line-height:1.6;'>" +
                "        <p>Dear <strong>" + escapeHtml(residentName) + "</strong>,</p>" +
                "        <p>This is a friendly reminder regarding your outstanding water invoice of <strong>₹" + String.format("%,.2f", totalAmount) + "</strong> for billing cycle <strong>" + escapeHtml(period) + "</strong>.</p>" +
                "        <div style='background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:16px; margin:20px 0; color:#92400e;'>" +
                "          <strong>⚠️ Due Date: " + escapeHtml(dueDate) + "</strong><br>" +
                "          Please clear the outstanding dues to avoid late surcharges or supply restrictions." +
                "        </div>" +
                "        <div style='text-align:center; margin:24px 0;'>" +
                "          <a href='" + billsUrl + "' target='_blank' style='background:#d97706; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;'>Pay ₹" + String.format("%,.2f", totalAmount) + " Now →</a>" +
                "        </div>" +
                "      </td></tr>" +
                "    </table>" +
                "  </td></tr>" +
                "</table></body></html>";
    }

    private String buildLeakAlertTemplate(
            String residentName,
            String unitNumber,
            String severity,
            String description,
            String apartmentName
    ) {
        return "<!DOCTYPE html><html><body style='margin:0; padding:0; background:#f1f5f9; font-family:sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='padding:36px 16px;'>" +
                "  <tr><td align='center'>" +
                "    <table width='100%' cellpadding='0' cellspacing='0' style='max-width:580px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0;'>" +
                "      <tr><td style='background:linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding:24px 30px; color:#ffffff;'>" +
                "        <div style='background:rgba(255,255,255,0.2); display:inline-block; padding:4px 10px; border-radius:16px; font-size:11px; font-weight:bold;'>🚨 WATER ANOMALY ALERT</div>" +
                "        <h2 style='margin:10px 0 4px;'>Potential Leak Detected</h2>" +
                "        <p style='margin:0; opacity:0.9; font-size:13px;'>Unit " + escapeHtml(unitNumber) + " • Severity: " + escapeHtml(severity) + "</p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:28px 30px; color:#334155; font-size:14px; line-height:1.6;'>" +
                "        <p>Dear <strong>" + escapeHtml(residentName) + "</strong>,</p>" +
                "        <p>Our automated sub-meter telemetry system detected abnormal continuous water flow or a potential leak in your unit.</p>" +
                "        <div style='background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin:20px 0; color:#991b1b;'>" +
                "          <strong>Incident Details:</strong><br>" +
                "          " + escapeHtml(description) +
                "        </div>" +
                "        <p>Please inspect all faucets, flush tanks, and RO water purification units immediately to prevent resource wastage and high billing surcharges.</p>" +
                "      </td></tr>" +
                "    </table>" +
                "  </td></tr>" +
                "</table></body></html>";
    }

    private String buildResetPasswordTemplate(String fullName, String resetLink) {
        return "<!DOCTYPE html><html><body style='font-family:sans-serif; padding:20px; color:#333;'>" +
                "<h2>Password Reset Request</h2>" +
                "<p>Hello " + escapeHtml(fullName) + ",</p>" +
                "<p>We received a request to reset your password. Click the button below to set a new password:</p>" +
                "<p><a href='" + resetLink + "' style='background:#0284c7; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;'>Reset Password</a></p>" +
                "<p>If you did not request this, please ignore this email.</p>" +
                "</body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
