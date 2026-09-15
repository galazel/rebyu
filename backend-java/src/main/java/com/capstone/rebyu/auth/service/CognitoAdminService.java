package com.capstone.rebyu.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Account administration against Supabase Auth: inviting the login accounts
 * REBYU creates for people, and removing a sign-in when an account is deleted.
 *
 * <p>The name is kept from when sign-in ran on Amazon Cognito, so its callers
 * did not all have to change with the provider. The subject it deals in is now
 * the Supabase user id, stored in the same {@code users.cognito_sub} column.
 *
 * <p>Calls the Auth admin REST API with the project's secret key, which never
 * leaves the backend.
 */
@Slf4j
@Service
public class CognitoAdminService {

    private static final Pattern USER_ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F-]{36})\"");

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String authUrl;
    private final String secretKey;
    private final String siteUrl;

    public CognitoAdminService(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey,
            @Value("${app.supabase.site-url}") String siteUrl) {
        this.authUrl = stripSlash(supabaseUrl) + "/auth/v1";
        this.secretKey = secretKey;
        this.siteUrl = stripSlash(siteUrl);
    }

    /** Outcome of an institution account provisioning attempt. */
    public record ProvisionResult(boolean emailed, String cognitoSub, String note) {
    }

    /**
     * Removes the sign-in behind a subject, so a deleted account cannot come
     * back. Without this, CognitoAuthService re-provisions a User and Learner
     * for any still-valid token whose subject it does not recognise.
     *
     * <p>Best effort by design: the database rows are already gone by the time
     * this runs, and an unreachable Supabase must not undo that. A missing user
     * -- including an account last signed in through Cognito, which Supabase
     * never had -- is the desired end state, not a failure.
     */
    public void deleteAccount(String subject) {
        if (subject == null || subject.isBlank()) {
            return;
        }
        try {
            HttpResponse<String> response = http.send(
                    admin("/admin/users/" + URLEncoder.encode(subject, StandardCharsets.UTF_8)).DELETE().build(),
                    HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status == 404) {
                log.info("Sign-in for subject {} was already removed", subject);
            } else if (status >= 200 && status < 300) {
                log.info("Deleted Supabase account for subject {}", subject);
            } else {
                log.error("Supabase account for subject {} could not be deleted ({}): {}. "
                        + "The learner's data is gone, but this sign-in must be removed by hand "
                        + "or the account will be re-provisioned on next login.", subject, status, response.body());
            }
        } catch (Exception ex) {
            log.error("Supabase account for subject {} could not be deleted: {}. "
                    + "Remove this sign-in by hand in the Supabase dashboard.", subject, ex.getMessage());
        }
    }

    /**
     * Invites the login account for someone REBYU is creating an account for.
     * Supabase emails them a link; opening it signs them in on the
     * set-new-password page, where they choose their password.
     */
    public ProvisionResult createInstitutionAccount(String email, String givenName, String familyName) {
        try {
            String body = "{\"email\":" + quote(email)
                    + ",\"data\":{\"given_name\":" + quote(givenName == null ? "" : givenName)
                    + ",\"family_name\":" + quote(familyName == null ? "" : familyName) + "}}";
            String redirect = URLEncoder.encode(siteUrl + "/set-new-password", StandardCharsets.UTF_8);

            HttpResponse<String> response = http.send(
                    admin("/invite?redirect_to=" + redirect)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                Matcher id = USER_ID.matcher(response.body());
                String subject = id.find() ? id.group(1) : null;
                log.info("Invitation for a new account emailed to {}", email);
                return new ProvisionResult(true, subject,
                        "An invitation to create a password was emailed to " + email + ".");
            }
            if (status == 422 || response.body().contains("email_exists")) {
                log.info("A sign-in already exists for {}", email);
                return new ProvisionResult(false, null,
                        "An account already exists for " + email + "; no new email was sent.");
            }
            log.warn("Could not invite {} ({}): {}", email, status, response.body());
        } catch (Exception e) {
            log.warn("Could not invite {}: {}", email, e.getMessage());
        }
        return new ProvisionResult(false, null,
                "The account was saved, but the invitation email could not be sent. Send credentials manually.");
    }

    private HttpRequest.Builder admin(String path) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("SUPABASE_SECRET_KEY is not set");
        }
        return HttpRequest.newBuilder(URI.create(authUrl + path))
                .timeout(Duration.ofSeconds(20))
                .header("apikey", secretKey)
                .header("Authorization", "Bearer " + secretKey);
    }

    private static String stripSlash(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    /** A JSON string literal. */
    private static String quote(String value) {
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
}
