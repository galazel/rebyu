package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AttemptAnswerReviewDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.ChallengeItemScoreDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.ChallengeScoreDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.DiagramElementReviewDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.ScoreComponentDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.SubQuestionAnswerReviewDto;
import com.capstone.rebyu.challenge.service.ArenaScoring;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Explains a challenge score: which parts it was built from, how much each weighs, what the
 * learner achieved on each and how many percentage points it contributed. The parts are
 * reconstructed from what grading stored; whatever they cannot account for (rounding, a
 * notation gate, an AI mark) is shown as its own line, so the parts always add up to the
 * percentage the learner was given.
 */
final class ChallengeScoreBreakdown {

    private ChallengeScoreBreakdown() {
    }

    /** One graded answer of the attempt, as the result page already describes it. */
    record Item(AttemptAnswerReviewDto review, String executionResult) {
    }

    static ChallengeScoreDto build(
            String arenaId, BigDecimal percentage, List<Item> items, Map<String, Integer> codeStrikeSettings,
            LocalDateTime startedAt, LocalDateTime submittedAt, Integer durationMinutes, ObjectMapper json) {

        BigDecimal totalPoints = items.stream()
                .map(item -> nz(item.review().points()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalPoints.signum() == 0) {
            totalPoints = BigDecimal.ONE;
        }

        List<ScoreComponentDto> components;
        String formula;
        switch (arenaId) {
            case "codestrike" -> {
                components = codeStrike(items, totalPoints, codeStrikeSettings, startedAt, submittedAt,
                        durationMinutes, json);
                formula = "Correctness, speed and efficiency are weighted as set for CodeStrike. Speed and "
                        + "efficiency only count in proportion to correctness, so a wrong answer cannot "
                        + "earn points for being fast.";
            }
            case "blueprint" -> {
                components = blueprint(items, totalPoints);
                formula = "Your diagram is compared with the model answer element by element; each element "
                        + "is worth its share of the problem. Written follow-up parts, when the problem "
                        + "has them, are marked separately and added.";
            }
            default -> {
                components = champions(items);
                formula = "Every question in the round is worth the same. Your score is the share you "
                        + "answered correctly.";
            }
        }

        BigDecimal accounted = components.stream()
                .map(ScoreComponentDto::points)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actual = nz(percentage).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gap = actual.subtract(accounted).setScale(2, RoundingMode.HALF_UP);
        if (gap.abs().compareTo(new BigDecimal("0.5")) >= 0) {
            components.add(new ScoreComponentDto(
                    "adjustment", "Other marking rules", null, null, gap,
                    gap.signum() < 0
                            ? "Deducted by rules beyond the parts above, such as the notation check or "
                                    + "an AI review of code that could not be run."
                            : "Credit from an AI review or partial-credit rule beyond the parts above."));
        } else if (gap.signum() != 0 && !components.isEmpty()) {
            // Rounding only: fold it into the largest part so the column adds up exactly.
            ScoreComponentDto largest = components.get(0);
            for (ScoreComponentDto component : components) {
                if (component.points().compareTo(largest.points()) > 0) largest = component;
            }
            int at = components.indexOf(largest);
            components.set(at, new ScoreComponentDto(largest.key(), largest.label(), largest.weightPercent(),
                    largest.achievedPercent(), largest.points().add(gap), largest.detail()));
        }

        List<ChallengeItemScoreDto> lines = new ArrayList<>();
        for (Item item : items) {
            AttemptAnswerReviewDto review = item.review();
            lines.add(new ChallengeItemScoreDto(
                    review.displayOrder(), title(review.question()), nz(review.credit()), nz(review.points()),
                    review.isCorrect(), truncate(review.feedback(), 600)));
        }
        return new ChallengeScoreDto(arenaId, formula, actual, components, lines);
    }

    // ------------------------------------------------------------------ CodeStrike

    private static List<ScoreComponentDto> codeStrike(
            List<Item> items, BigDecimal totalPoints, Map<String, Integer> settings,
            LocalDateTime startedAt, LocalDateTime submittedAt, Integer durationMinutes, ObjectMapper json) {

        double wCorrect = weight(settings, "weightCorrect", 60);
        double wSpeed = weight(settings, "weightSpeed", 20);
        double wEfficiency = weight(settings, "weightBigO", 20);
        double wTotal = Math.max(1, wCorrect + wSpeed + wEfficiency);

        double correctPts = 0, speedPts = 0, efficiencyPts = 0, aiPts = 0;
        double correctAchieved = 0, speedAchieved = 0, efficiencyAchieved = 0;
        int passedSum = 0, testSum = 0;
        Long slowest = null;
        boolean anyRun = false, anyAi = false;

        double speed = ArenaScoring.speedOf(startedAt, submittedAt, durationMinutes);
        for (Item item : items) {
            double share = nz(item.review().points()).doubleValue() / totalPoints.doubleValue();
            JsonNode run = read(json, item.executionResult());
            int total = run == null ? 0 : run.path("totalTests").asInt(0);
            if (total <= 0) {
                anyAi = true;
                aiPts += 100 * share * fraction(item.review());
                continue;
            }
            anyRun = true;
            int passed = run.path("passedTests").asInt(0);
            Long maxMs = run.hasNonNull("executionTimeMs") ? run.get("executionTimeMs").asLong() : null;
            double correctness = (double) passed / total;
            double efficiency = ArenaScoring.efficiencyOf(maxMs);
            passedSum += passed;
            testSum += total;
            if (maxMs != null && (slowest == null || maxMs > slowest)) slowest = maxMs;

            correctPts += 100 * share * wCorrect / wTotal * correctness;
            speedPts += 100 * share * wSpeed / wTotal * speed * correctness;
            efficiencyPts += 100 * share * wEfficiency / wTotal * efficiency * correctness;
            correctAchieved += share * correctness;
            speedAchieved += share * speed;
            efficiencyAchieved += share * efficiency;
        }

        List<ScoreComponentDto> parts = new ArrayList<>();
        if (anyRun) {
            parts.add(new ScoreComponentDto("correctness", "Correctness", pct(wCorrect / wTotal),
                    pct(correctAchieved), round(correctPts),
                    passedSum + " of " + testSum + (testSum == 1 ? " test" : " tests")
                            + " passed: your program's output was compared with the expected output."));
            parts.add(new ScoreComponentDto("speed", "Speed", pct(wSpeed / wTotal), pct(speedAchieved),
                    round(speedPts), speedDetail(startedAt, submittedAt, durationMinutes)));
            parts.add(new ScoreComponentDto("efficiency", "Efficiency", pct(wEfficiency / wTotal),
                    pct(efficiencyAchieved), round(efficiencyPts), efficiencyDetail(slowest)));
        }
        if (anyAi) {
            parts.add(new ScoreComponentDto("ai", "AI-marked code", null, null, round(aiPts),
                    "Code that could not be run (for example pseudocode) was marked by AI against the "
                            + "expected output; speed and efficiency do not apply to it."));
        }
        return parts;
    }

    private static String speedDetail(LocalDateTime startedAt, LocalDateTime submittedAt, Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes <= 0 || startedAt == null || submittedAt == null) {
            return "Untimed run: full speed credit.";
        }
        long used = Math.max(0, Duration.between(startedAt, submittedAt).getSeconds());
        return "You used " + clock(used) + " of " + durationMinutes + "m. Full credit if you finish within "
                + "the first half of the time limit, falling evenly to 0 at the limit.";
    }

