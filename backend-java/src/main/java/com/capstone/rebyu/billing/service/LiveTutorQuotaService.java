package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.function.Supplier;
import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class LiveTutorQuotaService {
    public static final String KIND = AiGenerationQuotaService.KIND_TUTOR_LIVE;
    private final ElevenLabsSettingsService settings;
    private final AiGenerationQuotaService quota;

    public record Connection(String signedUrl, Long usageId) {}

    public Connection authorize(Long learnerId, Supplier<String> issueConnection) {
        if (!settings.config().isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live Tutor is temporarily disabled by an administrator.");
        settings.requireAvailableCredits();
        if (learnerId == null) return new Connection(issueConnection.get(), null); // Authenticated administrator preview only.
        Long reservation = quota.reserveTutor(learnerId, KIND);
        try {
            String signedUrl = issueConnection.get();
            String conversationId = UriComponentsBuilder.fromUriString(signedUrl).build().getQueryParams().getFirst("conversation_id");
            if (conversationId == null || !conversationId.matches("[A-Za-z0-9_-]{1,128}")) throw new IllegalStateException("The provider did not bind this signed URL to a conversation.");
            quota.bindLive(learnerId, reservation, conversationId, settings.agentId());
            return new Connection(signedUrl, reservation);
        } catch (RuntimeException failure) {
            quota.settleTutor(learnerId, reservation, false);
            throw failure;
        }
    }

    /** Browser lifecycle events only request reconciliation; billing trusts provider evidence, not the browser. */
    public Map<String, Object> reconcile(Long learnerId, Long usageId) {
        var row = quota.reservation(learnerId, usageId);
        if (Boolean.TRUE.equals(row.getProviderVerified()) || "failed-live".equals(row.getKind())) return Map.of("status", row.getKind());
        if (row.getProviderConversationId() == null || !java.util.Set.of("hold-live", KIND).contains(row.getKind())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a Live Tutor connection.");
        try {
            var report = settings.conversation(row.getProviderConversationId());
            if (!row.getProviderAgentId().equals(report.get("agent_id")) || !row.getProviderConversationId().equals(report.get("conversation_id"))) {
                throw new IllegalStateException("Provider conversation did not match the authorized connection.");
            }
            String state = String.valueOf(report.get("status"));
            boolean output = report.get("transcript") instanceof List<?> transcript && transcript.stream().anyMatch(message ->
                    message instanceof Map<?, ?> turn && "agent".equals(turn.get("role")) && turn.get("message") instanceof String text && !text.isBlank());
            if ("failed".equals(state) || ("done".equals(state) && !output)) {
                quota.settleLive(learnerId, usageId, false, true);
                return Map.of("status", "failed-live", "charged", false);
            }
            if (output) {
                quota.settleLive(learnerId, usageId, true, "done".equals(state));
                return Map.of("status", KIND, "charged", true);
            }
        } catch (org.springframework.web.client.RestClientException temporarilyUnavailable) {
            // Provider metadata can lag a newly issued conversation. Keep the slot, never invent a successful use.
        }
        if (row.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(45))) {
            boolean delivered = KIND.equals(row.getKind());
            quota.settleLive(learnerId, usageId, delivered, true);
            return Map.of("status", delivered ? KIND : "failed-live", "charged", delivered);
        }
        return Map.of("status", row.getKind(), "charged", KIND.equals(row.getKind()));
    }
}
