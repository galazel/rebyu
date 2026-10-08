package com.capstone.rebyu.progress.dto;

import java.time.LocalDateTime;

public record LearnerAchievementViewDto(
        Long achievementId,
        String code,
        String slug,
        String title,
        String description,
        boolean earned,
        LocalDateTime earnedAt) {
}
