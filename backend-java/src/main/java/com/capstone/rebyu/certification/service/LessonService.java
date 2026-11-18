package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.certification.dto.LessonComponentResponseDto;
import com.capstone.rebyu.certification.dto.LessonDto;
import com.capstone.rebyu.certification.dto.LessonVersionDto;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.LessonVersion;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.mapper.LessonMapper;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.certification.repository.LessonVersionRepository;
import com.capstone.rebyu.certification.repository.MiddleCategoryRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    private final LessonVersionRepository lessonVersionRepository;

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
            boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner,
            String callerName) {
        Lesson lesson = findEntity(id);
        majorCategoryService.requireCanActOn(
                lesson.getMiddleCategory().getMajorCategory().getOwnerDepartment(),
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        String previous = normalizeStructure(lesson.getLessonComponentStructure());
        String structure = normalizeStructure(lessonDto.getLessonComponentStructure());

        lesson.setLessonComponentStructure(structure);
        lessonRepository.save(lesson);

        recordVersion(id, previous, structure, callerUserId, callerName);
    }

    /**
     * Appends the saved content to the lesson's history. The first save after history existed
     * also keeps what was there before (generated or older content), so it stays restorable.
     */
    private void recordVersion(Long lessonId, String previous, String structure, Long userId, String userName) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC); // UTC; the client appends "Z"
        if (!lessonVersionRepository.existsByLessonId(lessonId)) {
            if (!"[]".equals(previous) && !previous.equals(structure)) {
                lessonVersionRepository.save(newVersion(lessonId, previous, null, null, now.minusSeconds(1)));
            }
        } else {
            String latest = lessonVersionRepository.findFirstByLessonIdOrderByCreatedAtDescLessonVersionIdDesc(lessonId)
                    .map(LessonVersion::getLessonComponentStructure).orElse(null);
            if (structure.equals(latest)) {
                return;
            }
        }
        lessonVersionRepository.save(newVersion(lessonId, structure, userId, userName, now));
    }

    private LessonVersion newVersion(Long lessonId, String structure, Long userId, String userName, LocalDateTime at) {
        LessonVersion version = new LessonVersion();
        version.setLessonId(lessonId);
        version.setLessonComponentStructure(structure);
        version.setSavedByUserId(userId);
        version.setSavedByName(userName);
        version.setCreatedAt(at);
        return version;
    }

    @Transactional(readOnly = true)
    public List<LessonVersionDto> getVersions(
            Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        requireCanEdit(id, isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        return lessonVersionRepository.findAllByLessonIdOrderByCreatedAtDescLessonVersionIdDesc(id).stream()
                .map(v -> new LessonVersionDto(v.getLessonVersionId(), v.getSavedByName(), v.getCreatedAt(), null))
                .toList();
    }

    @Transactional(readOnly = true)
    public LessonVersionDto getVersion(
            Long id, Long versionId, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        requireCanEdit(id, isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        LessonVersion v = lessonVersionRepository.findByLessonVersionIdAndLessonId(versionId, id)
                .orElseThrow(() -> new EntityNotFoundException("Lesson version not found"));
        return new LessonVersionDto(v.getLessonVersionId(), v.getSavedByName(), v.getCreatedAt(), v.getLessonComponentStructure());
    }

    private void requireCanEdit(Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        Lesson lesson = findEntity(id);
        majorCategoryService.requireCanActOn(
                lesson.getMiddleCategory().getMajorCategory().getOwnerDepartment(),
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
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
