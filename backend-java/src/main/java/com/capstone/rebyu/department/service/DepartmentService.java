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

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAll(Long institutionId, Long institutionCertId) {
        List<Department> groups = departmentRepository.findByInstitution_InstitutionId(institutionId);
        if (institutionCertId != null) {
            groups = groups.stream()
                    .filter(g -> g.covers(institutionCertId))
                    .toList();
        }
        return groups.stream().map(departmentMapper::toDto).toList();
    }

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
                .filter(group -> institutionCertId == null || group.covers(institutionCertId))
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

    public DepartmentDto update(Long id, DepartmentDto dto, Long callerInstitutionId) {
        log.info("Updating institution group id: {}", id);
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setDepartmentName(dto.getDepartmentName());
        entity.setDepartmentDescription(dto.getDepartmentDescription());
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
