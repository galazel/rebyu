package com.capstone.rebyu.adaptive.engine;

import java.util.List;

/**
 * Item response theory, three-parameter logistic form (2PL when guessing is 0).
 *
 * <p>Pure functions over doubles. Nothing here knows about questions, learners
 * or the database -- it is the mathematics that turns a run of right and wrong
 * answers on items of known difficulty into an ability estimate, and an
 * ability estimate into "which item would tell us most".
 */
public final class IrtModel {

    private IrtModel() {
    }

    /** Ability grid the posterior is integrated over: -4 .. +4 in steps of 0.1. */
    static final double GRID_MIN = -4.0;
    static final double GRID_MAX = 4.0;
    static final double GRID_STEP = 0.1;
    static final int GRID_SIZE = (int) Math.round((GRID_MAX - GRID_MIN) / GRID_STEP) + 1;

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
     * Expected a posteriori estimate of ability given every response so far,
     * under a normal prior N(mu0, sigma0^2). Integrated numerically over the
     * grid in log space, so a long run of responses cannot underflow.
     */
    public static Estimate estimateEap(double mu0, double sigma0, List<Response> responses) {
        double sigma = Math.max(sigma0, 1e-3);
        double[] logWeights = new double[GRID_SIZE];
        double maxLog = Double.NEGATIVE_INFINITY;
        for (int k = 0; k < GRID_SIZE; k++) {
            double theta = GRID_MIN + k * GRID_STEP;
            double z = (theta - mu0) / sigma;
            double logW = -0.5 * z * z;
            for (Response response : responses) {
                double p = probability(theta, response.item());
                p = clamp(p, 1e-9, 1 - 1e-9);
                logW += response.correct() ? Math.log(p) : Math.log(1.0 - p);
            }
            logWeights[k] = logW;
            if (logW > maxLog) {
                maxLog = logW;
            }
        }
        double total = 0.0;
        double mean = 0.0;
        for (int k = 0; k < GRID_SIZE; k++) {
            double w = Math.exp(logWeights[k] - maxLog);
            logWeights[k] = w;
            total += w;
            mean += w * (GRID_MIN + k * GRID_STEP);
        }
        mean /= total;
        double variance = 0.0;
        for (int k = 0; k < GRID_SIZE; k++) {
            double d = (GRID_MIN + k * GRID_STEP) - mean;
            variance += logWeights[k] * d * d;
        }
        variance /= total;
        return new Estimate(mean, Math.sqrt(Math.max(variance, 0.0)));
    }

    /**
     * Online difficulty update, Elo style: an item answered correctly by a
     * learner who "should" have missed it gets easier, and vice versa. The
     * step is scaled by how surprising the response was.
     */
    public static ItemParams updateDifficulty(ItemParams item, double thetaBefore, boolean correct, double k) {
        double p = probability(thetaBefore, item);
        double u = correct ? 1.0 : 0.0;
        double b = item.b() - k * (u - p);
        return new ItemParams(item.a(), clamp(b, -3.0, 3.0), item.c());
    }

    /** Starting parameters for an item that has never been calibrated. */
    public static ItemParams defaultParams(String difficultyLevel, boolean multipleChoice, int choiceCount) {
        double b = switch (difficultyLevel == null ? "" : difficultyLevel.trim().toUpperCase()) {
            case "EASY" -> -1.0;
            case "HARD" -> 1.0;
            default -> 0.0;
        };
        double c = 0.0;
        if (multipleChoice) {
            c = choiceCount >= 2 ? 1.0 / choiceCount : 0.25;
            c = Math.max(c, 0.2);
        }
        return new ItemParams(1.0, b, c);
    }

    public static double logit(double p) {
        double x = clamp(p, 1e-6, 1 - 1e-6);
        return Math.log(x / (1 - x));
    }

    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
