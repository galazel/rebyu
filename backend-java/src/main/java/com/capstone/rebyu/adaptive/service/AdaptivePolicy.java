package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.assessment.entity.Exam;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/** Which assessments the adaptive engine runs, and how long each one is. */
@Component
@RequiredArgsConstructor
public class AdaptivePolicy {

    public static final Set<String> ADAPTIVE_TYPES =
            Set.of("LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM", "MOCK_EXAM", "DIAGNOSTIC");

    /**
     * The skim challenge: a knowledge check minted on one lesson. It runs on
     * the engine like any quiz -- items picked by ability from the lesson's
     * bank, marked as they are answered, seen items avoided -- but inside a
     * modal, so it is short and never serves a final round (no editor or
     * canvas fits there). The other knowledge check, five picked from
     * finished lessons mistakes-first, keeps its fixed paper.
     */
    public static final String KNOWLEDGE_CHECK = "KNOWLEDGE_CHECK";

    /** Types that never serve a final round: quick answers only. */
    private static final Set<String> QUICK_ONLY_TYPES = Set.of(KNOWLEDGE_CHECK);

    /**
     * Item types served in the final round: everything marked by an outside
     * grader (code runner, diagram comparison, the model for written
     * answers). They are saved as answered and marked in the background after
     * submit, so the learner never waits on them.
     */
    private static final Set<String> WORKSPACE_TYPES = Set.of("CRITICAL_THINKING", "PROGRAMMING", "DIAGRAM", "DESCRIPTIVE");

    public static boolean isServable(String questionType) {
        return questionType != null;
    }

    private final AdaptiveProperties properties;

    public boolean isAdaptiveType(String examTypeText) {
        return properties.isEnabled() && examTypeText != null && ADAPTIVE_TYPES.contains(examTypeText);
    }

    /** Whether this exam is run by the engine: its type is, or it is a lesson-scoped knowledge check. */
    public boolean isAdaptive(Exam exam) {
        if (exam == null || exam.getExamType() == null) return false;
        String type = exam.getExamType().getExamTypeText();
        if (isAdaptiveType(type)) return true;
        return properties.isEnabled() && KNOWLEDGE_CHECK.equals(type) && exam.getLesson() != null;
    }

    /** Whether this type may end with code, diagram or written items. */
    public static boolean allowsFinalRound(String examTypeText) {
        return examTypeText == null || !QUICK_ONLY_TYPES.contains(examTypeText);
    }

    public int targetCount(String examTypeText) {
        Integer configured = properties.getItemCounts().get(examTypeText);
        return configured == null || configured <= 0 ? 10 : configured;
    }

    public static boolean isWorkspaceType(String questionType) {
        return questionType != null && WORKSPACE_TYPES.contains(questionType.trim().toUpperCase());
    }

    public static boolean isMultipleChoice(String questionType) {
        return "MULTIPLE_CHOICE".equalsIgnoreCase(questionType) || "MCQ".equalsIgnoreCase(questionType)
                || "TRUE_FALSE".equalsIgnoreCase(questionType);
    }
}