    private static String efficiencyDetail(Long slowestMs) {
        String limits = "Full credit up to " + ArenaScoring.FAST_RUN_MS + " ms, falling evenly to 0 at "
                + String.format("%,d", ArenaScoring.SLOWEST_RUN_MS) + " ms.";
        return slowestMs == null ? "No run time was recorded, so full credit. " + limits
                : "Your program ran in " + slowestMs + " ms. " + limits;
    }

    // ------------------------------------------------------------------ Blueprint

    private static List<ScoreComponentDto> blueprint(List<Item> items, BigDecimal totalPoints) {
        Map<String, double[]> byKind = new LinkedHashMap<>(); // kind -> {points contributed, earned, max}
        double writtenPts = 0, writtenEarned = 0, writtenMax = 0;
        for (Item item : items) {
            AttemptAnswerReviewDto review = item.review();
            double points = nz(review.points()).doubleValue();
            double share = points / totalPoints.doubleValue();

            double subMax = 0, subEarned = 0;
            for (SubQuestionAnswerReviewDto sub : nonNull(review.subQuestionAnswers())) {
                subMax += nz(sub.maxPoints()).doubleValue();
                subEarned += nz(sub.earnedPoints()).doubleValue();
            }
            double diagramPart = points > 0 ? Math.max(0, points - subMax) / points : 1;

            double elementMax = 0;
            for (DiagramElementReviewDto element : nonNull(review.diagramElements())) {
                elementMax += nz(element.maxPoints()).doubleValue();
            }
            for (DiagramElementReviewDto element : nonNull(review.diagramElements())) {
                if (elementMax <= 0) break;
                String kind = label(element.kind());
                double[] acc = byKind.computeIfAbsent(kind, k -> new double[3]);
                double earned = nz(element.earnedPoints()).doubleValue();
                double max = nz(element.maxPoints()).doubleValue();
                acc[0] += 100 * share * diagramPart * earned / elementMax;
                acc[1] += earned;
                acc[2] += max;
            }
            if (subMax > 0) {
                writtenPts += 100 * share * subEarned / points;
                writtenEarned += subEarned;
                writtenMax += subMax;
            }
        }

        double allMax = byKind.values().stream().mapToDouble(v -> v[2]).sum();
        List<ScoreComponentDto> parts = new ArrayList<>();
        byKind.forEach((kind, acc) -> parts.add(new ScoreComponentDto(
                kind.toLowerCase(), kind, allMax > 0 ? pct(acc[2] / allMax) : null,
                acc[2] > 0 ? pct(acc[1] / acc[2]) : null, round(acc[0]),
                trim(acc[1]) + " of " + trim(acc[2]) + " points for " + kind.toLowerCase()
                        + " matched against the model answer.")));
        if (writtenMax > 0) {
            parts.add(new ScoreComponentDto("written", "Written parts", null, pct(writtenEarned / writtenMax),
                    round(writtenPts), trim(writtenEarned) + " of " + trim(writtenMax)
                            + " points for the follow-up questions."));
        }
        return parts;
    }

