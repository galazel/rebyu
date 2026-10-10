package com.capstone.rebyu.common;

import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

public final class PhaseTimer {

    private record Phase(String name, long millis) {}

    /** Operations at least this slow are logged at INFO with their breakdown. */
    private static final long SLOW_MILLIS = 800;

    private final String operation;
    private final Logger log;
    private final long startedAt = System.nanoTime();
    private final List<Phase> phases = new ArrayList<>();
    private long lastMark = startedAt;

    private PhaseTimer(String operation, Logger log) {
        this.operation = operation;
        this.log = log;
    }

    public static PhaseTimer start(String operation, Logger log) {
        return new PhaseTimer(operation, log);
    }

    public static void mark(PhaseTimer timer, String phase) {
        if (timer == null) {
            return;
        }
        long now = System.nanoTime();
        timer.phases.add(new Phase(phase, (now - timer.lastMark) / 1_000_000));
        timer.lastMark = now;
    }

    public static void finish(PhaseTimer timer) {
        if (timer == null) {
            return;
        }
        long total = (System.nanoTime() - timer.startedAt) / 1_000_000;
        if (total < SLOW_MILLIS && !timer.log.isDebugEnabled()) {
            return;
        }
        StringBuilder breakdown = new StringBuilder();
        for (Phase phase : timer.phases) {
            if (breakdown.length() > 0) {
                breakdown.append(", ");
            }
            breakdown.append(phase.name()).append(' ').append(phase.millis()).append("ms");
        }
        if (total >= SLOW_MILLIS) {
            timer.log.info("[perf] {} {}ms [{}]", timer.operation, total, breakdown);
        } else {
            timer.log.debug("[perf] {} {}ms [{}]", timer.operation, total, breakdown);
        }
    }
}
