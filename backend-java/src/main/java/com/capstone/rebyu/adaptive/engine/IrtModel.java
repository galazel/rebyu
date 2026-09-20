package com.capstone.rebyu.adaptive.engine;

import java.util.List;

/**
 * Item response theory, three-parameter logistic form (2PL when guessing is 0).
 *
 * <p>Pure functions over doubles. Nothing here knows about questions, learners
 * or the database -- it is the mathematics that turns a run of right and wrong
 * answers on items of known difficulty into an ability estimate, an ability
 * estimate into "which item would tell us most", and finally into the
 * proficiency rating the learner sees.
 *
 * <p>Two things are deliberately simple, because the platform is small:
 * <ul>
 *   <li>An item's difficulty comes from its authored level alone -- EASY,
 *       AVERAGE or HARD map to fixed points on the ability scale. There is no
 *       per-item calibration and no online drift: the bank is too thinly
 *       answered for either to mean anything, and a fixed map keeps every
 *       learner measured against the same ruler.</li>
 *   <li>Ability moves by a step after every answer -- up when right, down
 *       when wrong, scaled by how surprising the answer was -- from a
 *       baseline of zero. A step rule is the standard cold-start estimator:
 *       it needs no prior, settles in a handful of items, and every learner
 *       can see why their rating moved.</li>
 * </ul>
 */
public final class IrtModel {

    private IrtModel() {
    }

    /** The ability scale the learner-facing rating is drawn on. */
    public static final double THETA_MIN = -3.0;
    public static final double THETA_MAX = 3.0;
    /** Where every learner starts. */
    public static final double THETA_BASELINE = 0.0;
    /** How far one answer moves the estimate. */
    public static final double DEFAULT_STEP = 0.6;

    /** Where each authored difficulty level sits on the ability scale. */
    public static final double DIFFICULTY_EASY = -1.5;
    public static final double DIFFICULTY_AVERAGE = 0.0;
    public static final double DIFFICULTY_HARD = 1.5;

    /** a = discrimination, b = difficulty, c = pseudo-guessing. */
    public record ItemParams(double a, double b, double c) {
        public ItemParams {
            a = clamp(a, 0.2, 4.0);
            b = clamp(b, -4.0, 4.0);
            c = clamp(c, 0.0, 0.5);
        }
    }

    public record Estimate(double theta, double standardError) {
    }

    public record Response(ItemParams item, boolean correct) {
    }

    /** Probability of a correct response at ability {@code theta}. */
    public static double probability(double theta, ItemParams item) {
        double logistic = 1.0 / (1.0 + Math.exp(-item.a() * (theta - item.b())));
        return item.c() + (1.0 - item.c()) * logistic;
    }

    /**
     * Fisher information: how much a response to this item narrows the
     * ability estimate at {@code theta}. Peaks near the item's difficulty and
     * grows with discrimination; guessing flattens it.
     */
    public static double information(double theta, ItemParams item) {
        double p = probability(theta, item);
        double q = 1.0 - p;
        if (p <= 0 || q <= 0) {
            return 0.0;
        }
        double ratio = (p - item.c()) / (1.0 - item.c());
        return item.a() * item.a() * (q / p) * ratio * ratio;
    }

    /**
     * The step rule: ability after one more answer. The estimate moves by
     * {@code step} scaled by how surprising the response was -- {@code u - P},
     * where u is 1 for right and 0 for wrong and P the probability of a
     * right answer at the current ability. A right answer on a hard item
     * (P small) moves it most of a step up; a right answer on an item the
     * learner "should" get moves it little. The estimate never leaves the
     * scale.
     */
    public static double step(double theta, ItemParams item, boolean correct, double step) {
        double p = probability(theta, item);
        double u = correct ? 1.0 : 0.0;
        return clamp(theta + step * (u - p), THETA_MIN, THETA_MAX);
    }

    /**
     * Standard error of the estimate at {@code theta} given the items
     * answered so far: one over the root of the information they carried.
     * With nothing answered yet the estimate is as uncertain as the scale
     * is wide.
     */
    public static double standardError(double theta, List<Response> responses) {
        double total = 0.0;
        for (Response response : responses) {
            total += information(theta, response.item());
        }
        if (total <= 0) {
            return THETA_MAX - THETA_MIN;
        }
        return 1.0 / Math.sqrt(total);
    }

    /** Parameters for an item, from its authored difficulty level alone. */
    public static ItemParams defaultParams(String difficultyLevel, boolean multipleChoice, int choiceCount) {
        double c = 0.0;
        if (multipleChoice) {
            c = choiceCount >= 2 ? 1.0 / choiceCount : 0.25;
            c = Math.max(c, 0.2);
        }
        return new ItemParams(1.0, difficultyOf(difficultyLevel), c);
    }

    /** EASY -1.5, AVERAGE 0, HARD (and anything harder) +1.5. Unknown levels are average. */
    public static double difficultyOf(String difficultyLevel) {
        return switch (difficultyLevel == null ? "" : difficultyLevel.trim().toUpperCase()) {
            case "EASY" -> DIFFICULTY_EASY;
            case "HARD", "DIFFICULT" -> DIFFICULTY_HARD;
            default -> DIFFICULTY_AVERAGE;
        };
    }

    // ------------------------------------------------------------------
    // Proficiency: what the learner sees
    // ------------------------------------------------------------------

    /**
     * Ability translated onto 0..100: {@code ((theta + 3) / 6) * 100}, so the
     * baseline reads 50 and the ends of the scale read 0 and 100.
     */
    public static double proficiencyRating(double theta) {
        double rating = ((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100.0;
        return clamp(rating, 0.0, 100.0);
    }

    /** Novice below 25, Developing to 49, Proficient to 74, Advanced from 75. */
    public static String proficiencyLabel(double rating) {
        if (rating >= 75.0) return "Advanced";
        if (rating >= 50.0) return "Proficient";
        if (rating >= 25.0) return "Developing";
        return "Novice";
    }

    public static double logit(double p) {
        double x = clamp(p, 1e-6, 1 - 1e-6);
        return Math.log(x / (1 - x));
    }

    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
