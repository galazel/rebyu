package com.capstone.rebyu.billing.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PayMongoClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${paymongo.api-key:}")
    private String apiKey;

    @Value("${paymongo.secret-key:}")
    private String secretKey;

    @Value("${paymongo.enabled:false}")
    private boolean enabled;

    // Checkout Sessions live on v1; there is no v2 of this API.
    @Value("${paymongo.base-url:https://api.paymongo.com/v1}")
    private String baseUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Test mode only. A live key (sk_live_) is refused outright, so this build
     * can never take real money; checkout works whenever a test key is set.
     */
    private final java.util.Map<Long, String> lastSessionByLearner = new java.util.concurrent.ConcurrentHashMap<>();

    /** The checkout session this learner opened most recently (since the server started). */
    public String lastSessionFor(Long learnerId) {
        return lastSessionByLearner.get(learnerId);
    }

    public boolean isEnabled() {
        return secretKey != null && secretKey.trim().startsWith("sk_test_");
    }

    /** Why checkout is unavailable, for the error the learner sees. */
    public String disabledReason() {
        if (secretKey == null || secretKey.isBlank()) {
            return "Payments are not configured yet (PAYMONGO_SECRET_KEY is missing).";
        }
        if (!secretKey.trim().startsWith("sk_test_")) {
            return "Only a PayMongo test key (sk_test_...) is accepted.";
        }
        return null;
    }

    /**
     * Create a PayMongo Hosted Checkout Session.
     * Returns the checkout URL for the learner to complete payment.
     */
    public String createHostedCheckout(Long learnerId, Long planId, String planCode, long amountCents, String planName) {
        if (!isEnabled()) {
            log.warn("PayMongo is disabled; cannot create hosted checkout");
            return null;
        }
        try {
            Map<String, Object> lineItem = new HashMap<>();
            lineItem.put("currency", "PHP");
            lineItem.put("amount", amountCents);
            lineItem.put("description", planCode);
            lineItem.put("quantity", 1);
            lineItem.put("name", planName);

            Map<String, Object> attributes = new HashMap<>();
            attributes.put("line_items", new Object[]{lineItem});
            // Credit and debit cards both come under "card"; GCash is the e-wallet.
            attributes.put("payment_method_types", new String[]{"card", "gcash"});
            attributes.put("billing_name_required", true);
            // PayMongo's own payment receipt, on top of REBYU's invoice email.
            attributes.put("send_email_receipt", true);
            attributes.put("description", planName + " (test mode)");
            attributes.put("reference_number", "REBYU-" + learnerId + "-" + System.currentTimeMillis());
            // PayMongo does not fill in a {checkout_session_id} placeholder (that is
            // Stripe's), so the id came back literally and verify never found the
            // payment. The session id is remembered per learner instead; see
            // lastSessionFor.
            attributes.put("success_url", frontendUrl + "/subscription/success");
            attributes.put("cancel_url", frontendUrl + "/subscription/cancel");
            attributes.put("metadata", Map.of(
                    "learnerId", learnerId.toString(),
                    "planId", planId.toString(),
                    "planCode", planCode
            ));

            Map<String, Object> body = new HashMap<>();
            body.put("data", Map.of("attributes", attributes));

            String response = postRequest("/checkout_sessions", body);
            JsonNode root = objectMapper.readTree(response);
            String checkoutUrl = root.path("data").path("attributes").path("checkout_url").asText();
            String sessionId = root.path("data").path("id").asText();

            if (!sessionId.isBlank()) {
                lastSessionByLearner.put(learnerId, sessionId);
            }
            log.info("Created PayMongo hosted checkout: sessionId={}, learnerId={}, planCode={}",
                    sessionId, learnerId, planCode);
            return checkoutUrl;
        } catch (Exception e) {
            log.error("Failed to create PayMongo hosted checkout: {}", e.getMessage(), e);
            return null;
        }
    }

    /** A created hosted checkout: where to send the payer, and the session to verify afterwards. */
    public record HostedCheckout(String sessionId, String checkoutUrl) {}

    /**
     * Hosted Checkout for an institution invoice. Same session shape as the
     * Pro checkout, but keyed by invoice rather than learner, and it returns
     * the session id so the caller can store it on the invoice.
     */
    public HostedCheckout createInvoiceCheckout(
            String invoiceNumber, long amountCents, String description, String billingEmail,
            String successUrl, String cancelUrl, Map<String, String> metadata) {
        if (!isEnabled()) {
            log.warn("PayMongo is disabled; cannot create invoice checkout");
            return null;
        }
        try {
            Map<String, Object> lineItem = new HashMap<>();
            lineItem.put("currency", "PHP");
            lineItem.put("amount", amountCents);
            lineItem.put("description", description);
            lineItem.put("quantity", 1);
            lineItem.put("name", "Invoice " + invoiceNumber);

            Map<String, Object> attributes = new HashMap<>();
            attributes.put("line_items", new Object[]{lineItem});
            attributes.put("payment_method_types", new String[]{"card", "gcash"});
            attributes.put("billing_name_required", true);
            attributes.put("send_email_receipt", true);
            attributes.put("description", "REBYU invoice " + invoiceNumber + " (test mode)");
            attributes.put("reference_number", invoiceNumber);
            attributes.put("success_url", successUrl);
            attributes.put("cancel_url", cancelUrl);
            attributes.put("metadata", metadata);
            if (billingEmail != null && !billingEmail.isBlank()) {
                attributes.put("billing", Map.of("email", billingEmail));
            }

            Map<String, Object> body = new HashMap<>();
            body.put("data", Map.of("attributes", attributes));

            JsonNode root = objectMapper.readTree(postRequest("/checkout_sessions", body));
            String checkoutUrl = root.path("data").path("attributes").path("checkout_url").asText();
            String sessionId = root.path("data").path("id").asText();
            log.info("Created PayMongo invoice checkout: sessionId={}, invoice={}", sessionId, invoiceNumber);
            return new HostedCheckout(sessionId, checkoutUrl);
        } catch (Exception e) {
            log.error("Failed to create PayMongo invoice checkout: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Retrieve a checkout session from PayMongo.
     */
    public Map<String, Object> getCheckoutSession(String sessionId) {
        if (!isEnabled()) return null;
        try {
            String response = getRequest("/checkout_sessions/" + sessionId);
            JsonNode root = objectMapper.readTree(response);
            return objectMapper.convertValue(root.path("data"), Map.class);
        } catch (Exception e) {
            log.error("Failed to get PayMongo checkout session: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get payment status from checkout session.
     * Returns true if payment was successful.
     */
    public boolean isPaymentSuccessful(String sessionId) {
        Map<String, Object> session = getCheckoutSession(sessionId);
        if (session == null) return false;

        @SuppressWarnings("unchecked")
        Map<String, Object> attributes = (Map<String, Object>) session.get("attributes");
        if (attributes == null) return false;

        String status = (String) attributes.get("payment_status");
        if ("paid".equalsIgnoreCase(status)) return true;

        /* `payment_status` is not always there. A session that has been paid
           comes back with status "active" and no payment_status at all, but
           carries the payment itself in `payments` -- which is what actually
           happened to invoice REBYU-INV-202609-000001: PayMongo had taken the
           money and recorded pay_… as "paid", while this method kept answering
           false and the invoice sat unpaid forever. Read the payments. */
        Object rawPayments = attributes.get("payments");
        if (rawPayments instanceof List<?> payments) {
            for (Object entry : payments) {
                if (!(entry instanceof Map<?, ?> payment)) continue;
                Object paymentAttributes = payment.get("attributes");
                if (!(paymentAttributes instanceof Map<?, ?> paid)) continue;
                if ("paid".equalsIgnoreCase(String.valueOf(paid.get("status")))) return true;
            }
        }
        return false;
    }

    /** The id of the payment a paid checkout session produced, or null. */
    public String paymentIdForSession(String sessionId) {
        if (!isEnabled() || sessionId == null) return null;
        try {
            JsonNode root = objectMapper.readTree(getRequest("/checkout_sessions/" + sessionId));
            JsonNode payments = root.path("data").path("attributes").path("payments");
            for (JsonNode payment : payments) {
                String status = payment.path("attributes").path("status").asText();
                if ("paid".equalsIgnoreCase(status) || status.isBlank()) {
                    return payment.path("id").asText(null);
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to read payments of checkout session {}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    /**
     * A refund PayMongo accepted, and what it has done with it so far.
     *
     * <p>Accepting a refund is not the same as making it. Card refunds settle
     * over days and come back {@code pending} first; only {@code succeeded}
     * means the money has moved, and a pending refund can still fail.
     */
    public record Refund(String id, String status) {
        public boolean succeeded() {
            return "succeeded".equalsIgnoreCase(status);
        }

        public boolean pending() {
            return "pending".equalsIgnoreCase(status);
        }
    }

    /**
     * Refunds a payment in full (or the given amount). Returns what PayMongo
     * accepted, or null if it would not take it at all. Test-mode money, like
     * everything else this client touches.
     */
    public Refund refundPayment(String paymentId, long amountCents, String notes) {
        if (!isEnabled() || paymentId == null) return null;
        try {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("amount", amountCents);
            attributes.put("payment_id", paymentId);
            attributes.put("reason", "requested_by_customer");
            if (notes != null && !notes.isBlank()) attributes.put("notes", notes);
            String response = postRequest("/refunds", Map.of("data", Map.of("attributes", attributes)));
            JsonNode root = objectMapper.readTree(response);
            String refundId = root.path("data").path("id").asText(null);
            if (refundId == null) return null;
            String status = root.path("data").path("attributes").path("status").asText("pending");
            log.info("Refunded PayMongo payment {} ({} cents): refund {} [{}]",
                    paymentId, amountCents, refundId, status);
            return new Refund(refundId, status);
        } catch (Exception e) {
            log.error("Failed to refund PayMongo payment {}: {}", paymentId, e.getMessage());
            return null;
        }
    }

    /**
     * Re-reads a refund. What turns a {@code pending} refund into a settled
     * one in our own records, since PayMongo will not tell us unprompted.
     */
    public Refund refundStatus(String refundId) {
        if (!isEnabled() || refundId == null) return null;
        try {
            JsonNode root = objectMapper.readTree(getRequest("/refunds/" + refundId));
            String status = root.path("data").path("attributes").path("status").asText(null);
            return status == null ? null : new Refund(refundId, status);
        } catch (Exception e) {
            log.warn("Could not re-read PayMongo refund {}: {}", refundId, e.getMessage());
            return null;
        }
    }

    /**
     * Retrieve a subscription from PayMongo.
     */
    public Map<String, Object> getSubscription(String subscriptionId) {
        if (!isEnabled()) return null;
        try {
            String response = getRequest("/subscriptions/" + subscriptionId);
            JsonNode root = objectMapper.readTree(response);
            return objectMapper.convertValue(root.path("data"), Map.class);
        } catch (Exception e) {
            log.error("Failed to get PayMongo subscription: {}", e.getMessage());
            return null;
        }
    }

    /**
     * POST request with Basic Auth using secret key.
     */
    private String postRequest(String path, Object body) {
        try {
            String url = baseUrl + path;
            String auth = "Basic " + Base64.getEncoder().encodeToString((secretKey.trim() + ":").getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", auth);

            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, entity, String.class);

            log.debug("PayMongo POST {} response: {}", path, response != null ? response.substring(0, Math.min(100, response.length())) : "null");
            return response;
        } catch (RestClientException e) {
            log.error("PayMongo API error on POST {}: {}", path, e.getMessage());
            throw new RuntimeException("PayMongo API failed: " + e.getMessage(), e);
        }
    }

    /**
     * GET request with Basic Auth using secret key.
     */
    private String getRequest(String path) {
        try {
            String url = baseUrl + path;
            String auth = "Basic " + Base64.getEncoder().encodeToString((secretKey.trim() + ":").getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", auth);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            // getForObject(url) sent no headers at all, so every verify call
            // reached PayMongo unauthenticated and was refused.
            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            log.debug("PayMongo GET {} response received", path);
            return response;
        } catch (RestClientException e) {
            log.error("PayMongo API error on GET {}: {}", path, e.getMessage());
            throw new RuntimeException("PayMongo API failed: " + e.getMessage(), e);
        }
    }
}
