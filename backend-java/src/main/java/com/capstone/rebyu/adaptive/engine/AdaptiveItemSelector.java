package com.capstone.rebyu.adaptive.engine;

import com.capstone.rebyu.assessment.service.QuestionStem;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;

public final class AdaptiveItemSelector {

    private AdaptiveItemSelector() {
    }

    public static final String TIER_UNSEEN = "UNSEEN";
    public static final String TIER_NEW_THIS_CYCLE = "NEW_THIS_CYCLE";
    public static final String TIER_SEEN_THIS_CYCLE = "SEEN_THIS_CYCLE";
    public static final String TIER_REPEAT = "REPEAT";
    static final List<String> TIERS = List.of(TIER_UNSEEN, TIER_NEW_THIS_CYCLE, TIER_SEEN_THIS_CYCLE, TIER_REPEAT);

    public record Candidate(
            Long questionId,
            Long lessonId,
            String questionType,
            String questionText,
            IrtModel.ItemParams params,
            boolean workspace) {
    }

    public record Reason(
            Long lessonId,
            double lessonScore,
            double pKnown,
            String focus,
            String tier,
            int lessonsConsidered,
            int candidatesConsidered,
            double information,
            double theta) {
    }

    public record Selection(Candidate candidate, Reason reason) {
    }

    public record Settings(double explorationWeight, int topK, boolean softStart) {
    }

    public static Optional<Selection> select(
            AdaptiveSessionState state, List<Candidate> pool, Settings settings, Random random) {

        Set<Long> served = new HashSet<>(state.getServedQuestionIds());
        List<Set<String>> servedTokens = state.getServedStems().stream()
                .map(QuestionStem::tokens)
                .toList();

        List<Candidate> open = new ArrayList<>();
        for (Candidate candidate : pool) {
            if (served.contains(candidate.questionId())) continue;
            if (isTwinOfServed(candidate, servedTokens, state.getServedStems())) continue;
            open.add(candidate);
        }

        {
            final double theta = state.getTheta();
            double nearest = open.stream()
                    .mapToDouble(c -> Math.abs(c.params().b() - theta))
                    .min().orElse(0.0);
            List<Candidate> atLevel = open.stream()
                    .filter(c -> Math.abs(c.params().b() - theta) - nearest < 0.75)
                    .toList();
            if (!atLevel.isEmpty()) open = atLevel;
        }
        int bestRank = Integer.MAX_VALUE;
        for (Candidate c : open) bestRank = Math.min(bestRank, tierRank(tierOf(c, state)));
        if (bestRank == Integer.MAX_VALUE) return Optional.empty();
        final int rankInPlay = bestRank;
        open = open.stream().filter(c -> tierRank(tierOf(c, state)) == rankInPlay).toList();

        Map<Long, Map<String, List<Candidate>>> byLessonAndTier = new LinkedHashMap<>();
        for (Candidate candidate : open) {
            String tier = tierOf(candidate, state);
            byLessonAndTier
                    .computeIfAbsent(candidate.lessonId(), l -> new LinkedHashMap<>())
                    .computeIfAbsent(tier, t -> new ArrayList<>())
                    .add(candidate);
        }
        if (byLessonAndTier.isEmpty()) {
            return Optional.empty();
        }

        for (String tier : TIERS) {
            List<Long> lessons = byLessonAndTier.entrySet().stream()
                    .filter(e -> e.getValue().containsKey(tier))
                    .map(Map.Entry::getKey)
                    .toList();
            if (lessons.isEmpty()) continue;

            Long lessonId = chooseLesson(lessons, state, settings, random);
            List<Candidate> candidates = byLessonAndTier.get(lessonId).get(tier);
            Candidate chosen = chooseItem(candidates, state, settings, random);
            double pKnown = state.getPKnownByLesson().getOrDefault(lessonId, 0.5);
            String focus = state.getWeakLessonIds() != null && state.getWeakLessonIds().contains(lessonId)
                    ? "WEAK" : "COVERAGE";
            Reason reason = new Reason(
                    lessonId, lessonScore(lessonId, state, settings, 0.0), pKnown, focus, tier,
                    lessons.size(), candidates.size(),
                    IrtModel.information(state.getTheta(), chosen.params()), state.getTheta());
            return Optional.of(new Selection(chosen, reason));
        }
        return Optional.empty();
    }

    static int tierRank(String tier) {
        return switch (tier) {
            case TIER_UNSEEN -> 0;
            case TIER_NEW_THIS_CYCLE -> 1;
            case TIER_SEEN_THIS_CYCLE -> 2;
            default -> 3;
        };
    }

    private static String tierOf(Candidate candidate, AdaptiveSessionState state) {
        Long id = candidate.questionId();
        if (!state.getSeenQuestionIds().contains(id)) return TIER_UNSEEN;
        Set<Long> cycleSeen = state.getCycleSeenQuestionIds();
        if (cycleSeen == null || !cycleSeen.contains(id)) return TIER_NEW_THIS_CYCLE;
        if (state.getLastAttemptQuestionIds().contains(id)) return TIER_REPEAT;
        return TIER_SEEN_THIS_CYCLE;
    }

