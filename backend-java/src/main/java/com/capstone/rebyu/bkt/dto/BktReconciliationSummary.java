package com.capstone.rebyu.bkt.dto;

import java.time.LocalDateTime;

public record BktReconciliationSummary(
        int attemptsScanned,
        int eventsCreated,
        LocalDateTime completedAt
) {
}
