package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgrammingQuestionConfigDto {
    private Long programmingQuestionConfigId;

    @NotNull
    private Long questionId;

    private String starterCode;

    private String language;

    private List<ProgrammingTestCaseDto> testCases;
}
