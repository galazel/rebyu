package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LessonPriorityView(
        @JsonProperty("lesson_id") Long lessonId,
        @JsonProperty("lesson_title") String lessonTitle,
        @JsonProperty("middle_category_id") Long middleCategoryId,
        @JsonProperty("major_category_id") Long majorCategoryId,
        @JsonProperty("mastery_probability") Double masteryProbability,
        @JsonProperty("mastery_level") String masteryLevel,
        @JsonProperty("priority_score") Double priorityScore,
        @JsonProperty("priority_tag") String priorityTag,
        @JsonProperty("priority_label") String priorityLabel,
        @JsonProperty("primary_reason") String primaryReason,
        List<String> reasons,
        @JsonProperty("recommended_action") String recommendedAction,
        @JsonProperty("recommended_activity") String recommendedActivity,
        @JsonProperty("evidence_count") Integer evidenceCount,
        @JsonProperty("last_assessed_at") String lastAssessedAt
) {
}
