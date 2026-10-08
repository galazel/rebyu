package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.certification.dto.LessonComponentResponseDto;
import com.capstone.rebyu.certification.dto.LessonDto;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.mapper.LessonMapper;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.certification.repository.MiddleCategoryRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;
    private final MiddleCategoryRepository middleCategoryRepository;
    private final LessonImageService lessonImageService;
    private final LessonVideoService lessonVideoService;
    private final MajorCategoryService majorCategoryService;
    private final CurriculumSubtreeService curriculumSubtreeService;

    public List<LessonDto> getAll() {
        return lessonRepository.findAll()
                .stream()
                .map(lessonMapper::toDto)
                .toList();
    }

    public List<LessonDto> getByMiddleCategoryId(Long middleCategoryId) {
        return lessonRepository
                .findByMiddleCategory_MiddleCategoryId(middleCategoryId)
                .stream()
                .map(lessonMapper::toDto)
                .toList();
    }

    public LessonDto getById(Long id) {
        return lessonMapper.toDto(findEntity(id));
    }

    public LessonDto create(
            LessonDto dto, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        MiddleCategory middleCategory = findMiddleCategory(dto.getMiddleCategoryId());
        majorCategoryService.requireCanActOn(
                middleCategory.getMajorCategory().getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        Lesson entity = lessonMapper.toEntity(dto);
        entity.setLessonId(null);
        entity.setMiddleCategory(middleCategory);
        entity.setLessonComponentStructure(normalizeStructure(entity.getLessonComponentStructure()));

        return lessonMapper.toDto(lessonRepository.save(entity));
    }

    public LessonDto update(
            Long id, LessonDto dto, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Lesson existing = findEntity(id);
        majorCategoryService.requireCanActOn(
                existing.getMiddleCategory().getMajorCategory().getOwnerDepartment(),
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        MiddleCategory targetMiddleCategory = findMiddleCategory(dto.getMiddleCategoryId());
        if (!Objects.equals(ownerDepartmentId(existing.getMiddleCategory()), ownerDepartmentId(targetMiddleCategory))) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "This lesson can't be moved to a module owned by someone else.");
        }

        Lesson entity = lessonMapper.toEntity(dto);
        entity.setLessonId(id);
        entity.setMiddleCategory(targetMiddleCategory);
        String structure = entity.getLessonComponentStructure();
        entity.setLessonComponentStructure(normalizeStructure(
                structure != null ? structure : existing.getLessonComponentStructure()));

        return lessonMapper.toDto(lessonRepository.save(entity));
    }

    public void delete(Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Lesson existing = findEntity(id);
        majorCategoryService.requireCanActOn(
                existing.getMiddleCategory().getMajorCategory().getOwnerDepartment(),
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        curriculumSubtreeService.clearFor(CurriculumSubtreeService.Node.LESSON, id);
        lessonRepository.deleteById(id);
    }

    public void saveLessonComponent(
            Long id, LessonDto lessonDto,
            boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Lesson lesson = findEntity(id);
        majorCategoryService.requireCanActOn(
                lesson.getMiddleCategory().getMajorCategory().getOwnerDepartment(),
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        String structure = lessonDto.getLessonComponentStructure();

        lesson.setLessonComponentStructure(
                structure == null || structure.isBlank()
                        ? "[]"
                        : structure
        );

        lessonRepository.save(lesson);
    }

    @Transactional(readOnly = true)
    public LessonComponentResponseDto getLessonComponent(Long id) {
        Lesson lesson = findEntity(id);

        String structure = lesson.getLessonComponentStructure();

        if (structure == null || structure.isBlank()) {
            structure = "[]";
        }

        return new LessonComponentResponseDto(
                structure,
                lessonImageService.getImageKeysByLessonId(id),
                lessonVideoService.getVideoKeysByLessonId(id)
        );
    }

    private String normalizeStructure(String structure) {
        return structure == null || structure.isBlank() ? "[]" : structure;
    }

    private Long ownerDepartmentId(MiddleCategory middleCategory) {
        return middleCategory.getMajorCategory().getOwnerDepartment() != null
                ? middleCategory.getMajorCategory().getOwnerDepartment().getDepartmentId() : null;
    }

    private MiddleCategory findMiddleCategory(Long middleCategoryId) {
        return middleCategoryRepository
                .findById(middleCategoryId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "MiddleCategory not found: "
                                        + middleCategoryId
                        )
                );
    }

    private Lesson findEntity(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Lesson not found: " + id
                        )
                );
    }
}
