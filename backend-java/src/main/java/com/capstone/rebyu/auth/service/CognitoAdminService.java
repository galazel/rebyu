package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.notification.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
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
    private static final Pattern INVITED_AT = Pattern.compile("\"invited_at\":\"[^\"]+\"");
    private static final Pattern PASSWORD_SET = Pattern.compile("\"password_set\":true");

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String authUrl;
    private final String secretKey;
    private final String siteUrl;
    private final EmailService emailService;

    public CognitoAdminService(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey,
            @Value("${app.supabase.site-url}") String siteUrl,
            EmailService emailService) {
        this.emailService = emailService;
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
     * Creates the login account for someone REBYU is creating an account for,
     * the way it worked on Cognito: the account gets a temporary password,
     * REBYU emails it, and the first sign-in asks for a new one.
     *
     * <p>It used to send a Supabase invitation link instead. That link is
     * single-use and signs in only the browser that opens it, so opening it on a
     * phone (or a mail scanner opening it first) left an account with no
     * password that could not sign in anywhere else.
     *
     * <p>An address that already has a sign-in is left alone, unless it is one of
     * those invited accounts that never got a password -- that one is given a
     * temporary password now, so it can finally sign in.
     */
    public ProvisionResult createInstitutionAccount(String email, String givenName, String familyName) {
        String temporaryPassword = temporaryPassword();
        try {
            String body = "{\"email\":" + quote(email)
                    + ",\"password\":" + quote(temporaryPassword)
                    + ",\"email_confirm\":true"
                    + ",\"user_metadata\":{\"given_name\":" + quote(givenName == null ? "" : givenName)
                    + ",\"family_name\":" + quote(familyName == null ? "" : familyName)
                    + ",\"must_change_password\":true}}";

            HttpResponse<String> response = http.send(
                    admin("/admin/users")
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                Matcher id = USER_ID.matcher(response.body());
                String subject = id.find() ? id.group(1) : null;
                return emailTemporaryPassword(email, subject, temporaryPassword);
            }
            if (status == 422 || response.body().contains("email_exists")) {
                return recoverPasswordlessInvite(email);
            }
            log.warn("Could not create a sign-in for {} ({}): {}", email, status, response.body());
        } catch (Exception e) {
            log.warn("Could not create a sign-in for {}: {}", email, e.getMessage());
        }
        return new ProvisionResult(false, null,
                "The account was saved, but its sign-in could not be created. Send credentials manually.");
    }

    /**
     * Re-sends first sign-in details to an account created by invitation link
     * that never set a password. Anyone who has set their own password is left
     * alone.
     */
    public ProvisionResult recoverPasswordlessInvite(String email) {
        try {
            String user = findUserJson(email);
            if (user == null) {
                return new ProvisionResult(false, null,
                        "An account already exists for " + email + "; no new email was sent.");
            }
            Matcher id = USER_ID.matcher(user);
            String subject = id.find() ? id.group(1) : null;
            boolean invited = INVITED_AT.matcher(user).find();
            boolean passwordSet = PASSWORD_SET.matcher(user).find();
            if (subject == null || !invited || passwordSet) {
                log.info("A sign-in already exists for {}", email);
                return new ProvisionResult(false, subject,
                        "An account already exists for " + email + "; no new email was sent.");
            }

            String temporaryPassword = temporaryPassword();
            HttpResponse<String> response = http.send(
                    admin("/admin/users/" + subject)
                            .header("Content-Type", "application/json")
                            .PUT(HttpRequest.BodyPublishers.ofString("{\"password\":" + quote(temporaryPassword)
                                    + ",\"email_confirm\":true"
                                    + ",\"user_metadata\":{\"must_change_password\":true}}"))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.warn("Could not repair the invited sign-in for {} ({}): {}",
                        email, response.statusCode(), response.body());
                return new ProvisionResult(false, subject,
                        "An account already exists for " + email + " but has no password; send credentials manually.");
            }
            log.info("Invited sign-in for {} had no password; a temporary one was issued", email);
            return emailTemporaryPassword(email, subject, temporaryPassword);
        } catch (Exception e) {
            log.warn("Could not check the existing sign-in for {}: {}", email, e.getMessage());
            return new ProvisionResult(false, null,
                    "An account already exists for " + email + "; no new email was sent.");
        }
    }

    /**
     * Whether Supabase holds a sign-in for this address. Empty when Supabase
     * could not be asked, so the caller can fall back to a neutral message
     * rather than guess.
     */
    public java.util.Optional<Boolean> hasSignIn(String email) {
        try {
            return java.util.Optional.of(findUserJson(email) != null);
        } catch (Exception e) {
            log.warn("Could not look up the sign-in for {}: {}", email, e.getMessage());
            return java.util.Optional.empty();
        }
    }

    /** The admin API's user object for an address, or null. Paged; REBYU has few sign-ins. */
    private String findUserJson(String email) throws Exception {
        String wanted = "\"email\":\"" + email.trim().toLowerCase() + "\"";
        for (int page = 1; page <= 50; page++) {
            HttpResponse<String> response = http.send(
                    admin("/admin/users?per_page=200&page=" + page).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) return null;
            String compact = response.body().replaceAll("\\s+", "");
            int at = compact.toLowerCase().indexOf(wanted);
            if (at >= 0) {
                int open = compact.lastIndexOf("{\"id\":", at);
                int close = compact.indexOf("{\"id\":", at);
                return compact.substring(Math.max(open, 0), close < 0 ? compact.length() : close);
            }
            if (!compact.contains("\"id\":")) return null;
        }
        return null;
    }

    private ProvisionResult emailTemporaryPassword(String email, String subject, String temporaryPassword) {
        try {
            emailService.sendTemporaryPassword(email, temporaryPassword, siteUrl + "/login");
            log.info("Temporary password emailed to {}", email);
            return new ProvisionResult(true, subject,
                    "A temporary password was emailed to " + email + ".");
        } catch (Exception e) {
            log.warn("Sign-in created for {} but the email failed: {}", email, e.getMessage());
            return new ProvisionResult(false, subject,
                    "The sign-in was created, but the email with its temporary password could not be sent. "
                            + "Ask them to use \"Forgot password\" on the sign-in page.");
        }
    }

    /** 14 characters covering upper, lower, digit and symbol, so any password rule accepts it. */
    private static String temporaryPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnpqrstuvwxyz";
        String digits = "23456789";
        String symbols = "!@#$%*?";
        String all = upper + lower + digits + symbols;
        SecureRandom random = new SecureRandom();
        List<Character> chars = new ArrayList<>();
        for (String set : new String[]{upper, lower, digits, symbols}) {
            chars.add(set.charAt(random.nextInt(set.length())));
        }
        while (chars.size() < 14) {
            chars.add(all.charAt(random.nextInt(all.length())));
        }
        Collections.shuffle(chars, random);
        StringBuilder out = new StringBuilder();
        chars.forEach(out::append);
        return out.toString();
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
