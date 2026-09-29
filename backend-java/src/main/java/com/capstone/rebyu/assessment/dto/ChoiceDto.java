package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChoiceDto {
    private Long choiceId;

    @NotNull
    private Long questionId;

    @NotNull
    private String choiceText;

    @Size(max = 255)
    private String imageKey;

    private boolean correct;

    private String explanation;
}
