package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Daily and weekly usage limits for the learner's AI features, one bucket per
 * feature family. Each use is a row in ai_generation_usage tagged with a kind;
 * a bucket counts its kinds over today and over the current Monday-start week
 * (Asia/Manila). The limits come from the learner's plan entitlements, so they
 * are editable on the admin pricing page.
 */
@Service
@RequiredArgsConstructor
public class AiGenerationQuotaService {

    public static final ZoneId LEARNER_ZONE = ZoneId.of("Asia/Manila");

    public static final String KIND_TUTOR_CHAT = "tutor-chat";
    public static final String KIND_TUTOR_DIALOGUE = "tutor-dialogue";
    public static final String KIND_TUTOR_LIVE = "tutor-live";
    private static final Map<String, String> HOLDS = Map.of(KIND_TUTOR_CHAT, "hold-chat", KIND_TUTOR_DIALOGUE, "hold-dialogue", KIND_TUTOR_LIVE, "hold-live");
    private static final Set<String> HOLD_KINDS = Set.copyOf(HOLDS.values());

    public enum Bucket {
        TUTOR("tutor", "AI uses",
                Set.of(KIND_TUTOR_CHAT, KIND_TUTOR_DIALOGUE, KIND_TUTOR_LIVE),
                Entitlements.AI_TUTOR_DAILY_MESSAGES, Entitlements.DEFAULT_DAILY_TUTOR_MESSAGES,
                Entitlements.AI_TUTOR_WEEKLY_MESSAGES, Entitlements.DEFAULT_WEEKLY_TUTOR_MESSAGES),
        STUDY_AIDS("studyAids", "Flashcard & quiz generations",
                Set.of("quiz", "flashcard"),
                Entitlements.AI_TUTOR_DAILY_GENERATIONS, Entitlements.DEFAULT_DAILY_AI_GENERATIONS,
                Entitlements.AI_TUTOR_WEEKLY_GENERATIONS, Entitlements.DEFAULT_WEEKLY_AI_GENERATIONS);

        private final String key;
        private final String label;
        private final Set<String> kinds;
        private final String dailyCode;
        private final int dailyDefault;
        private final String weeklyCode;
        private final int weeklyDefault;

        Bucket(String key, String label, Set<String> kinds, String dailyCode, int dailyDefault,
               String weeklyCode, int weeklyDefault) {
            this.key = key;
            this.label = label;
            this.kinds = kinds;
            this.dailyCode = dailyCode;
            this.dailyDefault = dailyDefault;
            this.weeklyCode = weeklyCode;
            this.weeklyDefault = weeklyDefault;
        }

        public Set<String> kinds() {
            return kinds;
        }
    }

    public record Window(int used, int limit, LocalDateTime resetsAt) {}

    public record BucketUsage(String key, String label, Window daily, Window weekly) {}

    private final AiGenerationUsageRepository usage;
    private final LearnerEntitlementService entitlements;
    private final JdbcTemplate jdbc;

    public static LocalDate today() {
        return LocalDate.now(LEARNER_ZONE);
    }

