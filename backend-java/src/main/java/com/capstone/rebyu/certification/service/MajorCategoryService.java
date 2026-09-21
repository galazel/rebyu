package com.capstone.rebyu.certification.service;


import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.dto.MajorCategoryDto;
import com.capstone.rebyu.certification.mapper.MajorCategoryMapper;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.repository.MajorCategoryRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * MajorCategory is the ROOT of the ownership chain: {@code ownerDepartment} is
 * null for official, platform-wide content (admin-authored, unchanged
 * behavior) or set to one Department for Institution-Member-authored
 * content. MiddleCategory/Lesson don't carry their own owner column -- they
 * inherit it by walking up to their MajorCategory (see MiddleCategoryService/
 * LessonService), so ownership only ever needs to be decided in one place.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MajorCategoryService {
    private final MajorCategoryRepository majorCategoryRepository;
    private final MajorCategoryMapper majorCategoryMapper;
    private final DepartmentRepository departmentRepository;
    private final DepartmentService departmentService;
    private final CurriculumSubtreeService curriculumSubtreeService;

    public List<MajorCategoryDto> getAll() {
        log.debug("Fetching all major categories");
        return majorCategoryRepository.findAll().stream().map(majorCategoryMapper::toDto).toList();
    }

    public MajorCategoryDto getById(Long id) {
        log.debug("Fetching major category id: {}", id);
        return majorCategoryMapper.toDto(findEntity(id));
    }

    /**
     * @param isAdmin            an admin creates official content; ownerDepartmentId
     *                           must be null in that case.
     * @param callerInstitutionId ignored when isAdmin.
     * @param callerUserId       ignored when isAdmin.
     * @param callerIsOwner      whether the caller is the institution owner
     *                           (ignored when isAdmin).
     * @param ownerDepartmentId       required when !isAdmin -- the group this content
     *                           belongs to. The caller must be that group's
     *                           active leader or the institution owner, and the
     *                           group's own certification allocation must match
     *                           dto.certificationId -- an Institution Member can
     *                           only add content to the certification their
     *                           group is actually under, never an unrelated one.
     */
    public MajorCategoryDto create(
            MajorCategoryDto dto, boolean isAdmin,
            Long callerInstitutionId, Long callerUserId, boolean callerIsOwner, Long ownerDepartmentId) {
        log.info("Creating new major category (ownerDepartmentId={})", ownerDepartmentId);
        MajorCategory entity = majorCategoryMapper.toEntity(dto);
        entity.setMajorCategoryId(null);
        entity.setOwnerDepartment(resolveAndAuthorizeOwnerDepartment(
                isAdmin, callerInstitutionId, callerUserId, callerIsOwner, ownerDepartmentId, dto.getCertificationId()));
        MajorCategoryDto result = majorCategoryMapper.toDto(majorCategoryRepository.save(entity));
        log.info("MajorCategory created with id: {}", result.getMajorCategoryId());
        return result;
    }

    public MajorCategoryDto update(
            Long id, MajorCategoryDto dto,
            boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        log.info("Updating major category id: {}", id);
        MajorCategory existing = findEntity(id);
        requireCanActOn(existing.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);
        MajorCategory entity = majorCategoryMapper.toEntity(dto);
        entity.setMajorCategoryId(id);
        entity.setOwnerDepartment(existing.getOwnerDepartment());
        MajorCategoryDto result = majorCategoryMapper.toDto(majorCategoryRepository.save(entity));
        log.info("MajorCategory id: {} updated", id);
        return result;
    }

    public void delete(Long id, boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        log.info("Deleting major category id: {}", id);
        MajorCategory existing = findEntity(id);
        requireCanActOn(existing.getOwnerDepartment(), isAdmin, callerInstitutionId, callerUserId, callerIsOwner);

        // Everything under the whole branch -- the major's own assessment, each
        // module's, and every lesson's quiz and questions. JPA cascades the
        // categories and lessons; none of that content goes with them.
        curriculumSubtreeService.clearFor(CurriculumSubtreeService.Node.MAJOR, id);
        majorCategoryRepository.deleteById(id);
        log.info("MajorCategory id: {} deleted", id);
    }

    /**
     * Resolves the managed Department for a NEW major category and checks
     * the caller may actually create content under it. Public so
     * MiddleCategoryService/LessonService (same package) and ExamService
     * (assessment package -- an Exam's ownership follows the identical rule)
     * can reuse the exact same check instead of re-implementing it.
     */
    public Department resolveAndAuthorizeOwnerDepartment(
            boolean isAdmin, Long callerInstitutionId, Long callerUserId, boolean callerIsOwner,
            Long ownerDepartmentId, Long targetCertificationId) {
        if (ownerDepartmentId == null) {
            if (!isAdmin) {
                throw new IllegalArgumentException(
                        "Only an admin may create official (platform-wide) content.");
            }
            return null;
        }
        // Reuses the exact tenant + owner-or-active-leader check
        // DepartmentController already relies on -- throws EntityNotFoundException
        // if the group belongs to a different institution, or the caller can't act on it.
        departmentService.getAccessibleById(ownerDepartmentId, callerInstitutionId, callerUserId, callerIsOwner);

        Department group = departmentRepository.findById(ownerDepartmentId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + ownerDepartmentId));
        Long groupCertificationId = group.getInstitutionCert() != null && group.getInstitutionCert().getCertification() != null
                ? group.getInstitutionCert().getCertification().getCertificationId() : null;
        if (!Objects.equals(groupCertificationId, targetCertificationId)) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "This group's certification does not match the certification you're adding content to.");
        }
        return group;
    }

    /** Same rule as {@link #resolveAndAuthorizeOwnerDepartment}, for editing/deleting existing content. */
    public void requireCanActOn(
            Department ownerDepartment, boolean isAdmin,
            Long callerInstitutionId, Long callerUserId, boolean callerIsOwner) {
        if (ownerDepartment == null) {
            if (!isAdmin) {
                throw new IllegalArgumentException("Only an admin may modify official (platform-wide) content.");
            }
            return;
        }
        if (isAdmin) {
            return;
        }
        departmentService.getAccessibleById(
                ownerDepartment.getDepartmentId(), callerInstitutionId, callerUserId, callerIsOwner);
    }

    private MajorCategory findEntity(Long id) {
        return majorCategoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MajorCategory not found: " + id));
    }
}
