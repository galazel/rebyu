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

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(recipientEmail);
        message.setSubject("You're invited to join " + certificationTitle + " on REBYU");

        message.setText("""
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
        ));

        send(message);
    }

    /** First sign-in details for an account REBYU created, as the Cognito email used to send. */
    public void sendTemporaryPassword(String recipientEmail, String temporaryPassword, String signInUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(recipientEmail);
        message.setSubject("Your temporary password");
        message.setText("""
                Hello,

                Your REBYU account is ready.

                Username: %s
                Temporary password: %s

                Sign in here: %s
                You will be asked to choose your own password the first time you sign in.

                REBYU Team
                """.formatted(recipientEmail, temporaryPassword, signInUrl));
        send(message);
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