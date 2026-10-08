package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BktMasteryEvent(
        @JsonProperty("source_event_id") String sourceEventId,
        @JsonProperty("learner_id") Long learnerId,
        @JsonProperty("certification_id") Long certificationId,
        @JsonProperty("major_category_id") Long majorCategoryId,
        @JsonProperty("middle_category_id") Long middleCategoryId,
        @JsonProperty("lesson_id") Long lessonId,
        @JsonProperty("lesson_title") String lessonTitle,
        @JsonProperty("middle_category_title") String middleCategoryTitle,
        @JsonProperty("major_category_title") String majorCategoryTitle,
        @JsonProperty("question_id") Long questionId,
        @JsonProperty("is_correct") boolean isCorrect,
        @JsonProperty("score") Double score,
        @JsonProperty("difficulty_level") String difficultyLevel,
        @JsonProperty("assessment_type") String assessmentType,
        @JsonProperty("occurred_at") String occurredAt
) {
}
