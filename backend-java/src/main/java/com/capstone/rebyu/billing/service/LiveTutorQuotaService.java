package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class LiveTutorQuotaService {
    public static final String KIND = "tutor-live";
    private final AiGenerationUsageRepository usage;
    private final LearnerEntitlementService entitlements;
    private final ElevenLabsSettingsService settings;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public AiGenerationQuotaService.BucketUsage usage(Long learnerId) {
        var date = AiGenerationQuotaService.today();
        int used = (int) usage.countByLearnerIdAndKindInAndUsageDateBetween(learnerId, Set.of(KIND), date, date);
        return new AiGenerationQuotaService.BucketUsage("liveTutor", "Live Tutor sessions", new AiGenerationQuotaService.Window(
                used, settings.config().getDailySessionLimit(), date.plusDays(1).atStartOfDay()), null);
    }

    @Transactional
    public <T> T authorize(Long learnerId, Supplier<T> issueConnection) {
        if (!settings.config().isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live Tutor is temporarily disabled by an administrator.");
        if (learnerId == null) return issueConnection.get(); // Authenticated administrator preview only.
        entitlements.requireLearnerEntitlement(learnerId, Entitlements.AI_TUTOR, null);
        // Serialize check + successful issuance + debit across tabs and application replicas.
        jdbc.query("SELECT pg_advisory_xact_lock(?, ?)", (org.springframework.jdbc.core.RowCallbackHandler) row -> {}, 1279874629, learnerId.hashCode());
        var current = usage(learnerId).daily();
        if (current.used() >= current.limit()) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "You've used all " + current.limit() + " Live Tutor sessions today. Your daily allowance resets at midnight (UTC+8). You can still use available tutor chat messages.");
        T result = issueConnection.get();
        usage.save(AiGenerationUsage.builder().learnerId(learnerId).kind(KIND).usageDate(AiGenerationQuotaService.today())
                .createdAt(LocalDateTime.now()).build());
        return result;
    }
}
