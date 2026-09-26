package com.capstone.rebyu.challenge.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * CodeStrike's weighted score for one problem: correctness, speed and
 * efficiency, mixed by the admin's weights.
 *
 * <p>Each part is a fraction from 0 to 1, and only what can actually be
 * measured goes in:
 * <ul>
 *   <li><b>Correctness</b> -- tests passed out of tests run.
 *   <li><b>Speed</b> -- how much of the run's time limit the learner used. Full
 *       marks for finishing within half of it, falling to zero at the limit.
 *       It is a run-wide figure, not per problem: a CodeStrike run is one
 *       paper the learner moves about freely, so there is no honest per-problem
 *       solve time to read. An untimed run has no limit to measure against and
 *       scores full speed.
 *   <li><b>Efficiency</b> (the "complexity" weight) -- the program's slowest
 *       runtime across the tests. Full marks up to {@link #FAST_MS}, falling to
 *       zero at Judge0's CPU limit. A runtime proxy, not a Big-O proof: it
 *       separates a quadratic solution from a linear one only when the tests
 *       include an input large enough to show the difference.
 * </ul>
 *
 * <p>Speed and efficiency are multiplied by correctness. A fast program that
 * fails every test is not a fast solution, and should not bank 40% for it.
 */
public final class ArenaScoring {

  /** A runtime at or under this is full efficiency: interpreter start-up and small inputs. */
  static final long FAST_MS = 250;

  /** Judge0's per-test CPU limit (Judge0Properties default); a run this slow scores zero. */
  static final long SLOWEST_MS = 5000;

  private ArenaScoring() {}

  public record Breakdown(
      BigDecimal fraction, double correctness, double speed, double efficiency, String summary) {}

  public static Breakdown codeStrike(
      Map<String, Integer> settings,
      int passed,
      int total,
      Long maxTimeMs,
      LocalDateTime startedAt,
      LocalDateTime finishedAt,
      Integer durationMinutes) {

    double correctness = total > 0 ? (double) passed / total : 0;
    double speed = speed(startedAt, finishedAt, durationMinutes);
    double efficiency = efficiency(maxTimeMs);

    double wCorrect = weight(settings, "weightCorrect", 60);
    double wSpeed = weight(settings, "weightSpeed", 20);
    double wEfficiency = weight(settings, "weightBigO", 20);
    double wTotal = wCorrect + wSpeed + wEfficiency;
    if (wTotal <= 0) {
      // Unreachable through the settings endpoint (weights must total 100);
      // fall back to correctness alone rather than dividing by zero.
      wCorrect = 1;
      wSpeed = 0;
      wEfficiency = 0;
      wTotal = 1;
    }

    double fraction =
        (wCorrect * correctness + (wSpeed * speed + wEfficiency * efficiency) * correctness) / wTotal;

    String summary = String.format(
        "Scored on correctness %d/%d (%d%% weight), speed %d%% (%d%% weight) and efficiency %d%%%s (%d%% weight).",
        passed, total, Math.round(wCorrect * 100 / wTotal),
        Math.round(speed * 100), Math.round(wSpeed * 100 / wTotal),
        Math.round(efficiency * 100),
        maxTimeMs == null ? "" : ", slowest test " + maxTimeMs + " ms",
        Math.round(wEfficiency * 100 / wTotal));

    return new Breakdown(
        BigDecimal.valueOf(fraction).setScale(4, RoundingMode.HALF_UP),
        correctness, speed, efficiency, summary);
  }

  static double speed(LocalDateTime startedAt, LocalDateTime finishedAt, Integer durationMinutes) {
    if (durationMinutes == null || durationMinutes <= 0 || startedAt == null || finishedAt == null) {
      return 1;
    }
    double used = Duration.between(startedAt, finishedAt).toMillis() / (durationMinutes * 60_000.0);
    if (used <= 0.5) return 1;
    return clamp((1 - used) / 0.5);
  }

  static double efficiency(Long maxTimeMs) {
    if (maxTimeMs == null || maxTimeMs <= FAST_MS) return 1;
    return clamp(1 - (double) (maxTimeMs - FAST_MS) / (SLOWEST_MS - FAST_MS));
  }

  private static double weight(Map<String, Integer> settings, String key, int fallback) {
    Integer value = settings == null ? null : settings.get(key);
    return Math.max(0, value == null ? fallback : value);
  }

  private static double clamp(double value) {
    return Math.max(0, Math.min(1, value));
  }
}
