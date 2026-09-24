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

    /**
     * Engine-picked, but sat as a formal paper. The mock exam stands in for
     * the real certification exam, so it is delivered the way that exam is:
     * every item on the table at once, with item navigation, flags and
     * review. The engine still chooses the items -- by the learner's ability,
     * avoiding what they have seen, a fresh set on every retake -- it just
     * chooses them all up front instead of one answer at a time.
     */
    public static final Set<String> ASSEMBLED_PAPER_TYPES = Set.of("MOCK_EXAM");

    /** Engine-picked and delivered whole (see ASSEMBLED_PAPER_TYPES). */
    public boolean isAssembledPaper(Exam exam) {
        if (exam == null || exam.getExamType() == null) return false;
        if (exam.getOwnerDepartment() != null) return false;
        return properties.isEnabled() && ASSEMBLED_PAPER_TYPES.contains(exam.getExamType().getExamTypeText());
    }

    /** Engine-picked and served one item at a time: adaptive, and not an assembled paper. */
    public boolean isLiveAdaptive(Exam exam) {
        return isAdaptive(exam) && !isAssembledPaper(exam);
    }

    /**
     * Whether this exam is run by the engine: its type is, or it is a
     * lesson-scoped knowledge check.
     *
     * <p>A department's own assessment never is, whatever its type. The head
     * wrote its questions themselves and the list they wrote IS the paper; run
     * through the engine it would ignore that list and serve the official bank
     * instead -- a class sitting a quiz the head never set. A department mock
     * exam was doing exactly that, and was additionally refused for want of
     * the Pro mock-exam entitlement on a paper the institution already paid
     * for.
     */
    public boolean isAdaptive(Exam exam) {
        if (exam == null || exam.getExamType() == null) return false;
        if (exam.getOwnerDepartment() != null) return false;
        String type = exam.getExamType().getExamTypeText();
        if (isAdaptiveType(type)) return true;
        return properties.isEnabled() && KNOWLEDGE_CHECK.equals(type) && exam.getLesson() != null;
    }

    /** Whether this type may end with code, diagram or written items. */
    /** The exams that sit over a category: BKT focuses them on the weak lessons. */
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

    /**
     * How many items this type should end its final round on.
     *
     * <p>Zero for the types that never have one (see
     * {@link #allowsFinalRound}), so callers can use this without repeating
     * that test.
     */
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

    /**
     * The response model an item is scored under. The objective items --
     * multiple choice, short answer, true/false, fill-in, matching -- are
     * right or wrong and use the two-parameter logistic model. Written, coded
     * and drawn answers are marked on a scale and use the partial-credit
     * form: the share earned is the response.
     */
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
