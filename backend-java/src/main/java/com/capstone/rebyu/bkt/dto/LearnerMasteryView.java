package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LearnerMasteryView(
        List<Item> items,
        int total,
        @JsonProperty("average_mastery_probability") double averageMasteryProbability
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            @JsonProperty("learner_id") Long learnerId,
            @JsonProperty("lesson_id") Long lessonId,
            @JsonProperty("mastery_probability") Double masteryProbability,
            @JsonProperty("mastery_level") String masteryLevel,
            @JsonProperty("attempt_count") Integer attemptCount,
            @JsonProperty("last_updated") String lastUpdated
    ) {
    }
}
