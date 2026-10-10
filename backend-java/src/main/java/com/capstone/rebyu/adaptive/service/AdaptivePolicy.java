package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.assessment.entity.Exam;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdaptivePolicy {

    // Diagnostic and mock exams are fixed papers: every learner and every retake gets the same questions.
    public static final Set<String> ADAPTIVE_TYPES =
            Set.of("LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM");

    public static final String KNOWLEDGE_CHECK = "KNOWLEDGE_CHECK";

    private static final Set<String> QUICK_ONLY_TYPES = Set.of(KNOWLEDGE_CHECK);

    private static final Set<String> WORKSPACE_TYPES = Set.of("CRITICAL_THINKING", "PROGRAMMING", "DIAGRAM", "DESCRIPTIVE");

    public static boolean isServable(String questionType) {
        return questionType != null;
    }

    private final AdaptiveProperties properties;

    public boolean isAdaptiveType(String examTypeText) {
        return properties.isEnabled() && examTypeText != null && ADAPTIVE_TYPES.contains(examTypeText);
    }

    public static final Set<String> ASSEMBLED_PAPER_TYPES = Set.of();

    public boolean isAssembledPaper(Exam exam) {
        if (exam == null || exam.getExamType() == null) return false;
        if (exam.getOwnerDepartment() != null) return false;
        return properties.isEnabled() && ASSEMBLED_PAPER_TYPES.contains(exam.getExamType().getExamTypeText());
    }

    public boolean isLiveAdaptive(Exam exam) {
        return isAdaptive(exam) && !isAssembledPaper(exam);
    }

    public boolean isAdaptive(Exam exam) {
        if (exam == null || exam.getExamType() == null) return false;
        if (exam.getOwnerDepartment() != null) return false;
        String type = exam.getExamType().getExamTypeText();
        if (isAdaptiveType(type)) return true;
        return properties.isEnabled() && KNOWLEDGE_CHECK.equals(type) && exam.getLesson() != null;
    }

    public static boolean isCategoryExam(String examTypeText) {
        String t = examTypeText == null ? "" : examTypeText.trim().toUpperCase();
        return "MIDDLE_EXAM".equals(t) || "MAJOR_EXAM".equals(t);
    }

    public static boolean allowsFinalRound(String examTypeText) {
        return examTypeText == null || !QUICK_ONLY_TYPES.contains(examTypeText);
    }

    public int targetCount(String examTypeText) {
        Integer configured = properties.getItemCounts().get(examTypeText);
        return configured == null || configured <= 0 ? 10 : configured;
    }

    public int finalRoundCount(String examTypeText) {
        if (!allowsFinalRound(examTypeText)) {
            return 0;
        }
        Integer configured = properties.getFinalRoundCounts().get(examTypeText);
        return configured == null || configured < 0
                ? properties.getFinalRoundMax() : configured;
    }

    public static boolean isWorkspaceType(String questionType) {
        return questionType != null && WORKSPACE_TYPES.contains(questionType.trim().toUpperCase());
    }

    public static final String IRT_2PL = "2PL";
    public static final String IRT_PARTIAL_CREDIT = "PARTIAL_CREDIT";

    public static String irtModelFor(String questionType) {
        return isWorkspaceType(questionType) ? IRT_PARTIAL_CREDIT : IRT_2PL;
    }

    public static boolean usesPartialCredit(String questionType) {
        return IRT_PARTIAL_CREDIT.equals(irtModelFor(questionType));
    }

    public static boolean isMultipleChoice(String questionType) {
        return "MULTIPLE_CHOICE".equalsIgnoreCase(questionType) || "MCQ".equalsIgnoreCase(questionType)
                || "TRUE_FALSE".equalsIgnoreCase(questionType);
    }
}
