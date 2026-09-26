package com.capstone.rebyu.challenge.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ArenaScoringTest {

  static final Map<String, Integer> WEIGHTS = Map.of("weightCorrect", 60, "weightSpeed", 20, "weightBigO", 20);
  static final LocalDateTime START = LocalDateTime.of(2026, 9, 26, 10, 0);

  @Test
  void aFastQuickFullPassIsFullMarks() {
    var b = ArenaScoring.codeStrike(WEIGHTS, 5, 5, 80L, START, START.plusMinutes(10), 45);
    assertEquals(0, b.fraction().compareTo(java.math.BigDecimal.ONE));
  }

  @Test
  void speedAndEfficiencyOnlyCountForWhatPassed() {
    // Nothing passed: fast and efficient earns nothing.
    var none = ArenaScoring.codeStrike(WEIGHTS, 0, 5, 10L, START, START.plusMinutes(1), 45);
    assertEquals(0.0, none.fraction().doubleValue());

    // Half passed, otherwise perfect: half marks.
    var half = ArenaScoring.codeStrike(WEIGHTS, 2, 4, 10L, START, START.plusMinutes(1), 45);
    assertEquals(0.5, half.fraction().doubleValue(), 1e-4);
  }

  @Test
  void usingTheWholeTimeLimitLosesTheSpeedWeight() {
    var b = ArenaScoring.codeStrike(WEIGHTS, 5, 5, 80L, START, START.plusMinutes(45), 45);
    assertEquals(0.8, b.fraction().doubleValue(), 1e-4);
    // Three quarters of the limit is half speed.
    assertEquals(0.5, ArenaScoring.speed(START, START.plusMinutes(30), 40), 1e-9);
    // Untimed runs have nothing to measure against.
    assertEquals(1.0, ArenaScoring.speed(START, START.plusHours(3), null));
  }

  @Test
  void aSlowProgramLosesTheEfficiencyWeight() {
    var b = ArenaScoring.codeStrike(WEIGHTS, 5, 5, 5000L, START, START.plusMinutes(5), 45);
    assertEquals(0.8, b.fraction().doubleValue(), 1e-4);
    assertTrue(ArenaScoring.efficiency(1000L) < 1 && ArenaScoring.efficiency(1000L) > 0);
    assertTrue(b.summary().contains("5000 ms"));
  }

  @Test
  void theWeightsDecideTheMix() {
    // All weight on correctness: speed and runtime no longer matter.
    var correctOnly = Map.of("weightCorrect", 100, "weightSpeed", 0, "weightBigO", 0);
    var b = ArenaScoring.codeStrike(correctOnly, 5, 5, 5000L, START, START.plusMinutes(45), 45);
    assertEquals(1.0, b.fraction().doubleValue(), 1e-4);
  }
}
