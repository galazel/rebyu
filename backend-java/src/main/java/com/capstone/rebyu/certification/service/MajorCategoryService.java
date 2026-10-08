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

        curriculumSubtreeService.clearFor(CurriculumSubtreeService.Node.MAJOR, id);
        majorCategoryRepository.deleteById(id);
        log.info("MajorCategory id: {} deleted", id);
    }

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
