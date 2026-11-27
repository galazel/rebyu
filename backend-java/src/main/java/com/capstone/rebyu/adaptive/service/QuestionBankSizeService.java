package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.assessment.service.EligibleQuestionService;
import com.capstone.rebyu.assessment.service.QuestionStem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

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

    @Transactional(readOnly = true)
    public List<QuestionSelectionView> pool(Exam exam) {
        Long ownerDepartmentId = exam.getOwnerDepartment() == null ? null : exam.getOwnerDepartment().getDepartmentId();
        List<QuestionSelectionView> views = eligibleQuestions.resolveScopeViews(
                exam.getCertification() == null ? null : exam.getCertification().getCertificationId(),
                exam.getMajorCategory() == null ? null : exam.getMajorCategory().getMajorCategoryId(),
                exam.getMiddleCategory() == null ? null : exam.getMiddleCategory().getMiddleCategoryId(),
                exam.getLesson() == null ? null : exam.getLesson().getLessonId());
        List<QuestionSelectionView> eligible = views.stream()
                .filter(q -> q.getOwnerDepartmentId() == null || Objects.equals(q.getOwnerDepartmentId(), ownerDepartmentId))
                .filter(q -> AdaptivePolicy.isServable(q.getQuestionType()))
                .toList();
        String type = exam.getExamType().getExamTypeText();
        if (!AdaptivePolicy.ADAPTIVE_TYPES.contains(type)) return eligible;

        // Keep a single bank entry per exact stem, preferring the main round if both rounds have it.
        Set<String> stems = new HashSet<>();
        return eligible.stream()
                .sorted(Comparator.comparing(q -> AdaptivePolicy.belongsInFinalRound(type, q.getQuestionType())))
                .filter(q -> {
                    String stem = QuestionStem.of(q.getQuestionText());
                    return stem.isEmpty() || stems.add(stem);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public BankSize measure(Exam exam) {
        return measure(exam, pool(exam));
    }

    public BankSize measure(Exam exam, List<QuestionSelectionView> pool) {
        String type = exam.getExamType().getExamTypeText();
        int workspace = (int) pool.stream().filter(q -> AdaptivePolicy.belongsInFinalRound(type, q.getQuestionType())).count();
        int main = pool.size() - workspace;
        int target = policy.targetCount(type);
        int required = (int) Math.ceil(target * properties.getMinBankMultiplier());
        int finalCount = Math.min(Math.min(policy.finalRoundCount(type), workspace), target - 1);
        int requiredMain = target - finalCount;
        return new BankSize(pool.size(), main, workspace, required, requiredMain);
    }

    public String shortfallMessage(Exam exam, BankSize size) {
        return "The question bank for this " + exam.getExamType().getExamTypeText().toLowerCase().replace('_', ' ')
                + " has " + size.total() + " question" + (size.total() == 1 ? "" : "s")
                + " in scope; an adaptive assessment of "
                + policy.targetCount(exam.getExamType().getExamTypeText())
                + " items needs at least " + size.required() + " in the bank, including "
                + size.requiredMain() + " eligible for the main round (currently " + size.main() + ").";
    }
}
