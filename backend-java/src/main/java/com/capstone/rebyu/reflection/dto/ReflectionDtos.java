package com.capstone.rebyu.reflection.dto;

import com.capstone.rebyu.reflection.entity.MiddleReflection.Criterion;
import com.capstone.rebyu.reflection.entity.ReflectionSubmission.CriterionGrade;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ReflectionDtos {

    private ReflectionDtos() {}

    /** Mirrors {@code python-backend/app/schemas/assessment/reflection_schema.py}. */
    public record GenerationRequest(
            String certificationName,
            String majorCategory,
            String middleCategory,
            List<String> lessonNames,
            String context) {}

    public record GeneratedReflection(
            String title,
            String scenario,
            String prompt,
            List<String> parts,
            List<Criterion> rubric) {}

    public record SubmitRequest(String answer) {}

    public record SubmissionView(
            Long submissionId,
            String answer,
            BigDecimal scorePercent,
            boolean passed,
            String feedback,
            List<CriterionGrade> grades,
            LocalDateTime submittedAt) {}

    public record ReflectionView(
            Long reflectionId,
            Long middleCategoryId,
            String middleCategoryTitle,
            String title,
            String scenario,
            String prompt,
            List<String> parts,
            List<Criterion> rubric,
            int passPercent,
            int attempts,
            boolean passed,
            SubmissionView latest,
            SubmissionView best) {}
}
