package com.capstone.rebyu.adaptive.engine;

import java.util.List;

public final class IrtModel {

    private IrtModel() {
    }

    public static final double THETA_MIN = -3.0;
    public static final double THETA_MAX = 3.0;
    public static final double THETA_BASELINE = 0.0;
    public static final double PRIOR_SIGMA = 1.7;
    public static final double MIN_SIGMA = 0.75;

    public static final double DIFFICULTY_EASY = -1.5;
    public static final double DIFFICULTY_AVERAGE = 0.0;
    public static final double DIFFICULTY_HARD = 1.5;

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

    public static double probability(double theta, ItemParams item) {
        double logistic = 1.0 / (1.0 + Math.exp(-item.a() * (theta - item.b())));
        return item.c() + (1.0 - item.c()) * logistic;
    }

    public static double information(double theta, ItemParams item) {
        double p = probability(theta, item);
        double q = 1.0 - p;
        if (p <= 0 || q <= 0) {
            return 0.0;
        }
        double ratio = (p - item.c()) / (1.0 - item.c());
        return item.a() * item.a() * (q / p) * ratio * ratio;
    }

    public static Estimate update(double theta, double se, ItemParams item, double score) {
        double p = probability(theta, item);
        double u = clamp(score, 0.0, 1.0);
        double sigma = Double.isNaN(se) || se <= 0 ? PRIOR_SIGMA : Math.max(se, MIN_SIGMA);
        double variance = sigma * sigma;
        double info = information(theta, item);
        double gradient = item.a() * (u - p) * (p - item.c()) / (p * (1.0 - item.c()));
        double gain = variance / (1.0 + variance * info);
        double posteriorTheta = clamp(theta + gain * gradient, THETA_MIN, THETA_MAX);
        double posteriorSigma = Math.max(MIN_SIGMA, Math.sqrt(1.0 / (1.0 / variance + info)));
        return new Estimate(posteriorTheta, posteriorSigma);
    }

    public static Estimate update(double theta, double se, ItemParams item, boolean correct) {
        return update(theta, se, item, correct ? 1.0 : 0.0);
    }

    public static double standardError(double theta, List<Response> responses) {
        double total = 1.0 / (PRIOR_SIGMA * PRIOR_SIGMA);
        for (Response response : responses) {
            total += information(theta, response.item());
        }
        return Math.max(MIN_SIGMA, 1.0 / Math.sqrt(total));
    }

    public static ItemParams defaultParams(String difficultyLevel) {
        return new ItemParams(1.0, difficultyOf(difficultyLevel), 0.0);
    }

    public static double difficultyOf(String difficultyLevel) {
        return switch (difficultyLevel == null ? "" : difficultyLevel.trim().toUpperCase()) {
            case "EASY" -> DIFFICULTY_EASY;
            case "HARD" -> DIFFICULTY_HARD;
            default -> DIFFICULTY_AVERAGE;
        };
    }


    public static double proficiencyRating(double theta) {
        double rating = ((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100.0;
        return clamp(rating, 0.0, 100.0);
    }

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
