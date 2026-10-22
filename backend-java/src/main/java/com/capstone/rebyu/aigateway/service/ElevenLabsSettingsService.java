package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.LiveTutorSettings;
import com.capstone.rebyu.aigateway.repository.LiveTutorSettingsRepository;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import com.capstone.rebyu.billing.entity.PlanEntitlement;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ElevenLabsSettingsService {
    private final LiveTutorSettingsRepository settings;
    private final JdbcTemplate jdbc;
    private final PlanEntitlementRepository planEntitlements;
    private final SubscriptionPlanRepository plans;
    @Value("${ELEVENLABS_API_KEY:}") private String key;
    @Value("${ELEVENLABS_LIVE_TUTOR_AGENT_ID:agent_3501m5h7xxgpfxkb8z6fbcget9dt}") private String agentId;

    public LiveTutorSettings config() { return settings.findById(1L).orElseGet(LiveTutorSettings::new); }

    private RestClient client() {
        if (key == null || key.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ElevenLabs is not configured.");
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build());
        factory.setReadTimeout(Duration.ofSeconds(15));
        return RestClient.builder().baseUrl("https://api.elevenlabs.io").defaultHeader("xi-api-key", key).requestFactory(factory).build();
    }
    @SuppressWarnings("unchecked")
    private Map<String, Object> get(String path) {
        var result = client().get().uri(path).retrieve().body(Map.class);
        return result == null ? Map.of() : result;
    }
    public String signedUrl() {
        // Binding a conversation ID makes the signature single-use, preventing quota bypass by URL replay.
        Object value = get("/v1/convai/conversation/get-signed-url?include_conversation_id=true&agent_id=" + agentId).get("signed_url");
        if (!(value instanceof String url) || url.isBlank()) throw new IllegalStateException("Missing signed URL");
        return url;
    }
    public String agentId() { return agentId; }

    public Map<String, Object> overview() {
        var result = new LinkedHashMap<String, Object>();
        result.put("settings", config());
        result.put("configured", key != null && !key.isBlank());
        result.put("agentId", agentId);
        result.put("proLimits", proLimits());
        try {
            var subscription = get("/v1/user/subscription");
            if (!(subscription.get("character_count") instanceof Number) || !(subscription.get("character_limit") instanceof Number)) throw new IllegalStateException("Allowance unavailable");
            long used = number(subscription.get("character_count")), limit = number(subscription.get("character_limit"));
            var credits = new LinkedHashMap<String, Object>();
            credits.put("available", true); credits.put("used", used); credits.put("limit", limit);
            credits.put("remaining", Math.max(0, limit - used)); credits.put("tier", subscription.get("tier"));
            credits.put("resetsAt", subscription.get("next_character_count_reset_unix"));
            result.put("credits", credits);
        } catch (Exception exception) {
            result.put("credits", Map.of("available", false, "reason", "Cannot read ElevenLabs balance. Check account access and subscription-read permission."));
        }
        try {
            Object rows = get("/v1/voices").get("voices");
            var voices = new ArrayList<Map<String, Object>>();
            if (rows instanceof List<?> list) for (Object row : list) {
                if (row instanceof Map<?, ?> voice && voice.get("voice_id") instanceof String id) {
                    voices.add(Map.of("id", id, "name", Objects.toString(voice.get("name"), id), "category", Objects.toString(voice.get("category"), "")));
                }
            }
            result.put("voices", voices);
        } catch (Exception exception) {
            result.put("voices", List.of()); result.put("voicesError", "Cannot list voices. Check the key's voices-read permission.");
        }
        return result;
    }
    private static long number(Object value) { return value instanceof Number number ? number.longValue() : 0; }

    public record Update(Boolean enabled, Integer dailySessionLimit, Integer maxDurationSeconds, String voiceId,
                         Integer proDailyMessages, Integer proWeeklyMessages) {}

    private Map<String, Integer> proLimits() {
        var plan = plans.findByPlanCode("PRO_MONTHLY");
        return Map.of("dailyMessages", plan.map(p -> planEntitlements.findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(p.getSubscriptionPlanId(), Entitlements.AI_TUTOR_DAILY_MESSAGES)
                        .map(PlanEntitlement::getLimitValue).orElse(50)).orElse(50),
                "weeklyMessages", plan.map(p -> planEntitlements.findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(p.getSubscriptionPlanId(), Entitlements.AI_TUTOR_WEEKLY_MESSAGES)
                        .map(PlanEntitlement::getLimitValue).orElse(250)).orElse(250));
    }

    @Transactional
    public LiveTutorSettings update(Update request, String actor) {
        if (request == null || request.enabled() == null || request.dailySessionLimit() == null || request.dailySessionLimit() < 1 || request.dailySessionLimit() > 1000
                || request.maxDurationSeconds() == null || request.maxDurationSeconds() < 60 || request.maxDurationSeconds() > 1800
                || request.voiceId() == null || !request.voiceId().matches("[A-Za-z0-9_-]{1,100}")
                || (request.proDailyMessages() != null && (request.proDailyMessages() < 1 || request.proDailyMessages() > 100000))
                || (request.proWeeklyMessages() != null && (request.proWeeklyMessages() < 1 || request.proWeeklyMessages() > 100000))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a voice, 1–1000 daily sessions and a duration of 60–1800 seconds.");
        }
        jdbc.query("SELECT pg_advisory_xact_lock(?, ?)", (org.springframework.jdbc.core.RowCallbackHandler) row -> {}, 1279874629, 0);
        var current = config();
        var pro = plans.findByPlanCode("PRO_MONTHLY");
        if ((request.proDailyMessages() != null || request.proWeeklyMessages() != null) && pro.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The Pro plan has not been configured yet.");
        }
        // Quota-only edits remain possible even if the provider is unavailable.
        if (!current.getVoiceId().equals(request.voiceId()) || current.getMaxDurationSeconds() != request.maxDurationSeconds()) {
            try {
                get("/v1/voices/" + request.voiceId());
                client().patch().uri("/v1/convai/agents/" + agentId).body(Map.of("conversation_config", Map.of(
                        "tts", Map.of("voice_id", request.voiceId()),
                        "conversation", Map.of("max_duration_seconds", request.maxDurationSeconds())))).retrieve().toBodilessEntity();
            } catch (Exception exception) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ElevenLabs could not apply this voice/duration. Settings were not saved. Check voice access and agent-write permission.");
            }
        }
        current.setEnabled(request.enabled()); current.setDailySessionLimit(request.dailySessionLimit());
        current.setVoiceId(request.voiceId()); current.setMaxDurationSeconds(request.maxDurationSeconds());
        current.setUpdatedAt(Instant.now()); current.setUpdatedBy(actor);
        if (pro.isPresent()) {
            var changes = new LinkedHashMap<String, Integer>();
            if (request.proDailyMessages() != null) changes.put(Entitlements.AI_TUTOR_DAILY_MESSAGES, request.proDailyMessages());
            if (request.proWeeklyMessages() != null) changes.put(Entitlements.AI_TUTOR_WEEKLY_MESSAGES, request.proWeeklyMessages());
            changes.forEach((code, limit) -> {
                var entitlement = planEntitlements.findBySubscriptionPlan_SubscriptionPlanIdAndEntitlementCode(pro.get().getSubscriptionPlanId(), code)
                        .orElseGet(() -> PlanEntitlement.builder().subscriptionPlan(pro.get()).entitlementCode(code).build());
                entitlement.setEnabled(true); entitlement.setLimitValue(limit); planEntitlements.save(entitlement);
            });
        }
        return settings.save(current);
    }
}
