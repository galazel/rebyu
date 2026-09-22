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

/**
 * Chooses the next item. Three decisions, all made from the state and the
 * pool and nothing else:
 *
 * <ol>
 *   <li><b>Which tier, then which level</b> -- never-seen items while any
 *       remain (a retake is a fresh set), then the least recently seen; and
 *       within that tier the authored difficulty nearest the current
 *       ability, which is what makes the paper adaptive.</li>
 *   <li><b>Which lesson</b> -- the one the assessment still owes coverage to,
 *       tempered by how uncertain the learner's knowledge of it is (BKT's
 *       p(1-p) is largest at 0.5, where one more answer tells us most).</li>
 *   <li><b>Which item in it</b> -- never-seen items first, then items not on
 *       the last attempt, then anything not yet served this session; within
 *       that tier, the most informative at the current ability, drawn at
 *       random from the top few so two learners at the same ability do not
 *       always meet the same question.</li>
 * </ol>
 */
public final class AdaptiveItemSelector {

    private AdaptiveItemSelector() {
    }

    /**
     * Never met. Then met only elsewhere (a knowledge check, a skim challenge,
     * another exam). Then on an earlier attempt of this exam. Then on the
     * last attempt of this exam. A retake of the same exam repeats a question
     * only once every question the bank holds for it has been used.
     */
    /** Never met by this learner, in any assessment. */
    public static final String TIER_UNSEEN = "UNSEEN";
    /** Met in an earlier pass over the bank, not yet in this one. */
    public static final String TIER_NEW_THIS_CYCLE = "NEW_THIS_CYCLE";
    /** Met already in this pass: only when the pass cannot fill the paper. */
    public static final String TIER_SEEN_THIS_CYCLE = "SEEN_THIS_CYCLE";
    /** On the learner's last attempt of this exam: last of all. */
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
            /** WEAK when the lesson is one the exam is focusing on, COVERAGE otherwise. */
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

        /* Candidates still open this session. */
        List<Candidate> open = new ArrayList<>();
        for (Candidate candidate : pool) {
            if (served.contains(candidate.questionId())) continue;
            if (isTwinOfServed(candidate, servedTokens, state.getServedStems())) continue;
            open.add(candidate);
        }

        /* Never repeat while the bank still has questions the learner has
           not met in this pass over it: a retake is a fresh set. A pass that
           cannot fill a paper is rolled over before the session starts (see
           AdaptiveAttemptService), so within a session the tiers below the
           first two are only reached when the whole bank is smaller than the
           paper. Questions never met at all come before ones met in an
           earlier pass, and the last attempt's own items come last. */
        int bestRank = Integer.MAX_VALUE;
        for (Candidate c : open) bestRank = Math.min(bestRank, tierRank(tierOf(c, state)));
        if (bestRank == Integer.MAX_VALUE) return Optional.empty();
        final int rankInPlay = bestRank;
        open = open.stream().filter(c -> tierRank(tierOf(c, state)) == rankInPlay).toList();

        /* Within that, the level the ability calls for. Difficulty is three
           fixed points, so "most informative" is "the level nearest theta";
           a level with nothing left gives way to the next nearest, never to
           the farthest. For the first item the ability is the prior, so this
           is also the soft start: the paper opens at the prior's level. */
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

        /* Grouped by lesson and by tier. */
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

        /* Best tier available anywhere. "Do not repeat while unseen ones
           exist" outranks lesson choice: a lesson is only eligible at the
           best tier it can offer that is at least as good as what any other
           lesson offers. */
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

    /** Never seen, then new this cycle, then seen this cycle, then the last attempt's items. */
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

    /** MCQ and MULTIPLE_CHOICE are one type; everything else is its own. */
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

    /** Coverage owed to the lesson plus how much one more answer on it would tell us. */
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

    /** What the lesson is owed: the focus plan when there is one, else its share of the pool. */
    static double targetShare(Long lessonId, AdaptiveSessionState state) {
        Map<Long, Double> plan = state.getTargetShareByLesson();
        if (plan != null && !plan.isEmpty()) {
            return plan.getOrDefault(lessonId, 0.0);
        }
        int poolTotal = state.getPoolCountByLesson().values().stream().mapToInt(Integer::intValue).sum();
        return poolTotal == 0 ? 0.0 : (double) state.getPoolCountByLesson().getOrDefault(lessonId, 0) / poolTotal;
    }

    /**
     * The focus plan of a category exam: BKT names the weak lessons, and
     * they are owed {@code weakShare} of the paper between them, each in
     * proportion to how weak it is; the other lessons split what remains in
     * proportion to their bank. With no weak lesson the single weakest one
     * is the focus; with every lesson weak there is nothing to focus on and
     * the plan is plain coverage.
     */
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
            return plan; // everything is weak: cover the category
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

        /* The first item of a session is picked near the prior rather than by
           information alone, so an uncertain prior does not open with the
           hardest item in the bank. */
        if (settings.softStart() && state.getServedCount() == 0) {
            List<Candidate> near = ranked.stream()
                    .filter(c -> Math.abs(c.params().b() - state.getMu0()) <= 1.0)
                    .toList();
            if (!near.isEmpty()) ranked = new ArrayList<>(near);
        }

        /* Information alone starves the paper of variety: a guessable
           multiple-choice item carries less information than a typed one of
           the same difficulty, so left to itself the selector serves short
           answers all day. The paper should reflect the bank's mix instead --
           a type that is behind its share gets a boost, one that is ahead a
           penalty -- and information decides within that. */
        ranked.sort(Comparator.comparingDouble(
                (Candidate c) -> IrtModel.information(theta, c.params()) * typeWeight(c.questionType(), state)).reversed());
        int k = Math.max(1, Math.min(settings.topK(), ranked.size()));
        return ranked.get(random.nextInt(k));
    }
}
