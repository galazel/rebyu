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
            attributes.put("payment_method_types", new String[]{"card", "gcash", "paymaya"});
            attributes.put("billing_name_required", true);
            attributes.put("description", planName + " (test mode)");
            attributes.put("reference_number", "REBYU-" + learnerId + "-" + System.currentTimeMillis());
            attributes.put("success_url", frontendUrl + "/subscription/success?session_id={checkout_session_id}");
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

            log.info("Created PayMongo hosted checkout: sessionId={}, learnerId={}, planCode={}",
                    sessionId, learnerId, planCode);
            return checkoutUrl;
        } catch (Exception e) {
            log.error("Failed to create PayMongo hosted checkout: {}", e.getMessage(), e);
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
        return "paid".equalsIgnoreCase(status);
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
