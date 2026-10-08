package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.EligibleQuestionDto;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EligibleQuestionService {

    private final QuestionRepository questionRepository;
    private final ExamQuestionRepository examQuestionRepository;

    @Transactional(readOnly = true)
    public List<EligibleQuestionDto> getEligible(
            Long certificationId, Long majorId, Long middleId, Long lessonId, Long examId,
            Long includeDepartmentId) {

        List<Question> scoped = resolveScope(certificationId, majorId, middleId, lessonId);

        Set<Long> assigned = examId == null
                ? Set.of()
                : examQuestionRepository.findByExam_ExamIdOrderByDisplayOrderAsc(examId).stream()
                        .map(examQuestion -> examQuestion.getQuestion().getQuestionId())
                        .collect(Collectors.toSet());

        return scoped.stream()
                .filter(question -> !assigned.contains(question.getQuestionId()))
                .filter(question -> question.getOwnerDepartment() == null
                        || question.getOwnerDepartment().getDepartmentId().equals(includeDepartmentId))
                .map(this::toDto)
                .toList();
    }

    public List<Question> resolveScope(Long certificationId, Long majorId, Long middleId, Long lessonId) {
        if (lessonId != null) {
            return questionRepository
                    .findByParentQuestionIsNullAndLesson_LessonIdOrderByQuestionIdAsc(lessonId);
        }
        if (middleId != null) {
            return questionRepository
                    .findByParentQuestionIsNullAndLesson_MiddleCategory_MiddleCategoryIdOrderByQuestionIdAsc(middleId);
        }
        if (majorId != null) {
            return questionRepository
                    .findByParentQuestionIsNullAndLesson_MiddleCategory_MajorCategory_MajorCategoryIdOrderByQuestionIdAsc(majorId);
        }
        if (certificationId != null) {
            return questionRepository
                    .findByParentQuestionIsNullAndLesson_MiddleCategory_MajorCategory_Certification_CertificationIdOrderByQuestionIdAsc(certificationId);
        }
        throw new IllegalArgumentException(
                "Provide a certificationId, majorId, middleId, or lessonId to resolve eligible questions.");
    }

    public List<QuestionSelectionView> resolveScopeViews(
            Long certificationId, Long majorId, Long middleId, Long lessonId) {
        if (lessonId != null) {
            return questionRepository.findSelectionViewsByLesson(lessonId);
        }
        if (middleId != null) {
            return questionRepository.findSelectionViewsByMiddleCategory(middleId);
        }
        if (majorId != null) {
            return questionRepository.findSelectionViewsByMajorCategory(majorId);
        }
        if (certificationId != null) {
            return questionRepository.findSelectionViewsByCertification(certificationId);
        }
        throw new IllegalArgumentException(
                "Provide a certificationId, majorId, middleId, or lessonId to resolve eligible questions.");
    }

    private EligibleQuestionDto toDto(Question question) {
        Lesson lesson = question.getLesson();
        MiddleCategory middle = lesson != null ? lesson.getMiddleCategory() : null;
        MajorCategory major = middle != null ? middle.getMajorCategory() : null;
        return new EligibleQuestionDto(
                question.getQuestionId(),
                question.getQuestionType(),
                question.getDifficultyLevel(),
                question.getQuestionText(),
                lesson != null ? lesson.getLessonId() : null,
                lesson != null ? lesson.getName() : null,
                middle != null ? middle.getTitle() : null,
                major != null ? major.getTitle() : null);
    }
}
