package com.capstone.rebyu.adaptive.engine;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdaptiveFocusPlanTest {

    private static Map<Long, Integer> pool() {
        Map<Long, Integer> pool = new LinkedHashMap<>();
        pool.put(1L, 10); pool.put(2L, 20); pool.put(3L, 30); pool.put(4L, 40);
        return pool;
    }

    @Test
    void weakLessonsShareHalfThePaperAndTheRestSplitByBank() {
        Map<Long, Double> mastery = Map.of(1L, 0.2, 2L, 0.4, 3L, 0.8, 4L, 0.9);
        Set<Long> weak = new LinkedHashSet<>();
        Map<Long, Double> plan = AdaptiveItemSelector.focusPlan(pool(), mastery, 0.5, 0.5, weak);

        assertEquals(Set.of(1L, 2L), weak);
        // weak: (1-0.2)=0.8 and (1-0.4)=0.6 of the half
        assertEquals(0.5 * 0.8 / 1.4, plan.get(1L), 1e-9);
        assertEquals(0.5 * 0.6 / 1.4, plan.get(2L), 1e-9);
        // rest: bank 30 and 40 of the other half
        assertEquals(0.5 * 30 / 70.0, plan.get(3L), 1e-9);
        assertEquals(0.5 * 40 / 70.0, plan.get(4L), 1e-9);
        assertEquals(1.0, plan.values().stream().mapToDouble(Double::doubleValue).sum(), 1e-9);
    }

    @Test
    void withNoWeakLessonTheWeakestIsTheFocus() {
        Map<Long, Double> mastery = Map.of(1L, 0.9, 2L, 0.7, 3L, 0.8, 4L, 0.95);
        Set<Long> weak = new LinkedHashSet<>();
        Map<Long, Double> plan = AdaptiveItemSelector.focusPlan(pool(), mastery, 0.5, 0.5, weak);
        assertEquals(Set.of(2L), weak);
        assertEquals(0.5, plan.get(2L), 1e-9);
    }

    @Test
    void withEveryLessonWeakThePlanIsPlainCoverage() {
        Map<Long, Double> mastery = Map.of(1L, 0.1, 2L, 0.2, 3L, 0.3, 4L, 0.4);
        Set<Long> weak = new LinkedHashSet<>();
        Map<Long, Double> plan = AdaptiveItemSelector.focusPlan(pool(), mastery, 0.5, 0.5, weak);
        assertTrue(plan.isEmpty());
        assertTrue(weak.isEmpty());
    }
}
