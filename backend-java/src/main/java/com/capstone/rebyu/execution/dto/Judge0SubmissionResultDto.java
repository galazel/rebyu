package com.capstone.rebyu.execution.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Judge0SubmissionResultDto(
        String stdout,
        String stderr,
        @JsonProperty("compile_output") String compileOutput,
        String message,
        Judge0StatusDto status,
        String time,
        Integer memory
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Judge0StatusDto(int id, String description) {}
}
