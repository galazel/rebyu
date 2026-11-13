package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.learningtools.service.GeneratedAssessmentService;

/**
 * Which assessments belong to a certification itself, as opposed to ones a learner or a
 * department made. Learner analytics, exports and mastery count only the certification's
 * own assessments, so a learner's AI practice quiz or a class paper never moves them.
 */
public final class CertificationAssessments {

    private CertificationAssessments() {}

    /** Why the exam is not the certification's own, or null when it is. */
    public static String notCertificationReason(Exam exam) {
        if (exam == null) return null;
        if (exam.getLearner() != null) return "belongs to a single learner";
        if (GeneratedAssessmentService.GENERATED_TARGET_SCOPE.equals(exam.getTargetScope())) {
            return "target scope " + exam.getTargetScope();
        }
        String typeText = exam.getExamType() == null ? null : exam.getExamType().getExamTypeText();
        if (GeneratedAssessmentService.QUIZ_EXAM_TYPE.equals(typeText)
                || GeneratedAssessmentService.FLASHCARD_EXAM_TYPE.equals(typeText)) {
            return "type " + typeText;
        }
        if (exam.getOwnerDepartment() != null) {
            return "set by department " + exam.getOwnerDepartment().getDepartmentId();
        }
        return null;
    }

    public static boolean isCertificationOwn(Exam exam) {
        return notCertificationReason(exam) == null;
    }
}
