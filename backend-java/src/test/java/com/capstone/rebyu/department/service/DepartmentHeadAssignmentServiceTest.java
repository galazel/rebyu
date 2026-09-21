package com.capstone.rebyu.department.service;

import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.dto.DepartmentHeadAssignmentDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.mapper.DepartmentHeadAssignmentMapper;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
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

class DepartmentHeadAssignmentServiceTest {

    private static final Long CALLER_INSTITUTION_ID = 1L;
    private static final Long OTHER_INSTITUTION_ID = 2L;
    private static final Long GROUP_ID = 10L;
    private static final Long USER_ID = 20L;
    private static final Long AUTHORITY_ID = 40L;

    private DepartmentHeadAssignmentRepository authorityRepository;
    private DepartmentRepository groupRepository;
    private DepartmentHeadAssignmentMapper mapper;

    private DepartmentHeadAssignmentService service;

    @BeforeEach
    void setUp() {
        authorityRepository = mock(DepartmentHeadAssignmentRepository.class);
        groupRepository = mock(DepartmentRepository.class);
        mapper = mock(DepartmentHeadAssignmentMapper.class);

        service = new DepartmentHeadAssignmentService(authorityRepository, groupRepository, mapper,
                mock(UserRepository.class), mock(UserTypeRepository.class),
                mock(DepartmentHeadRepository.class));

        when(mapper.toDto(any(DepartmentHeadAssignment.class))).thenAnswer(inv -> {
            DepartmentHeadAssignment entity = inv.getArgument(0);
            DepartmentHeadAssignmentDto dto = new DepartmentHeadAssignmentDto();
            dto.setDepartmentHeadAssignmentId(entity.getDepartmentHeadAssignmentId());
            dto.setStatus(entity.getStatus());
            return dto;
        });
        when(mapper.toEntity(any(DepartmentHeadAssignmentDto.class))).thenAnswer(inv -> {
            DepartmentHeadAssignmentDto dto = inv.getArgument(0);
            return DepartmentHeadAssignment.builder()
                    .departmentHeadAssignmentId(dto.getDepartmentHeadAssignmentId())
                    .status(dto.getStatus())
                    .build();
        });
    }

    private Department group(Long institutionId) {
        Institution institution = new Institution();
        institution.setInstitutionId(institutionId);
        return Department.builder()
                .departmentId(GROUP_ID)
                .institution(institution)
                .build();
    }

    private DepartmentHeadAssignmentDto dto() {
        DepartmentHeadAssignmentDto dto = new DepartmentHeadAssignmentDto();
        dto.setDepartmentId(GROUP_ID);
        dto.setUserId(USER_ID);
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

    // 2: brand new (user, group) pair succeeds with a fresh active row
    @Test
    void create_newAssignment_insertsFreshActiveRow() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        when(authorityRepository.findByDepartmentAndUser(any(), any()))
                .thenReturn(Optional.empty());
        when(authorityRepository.save(any(DepartmentHeadAssignment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DepartmentHeadAssignmentDto result = service.create(dto(), CALLER_INSTITUTION_ID);

        assertEquals(DepartmentHeadAssignment.Status.active, result.getStatus());
        verify(authorityRepository, times(1)).save(any(DepartmentHeadAssignment.class));
    }

    // 3: duplicate ACTIVE authority is rejected
    @Test
    void create_alreadyActiveAuthority_throwsBusinessRuleException() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        DepartmentHeadAssignment activeRow = DepartmentHeadAssignment.builder()
                .departmentHeadAssignmentId(AUTHORITY_ID)
                .status(DepartmentHeadAssignment.Status.active)
                .build();
        when(authorityRepository.findByDepartmentAndUser(any(), any()))
                .thenReturn(Optional.of(activeRow));

        assertThrows(BusinessRuleException.DepartmentRuleException.class,
                () -> service.create(dto(), CALLER_INSTITUTION_ID));
        verify(authorityRepository, times(0)).save(any());
    }

    // 4: re-adding a previously archived authority reactivates the same row
    @Test
    void create_archivedAuthority_reactivatesSameRowInsteadOfInserting() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(CALLER_INSTITUTION_ID)));
        DepartmentHeadAssignment archivedRow = DepartmentHeadAssignment.builder()
                .departmentHeadAssignmentId(AUTHORITY_ID)
                .status(DepartmentHeadAssignment.Status.archived)
                .removedAt(LocalDateTime.now().minusDays(1))
                .build();
        when(authorityRepository.findByDepartmentAndUser(any(), any()))
                .thenReturn(Optional.of(archivedRow));
        when(authorityRepository.save(any(DepartmentHeadAssignment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DepartmentHeadAssignmentDto result = service.create(dto(), CALLER_INSTITUTION_ID);

        assertEquals(AUTHORITY_ID, result.getDepartmentHeadAssignmentId()); // same row, not a new one
        assertEquals(DepartmentHeadAssignment.Status.active, archivedRow.getStatus());
        assertEquals(null, archivedRow.getRemovedAt());
    }

    // 5: delete rejects cross-tenant access
    @Test
    void delete_differentInstitution_throwsNotFound() {
        DepartmentHeadAssignment row = DepartmentHeadAssignment.builder()
                .departmentHeadAssignmentId(AUTHORITY_ID)
                .department(group(OTHER_INSTITUTION_ID))
                .status(DepartmentHeadAssignment.Status.active)
                .build();
        when(authorityRepository.findById(AUTHORITY_ID)).thenReturn(Optional.of(row));

        assertThrows(EntityNotFoundException.class,
                () -> service.delete(AUTHORITY_ID, CALLER_INSTITUTION_ID));
    }

    // 6: delete by same institution archives the row
    @Test
    void delete_sameInstitution_archivesRow() {
        DepartmentHeadAssignment row = DepartmentHeadAssignment.builder()
                .departmentHeadAssignmentId(AUTHORITY_ID)
                .department(group(CALLER_INSTITUTION_ID))
                .status(DepartmentHeadAssignment.Status.active)
                .build();
        when(authorityRepository.findById(AUTHORITY_ID)).thenReturn(Optional.of(row));
        when(authorityRepository.save(any(DepartmentHeadAssignment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.delete(AUTHORITY_ID, CALLER_INSTITUTION_ID);

        assertEquals(DepartmentHeadAssignment.Status.archived, row.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(row.getRemovedAt() != null);
    }
}
