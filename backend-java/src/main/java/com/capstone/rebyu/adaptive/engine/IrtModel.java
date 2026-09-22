package com.capstone.rebyu.adaptive.engine;

import java.util.List;

/**
 * Item response theory, mixed format: the two-parameter logistic model for
 * the objective items (multiple choice, short answer, ...), which are right
 * or wrong, and its partial-credit form for written, coded and drawn answers,
 * which are marked on a scale. Both share one ability scale and one step
 * rule; they differ only in what the response is -- 1 or 0, or the share
 * earned. The guessing term {@code c} is kept in the formula for
 * completeness but every item is served with it at zero.
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
 *   <li>Ability is a Gaussian belief -- a mean and a standard error --
 *       updated after every answer from a baseline of zero. Each answer
 *       moves the mean by the surprise (right or wrong against what the
 *       belief predicted) scaled by the belief's own uncertainty, and
 *       narrows the uncertainty by the information the item carried. This
 *       is the one-step Newton form of the Bayesian (EAP) estimate: the
 *       first answers move the estimate a whole level, the tenth barely
 *       nudges it, and no answer is ever weighed alone.</li>
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
    /**
     * How uncertain the baseline is: the prior standard deviation. Set to the
     * spacing between adjacent difficulty levels, so one confident answer on
     * a level-matched item moves the estimate about one level.
     */
    public static final double PRIOR_SIGMA = 1.7;
    /**
     * The estimate never becomes so sure that a run of surprises cannot move
     * it: the standard error floors here, half a level. At the floor a run
     * of about five surprising answers crosses one level; one does not.
     */
    public static final double MIN_SIGMA = 0.75;

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

    public record Response(ItemParams item, double score) {
        public Response(ItemParams item, boolean correct) {
            this(item, correct ? 1.0 : 0.0);
        }
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
     * The ability belief after one response: mean and standard error.
     *
     * <p>The prior is N(theta, se^2). A right answer on an item the learner
     * was unlikely to get moves the mean most; one they "should" have got
     * moves it little; and the whole move is scaled by the prior variance --
     * a wide belief moves freely, a narrow one resists. The posterior
     * variance is the prior's narrowed by the item's information, so each
     * answer makes the next one count for less. Objective items respond 1 or
     * 0; a written, coded or drawn answer responds with the share it earned,
     * and since P is also the expected share, {@code score - P} is still the
     * surprise. The mean never leaves the scale; the standard error never
     * drops below {@link #MIN_SIGMA}.
     */
    public static Estimate update(double theta, double se, ItemParams item, double score) {
        double p = probability(theta, item);
        double u = clamp(score, 0.0, 1.0);
        double sigma = Double.isNaN(se) || se <= 0 ? PRIOR_SIGMA : Math.max(se, MIN_SIGMA);
        double variance = sigma * sigma;
        double info = information(theta, item);
        /* Gradient of the log-likelihood in theta, in the 3PL general form;
           with c = 0 it is a(u - p). */
        double gradient = item.a() * (u - p) * (p - item.c()) / (p * (1.0 - item.c()));
        double gain = variance / (1.0 + variance * info);
        double posteriorTheta = clamp(theta + gain * gradient, THETA_MIN, THETA_MAX);
        double posteriorSigma = Math.max(MIN_SIGMA, Math.sqrt(1.0 / (1.0 / variance + info)));
        return new Estimate(posteriorTheta, posteriorSigma);
    }

    /** {@link #update(double, double, ItemParams, double)} for a right-or-wrong response. */
    public static Estimate update(double theta, double se, ItemParams item, boolean correct) {
        return update(theta, se, item, correct ? 1.0 : 0.0);
    }

    /**
     * Standard error of the estimate at {@code theta} given the items
     * answered so far: the prior's precision plus the information they
     * carried, inverted. With nothing answered yet it is the prior's.
     */
    public static double standardError(double theta, List<Response> responses) {
        double total = 1.0 / (PRIOR_SIGMA * PRIOR_SIGMA);
        for (Response response : responses) {
            total += information(theta, response.item());
        }
        return Math.max(MIN_SIGMA, 1.0 / Math.sqrt(total));
    }

    /**
     * Parameters for an item, from its authored difficulty level alone: unit
     * discrimination, difficulty from the level, no guessing (2PL).
     */
    public static ItemParams defaultParams(String difficultyLevel) {
        return new ItemParams(1.0, difficultyOf(difficultyLevel), 0.0);
    }

    /** EASY -1.5, AVERAGE 0, HARD +1.5. Unknown levels are average. */
    public static double difficultyOf(String difficultyLevel) {
        return switch (difficultyLevel == null ? "" : difficultyLevel.trim().toUpperCase()) {
            case "EASY" -> DIFFICULTY_EASY;
            case "HARD" -> DIFFICULTY_HARD;
            default -> DIFFICULTY_AVERAGE;
        };
    }

    // Proficiency: what the learner sees

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
