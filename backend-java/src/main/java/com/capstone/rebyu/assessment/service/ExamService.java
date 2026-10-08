package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.AddExamQuestionsRequest;
import com.capstone.rebyu.assessment.dto.ExamDto;
import com.capstone.rebyu.assessment.mapper.ExamMapper;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.certification.repository.MajorCategoryRepository;
import com.capstone.rebyu.certification.repository.MiddleCategoryRepository;
import com.capstone.rebyu.certification.service.MajorCategoryService;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.entity.Department;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ExamService {
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final QuestionRepository questionRepository;
    private final ExamTypeRepository examTypeRepository;
    private final CertificationRepository certificationRepository;
    private final MajorCategoryRepository majorCategoryRepository;
    private final MiddleCategoryRepository middleCategoryRepository;
    private final LessonRepository lessonRepository;
    private final ExamMapper examMapper;
    private final MajorCategoryService majorCategoryService;
    private final com.capstone.rebyu.adaptive.service.AdaptivePolicy adaptivePolicy;
    private final com.capstone.rebyu.adaptive.service.QuestionBankSizeService questionBankSize;

    public List<ExamDto> getAll(Long includeDepartmentId, Long certificationId, Long viewerLearnerId) {
        log.debug("Fetching exams (includeDepartmentId={}, certificationId={})", includeDepartmentId, certificationId);
        List<Exam> exams = (certificationId == null
                ? examRepository.findAll()
                : examRepository.findByCertification_CertificationId(certificationId))
                .stream()
                .filter(exam -> exam.getOwnerDepartment() == null
                        || exam.getOwnerDepartment().getDepartmentId().equals(includeDepartmentId))
                .filter(exam -> exam.getLearner() == null
                        || exam.getLearner().getLearnerId().equals(viewerLearnerId))
                .toList();
        Map<Long, List<Long>> questionIdsByExamId = questionIdsByExamId(exams);
        return exams.stream()
                .map(exam -> {
                    ExamDto dto = examMapper.toDto(exam);
                    dto.setQuestionIds(
                            questionIdsByExamId.getOrDefault(exam.getExamId(), List.of()));
                    return dto;
                })
                .toList();
    }

    private Map<Long, List<Long>> questionIdsByExamId(List<Exam> exams) {
        if (exams.isEmpty()) {
            return Map.of();
        }
        List<Long> examIds = exams.stream().map(Exam::getExamId).toList();
        return examQuestionRepository.findQuestionIdsByExamIds(examIds).stream()
                .collect(Collectors.groupingBy(
                        ExamQuestionRepository.ExamQuestionIdView::getExamId,
                        Collectors.mapping(
                                ExamQuestionRepository.ExamQuestionIdView::getQuestionId,
                                Collectors.toList())));
    }

    public ExamDto getById(Long id, Long includeDepartmentId) {
        log.debug("Fetching exam id: {}", id);
        Exam exam = findEntity(id);
        if (exam.getOwnerDepartment() != null
                && !exam.getOwnerDepartment().getDepartmentId().equals(includeDepartmentId)) {
            throw new EntityNotFoundException("Exam not found: " + id);
        }
        return toDtoWithQuestions(exam);
    }

    public ExamDto create(
            ExamDto dto, boolean isAdmin,
            Long callerInstitutionId, Long callerUserId, boolean callerIsOwner, Long ownerDepartmentId) {
        log.info("Creating new exam (ownerDepartmentId={})", ownerDepartmentId);
        enforceUniqueness(dto, ownerDepartmentId);
        Exam entity = examMapper.toEntity(dto);
        entity.setExamId(null);
        entity.setOwnerDepartment(majorCategoryService.resolveAndAuthorizeOwnerDepartment(
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner, ownerDepartmentId, dto.getCertificationId()));
        normalizeForSave(entity, dto);
        if (entity.getStatus() == null) {
            entity.setStatus(Exam.Status.DRAFT);
        }
        entity.setUpdatedAt(LocalDateTime.now());
        Exam saved = examRepository.save(entity);
        int synced = syncSelectedQuestions(saved, dto);
        if (synced >= 0) {
            saved.setTotalQuestions(synced);
            saved = examRepository.save(saved);
        }
        ExamDto result = toDtoWithQuestions(saved);
        log.info("Exam created with id: {}", result.getExamId());
        return result;
    }

    public ExamDto update(
            Long id, ExamDto dto, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        log.info("Updating exam id: {}", id);
        Exam existing = findEntity(id);
        majorCategoryService.requireCanActOn(
                existing.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        Exam entity = examMapper.toEntity(dto);
        entity.setExamId(id);
        entity.setOwnerDepartment(existing.getOwnerDepartment());
        normalizeForSave(entity, dto);
        if (entity.getStatus() == null) {
            entity.setStatus(existing.getStatus());
        }
        entity.setPublishedAt(existing.getPublishedAt());
        entity.setUpdatedAt(LocalDateTime.now());
        Exam saved = examRepository.save(entity);
        int synced = syncSelectedQuestions(saved, dto);
        if (synced >= 0) {
            saved.setTotalQuestions(synced);
            saved = examRepository.save(saved);
        }
        ExamDto result = toDtoWithQuestions(saved);
        log.info("Exam id: {} updated", id);
        return result;
    }

    public ExamDto publish(
            Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Exam exam = findEntity(id);
        majorCategoryService.requireCanActOn(
                exam.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        if (exam.getTitle() == null || exam.getTitle().isBlank()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "The assessment needs a title before it can be published.");
        }

        List<ExamQuestion> examQuestions =
                examQuestionRepository.findByExam_ExamIdOrderByDisplayOrderAsc(id);
        boolean adaptive = adaptivePolicy.isAdaptive(exam);
        if (adaptive) {
            var size = questionBankSize.measure(exam);
            if (!size.sufficient()) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        questionBankSize.shortfallMessage(exam, size));
            }
        } else if (examQuestions.isEmpty()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "Add at least one question before publishing this assessment.");
        }

        Long certificationId = exam.getCertification().getCertificationId();
        for (ExamQuestion examQuestion : examQuestions) {
            Question question = examQuestion.getQuestion();
            Long questionCertId = question.getLesson()
                    .getMiddleCategory().getMajorCategory()
                    .getCertification().getCertificationId();
            if (!certificationId.equals(questionCertId)) {
                throw new BusinessRuleException.QuestionNotEligibleForAssessmentException();
            }
            if (exam.getLesson() != null
                    && !exam.getLesson().getLessonId()
                            .equals(question.getLesson().getLessonId())) {
                throw new BusinessRuleException.QuestionNotEligibleForAssessmentException();
            }
        }

        exam.setStatus(Exam.Status.PUBLISHED);
        exam.setPublishedAt(LocalDateTime.now());
        exam.setUpdatedAt(LocalDateTime.now());
        log.info("Exam id: {} published with {} question(s)", id, examQuestions.size());
        return toDtoWithQuestions(examRepository.save(exam));
    }

    public void delete(Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        log.info("Deleting exam id: {}", id);
        Exam exam = findEntity(id);
        majorCategoryService.requireCanActOn(
                exam.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        examQuestionRepository.deleteByExam_ExamId(id);
        examQuestionRepository.flush();
        examRepository.delete(exam);
        log.info("Exam id: {} deleted", id);
    }

    public ExamDto archive(
            Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Exam exam = findEntity(id);
        majorCategoryService.requireCanActOn(
                exam.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        exam.setStatus(Exam.Status.ARCHIVED);
        exam.setUpdatedAt(LocalDateTime.now());
        log.info("Exam id: {} archived", id);
        return toDtoWithQuestions(examRepository.save(exam));
    }

    public ExamDto addQuestions(
            Long examId, AddExamQuestionsRequest request,
            boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Exam exam = findEntity(examId);
        majorCategoryService.requireCanActOn(
                exam.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        Set<Long> requestedIds = new LinkedHashSet<>();
        for (AddExamQuestionsRequest.Item item : request.questions()) {
            if (!requestedIds.add(item.questionId())) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "The same question cannot be added more than once.");
            }
        }

        List<ExamQuestion> existing =
                examQuestionRepository.findByExam_ExamIdOrderByDisplayOrderAsc(examId);
        Set<Long> assigned = existing.stream()
                .map(examQuestion -> examQuestion.getQuestion().getQuestionId())
                .collect(Collectors.toSet());
        int nextOrder = existing.stream()
                .map(ExamQuestion::getDisplayOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        List<Question> questions = questionRepository.findAllById(requestedIds);
        if (questions.size() != requestedIds.size()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "One or more selected questions no longer exist.");
        }
        Map<Long, Question> questionById = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, question -> question));

        Long certificationId = exam.getCertification().getCertificationId();
        for (AddExamQuestionsRequest.Item item : request.questions()) {
            if (assigned.contains(item.questionId())) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "A selected question is already assigned to this assessment.");
            }
            Question question = questionById.get(item.questionId());
            if (question.getParentQuestion() != null) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "Sub-questions are included with their parent and cannot be added directly.");
            }
            Long questionCertId = question.getLesson()
                    .getMiddleCategory().getMajorCategory()
                    .getCertification().getCertificationId();
            if (!certificationId.equals(questionCertId)) {
                throw new BusinessRuleException.QuestionNotEligibleForAssessmentException();
            }
            int order = item.displayOrder() != null ? item.displayOrder() : nextOrder++;
            examQuestionRepository.save(ExamQuestion.builder()
                    .exam(exam)
                    .question(question)
                    .displayOrder(order)
                    .points(item.points())
                    .build());
        }

        exam.setTotalQuestions((int) examQuestionRepository.countByExam_ExamId(examId));
        exam.setUpdatedAt(LocalDateTime.now());
        examRepository.save(exam);
        return toDtoWithQuestions(exam);
    }

    private void enforceUniqueness(ExamDto dto, Long ownerDepartmentId) {
        if (ownerDepartmentId != null) {
            return;
        }
        String scope = dto.getTargetScope();
        if ("LESSON".equals(scope) && dto.getLessonId() != null
                && examRepository.existsOfficialByLessonId(dto.getLessonId())) {
            throw new BusinessRuleException.AssessmentAlreadyExistsException(
                    "A quiz already exists for this lesson. Edit the existing one instead.");
        }
        if ("MIDDLE_CATEGORY".equals(scope) && dto.getMiddleCategoryId() != null
                && examRepository.existsByMiddleCategory_MiddleCategoryId(dto.getMiddleCategoryId())) {
            throw new BusinessRuleException.AssessmentAlreadyExistsException(
                    "A middle exam already exists for this middle category.");
        }
        if ("MAJOR_CATEGORY".equals(scope) && dto.getMajorCategoryId() != null
                && examRepository.existsByMajorCategory_MajorCategoryId(dto.getMajorCategoryId())) {
            throw new BusinessRuleException.AssessmentAlreadyExistsException(
                    "A major exam already exists for this major category.");
        }
        if (dto.getCertificationId() != null && dto.getExamTypeId() != null) {
            String typeText = examTypeRepository.findById(dto.getExamTypeId())
                    .map(ExamType::getExamTypeText).orElse("");
            String upper = typeText.toUpperCase(Locale.ROOT);
            if (upper.contains("DIAGNOSTIC")
                    && examRepository.existsByCertification_CertificationIdAndExamType_ExamTypeText(
                            dto.getCertificationId(), typeText)) {
                throw new BusinessRuleException.AssessmentAlreadyExistsException(
                        "A diagnostic exam already exists for this certification.");
            }
            if (upper.contains("MOCK")
                    && examRepository.existsByCertification_CertificationIdAndExamType_ExamTypeText(
                            dto.getCertificationId(), typeText)) {
                throw new BusinessRuleException.AssessmentAlreadyExistsException(
                        "A mock exam already exists for this certification.");
            }
        }
    }

    private Exam findEntity(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + id));
    }

    private ExamDto toDtoWithQuestions(Exam exam) {
        ExamDto dto = examMapper.toDto(exam);
        List<Long> questionIds = examQuestionRepository
                .findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId())
                .stream()
                .map(examQuestion -> examQuestion.getQuestion().getQuestionId())
                .toList();
        dto.setQuestionIds(questionIds);
        return dto;
    }

    private void normalizeForSave(Exam entity, ExamDto dto) {
        if (dto.getQuestions() != null) {
            entity.setTotalQuestions(dto.getQuestions().size());
        } else if (dto.getQuestionIds() != null) {
            entity.setTotalQuestions(dto.getQuestionIds().size());
        } else if (entity.getTotalQuestions() == null) {
            entity.setTotalQuestions(0);
        }

        if (entity.getPassingScore() == null) {
            entity.setPassingScore(new BigDecimal("70.00"));
        }

        String generated = generateTitle(dto);
        if (generated != null) {
            entity.setTitle(generated);
        }
    }

    private String generateTitle(ExamDto dto) {
        String scope = dto.getTargetScope();
        if ("LESSON".equals(scope) && dto.getLessonId() != null) {
            return lessonRepository.findById(dto.getLessonId())
                    .map(Lesson::getName).map(name -> name + " Quiz").orElse(null);
        }
        if ("MIDDLE_CATEGORY".equals(scope) && dto.getMiddleCategoryId() != null) {
            return middleCategoryRepository.findById(dto.getMiddleCategoryId())
                    .map(MiddleCategory::getTitle).map(title -> title + " Middle Exam").orElse(null);
        }
        if ("MAJOR_CATEGORY".equals(scope) && dto.getMajorCategoryId() != null) {
            return majorCategoryRepository.findById(dto.getMajorCategoryId())
                    .map(MajorCategory::getTitle).map(title -> title + " Major Exam").orElse(null);
        }
        if (dto.getCertificationId() != null) {
            String certTitle = certificationRepository.findById(dto.getCertificationId())
                    .map(Certification::getTitle).orElse(null);
            if (certTitle == null) {
                return null;
            }
            String typeText = dto.getExamTypeId() == null ? "" : examTypeRepository
                    .findById(dto.getExamTypeId()).map(ExamType::getExamTypeText).orElse("");
            String upper = typeText.toUpperCase(java.util.Locale.ROOT);
            if (upper.contains("MOCK")) {
                return certTitle + " Mock Exam";
            }
            if (upper.contains("DIAGNOSTIC")) {
                return certTitle + " Diagnostic Exam";
            }
            return null;
        }
        return null;
    }

    private int syncSelectedQuestions(Exam exam, ExamDto dto) {
        if (dto.getQuestions() != null) {
            syncExamQuestionsWithPoints(exam, dto.getQuestions());
            return dto.getQuestions().size();
        }
        if (dto.getQuestionIds() != null) {
            List<ExamDto.ExamQuestionInput> inputs = new ArrayList<>();
            for (Long questionId : dto.getQuestionIds()) {
                inputs.add(new ExamDto.ExamQuestionInput(questionId, null, null));
            }
            syncExamQuestionsWithPoints(exam, inputs);
            return inputs.size();
        }
        return -1;
    }

    private void syncExamQuestionsWithPoints(Exam exam, List<ExamDto.ExamQuestionInput> selection) {
        List<ExamDto.ExamQuestionInput> ordered = new ArrayList<>(selection);
        List<Long> orderedQuestionIds = ordered.stream()
                .map(ExamDto.ExamQuestionInput::getQuestionId)
                .toList();

        Set<Long> uniqueQuestionIds = new LinkedHashSet<>(orderedQuestionIds);
        if (uniqueQuestionIds.size() != orderedQuestionIds.size()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "The same question cannot be added to an assessment more than once.");
        }

        List<Question> questions = questionRepository.findAllById(orderedQuestionIds);
        if (questions.size() != orderedQuestionIds.size()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "One or more selected questions no longer exist.");
        }
        Map<Long, Question> questionById = questions.stream()
                .collect(Collectors.toMap(Question::getQuestionId, question -> question));

        Long certificationId = exam.getCertification().getCertificationId();
        Long lessonId = exam.getLesson() == null ? null : exam.getLesson().getLessonId();

        for (Long questionId : orderedQuestionIds) {
            Question question = questionById.get(questionId);
            if (question.getParentQuestion() != null) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "Sub-questions are included automatically with their parent question "
                                + "and cannot be added on their own.");
            }
            Long questionCertId = question.getLesson()
                    .getMiddleCategory().getMajorCategory()
                    .getCertification().getCertificationId();
            if (!certificationId.equals(questionCertId)) {
                throw new BusinessRuleException.QuestionNotEligibleForAssessmentException();
            }
            if (lessonId != null && !lessonId.equals(question.getLesson().getLessonId())) {
                throw new BusinessRuleException.QuestionNotEligibleForAssessmentException();
            }
        }

        examQuestionRepository.deleteByExam_ExamId(exam.getExamId());
        examQuestionRepository.flush();

        int fallbackOrder = 1;
        for (ExamDto.ExamQuestionInput input : ordered) {
            int displayOrder = input.getDisplayOrder() != null
                    ? input.getDisplayOrder()
                    : fallbackOrder;
            fallbackOrder = displayOrder + 1;
            examQuestionRepository.save(ExamQuestion.builder()
                    .exam(exam)
                    .question(questionById.get(input.getQuestionId()))
                    .displayOrder(displayOrder)
                    .points(input.getPoints())
                    .build());
        }
    }
}
