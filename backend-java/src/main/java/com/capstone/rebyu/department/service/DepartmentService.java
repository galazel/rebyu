package com.capstone.rebyu.department.service;

import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.mapper.DepartmentMapper;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentHeadAssignmentRepository departmentHeadAssignmentRepository;
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final DepartmentMapper departmentMapper;

    // institutionId is always the JWT-derived caller (never client-supplied and
    // never optional here) so this can never fall through to a global fetch.
    // institutionCertId, when given, narrows further -- but only within that same
    // institution, so a caller can't read another tenant's groups by guessing
    // an institutionCertId that belongs to a different institution.
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAll(Long institutionId, Long institutionCertId) {
        List<Department> groups = departmentRepository.findByInstitution_InstitutionId(institutionId);
        if (institutionCertId != null) {
            groups = groups.stream()
                    .filter(g -> g.getInstitutionCert() != null && institutionCertId.equals(g.getInstitutionCert().getInstitutionCertId()))
                    .toList();
        }
        return groups.stream().map(departmentMapper::toDto).toList();
    }

    /**
     * Owners may see every group in their institution. Other Institution Members
     * receive only the groups for which they are an active authority.
     */
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAccessible(
            Long institutionId, Long userId, boolean owner, Long institutionCertId) {
        List<Department> groups = owner
                ? departmentRepository.findByInstitution_InstitutionId(institutionId)
                : departmentRepository.findActiveAuthorizedGroups(
                        institutionId,
                        userId,
                        Department.Status.active,
                        DepartmentHeadAssignment.Status.active);
        return groups.stream()
                .filter(group -> institutionCertId == null || Objects.equals(group.getInstitutionCert().getInstitutionCertId(), institutionCertId))
                .map(departmentMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDto getAccessibleById(Long id, Long institutionId, Long userId, boolean owner) {
        Department entity = findEntity(id);
        requireSameInstitution(entity, institutionId);
        boolean hasAccess = owner || departmentHeadAssignmentRepository.existsByDepartmentAndUserAndStatus(
                entity,
                com.capstone.rebyu.user.entity.User.builder().userId(userId).build(),
                DepartmentHeadAssignment.Status.active);
        if (!hasAccess) {
            throw new EntityNotFoundException("Department not found: " + id);
        }
        return departmentMapper.toDto(entity);
    }

    @Transactional(readOnly = true)
    public DepartmentDto getById(Long id, Long callerInstitutionId) {
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        return departmentMapper.toDto(entity);
    }

    public DepartmentDto create(DepartmentDto dto) {
        log.info("Creating institution group '{}' for institutionCertId={}", dto.getDepartmentName(), dto.getInstitutionCertId());

        InstitutionCertificate institutionCert = institutionCertificateRepository.findById(dto.getInstitutionCertId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "InstitutionCertificate not found: " + dto.getInstitutionCertId()));

        // The org cert allocation referenced by the group must belong to the
        // SAME institution the caller was resolved to -- otherwise a caller
        // could create a group under an allocation owned by another tenant.
        Long institutionCertInstitutionId = institutionCert.getInstitution() != null
                ? institutionCert.getInstitution().getInstitutionId() : null;
        if (!Objects.equals(dto.getInstitutionId(), institutionCertInstitutionId)) {
            throw new EntityNotFoundException("InstitutionCertificate not found: " + dto.getInstitutionCertId());
        }

        // A single group can't be handed more slots than the certification
        // allocation itself has -- a real (if generous) sanity bound. It does
        // NOT sum across sibling groups; that would require re-validating every
        // other group whenever one changes.
        if (dto.getTotalSlots() > institutionCert.getTotalSlots()) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "This group can have at most " + institutionCert.getTotalSlots()
                            + " slot(s) -- the certification's own allocation limit.");
        }

        Department entity = departmentMapper.toEntity(dto);
        entity.setDepartmentId(null);
        // The mapper builds DETACHED stubs for the institutionCert/institution FKs (id
        // set, @Version null). Persisting the group against those stubs throws
        // "uninitialized version value 'null'". Attach the managed institutionCert we
        // already loaded (and its managed institution) instead.
        entity.setInstitutionCert(institutionCert);
        entity.setInstitution(institutionCert.getInstitution());
        entity.setCreatedAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : Department.Status.active);
        entity.setUsedSlots(0);
        DepartmentDto result = departmentMapper.toDto(departmentRepository.save(entity));
        log.info("Institution group created with id: {}", result.getDepartmentId());
        return result;
    }

    public DepartmentDto update(Long id, DepartmentDto dto, Long callerInstitutionId) {
        log.info("Updating institution group id: {}", id);
        // Mutate editable fields only; createdBy/createdAt/institution/institutionCert/
        // usedSlots are immutable here -- usedSlots only changes via invitations.
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setDepartmentName(dto.getDepartmentName());
        entity.setDepartmentDescription(dto.getDepartmentDescription());
        if (dto.getTotalSlots() != null) {
            if (dto.getTotalSlots() < entity.getUsedSlots()) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This group already has " + entity.getUsedSlots()
                                + " slot(s) in use -- lower the limit no further than that.");
            }
            InstitutionCertificate institutionCert = entity.getInstitutionCert();
            if (institutionCert != null && dto.getTotalSlots() > institutionCert.getTotalSlots()) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This group can have at most " + institutionCert.getTotalSlots()
                                + " slot(s) -- the certification's own allocation limit.");
            }
            entity.setTotalSlots(dto.getTotalSlots());
        }
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        return departmentMapper.toDto(departmentRepository.save(entity));
    }

    public void delete(Long id, Long callerInstitutionId) {
        log.info("Archiving institution group id: {}", id);
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setStatus(Department.Status.archived);
        departmentRepository.save(entity);
    }

    private void requireSameInstitution(Department entity, Long callerInstitutionId) {
        Long ownerInstitutionId = entity.getInstitution() != null
                ? entity.getInstitution().getInstitutionId() : null;
        if (!Objects.equals(ownerInstitutionId, callerInstitutionId)) {
            throw new EntityNotFoundException("Department not found: " + entity.getDepartmentId());
        }
    }

    private Department findEntity(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found: " + id));
    }
}
