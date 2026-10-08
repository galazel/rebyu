package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.QuestionDto;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.mapper.QuestionMapper;
import com.capstone.rebyu.assessment.repository.ChoiceRepository;
import com.capstone.rebyu.assessment.repository.DiagramQuestionConfigRepository;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ProgrammingQuestionConfigRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.TextQuestionConfigRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final LessonRepository lessonRepository;
    private final ChoiceRepository choiceRepository;
    private final TextQuestionConfigRepository textQuestionConfigRepository;
    private final ProgrammingQuestionConfigRepository programmingQuestionConfigRepository;
    private final DiagramQuestionConfigRepository diagramQuestionConfigRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final QuestionMapper questionMapper;
    private final InstitutionCertificateRepository institutionCertificateRepository;

    public List<QuestionDto> getAll(Long includeDepartmentId) {
        log.debug("Fetching all questions (includeDepartmentId={})", includeDepartmentId);
        return questionRepository.findAll().stream()
                .filter(question -> isVisible(question, includeDepartmentId))
                .map(questionMapper::toDto).toList();
    }

    public List<QuestionDto> getByCertificationId(Long certificationId, Long includeDepartmentId) {
        log.debug("Fetching questions for certification id: {}", certificationId);
        return questionRepository.findBankByCertificationId(certificationId).stream()
                .filter(question -> isVisible(question, includeDepartmentId))
                .map(questionMapper::toDto).toList();
    }

    public List<QuestionDto> getByLessonId(Long lessonId, Long includeDepartmentId) {
        log.debug("Fetching questions for lesson id: {}", lessonId);
        return questionRepository.findByLesson_LessonId(lessonId).stream()
                .filter(question -> isVisible(question, includeDepartmentId))
                .map(questionMapper::toDto).toList();
    }

    public QuestionDto getById(Long id, Long includeDepartmentId) {
        log.debug("Fetching question id: {}", id);
        Question entity = findEntity(id);
        if (!isVisible(entity, includeDepartmentId)) {
            throw new EntityNotFoundException("Question not found: " + id);
        }
        return questionMapper.toDto(entity);
    }

    private boolean isVisible(Question question, Long includeDepartmentId) {
        return question.getOwnerDepartment() == null
                || question.getOwnerDepartment().getDepartmentId().equals(includeDepartmentId);
    }

    public QuestionDto create(
            QuestionDto dto, Long creatorUserId, Long restrictToInstitutionId, Department ownerDepartment) {
        log.info("Creating new question (ownerDepartment={})",
                ownerDepartment == null ? null : ownerDepartment.getDepartmentId());
        validateLesson(dto, restrictToInstitutionId);
        if (dto.getParentQuestionId() == null && dto.getQuestionText() != null) {
            questionRepository.findByParentQuestionIsNullAndLesson_LessonIdOrderByQuestionIdAsc(dto.getLessonId()).stream()
                    .filter(existing -> QuestionStem.sameQuestion(existing.getQuestionText(), dto.getQuestionText()))
                    .findFirst()
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("This lesson already asks this (question "
                                + existing.getQuestionId() + "): " + existing.getQuestionText());
                    });
        }
        Question entity = questionMapper.toEntity(dto);
        entity.setQuestionId(null);
        entity.setCreatedBy(User.builder().userId(creatorUserId).build());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setOwnerDepartment(ownerDepartment);
        resolveParent(entity, dto.getParentQuestionId());
        QuestionDto result = questionMapper.toDto(questionRepository.save(entity));
        log.info("Question created with id: {} by userId={}", result.getQuestionId(), creatorUserId);
        return result;
    }

    public QuestionDto update(
            Long id, QuestionDto dto, Long callerUserId, boolean isAdmin, Long restrictToInstitutionId) {
        log.info("Updating question id: {}", id);
        validateLesson(dto, restrictToInstitutionId);
        Question entity = findEntity(id);
        if (!isAdmin) {
            requireOwnAuthorship(entity, callerUserId);
        }
        entity.setQuestionType(dto.getQuestionType());
        entity.setDifficultyLevel(dto.getDifficultyLevel());
        entity.setQuestionText(dto.getQuestionText());
        entity.setImageKey(dto.getImageKey());
        entity.setLesson(lessonRepository.getReferenceById(dto.getLessonId()));
        resolveParent(entity, dto.getParentQuestionId());
        QuestionDto result = questionMapper.toDto(questionRepository.save(entity));
        log.info("Question id: {} updated", id);
        return result;
    }

    private void validateLesson(QuestionDto dto, Long restrictToInstitutionId) {
        if (dto.getLessonId() == null) {
            throw new IllegalArgumentException("A lessonId is required to save a question.");
        }
        Lesson lesson = lessonRepository.findById(dto.getLessonId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lesson not found: " + dto.getLessonId()));

        Long resolvedCertificationId = Optional.ofNullable(lesson.getMiddleCategory())
                .map(MiddleCategory::getMajorCategory)
                .map(MajorCategory::getCertification)
                .map(Certification::getCertificationId)
                .orElse(null);

        if (dto.getCertificationId() != null
                && !dto.getCertificationId().equals(resolvedCertificationId)) {
            throw new IllegalArgumentException(
                    "Lesson " + dto.getLessonId() + " does not belong to certification "
                            + dto.getCertificationId() + ".");
        }

        if (restrictToInstitutionId != null) {
            boolean hasAccess = resolvedCertificationId != null
                    && institutionCertificateRepository.findByInstitution_InstitutionIdAndCertification_CertificationId(
                            restrictToInstitutionId, resolvedCertificationId).isPresent();
            if (!hasAccess) {
                throw new BusinessRuleException.QuestionAccessException(
                        "Your institution does not have access to this certification.");
            }
        }
    }

    private void requireOwnAuthorship(Question entity, Long callerUserId) {
        if (entity.getCreatedBy() == null
                || !entity.getCreatedBy().getUserId().equals(callerUserId)) {
            throw new BusinessRuleException.QuestionAccessException(
                    "You can only modify questions you created.");
        }
    }

    public void delete(Long id, Long callerUserId, boolean isAdmin) {
        log.info("Deleting question id: {}", id);
        Question entity = findEntity(id);
        if (!isAdmin) {
            requireOwnAuthorship(entity, callerUserId);
        }
        validateQuestionTreeCanBeDeleted(id);
        deleteQuestionTree(id);
        log.info("Question id: {} deleted", id);
    }

    private void validateQuestionTreeCanBeDeleted(Long id) {
        findEntity(id);

        if (examQuestionRepository.existsByQuestion_QuestionId(id)) {
            throw new IllegalStateException("Question cannot be deleted because it is already used in an exam.");
        }


        questionRepository.findByParentQuestion_QuestionId(id)
                .forEach(childQuestion -> validateQuestionTreeCanBeDeleted(childQuestion.getQuestionId()));
    }

    private void deleteQuestionTree(Long id) {
        questionRepository.findByParentQuestion_QuestionId(id)
                .forEach(childQuestion -> deleteQuestionTree(childQuestion.getQuestionId()));

        deleteQuestionDependents(id);
        questionRepository.deleteByQuestionId(id);
    }

    private void deleteQuestionDependents(Long questionId) {
        textQuestionConfigRepository.findByQuestion_QuestionId(questionId)
                .ifPresent(textQuestionConfigRepository::delete);
        programmingQuestionConfigRepository.findByQuestion_QuestionId(questionId)
                .ifPresent(programmingQuestionConfigRepository::delete);
        diagramQuestionConfigRepository.findByQuestion_QuestionId(questionId)
                .ifPresent(diagramQuestionConfigRepository::delete);
        choiceRepository.deleteByQuestion_QuestionId(questionId);
    }

    private void resolveParent(Question entity, Long parentId) {
        entity.setParentQuestion(parentId != null ? findEntity(parentId) : null);
    }

    private Question findEntity(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Question not found: " + id));
    }
}
