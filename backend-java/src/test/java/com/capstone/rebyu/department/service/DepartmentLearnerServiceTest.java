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
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DepartmentLearnerServiceTest {

    private static final Long CALLER_INSTITUTION_ID = 1L;
    private static final Long OTHER_INSTITUTION_ID = 2L;
    private static final Long GROUP_ID = 10L;
    private static final Long INSTITUTION_CERT_LEARNER_ID = 20L;
    private static final Long INSTITUTION_CERT_ID = 30L;
    private static final Long ASSIGNEE_ID = 40L;

    private DepartmentLearnerRepository assigneeRepository;
    private DepartmentRepository groupRepository;
    private InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private DepartmentLearnerMapper mapper;

    private DepartmentLearnerService service;

    @BeforeEach
    void setUp() {
        assigneeRepository = mock(DepartmentLearnerRepository.class);
        groupRepository = mock(DepartmentRepository.class);
        institutionCertLearnerRepository = mock(InstitutionCertificationLearnerRepository.class);
        mapper = mock(DepartmentLearnerMapper.class);

        service = new DepartmentLearnerService(
                assigneeRepository, groupRepository, institutionCertLearnerRepository, mapper);

        when(mapper.toDto(any(DepartmentLearner.class))).thenAnswer(inv -> {
            DepartmentLearner entity = inv.getArgument(0);
            DepartmentLearnerDto dto = new DepartmentLearnerDto();
            dto.setDepartmentLearnerId(entity.getDepartmentLearnerId());
            dto.setStatus(entity.getStatus());
            dto.setRole(entity.getRole());
            return dto;
        });
        when(mapper.toEntity(any(DepartmentLearnerDto.class))).thenAnswer(inv -> {
            DepartmentLearnerDto dto = inv.getArgument(0);
            return DepartmentLearner.builder()
                    .departmentLearnerId(dto.getDepartmentLearnerId())
                    .status(dto.getStatus())
                    .role(dto.getRole())
                    .build();
        });
    }

    private Department group(Long institutionId) {
        Institution institution = new Institution();
        institution.setInstitutionId(institutionId);
        InstitutionCertificate institutionCert = new InstitutionCertificate();
        institutionCert.setInstitutionCertId(INSTITUTION_CERT_ID);
        return Department.builder()
                .departmentId(GROUP_ID)
                .institution(institution)
                .institutionCert(institutionCert)
                .build();
    }

    private InstitutionCertificationLearner learner(Long institutionCertId) {
        InstitutionCertificate institutionCert = new InstitutionCertificate();
        institutionCert.setInstitutionCertId(institutionCertId);
        return InstitutionCertificationLearner.builder()
                .institutionCertLearnerId(INSTITUTION_CERT_LEARNER_ID)
                .institutionCert(institutionCert)
                .build();
    }

    private DepartmentLearnerDto dto() {
        DepartmentLearnerDto dto = new DepartmentLearnerDto();
        dto.setDepartmentId(GROUP_ID);
        dto.setInstitutionCertLearnerId(INSTITUTION_CERT_LEARNER_ID);
        dto.setAssignedBy(99L);
        return dto;
    }

    // 1: cross-tenant group access is rejected
    @Test
    void create_groupBelongsToDifferentInstitution_throwsNotFound() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(OTHER_INSTITUTION_ID)));

        assertThrows(EntityNotFoundException.class,
                () -> service.create(dto(), CALLER_INSTITUTION_ID));
    }

    // 2: learner from a different certification allocation is rejected
    @Test
    void create_learnerBelongsToDifferentInstitutionCert_throwsBusinessRuleException() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        when(institutionCertLearnerRepository.findById(INSTITUTION_CERT_LEARNER_ID))
                .thenReturn(Optional.of(learner(999L))); // different org cert than the group's

        assertThrows(BusinessRuleException.DepartmentRuleException.class,
                () -> service.create(dto(), CALLER_INSTITUTION_ID));
    }

    // 3: brand new assignment succeeds, defaults to member role
    @Test
    void create_newAssignment_defaultsToHeadRole() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        when(institutionCertLearnerRepository.findById(INSTITUTION_CERT_LEARNER_ID))
                .thenReturn(Optional.of(learner(INSTITUTION_CERT_ID)));
        when(assigneeRepository.findByDepartmentAndInstitutionCertLearner(any(), any()))
                .thenReturn(Optional.empty());
        when(assigneeRepository.save(any(DepartmentLearner.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DepartmentLearnerDto result = service.create(dto(), CALLER_INSTITUTION_ID);

        assertEquals(DepartmentLearner.Role.member, result.getRole());
        assertEquals(DepartmentLearner.Status.active, result.getStatus());
    }

    // 4: duplicate ACTIVE assignment is rejected
    @Test
    void create_alreadyActiveAssignment_throwsBusinessRuleException() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        when(institutionCertLearnerRepository.findById(INSTITUTION_CERT_LEARNER_ID))
                .thenReturn(Optional.of(learner(INSTITUTION_CERT_ID)));
        DepartmentLearner activeRow = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .status(DepartmentLearner.Status.active)
                .build();
        when(assigneeRepository.findByDepartmentAndInstitutionCertLearner(any(), any()))
                .thenReturn(Optional.of(activeRow));

        assertThrows(BusinessRuleException.DepartmentRuleException.class,
                () -> service.create(dto(), CALLER_INSTITUTION_ID));
        verify(assigneeRepository, times(0)).save(any());
    }

    // 5: re-adding a previously removed (archived) learner reactivates the row
    @Test
    void create_archivedAssignment_reactivatesInsteadOfInserting() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        when(institutionCertLearnerRepository.findById(INSTITUTION_CERT_LEARNER_ID))
                .thenReturn(Optional.of(learner(INSTITUTION_CERT_ID)));
        DepartmentLearner archivedRow = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .status(DepartmentLearner.Status.archived)
                .removedAt(LocalDateTime.now().minusDays(1))
                .role(DepartmentLearner.Role.lead)
                .build();
        when(assigneeRepository.findByDepartmentAndInstitutionCertLearner(any(), any()))
                .thenReturn(Optional.of(archivedRow));
        when(assigneeRepository.save(any(DepartmentLearner.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DepartmentLearnerDto result = service.create(dto(), CALLER_INSTITUTION_ID);

        assertEquals(ASSIGNEE_ID, result.getDepartmentLearnerId()); // same row, not a new one
        assertEquals(DepartmentLearner.Status.active, result.getStatus());
        assertEquals(DepartmentLearner.Role.member, result.getRole()); // dto had no role -> defaults
    }

    // 6: delete rejects cross-tenant access
    @Test
    void delete_differentInstitution_throwsNotFound() {
        DepartmentLearner row = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .department(group(OTHER_INSTITUTION_ID))
                .status(DepartmentLearner.Status.active)
                .build();
        when(assigneeRepository.findById(ASSIGNEE_ID)).thenReturn(Optional.of(row));

        assertThrows(EntityNotFoundException.class,
                () -> service.delete(ASSIGNEE_ID, CALLER_INSTITUTION_ID));
    }

    // 7: delete archives the row (soft-remove)
    @Test
    void delete_sameInstitution_archivesRow() {
        DepartmentLearner row = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .department(group(CALLER_INSTITUTION_ID))
                .status(DepartmentLearner.Status.active)
                .build();
        when(assigneeRepository.findById(ASSIGNEE_ID)).thenReturn(Optional.of(row));
        when(assigneeRepository.save(any(DepartmentLearner.class))).thenAnswer(inv -> inv.getArgument(0));

        service.delete(ASSIGNEE_ID, CALLER_INSTITUTION_ID);

        assertEquals(DepartmentLearner.Status.archived, row.getStatus());
        assertEquals(DepartmentLearner.Status.archived, row.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(row.getRemovedAt() != null);
    }

    // 8: role change
    @Test
    void changeRole_sameInstitution_updatesRole() {
        DepartmentLearner row = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .department(group(CALLER_INSTITUTION_ID))
                .status(DepartmentLearner.Status.active)
                .role(DepartmentLearner.Role.member)
                .build();
        when(assigneeRepository.findById(ASSIGNEE_ID)).thenReturn(Optional.of(row));
        when(assigneeRepository.save(any(DepartmentLearner.class))).thenAnswer(inv -> inv.getArgument(0));

        DepartmentLearnerDto result =
                service.changeRole(ASSIGNEE_ID, DepartmentLearner.Role.lead, CALLER_INSTITUTION_ID);

        assertEquals(DepartmentLearner.Role.lead, result.getRole());
    }

    @Test
    void changeRole_differentInstitution_throwsNotFound() {
        DepartmentLearner row = DepartmentLearner.builder()
                .departmentLearnerId(ASSIGNEE_ID)
                .department(group(OTHER_INSTITUTION_ID))
                .status(DepartmentLearner.Status.active)
                .build();
        when(assigneeRepository.findById(ASSIGNEE_ID)).thenReturn(Optional.of(row));

        assertThrows(EntityNotFoundException.class,
                () -> service.changeRole(ASSIGNEE_ID, DepartmentLearner.Role.lead, CALLER_INSTITUTION_ID));
    }
}
