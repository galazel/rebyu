package com.capstone.rebyu.billing.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class PayMongoWebhookVerifier {

    @Value("${paymongo.webhook-secret:}")
    private String webhookSecret;

    @Value("${paymongo.allow-unsigned-webhooks:false}")
    private boolean allowUnsigned;

    public boolean isConfigured() {
        return webhookSecret != null && !webhookSecret.isBlank();
    }

    public boolean verify(String rawBody, String signatureHeader) {
        if (!isConfigured()) {
            if (allowUnsigned) {
                log.warn("PAYMONGO WEBHOOK SIGNATURE NOT VERIFIED: paymongo.webhook-secret is not set and "
                        + "paymongo.allow-unsigned-webhooks is on. Local testing only.");
                return true;
            }
            log.error("Rejected PayMongo webhook: paymongo.webhook-secret is not set. Set it from the "
                    + "PayMongo dashboard's webhook signing secret.");
            return false;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("Rejected PayMongo webhook: missing Paymongo-Signature header");
            return false;
        }

        Map<String, String> parts = parseSignatureHeader(signatureHeader);
        String timestamp = parts.get("t");
        String candidate = parts.getOrDefault("te", parts.get("li"));
        if (timestamp == null || candidate == null) {
            log.warn("Rejected PayMongo webhook: malformed Paymongo-Signature header");
            return false;
        }

        String expected = hmacSha256Hex(timestamp + "." + rawBody, webhookSecret);
        boolean matches = constantTimeEquals(expected, candidate);
        if (!matches) {
            log.warn("Rejected PayMongo webhook: signature mismatch");
        }
        return matches;
    }

    private Map<String, String> parseSignatureHeader(String header) {
        Map<String, String> parts = new HashMap<>();
        for (String segment : header.split(",")) {
            String[] kv = segment.split("=", 2);
            if (kv.length == 2) {
                parts.put(kv[0].trim(), kv[1].trim());
            }
        }
        return parts;
    }

    private String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            log.error("Failed to compute PayMongo webhook signature", e);
            return "";
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return false;
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }
}
