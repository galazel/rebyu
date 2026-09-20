package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * One final question-level BKT evidence event, serialized exactly as the FastAPI
 * {@code MasteryEventCreate} schema expects (snake_case).
 *
 * <p>Only <em>finalized, graded</em> questions become events. The
 * {@code sourceEventId} is deterministic so retries and re-enqueues are
 * idempotent on the FastAPI side. The category path (ids + titles) travels with
 * the event so the BKT service can aggregate lesson → middle → major priorities
 * without reading the curriculum tables.
 */
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
        /** Share of the item earned, 0..1; the mastery update weighs the evidence by it. */
        @JsonProperty("score") Double score,
        @JsonProperty("difficulty_level") String difficultyLevel,
        @JsonProperty("assessment_type") String assessmentType,
        @JsonProperty("occurred_at") String occurredAt
) {
}
