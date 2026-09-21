package com.capstone.rebyu.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** The Resend API key, which is also the SMTP password. */
    @Value("${spring.mail.password:}")
    private String resendApiKey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public void sendInstitutionInvitation(
            String recipientEmail,
            String institutionName,
            String certificationTitle,
            String invitationToken
    ) {
        String invitationLink = buildInvitationLink(invitationToken);
        String subject = "You're invited to join " + certificationTitle + " on REBYU";
        String text = """
                Hello,

                %s invited you to join the %s certification review on REBYU.

                Accept your invitation here:
                %s

                This invitation link will expire in 7 days.
                Please do not share this link with anyone else.

                REBYU Team
                """.formatted(
                institutionName,
                certificationTitle,
                invitationLink
        );
        String html = frame("<p>Hello,</p>"
                + "<p><b>" + escape(institutionName) + "</b> invited you to join the <b>" + escape(certificationTitle)
                + "</b> certification review on REBYU.</p>"
                + "<p><a href=\"" + invitationLink + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">Accept invitation</a></p>"
                + "<p style=\"font-size:12px;color:#6b706c\">This link expires in 7 days. Please do not share it.</p>");
        sendHtml(recipientEmail, subject, text, html);
    }

    /**
     * The welcome sent when a partnership request is approved: what was
     * granted, what it costs, and a button to the invoice. Sign-in details
     * arrive separately (see sendTemporaryPassword / Cognito).
     */
    public void sendPartnershipWelcome(
            String recipientEmail,
            String institutionName,
            String referenceNumber,
            String invoiceNumber,
            String amountDue,
            String invoicePath,
            java.util.List<String> lineSummaries
    ) {
        String base = frontendUrl.replaceAll("/+$", "");
        String invoiceUrl = base + invoicePath;
        String subject = "Welcome to REBYU, " + institutionName + " - your partnership is approved";
        StringBuilder textLines = new StringBuilder();
        StringBuilder htmlLines = new StringBuilder();
        for (String line : lineSummaries) {
            textLines.append("  - ").append(line).append('\n');
            htmlLines.append("<li>").append(escape(line)).append("</li>");
        }
        String text = """
                Hello %s,

                Welcome to REBYU! Your partnership request (%s) has been approved and your institution account is ready.

                Certification access granted:
                %s
                Invoice %s - amount due: %s

                View your invoice here:
                %s

                Your sign-in details are sent in a separate email. Once you are in, head to Certifications to create departments and invite your learners.

                REBYU Team
                """.formatted(institutionName, referenceNumber, textLines, invoiceNumber, amountDue, invoiceUrl);
        String html = frame("<p>Hello <b>" + escape(institutionName) + "</b>,</p>"
                + "<p>Welcome to REBYU! Your partnership request <b>" + escape(referenceNumber)
                + "</b> has been approved and your institution account is ready.</p>"
                + "<p style=\"margin-bottom:4px\"><b>Certification access granted</b></p><ul style=\"margin-top:0\">" + htmlLines + "</ul>"
                + "<p>Invoice <b>" + escape(invoiceNumber) + "</b> &middot; amount due <b>" + escape(amountDue) + "</b></p>"
                + "<p><a href=\"" + invoiceUrl + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">View invoice</a></p>"
                + "<p style=\"font-size:12px;color:#6b706c\">Your sign-in details arrive in a separate email. Once you are in, open Certifications to create departments and invite learners.</p>");
        sendHtml(recipientEmail, subject, text, html);
    }

    /** First sign-in details for an account REBYU created, as the Cognito email used to send. */
    public void sendTemporaryPassword(String recipientEmail, String temporaryPassword, String signInUrl) {
        String text = """
                Hello,

                Your REBYU account is ready.

                Username: %s
                Temporary password: %s

                Sign in here: %s
                You will be asked to choose your own password the first time you sign in.

                REBYU Team
                """.formatted(recipientEmail, temporaryPassword, signInUrl);
        String html = frame("<p>Hello,</p><p>Your REBYU account is ready.</p>"
                + "<table style=\"font-size:14px;border-collapse:collapse;margin:0 0 16px\">"
                + "<tr><td style=\"color:#6b706c;padding:3px 12px 3px 0\">Username</td><td>" + escape(recipientEmail) + "</td></tr>"
                + "<tr><td style=\"color:#6b706c;padding:3px 12px 3px 0\">Temporary password</td><td style=\"font-family:Consolas,Menlo,monospace\">" + escape(temporaryPassword) + "</td></tr>"
                + "</table>"
                + "<p><a href=\"" + signInUrl + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">Sign in</a></p>"
                + "<p style=\"font-size:12px;color:#6b706c\">You will be asked to choose your own password the first time you sign in.</p>");
        sendHtml(recipientEmail, "Your temporary password", text, html);
    }

    /** The REBYU wordmark as an email header, linked to the site. */
    public String logoHeader() {
        String base = frontendUrl.replaceAll("/+$", "");
        return "<a href=\"" + base + "\" style=\"display:inline-block;margin:0 0 14px;"
                + "font-size:20px;font-weight:bold;letter-spacing:.04em;color:#2f6b4f;text-decoration:none\">REBYU</a>";
    }

    /** The standard REBYU email frame: paper, white card, logo on top, body inside. */
    public String frame(String bodyHtml) {
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f4f1ea;padding:24px\">"
                + "<div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:14px;padding:24px;color:#2c3a33\">"
                + logoHeader() + bodyHtml + "</div></div>";
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    /** An HTML email with a plain-text fallback (the text alone over SMTP). */
    public void sendHtml(String to, String subject, String text, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            return;
        }
        post("{\"from\":" + json(mailFrom)
                + ",\"to\":[" + json(to) + "]"
                + ",\"subject\":" + json(subject)
                + ",\"text\":" + json(text)
                + ",\"html\":" + json(html) + "}");
    }

    /**
     * Sends through Resend's HTTPS API when a Resend key is configured, and over
     * SMTP otherwise. Railway blocks outbound SMTP, so on the live server every
     * SMTP send failed -- the temporary-password and invitation emails never left.
     */
    private void send(SimpleMailMessage message) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            mailSender.send(message);
            return;
        }
        String to = message.getTo() == null || message.getTo().length == 0 ? "" : message.getTo()[0];
        String body = "{\"from\":" + json(message.getFrom())
                + ",\"to\":[" + json(to) + "]"
                + ",\"subject\":" + json(message.getSubject())
                + ",\"text\":" + json(message.getText()) + "}";
        post(body);
    }

    private void post(String body) {
        try {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                            .timeout(Duration.ofSeconds(15))
                            .header("Authorization", "Bearer " + resendApiKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("Resend rejected the email (" + response.statusCode() + "): "
                        + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Email sending was interrupted", e);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Could not reach Resend: " + e.getMessage(), e);
        }
    }

    private static String json(String value) {
        if (value == null) return "\"\"";
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) out.append(String.format("\\u%04x", (int) c));
                    else out.append(c);
                }
            }
        }
        return out.append('"').toString();
    }

    private String buildInvitationLink(String invitationToken) {
        if (invitationToken == null || invitationToken.isBlank()) {
            throw new IllegalArgumentException("Invitation token must not be blank.");
        }

        String cleanFrontendUrl = frontendUrl.replaceAll("/+$", "");

        return UriComponentsBuilder
                .fromUriString(cleanFrontendUrl)
                .path("/invitations/accept")
                .queryParam("token", invitationToken)
                .build()
                .encode()
                .toUriString();
    }
}