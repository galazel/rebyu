package com.capstone.rebyu.challenge.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class ChallengeStandingsDtos {

    private ChallengeStandingsDtos() {}

    public record ChallengeLeaderboardRow(
            long rank,
            String name,
            int points,
            int completed,
            int bestScore,
            boolean you
    ) {}

    public record ChallengeActivityRow(
            Long challengeSessionId,
            String mode,
            LocalDateTime startedAt,
            String status,
            Integer score
    ) {}

    public record ChallengeRecord(
            Long rank,
            int points,
            int completed,
            int bestScore,
            int streakDays,
            List<ChallengeActivityRow> recent
    ) {}
}