    // ------------------------------------------------------------------ Champions Cup

    private static List<ScoreComponentDto> champions(List<Item> items) {
        int correct = 0;
        for (Item item : items) {
            if (Boolean.TRUE.equals(item.review().isCorrect())) correct++;
        }
        List<ScoreComponentDto> parts = new ArrayList<>();
        int n = Math.max(1, items.size());
        parts.add(new ScoreComponentDto("correct", "Correct answers", 100, pct((double) correct / n),
                round(100.0 * correct / n),
                correct + " of " + items.size() + " questions answered correctly, each worth "
                        + trim(100.0 / n) + " points."));
        return parts;
    }

    // ------------------------------------------------------------------ helpers

    private static double fraction(AttemptAnswerReviewDto review) {
        double points = nz(review.points()).doubleValue();
        return points > 0 ? nz(review.credit()).doubleValue() / points : 0;
    }

    private static double weight(Map<String, Integer> settings, String key, int fallback) {
        Integer value = settings == null ? null : settings.get(key);
        return Math.max(0, value == null ? fallback : value);
    }

    private static JsonNode read(ObjectMapper json, String payload) {
        if (payload == null || payload.isBlank()) return null;
        try {
            return json.readTree(payload);
        } catch (Exception e) {
            return null;
        }
    }

    private static String label(String kind) {
        if (kind == null || kind.isBlank()) return "Elements";
        String words = kind.replace('_', ' ').toLowerCase();
        String plural = words.endsWith("s") ? words : words.endsWith("y") ? words.substring(0, words.length() - 1) + "ies" : words + "s";
        return Character.toUpperCase(plural.charAt(0)) + plural.substring(1);
    }

    private static String clock(long seconds) {
        return (seconds / 60) + "m " + (seconds % 60) + "s";
    }

    private static String title(String question) {
        if (question == null) return "";
        String first = question.strip().split("\\R", 2)[0];
        return truncate(first, 90);
    }

    private static String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }

    private static String trim(double value) {
        return value == Math.rint(value) ? String.valueOf((long) value) : String.format("%.1f", value);
    }

    private static Integer pct(double share) {
        return (int) Math.round(share * 100);
    }

    private static BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }
}
