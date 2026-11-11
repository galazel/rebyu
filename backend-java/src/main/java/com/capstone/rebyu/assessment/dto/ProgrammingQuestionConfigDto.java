package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgrammingQuestionConfigDto {
    private Long programmingQuestionConfigId;

    @NotNull
    private Long questionId;

    private String starterCode;

    private String language;

    @NotBlank
    private String expectedOutput;
}
