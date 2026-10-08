package com.capstone.rebyu.billing.controller;

import com.capstone.rebyu.billing.client.PayMongoWebhookVerifier;
import com.capstone.rebyu.billing.service.PaymentWebhookService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks/paymongo")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentWebhookService webhookService;
    private final PayMongoWebhookVerifier verifier;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(name = "Paymongo-Signature", required = false) String signature) {
        if (!verifier.verify(payload, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("data").path("attributes").path("type").asText();
            log.info("Received PayMongo webhook event: {}", eventType);

            switch (eventType) {
                case "checkout_session.payment.paid" ->
                    webhookService.handleCheckoutSessionPaymentPaid(
                            root.path("data").path("attributes").path("data"));
                case "charge.updated", "charge.succeeded" ->
                    webhookService.handleChargeUpdated(root.path("data"));
                case "charge.failed", "payment.failed" ->
                    webhookService.handleChargeFailed(root.path("data"));
                case "subscription.updated" ->
                    webhookService.handleSubscriptionUpdated(root.path("data"));
                case "subscription.payment.successful" ->
                    webhookService.handleSubscriptionPaymentSuccessful(root.path("data"));
                case "subscription.payment.failed" ->
                    webhookService.handleSubscriptionPaymentFailed(root.path("data"));
                default ->
                    log.warn("Unhandled PayMongo webhook event type: {}", eventType);
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error processing PayMongo webhook", e);
            return ResponseEntity.ok().build();
        }
    }
}
