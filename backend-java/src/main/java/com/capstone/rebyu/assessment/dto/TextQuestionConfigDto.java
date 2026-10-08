package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TextQuestionConfigDto {
    private Long textQuestionConfigId;

    @NotNull
    private Long questionId;

    @NotBlank
    private String correctAnswer;

    @NotBlank
    @Size(max = 30)
    private String checkingMethod;

    private List<String> acceptedVariations;
}
