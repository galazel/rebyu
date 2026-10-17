package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    public enum Bucket {
        TUTOR("tutor", "AI tutor messages",
                Set.of(KIND_TUTOR_CHAT, KIND_TUTOR_DIALOGUE),
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
        if (current.daily().used() >= current.daily().limit()) {
            throw new UsageLimitException(bucket, "today", current.daily().limit(), "at midnight");
        }
        if (current.weekly().used() >= current.weekly().limit()) {
            throw new UsageLimitException(bucket, "this week", current.weekly().limit(), "on Monday");
        }
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
