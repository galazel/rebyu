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
            boolean existingPartner,
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
        /* An institution that already has access is not being welcomed and its
           account is not "ready" -- it has been signing in for months. Same
           invoice, same link, different first line. */
        String subject = existingPartner
                ? "Your REBYU request (" + referenceNumber + ") is approved - invoice ready to pay"
                : "Welcome to REBYU, " + institutionName + " - your partnership is approved";
        String opening = existingPartner
                ? "Your request (%s) has been approved. The access below is added to what you already have."
                : "Welcome to REBYU! Your partnership request (%s) has been approved and your institution account is ready.";
        String openingHtml = existingPartner
                ? "Your request <b>" + escape(referenceNumber)
                        + "</b> has been approved. The access below is added to what you already have."
                : "Welcome to REBYU! Your partnership request <b>" + escape(referenceNumber)
                        + "</b> has been approved and your institution account is ready.";
        String accessHeading = existingPartner ? "Additional access approved" : "Certification access approved";
        String signInNote = existingPartner
                ? ""
                : "<p style=\"font-size:12px;color:#6b706c\">Your sign-in details arrive in a separate email.</p>";
        StringBuilder textLines = new StringBuilder();
        StringBuilder htmlLines = new StringBuilder();
        for (String line : lineSummaries) {
            textLines.append("  - ").append(line).append('\n');
            htmlLines.append("<li>").append(escape(line)).append("</li>");
        }
        String closing = existingPartner
                ? "Once the invoice is paid the extra slots are added to your allocation and are ready to assign."
                : "Your sign-in details are sent in a separate email. Once the invoice is paid, head to Certifications to create departments and invite your learners.";
        String text = """
                Hello %s,

                %s

                %s (activates once the invoice is paid):
                %s
                Invoice %s - amount due: %s

                View and pay your invoice online (card or GCash via PayMongo):
                %s

                %s

                REBYU Team
                """.formatted(institutionName, opening.formatted(referenceNumber), accessHeading,
                textLines, invoiceNumber, amountDue, invoiceUrl, closing);
        String html = frame("<p>Hello <b>" + escape(institutionName) + "</b>,</p>"
                + "<p>" + openingHtml + "</p>"
                + "<p style=\"margin-bottom:4px\"><b>" + accessHeading + "</b> <span style=\"color:#6b706c\">(activates once the invoice is paid)</span></p><ul style=\"margin-top:0\">" + htmlLines + "</ul>"
                + "<p>Invoice <b>" + escape(invoiceNumber) + "</b> &middot; amount due <b>" + escape(amountDue) + "</b></p>"
                + "<p><a href=\"" + invoiceUrl + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">View and pay invoice</a></p>"
                + "<p style=\"font-size:12px;color:#6b706c\">Pay by card or GCash through PayMongo from the invoice page; access switches on as soon as payment is confirmed. "
                + (existingPartner
                        ? "The extra slots join your existing allocation."
                        : "Your sign-in details arrive in a separate email. Once you are in, open Certifications to create departments and invite learners.")
                + "</p>"
                + signInNote);
        sendHtml(recipientEmail, subject, text, html);
    }

    /** Sent when a learner passes a certification's mock exam: the badge is theirs. */
    /**
     * Sent when an admin rejects a partnership request.
     *
     * The approval has had an email since the beginning; the rejection had only
     * an in-app notice, which an institution that submitted a request and then
     * closed the tab never sees -- and which a public applicant, having no
     * account yet, cannot receive at all. A decision either way is worth the
     * same message, and an unexplained "no" is the one most likely to be
     * chased, so the admin's remarks ride along when there are any.
     */
    public void sendPartnershipRejected(
            String recipientEmail,
            String institutionName,
            String referenceNumber,
            String remarks
    ) {
        String base = frontendUrl.replaceAll("/+$", "");
        String link = base + "/institution/partnership";
        String subject = "Your REBYU partnership request (" + referenceNumber + ") was not approved";
        boolean hasRemarks = remarks != null && !remarks.isBlank();
        String text = """
                Hello %s,

                Your partnership request (%s) was reviewed and could not be approved.
                %s
                You can submit a new request at any time:
                %s

                If you think this was a mistake, reply to this email and we will take another look.

                REBYU Team
                """.formatted(institutionName, referenceNumber,
                hasRemarks ? "\nReason given: " + remarks + "\n" : "", link);
        String html = frame("<p>Hello <b>" + escape(institutionName) + "</b>,</p>"
                + "<p>Your partnership request <b>" + escape(referenceNumber)
                + "</b> was reviewed and could not be approved.</p>"
                + (hasRemarks
                        ? "<p style=\"background:#f4f1ea;border-left:3px solid #c8553d;padding:10px 12px;margin:0 0 16px\">"
                                + "<b>Reason given:</b><br>" + escape(remarks) + "</p>"
                        : "")
                + "<p><a href=\"" + link + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">Submit a new request</a></p>"
                + "<p style=\"font-size:12px;color:#6b706c\">If you think this was a mistake, reply to this email and we will take another look.</p>");
        sendHtml(recipientEmail, subject, text, html);
    }

    /**
     * Sent when a partnership ends: access is already gone by the time this
     * arrives, so it says so plainly and states what happened to the money.
     */
    public void sendPartnershipCancelled(
            String recipientEmail,
            String institutionName,
            String referenceNumber,
            String refundSummary
    ) {
        String subject = "Your REBYU partnership (" + referenceNumber + ") has ended";
        String text = """
                Hello %s,

                Your partnership (%s) has been cancelled and access for your learners has been removed.

                %s

                Your invoices and payment records stay available for your accounting. If you would
                like to work with REBYU again, you can submit a new partnership request at any time.

                REBYU Team
                """.formatted(institutionName, referenceNumber, refundSummary);
        String html = frame("<p>Hello <b>" + escape(institutionName) + "</b>,</p>"
                + "<p>Your partnership <b>" + escape(referenceNumber)
                + "</b> has been cancelled and access for your learners has been removed.</p>"
                + "<p style=\"background:#f4f1ea;border-left:3px solid #2f6b4f;padding:10px 12px\">"
                + escape(refundSummary) + "</p>"
                + "<p style=\"font-size:12px;color:#6b706c\">Your invoices and payment records stay available for "
                + "your accounting. If you would like to work with REBYU again, you can submit a new partnership "
                + "request at any time.</p>");
        sendHtml(recipientEmail, subject, text, html);
    }

    /**
     * Congratulations email sent the moment the learner earns both the badge
     * and the numbered certificate. It renders a formal "Badge of Completion"
     * card inside the email body and links to the certificate page.
     */
    public void sendBadgeEarned(String recipientEmail, String learnerName, String certificationTitle,
                                String score, boolean hasBadgeImage,
                                Long certificationId, String certificateNumber,
                                java.time.LocalDateTime issuedAt) {
        String base = frontendUrl.replaceAll("/+$", "");
        String certLink = base + "/learner/certifications/" + certificationId + "/certificate";
        String badgeImgUrl = base + "/api/certifications/" + certificationId + "/badge";
        String subject = "Congratulations! You completed " + certificationTitle + " on REBYU";
        String scoreLine = score == null || score.isBlank() ? "" : " with a score of " + score;
        String dateStr = issuedAt == null ? "" : issuedAt.toLocalDate()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        String text = """
                Congratulations %s!

                You have successfully completed the %s review on REBYU%s.

                Certificate No.: %s
                Date of Completion: %s

                View your Badge of Completion:
                %s

                Well done — keep it up!

                REBYU Team
                """.formatted(learnerName, certificationTitle, scoreLine,
                certificateNumber == null ? "—" : certificateNumber,
                dateStr, certLink);

        // Badge image block — shown only when the certification has an uploaded image.
        String badgeBlock = hasBadgeImage
                ? "<div style=\"text-align:center;margin:16px 0\">"
                        + "<img src=\"" + badgeImgUrl + "\" alt=\"" + escape(certificationTitle) + " badge\""
                        + " style=\"width:100px;height:100px;border-radius:50%;border:4px solid #2f6b4f;object-fit:cover\" />"
                        + "</div>"
                : "<div style=\"width:80px;height:80px;border-radius:50%;background:#1a5c3a;margin:16px auto;"
                        + "display:flex;align-items:center;justify-content:center;font-size:30px\">✓</div>";

        String html = frame(
                // certificate card block
                "<div style=\"border:2px solid #2f6b4f;border-radius:10px;overflow:hidden;margin-bottom:20px\">"
                // green top bar
                + "<div style=\"background:linear-gradient(90deg,#1a5c3a 0%,#2d8c5e 50%,#1a5c3a 100%);height:7px\"></div>"
                // inner padded area
                + "<div style=\"padding:24px 28px;text-align:center;font-family:Georgia,'Times New Roman',serif\">"
                + "<p style=\"margin:0 0 2px;font-size:10px;font-weight:bold;letter-spacing:0.3em;color:#1a5c3a;text-transform:uppercase\">REBYU LEARNING</p>"
                // decorative dots
                + "<p style=\"margin:6px 0 10px;color:#1a5c3a;font-size:12px\">· · ·</p>"
                // title
                + "<p style=\"margin:0 0 4px;font-size:22px;font-weight:bold;color:#1a5c3a\">Badge of Completion</p>"
                + "<p style=\"margin:0 0 14px;font-size:12px;color:#6b706c;font-style:italic\">This formally acknowledges that</p>"
                // badge image
                + badgeBlock
                // name
                + "<p style=\"margin:10px 0 4px;font-size:20px;font-weight:bold;color:#111827\">" + escape(learnerName) + "</p>"
                + "<p style=\"margin:0 0 4px;font-size:12px;color:#6b706c\">has achieved the badge of completion for</p>"
                + "<p style=\"margin:0 0 16px;font-size:14px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#111827\">" + escape(certificationTitle) + "</p>"
                // score + cert number row
                + "<table style=\"width:100%;border-top:1px solid #dce8e2;margin-top:4px;padding-top:14px;font-size:11px;border-collapse:collapse\">"
                + "<tr>"
                + (score != null && !score.isBlank() ? "<td style=\"width:50%;padding:8px 4px;border-right:1px solid #dce8e2\"><span style=\"display:block;color:#6b706c;letter-spacing:0.12em;text-transform:uppercase;font-size:9px\">Score</span><b>" + escape(score) + "</b></td>" : "<td style=\"width:50%;padding:8px 4px;border-right:1px solid #dce8e2\"><span style=\"display:block;color:#6b706c;letter-spacing:0.12em;text-transform:uppercase;font-size:9px\">Date</span><b>" + escape(dateStr) + "</b></td>")
                + "<td style=\"width:50%;padding:8px 4px\"><span style=\"display:block;color:#6b706c;letter-spacing:0.12em;text-transform:uppercase;font-size:9px\">Certificate No.</span><b style=\"font-family:Consolas,Menlo,monospace\">" + escape(certificateNumber == null ? "—" : certificateNumber) + "</b></td>"
                + "</tr></table>"
                + "</div>"
                // green bottom bar
                + "<div style=\"background:linear-gradient(90deg,#1a5c3a 0%,#2d8c5e 50%,#1a5c3a 100%);height:7px\"></div>"
                + "</div>"
                // CTA
                + "<p style=\"text-align:center\">"
                + "<a href=\"" + certLink + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold;display:inline-block\">View your Badge of Completion</a>"
                + "</p>"
                + "<p style=\"font-size:12px;color:#6b706c;text-align:center;margin-top:12px\">Well done — keep it up!</p>"
        );
        sendHtml(recipientEmail, subject, text, html);
    }

    /** Sent alongside the badge email, separately: the numbered certificate of completion. */
    public void sendCertificateIssued(String recipientEmail, String learnerName, String certificationTitle,
                                      String certificateNumber, String score, java.time.LocalDateTime issuedAt,
                                      Attachment certificatePdf) {
        String base = frontendUrl.replaceAll("/+$", "");
        String link = base + "/learner/certifications";
        String date = issuedAt.toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String subject = "Your certificate of completion for " + certificationTitle;
        String text = """
                Congratulations %s!

                You completed the %s review on REBYU and passed its mock exam%s. Your certificate of completion is attached to this email as a PDF.

                Certificate number: %s
                Issued: %s

                The certificate is also shown on your certification card:
                %s

                REBYU Team
                """.formatted(learnerName, certificationTitle,
                score == null || score.isBlank() ? "" : " with a score of " + score,
                certificateNumber, date, link);
        String html = frame("<p>Congratulations <b>" + escape(learnerName) + "</b>!</p>"
                + "<p>You completed the <b>" + escape(certificationTitle) + "</b> review and passed its mock exam. "
                + "Your certificate of completion is attached as a PDF.</p>"
                + "<div style=\"border:2px solid #2f6b4f;border-radius:12px;padding:20px 24px;margin:12px 0;text-align:center\">"
                + "<p style=\"margin:0;font-size:11px;letter-spacing:0.16em;color:#6b706c\">CERTIFICATE OF COMPLETION</p>"
                + "<p style=\"margin:8px 0 0;font-size:22px;font-weight:bold\">" + escape(learnerName) + "</p>"
                + "<p style=\"margin:6px 0 0\">completed the <b>" + escape(certificationTitle) + "</b> review and passed its mock exam"
                + (score == null || score.isBlank() ? "" : " with <b>" + escape(score) + "</b>") + ".</p>"
                + "<p style=\"margin:12px 0 0;font-family:monospace\">" + escape(certificateNumber) + "</p>"
                + "<p style=\"margin:2px 0 0;font-size:12px;color:#6b706c\">Issued " + escape(date) + "</p>"
                + "</div>"
                + "<p><a href=\"" + link + "\" style=\"background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block\">View on REBYU</a></p>");
        sendHtmlWithAttachment(recipientEmail, subject, text, html, certificatePdf);
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
    /** One file riding on an email: its name, MIME type and bytes. */
    public record Attachment(String filename, String contentType, byte[] bytes) {}

    /**
     * Like {@link #sendHtml} with a file attached. Resend takes attachments
     * as base64 in the same JSON; SMTP needs a MIME multipart message.
     */
    public void sendHtmlWithAttachment(String to, String subject, String text, String html, Attachment attachment) {
        if (attachment == null) {
            sendHtml(to, subject, text, html);
            return;
        }
        String base64 = java.util.Base64.getEncoder().encodeToString(attachment.bytes());
        if (resendApiKey == null || resendApiKey.isBlank()) {
            try {
                jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper =
                        new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(text, html);
                helper.addAttachment(attachment.filename(),
                        new org.springframework.core.io.ByteArrayResource(attachment.bytes()), attachment.contentType());
                mailSender.send(message);
            } catch (jakarta.mail.MessagingException e) {
                throw new IllegalStateException("Could not build the email with its attachment", e);
            }
            return;
        }
        post("{\"from\":" + json(mailFrom)
                + ",\"to\":[" + json(to) + "]"
                + ",\"subject\":" + json(subject)
                + ",\"text\":" + json(text)
                + ",\"html\":" + json(html)
                + ",\"attachments\":[{\"filename\":" + json(attachment.filename())
                + ",\"content\":" + json(base64)
                + ",\"content_type\":" + json(attachment.contentType()) + "}]}");
    }

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