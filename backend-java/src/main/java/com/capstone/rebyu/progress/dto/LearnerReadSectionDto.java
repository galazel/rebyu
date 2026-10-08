package com.capstone.rebyu.progress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearnerReadSectionDto {
    @NotNull
    private Long lessonId;

    @NotBlank
    private String sectionKey;
}
