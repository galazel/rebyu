package com.capstone.rebyu.challenge.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

public final class ArenaScoring {

  static final long FAST_MS = 250;

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