    static double typeWeight(String questionType, AdaptiveSessionState state) {
        String type = normaliseType(questionType);
        int poolTotal = state.getPoolCountByType().values().stream().mapToInt(Integer::intValue).sum();
        if (poolTotal == 0) return 1.0;
        double targetShare = (double) state.getPoolCountByType().getOrDefault(type, 0) / poolTotal;
        int servedTotal = state.getServedCountByType().values().stream().mapToInt(Integer::intValue).sum();
        double servedShare = servedTotal == 0 ? 0.0
                : (double) state.getServedCountByType().getOrDefault(type, 0) / servedTotal;
        double deficit = targetShare - servedShare;
        return Math.max(0.15, 1.0 + 3.0 * deficit);
    }

    public static String normaliseType(String questionType) {
        String t = questionType == null ? "" : questionType.trim().toUpperCase();
        return "MCQ".equals(t) ? "MULTIPLE_CHOICE" : t;
    }

    private static boolean isTwinOfServed(
            Candidate candidate, List<Set<String>> servedTokens, List<String> servedStems) {
        String stem = QuestionStem.of(candidate.questionText());
        if (stem.isEmpty()) return false;
        if (servedStems.contains(stem)) return true;
        Set<String> tokens = QuestionStem.tokens(candidate.questionText());
        for (Set<String> existing : servedTokens) {
            if (QuestionStem.sameQuestion(tokens, existing)) return true;
        }
        return false;
    }

    private static Long chooseLesson(
            List<Long> lessons, AdaptiveSessionState state, Settings settings, Random random) {
        Long best = null;
        double bestScore = Double.NEGATIVE_INFINITY;
        for (Long lessonId : lessons) {
            double score = lessonScore(lessonId, state, settings, random.nextDouble() * 0.05);
            if (score > bestScore) {
                bestScore = score;
                best = lessonId;
            }
        }
        return best;
    }

    static double lessonScore(Long lessonId, AdaptiveSessionState state, Settings settings, double noise) {
        double targetShare = targetShare(lessonId, state);
        int servedTotal = state.getServedCountByLesson().values().stream().mapToInt(Integer::intValue).sum();
        double servedShare = servedTotal == 0
                ? 0.0
                : (double) state.getServedCountByLesson().getOrDefault(lessonId, 0) / servedTotal;
        double coverageDeficit = Math.max(0.0, targetShare - servedShare);
        double pKnown = state.getPKnownByLesson().getOrDefault(lessonId, 0.5);
        double uncertainty = pKnown * (1.0 - pKnown);
        return coverageDeficit + settings.explorationWeight() * uncertainty + noise;
    }

    static double targetShare(Long lessonId, AdaptiveSessionState state) {
        Map<Long, Double> plan = state.getTargetShareByLesson();
        if (plan != null && !plan.isEmpty()) {
            return plan.getOrDefault(lessonId, 0.0);
        }
        int poolTotal = state.getPoolCountByLesson().values().stream().mapToInt(Integer::intValue).sum();
        return poolTotal == 0 ? 0.0 : (double) state.getPoolCountByLesson().getOrDefault(lessonId, 0) / poolTotal;
    }

    public static Map<Long, Double> focusPlan(
            Map<Long, Integer> poolCountByLesson, Map<Long, Double> pKnownByLesson,
            double weakShare, double weakThreshold, Set<Long> weakOut) {
        Map<Long, Double> plan = new LinkedHashMap<>();
        if (poolCountByLesson.isEmpty()) return plan;
        List<Long> weak = new ArrayList<>();
        Long weakest = null;
        double lowest = Double.POSITIVE_INFINITY;
        for (Long lessonId : poolCountByLesson.keySet()) {
            double p = pKnownByLesson.getOrDefault(lessonId, 0.5);
            if (p < weakThreshold) weak.add(lessonId);
            if (p < lowest) {
                lowest = p;
                weakest = lessonId;
            }
        }
        if (weak.isEmpty() && weakest != null) weak.add(weakest);
        if (weak.size() >= poolCountByLesson.size()) {
            return plan;
        }
        weakOut.addAll(weak);
        double weakWeight = 0.0;
        for (Long id : weak) weakWeight += 1.0 - pKnownByLesson.getOrDefault(id, 0.5);
        int restPool = 0;
        for (Map.Entry<Long, Integer> e : poolCountByLesson.entrySet()) {
            if (!weak.contains(e.getKey())) restPool += e.getValue();
        }
        for (Map.Entry<Long, Integer> e : poolCountByLesson.entrySet()) {
            Long id = e.getKey();
            if (weak.contains(id)) {
                double w = 1.0 - pKnownByLesson.getOrDefault(id, 0.5);
                plan.put(id, weakWeight > 0 ? weakShare * w / weakWeight : weakShare / weak.size());
            } else {
                plan.put(id, restPool > 0 ? (1.0 - weakShare) * e.getValue() / restPool : 0.0);
            }
        }
        return plan;
    }

    private static Candidate chooseItem(
            List<Candidate> candidates, AdaptiveSessionState state, Settings settings, Random random) {
        double theta = state.getTheta();
        List<Candidate> ranked = new ArrayList<>(candidates);

        if (settings.softStart() && state.getServedCount() == 0) {
            List<Candidate> near = ranked.stream()
                    .filter(c -> Math.abs(c.params().b() - state.getMu0()) <= 1.0)
                    .toList();
            if (!near.isEmpty()) ranked = new ArrayList<>(near);
        }

        ranked.sort(Comparator.comparingDouble(
                (Candidate c) -> IrtModel.information(theta, c.params()) * typeWeight(c.questionType(), state)).reversed());
        int k = Math.max(1, Math.min(settings.topK(), ranked.size()));
        return ranked.get(random.nextInt(k));
    }
}
