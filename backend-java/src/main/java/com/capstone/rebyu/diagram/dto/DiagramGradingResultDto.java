package com.capstone.rebyu.diagram.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Deterministic (non-AI) diagram grading result. {@code status}:
 * GRADED (a real score was computed — may still be 0 for a blank/weak
 * submission), EMPTY_SUBMISSION (nothing meaningful was drawn — a
 * definitive, fair 0), or INVALID_REFERENCE (the admin's reference diagram
 * has no gradeable nodes — never penalize the learner for that; the caller
 * leaves the answer pending rather than fabricating a score).
 * {@code elementResults} DOES include the required (reference-side)
 * description and, when matched, what the learner actually drew — so a
 * learner can see exactly which required nodes/relationships were found or
 * missing. The caller is responsible for gating this behind the exam's
 * release-answers setting before it ever reaches a learner, the same way
 * MCQ answer keys are gated.
 */
public record DiagramGradingResultDto(
        String status,
        BigDecimal earnedPoints,
        BigDecimal maxPoints,
        String feedback,
        List<ElementResultDto> elementResults
) {
    public record ElementResultDto(
            String kind,                 // NODE | EDGE
            String expectedDescription,  // required element, e.g. "Course" or "Student -> Course: enrolls in 1..*"
            boolean matched,
            String matchQuality,         // STRONG | PARTIAL | WEAK | NONE
            String learnerDescription,   // what the learner drew that matched; null when unmatched
            String reason,               // why this element scored what it did, in the learner's terms
            BigDecimal earnedPoints,
            BigDecimal maxPoints
    ) {}
}
