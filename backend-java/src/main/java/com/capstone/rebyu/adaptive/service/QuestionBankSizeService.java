package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.assessment.service.EligibleQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * The question pool an adaptive assessment draws from, and whether it is big
 * enough. One place, so publishing and starting an attempt agree on both.
 */
@Service
@RequiredArgsConstructor
public class QuestionBankSizeService {

    private final EligibleQuestionService eligibleQuestions;
    private final AdaptivePolicy policy;
    private final AdaptiveProperties properties;

    public record BankSize(int total, int main, int workspace, int required, int requiredMain) {
        public boolean sufficient() {
            return total >= required && main >= requiredMain;
        }
    }

    /** Every top-level question in the exam's scope that this exam may serve. */
    @Transactional(readOnly = true)
    public List<QuestionSelectionView> pool(Exam exam) {
        Long ownerDepartmentId = exam.getOwnerDepartment() == null ? null : exam.getOwnerDepartment().getDepartmentId();
        List<QuestionSelectionView> views = eligibleQuestions.resolveScopeViews(
                exam.getCertification() == null ? null : exam.getCertification().getCertificationId(),
                exam.getMajorCategory() == null ? null : exam.getMajorCategory().getMajorCategoryId(),
                exam.getMiddleCategory() == null ? null : exam.getMiddleCategory().getMiddleCategoryId(),
                exam.getLesson() == null ? null : exam.getLesson().getLessonId());
        boolean quickOnly = !AdaptivePolicy.allowsFinalRound(exam.getExamType().getExamTypeText());
        return views.stream()
                .filter(q -> q.getOwnerDepartmentId() == null || Objects.equals(q.getOwnerDepartmentId(), ownerDepartmentId))
                .filter(q -> AdaptivePolicy.isServable(q.getQuestionType()))
                .filter(q -> !quickOnly || !AdaptivePolicy.isWorkspaceType(q.getQuestionType()))
                .toList();
    }

    @Transactional(readOnly = true)
    public BankSize measure(Exam exam) {
        return measure(exam, pool(exam));
    }

    public BankSize measure(Exam exam, List<QuestionSelectionView> pool) {
        int workspace = (int) pool.stream().filter(q -> AdaptivePolicy.isWorkspaceType(q.getQuestionType())).count();
        int main = pool.size() - workspace;
        String type = exam.getExamType().getExamTypeText();
        int target = policy.targetCount(type);
        int required = (int) Math.ceil(target * properties.getMinBankMultiplier());
        int requiredMain = Math.max(1, target - policy.finalRoundCount(type));
        return new BankSize(pool.size(), main, workspace, required, requiredMain);
    }

    public String shortfallMessage(Exam exam, BankSize size) {
        return "The question bank for this " + exam.getExamType().getExamTypeText().toLowerCase().replace('_', ' ')
                + " has " + size.total() + " question" + (size.total() == 1 ? "" : "s")
                + " in scope; an adaptive assessment of "
                + policy.targetCount(exam.getExamType().getExamTypeText())
                + " items needs at least " + size.required() + ".";
    }
}
