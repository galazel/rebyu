package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MasteryHistoryView(
        @JsonProperty("mastery_history_id") String masteryHistoryId,
        @JsonProperty("learner_id") Long learnerId,
        @JsonProperty("certification_id") Long certificationId,
        @JsonProperty("lesson_id") Long lessonId,
        @JsonProperty("previous_mastery") Double previousMastery,
        @JsonProperty("final_mastery") Double finalMastery,
        @JsonProperty("previous_mastery_level") String previousMasteryLevel,
        @JsonProperty("new_mastery_level") String newMasteryLevel,
        @JsonProperty("observed_correct") boolean observedCorrect,
        @JsonProperty("assessment_type") String assessmentType,
        @JsonProperty("difficulty_level") String difficultyLevel,
        @JsonProperty("created_at") String createdAt
) {
}
