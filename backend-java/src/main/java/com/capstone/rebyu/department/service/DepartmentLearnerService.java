package com.capstone.rebyu.department.service;

import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.department.dto.DepartmentLearnerDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.mapper.DepartmentLearnerMapper;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
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
public class DepartmentLearnerService {

    private final DepartmentLearnerRepository departmentLearnerRepository;
    private final DepartmentRepository departmentRepository;
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;
    private final DepartmentLearnerMapper departmentLearnerMapper;

    @Transactional(readOnly = true)
    public List<DepartmentLearnerDto> getAll(Long departmentId) {
        List<DepartmentLearner> assignees = departmentId != null
                ? departmentLearnerRepository.findByDepartment_DepartmentId(departmentId)
                : departmentLearnerRepository.findAll();
        return assignees.stream().map(departmentLearnerMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentLearnerDto getById(Long id) {
        return departmentLearnerMapper.toDto(findEntity(id));
    }

    public DepartmentLearnerDto create(DepartmentLearnerDto dto, Long callerInstitutionId) {
        log.info("Adding learner (institutionCertLearnerId={}) to departmentId={}",
                dto.getInstitutionCertLearnerId(), dto.getDepartmentId());

        Department group = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department not found: " + dto.getDepartmentId()));

        if (group.getInstitution() == null
                || !group.getInstitution().getInstitutionId().equals(callerInstitutionId)) {
            throw new EntityNotFoundException(
                    "Department not found: " + dto.getDepartmentId());
        }

        InstitutionCertificationLearner learner = institutionCertificationLearnerRepository
                .findById(dto.getInstitutionCertLearnerId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "InstitutionCertificationLearner not found: " + dto.getInstitutionCertLearnerId()));

        // The learner must already hold institution_cert access for the SAME allocation the
        // group belongs to — you cannot group a learner into another certification.
        Long groupInstitutionCertId = group.getInstitutionCert() != null ? group.getInstitutionCert().getInstitutionCertId() : null;
        Long learnerInstitutionCertId = learner.getInstitutionCert() != null ? learner.getInstitutionCert().getInstitutionCertId() : null;
        if (!Objects.equals(groupInstitutionCertId, learnerInstitutionCertId)) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "This learner does not have access to the certification this group belongs to.");
        }

        // Reactivate an archived assignment instead of colliding with it — the
        // partial unique index (uq_institution_group_assignee_active) only
        // guards active rows, so a stale archived row must be found and
        // revived explicitly rather than inserted alongside.
        var existing = departmentLearnerRepository.findByDepartmentAndInstitutionCertLearner(group, learner);
        if (existing.isPresent()) {
            DepartmentLearner row = existing.get();
            if (row.getStatus() == DepartmentLearner.Status.active) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This learner is already assigned to this group.");
            }
            row.setStatus(DepartmentLearner.Status.active);
            row.setRemovedAt(null);
            row.setAssignedAt(LocalDateTime.now());
            row.setAssignedBy(com.capstone.rebyu.user.entity.User.builder().userId(dto.getAssignedBy()).build());
            row.setRole(dto.getRole() != null ? dto.getRole() : DepartmentLearner.Role.member);
            DepartmentLearnerDto reactivated =
                    departmentLearnerMapper.toDto(departmentLearnerRepository.save(row));
            log.info("Reactivated institution group assignee id: {}", reactivated.getDepartmentLearnerId());
            return reactivated;
        }

        DepartmentLearner entity = departmentLearnerMapper.toEntity(dto);
        entity.setDepartmentLearnerId(null);
        entity.setAssignedAt(dto.getAssignedAt() != null ? dto.getAssignedAt() : LocalDateTime.now());
        entity.setStatus(DepartmentLearner.Status.active);
        entity.setRole(dto.getRole() != null ? dto.getRole() : DepartmentLearner.Role.member);
        entity.setRemovedAt(null);
        DepartmentLearnerDto result =
                departmentLearnerMapper.toDto(departmentLearnerRepository.save(entity));
        log.info("Institution group assignee created with id: {}", result.getDepartmentLearnerId());
        return result;
    }

    /** Archive (soft-remove) a learner from a group. */
    public void delete(Long id, Long callerInstitutionId) {
        log.info("Removing institution group assignee id: {}", id);
        DepartmentLearner entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setStatus(DepartmentLearner.Status.archived);
        entity.setRemovedAt(LocalDateTime.now());
        departmentLearnerRepository.save(entity);
    }

    /** Change a learner's standing within the group (peer lead vs. regular member). */
    public DepartmentLearnerDto changeRole(
            Long id, DepartmentLearner.Role newRole, Long callerInstitutionId) {
        DepartmentLearner entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setRole(newRole);
        return departmentLearnerMapper.toDto(departmentLearnerRepository.save(entity));
    }

    private void requireSameInstitution(DepartmentLearner entity, Long callerInstitutionId) {
        Department group = entity.getDepartment();
        if (group == null || group.getInstitution() == null
                || !group.getInstitution().getInstitutionId().equals(callerInstitutionId)) {
            throw new EntityNotFoundException(
                    "DepartmentLearner not found: " + entity.getDepartmentLearnerId());
        }
    }

    private DepartmentLearner findEntity(Long id) {
        return departmentLearnerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DepartmentLearner not found: " + id));
    }
}
