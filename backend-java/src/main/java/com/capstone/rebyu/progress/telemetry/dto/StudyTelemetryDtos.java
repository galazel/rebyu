package com.capstone.rebyu.progress.telemetry.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class StudyTelemetryDtos {
    private StudyTelemetryDtos() {}
    public record RecordEventRequest(@NotNull Long lessonId, @NotBlank String eventType,
        @Min(0) @Max(120) Integer durationSeconds, @Min(0) @Max(50000) Integer scrollVelocity,
        @Min(0) Integer correctCount, @Min(0) Integer questionCount) {}
    public record DailyPoint(String date, int studyMinutes, int rushes) {}
    public record BehaviorSummary(int todayStudyMinutes, int weekStudyMinutes, int challengeCompletions,
        int rushEvents, int focusConsistency, String readingPace, List<DailyPoint> trend) {}
}
