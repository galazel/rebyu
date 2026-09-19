package com.capstone.rebyu.bkt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** One lesson's trained BKT parameters, as the model service reports them. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record LessonBktParametersView(
        @JsonProperty("lesson_id") Long lessonId,
        @JsonProperty("prior_probability") Double priorProbability,
        @JsonProperty("learn_probability") Double learnProbability,
        @JsonProperty("guess_probability") Double guessProbability,
        @JsonProperty("slip_probability") Double slipProbability
) {
}