    private static LocalDate weekStart() {
        return today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private int count(Long learnerId, Bucket bucket, LocalDate from) {
        return (int) usage.countByLearnerIdAndKindInAndUsageDateBetween(learnerId, bucket.kinds, from, today());
    }

    @Transactional(readOnly = true)
    public BucketUsage usage(Long learnerId, Bucket bucket) {
        int dailyLimit = entitlements.planLimit(learnerId, bucket.dailyCode, bucket.dailyDefault);
        int weeklyLimit = entitlements.planLimit(learnerId, bucket.weeklyCode, bucket.weeklyDefault);
        return new BucketUsage(bucket.key, bucket.label,
                new Window(count(learnerId, bucket, today()), dailyLimit, today().plusDays(1).atStartOfDay()),
                new Window(count(learnerId, bucket, weekStart()), weeklyLimit, weekStart().plusWeeks(1).atStartOfDay()));
    }

    /** Every bucket for one learner, or none when the plan has no AI access. */
    @Transactional(readOnly = true)
    public List<BucketUsage> usage(Long learnerId) {
        if (!entitlements.getEffectiveEntitlements(learnerId, null).features().contains(Entitlements.AI_TUTOR)) {
            return List.of();
        }
        // Only the tutor bucket: every learner AI task is a tutor message now, and each
        // bucket costs ~8 database round trips. STUDY_AIDS is still enforced on generate.
        return List.of(usage(learnerId, Bucket.TUTOR));
    }

    @Transactional(readOnly = true)
    public int usedToday(Long learnerId) {
        return count(learnerId, Bucket.STUDY_AIDS, today());
    }

    /** Study-aid (flashcard and quiz) generation, kept for existing callers. */
    @Transactional(readOnly = true)
    public void requireAvailable(Long learnerId) {
        requireAvailable(learnerId, Bucket.STUDY_AIDS);
    }

    @Transactional(readOnly = true)
    public void requireAvailable(Long learnerId, Bucket bucket) {
        entitlements.requireLearnerEntitlement(learnerId, Entitlements.AI_TUTOR, null);
        BucketUsage current = usage(learnerId, bucket);
        if (current.daily().used() + (bucket == Bucket.TUTOR ? held(learnerId, today()) : 0) >= current.daily().limit()) {
            throw new UsageLimitException(bucket, "today", current.daily().limit(), "at midnight");
        }
        if (current.weekly().used() + (bucket == Bucket.TUTOR ? held(learnerId, weekStart()) : 0) >= current.weekly().limit()) {
            throw new UsageLimitException(bucket, "this week", current.weekly().limit(), "on Monday");
        }
    }

    private int held(Long learnerId, LocalDate from) {
        return (int) usage.countByLearnerIdAndKindInAndUsageDateBetweenAndCreatedAtAfter(
                learnerId, HOLD_KINDS, from, today(), LocalDateTime.now().minusMinutes(45));
    }

    /** An in-flight slot prevents parallel bypass but is not displayed as a used allowance. */
    @Transactional
    public Long reserveTutor(Long learnerId, String kind) {
        if (!HOLDS.containsKey(kind)) throw new IllegalArgumentException("Unsupported tutor usage kind");
        lock(learnerId);
        requireAvailable(learnerId, Bucket.TUTOR);
        return usage.saveAndFlush(AiGenerationUsage.builder().learnerId(learnerId).kind(HOLDS.get(kind))
                .usageDate(today()).createdAt(LocalDateTime.now()).build()).getAiGenerationUsageId();
    }

    private void lock(Long learnerId) {
        jdbc.query("SELECT pg_advisory_xact_lock(?, ?)", (org.springframework.jdbc.core.RowCallbackHandler) row -> {}, 1279874629, learnerId.hashCode());
    }

    @Transactional(readOnly = true)
    public AiGenerationUsage reservation(Long learnerId, Long id) {
        var row = usage.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI request not found."));
        if (!java.util.Objects.equals(row.getLearnerId(), learnerId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This AI request belongs to another learner.");
        return row;
    }

    @Transactional
    public void bindLive(Long learnerId, Long id, String conversationId, String agentId) {
        lock(learnerId);
        var row = reservation(learnerId, id);
        if (!"hold-live".equals(row.getKind()) || row.getProviderConversationId() != null) throw new IllegalStateException("AI connection is already bound.");
        row.setProviderConversationId(conversationId); row.setProviderAgentId(agentId); row.setProviderVerified(false);
        usage.save(row);
    }

    /** Server-owned stream lifecycle only; a client cannot declare its own success/failure. */
    @Transactional
    public void settleTutor(Long learnerId, Long id, boolean success) {
        lock(learnerId);
        var row = reservation(learnerId, id);
        String kind = HOLDS.entrySet().stream().filter(entry -> entry.getValue().equals(row.getKind())).map(Map.Entry::getKey).findFirst().orElse(null);
        if (kind == null) return; // Idempotent; a failed request can never become a paid success later.
        row.setKind(success ? kind : "failed-" + kind.substring("tutor-".length()));
        usage.save(row);
    }

    /** Only provider-verified live lifecycle may undo a previously acknowledged live use. */
    @Transactional
    public void settleLive(Long learnerId, Long id, boolean success, boolean terminal) {
        lock(learnerId);
        var row = reservation(learnerId, id);
        if (!Set.of("hold-live", KIND_TUTOR_LIVE).contains(row.getKind()) || Boolean.TRUE.equals(row.getProviderVerified())) return;
        row.setKind(success ? KIND_TUTOR_LIVE : "failed-live");
        row.setProviderVerified(terminal);
        usage.save(row);
    }

    @Transactional(readOnly = true)
    public List<AiGenerationUsage> pendingLiveVerifications() {
        return usage.findTop10ByKindInAndProviderVerifiedFalseAndProviderConversationIdIsNotNullOrderByCreatedAtAsc(Set.of("hold-live", KIND_TUTOR_LIVE));
    }

    /** One shared, serialized allowance across chat, dialogue and live sessions.
     * Successful issuance/delivery costs one use; failed suppliers do not debit. */
    @Transactional
    public <T> T authorizeTutor(Long learnerId, String kind, Supplier<T> operation) {
        if (!Bucket.TUTOR.kinds.contains(kind)) throw new IllegalArgumentException("Unsupported tutor usage kind");
        lock(learnerId);
        requireAvailable(learnerId, Bucket.TUTOR);
        T result = operation.get();
        record(learnerId, kind);
        return result;
    }

    /** Prefix of the rows that note which tutor tool was used. They are not in any
     *  bucket's kinds, so they show in the breakdown without counting toward a limit. */
    public static final String TOOL_PREFIX = "tool:";

    public void recordTool(Long learnerId, String widgetType) {
        if (learnerId == null || widgetType == null || widgetType.isBlank()) return;
        String kind = TOOL_PREFIX + widgetType;
        record(learnerId, kind.length() > 20 ? kind.substring(0, 20) : kind);
    }

    public record Breakdown(Map<String, Long> today, Map<String, Long> week,
                            List<Map<String, Object>> days) {}

    /** What the learner's AI use was spent on, today and this week, plus the last 7 days. */
    public Breakdown breakdown(Long learnerId) {
        LocalDate today = today();
        LocalDate from = weekStart().isBefore(today.minusDays(6)) ? weekStart() : today.minusDays(6);
        List<AiGenerationUsage> rows = usage.findByLearnerIdAndUsageDateBetween(learnerId, from, today);
        Map<String, Long> day = new java.util.TreeMap<>();
        Map<String, Long> week = new java.util.TreeMap<>();
        Map<LocalDate, Long> perDay = new java.util.TreeMap<>();
        for (AiGenerationUsage row : rows) {
            if (row.getKind().startsWith("hold-") || row.getKind().startsWith("failed-")) continue;
            if (row.getUsageDate().equals(today)) day.merge(row.getKind(), 1L, Long::sum);
            if (!row.getUsageDate().isBefore(weekStart())) week.merge(row.getKind(), 1L, Long::sum);
            if (Bucket.TUTOR.kinds.contains(row.getKind()) && !row.getUsageDate().isBefore(today.minusDays(6))) {
                perDay.merge(row.getUsageDate(), 1L, Long::sum);
            }
        }
        List<Map<String, Object>> days = new java.util.ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            days.add(Map.of("date", date.toString(), "messages", perDay.getOrDefault(date, 0L)));
        }
        return new Breakdown(day, week, days);
    }

    @Transactional
    public void record(Long learnerId, String kind) {
        usage.save(AiGenerationUsage.builder()
                .learnerId(learnerId)
                .kind(kind)
                .usageDate(today())
                .createdAt(LocalDateTime.now())
                .build());
    }

    public static class UsageLimitException extends PremiumAccessRequiredException {
        private final String message;

        public UsageLimitException(Bucket bucket, String period, int limit, String resets) {
            super(bucket.dailyCode);
            this.message = "You have used all " + limit + " " + bucket.label.toLowerCase()
                    + " for " + period + ". They reset " + resets + ".";
        }

        @Override
        public String getMessage() {
            return message;
        }

        @Override
        public String getCode() {
            return "USAGE_LIMIT_REACHED";
        }
    }
}
