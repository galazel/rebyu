package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ConfidenceView(
        @JsonProperty("learner_id") Long learnerId,
        @JsonProperty("certification_id") Long certificationId,
        @JsonProperty("confidence_score") Double confidenceScore,
        @JsonProperty("average_mastery") Double averageMastery,
        @JsonProperty("mastered_count") Integer masteredCount,
        @JsonProperty("good_count") Integer goodCount,
        @JsonProperty("developing_count") Integer developingCount,
        @JsonProperty("weak_count") Integer weakCount,
        @JsonProperty("total_lessons") Integer totalLessons,
        @JsonProperty("coverage_percentage") Double coveragePercentage
) {
}
