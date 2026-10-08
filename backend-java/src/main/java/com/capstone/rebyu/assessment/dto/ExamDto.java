package com.capstone.rebyu.assessment.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamDto {
    private Long examId;

    @NotNull
    private Long certificationId;

    @NotNull
    private Long examTypeId;

    @NotBlank
    @Size(max = 150)
    private String title;

    private boolean isGenerated = false;

    @Min(1)
    private Integer durationMinutes;

    @NotNull
    @Min(1)
    private Integer totalQuestions;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal passingScore;

    private String status;

    private String description;

    private String instructions;

    private Long lessonId;

    private Long middleCategoryId;

    private Long majorCategoryId;

    private String targetScope;

    private LocalDateTime publishedAt;

    private LocalDateTime updatedAt;

    private Boolean releaseAnswersAfterSubmit;

    private Long ownerDepartmentId;

    private List<ExamQuestionInput> questions;

    private List<Long> questionIds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamQuestionInput {
        @NotNull
        private Long questionId;

        @DecimalMin("0.0")
        private BigDecimal points;

        private Integer displayOrder;
    }
}
