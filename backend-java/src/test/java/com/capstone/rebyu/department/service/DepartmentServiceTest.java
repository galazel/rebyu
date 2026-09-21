package com.capstone.rebyu.department.service;

import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.mapper.DepartmentMapper;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DepartmentServiceTest {

    private static final Long CALLER_INSTITUTION_ID = 1L;
    private static final Long OTHER_INSTITUTION_ID = 2L;
    private static final Long GROUP_ID = 10L;
    private static final Long INSTITUTION_CERT_ID = 30L;

    private DepartmentRepository groupRepository;
    private InstitutionCertificateRepository institutionCertRepository;
    private DepartmentMapper mapper;

    private DepartmentService service;

    @BeforeEach
    void setUp() {
        groupRepository = mock(DepartmentRepository.class);
        institutionCertRepository = mock(InstitutionCertificateRepository.class);
        mapper = mock(DepartmentMapper.class);

        service = new DepartmentService(
                groupRepository, mock(DepartmentHeadAssignmentRepository.class), institutionCertRepository, mapper);

        when(mapper.toDto(any(Department.class))).thenAnswer(inv -> {
            Department entity = inv.getArgument(0);
            DepartmentDto dto = new DepartmentDto();
            dto.setDepartmentId(entity.getDepartmentId());
            dto.setDepartmentName(entity.getDepartmentName());
            dto.setDepartmentDescription(entity.getDepartmentDescription());
            dto.setTotalSlots(entity.getTotalSlots());
            dto.setUsedSlots(entity.getUsedSlots());
            dto.setStatus(entity.getStatus());
            return dto;
        });
        when(mapper.toEntity(any(DepartmentDto.class))).thenAnswer(inv -> {
            DepartmentDto dto = inv.getArgument(0);
            return Department.builder()
                    .departmentId(dto.getDepartmentId())
                    .departmentName(dto.getDepartmentName())
                    .departmentDescription(dto.getDepartmentDescription())
                    .totalSlots(dto.getTotalSlots() != null ? dto.getTotalSlots() : 0)
                    .status(dto.getStatus())
                    .build();
        });
    }

    private Department group(Long institutionId) {
        Institution institution = new Institution();
        institution.setInstitutionId(institutionId);
        InstitutionCertificate institutionCert = new InstitutionCertificate();
        institutionCert.setInstitutionCertId(INSTITUTION_CERT_ID);
        institutionCert.setTotalSlots(100);
        return Department.builder()
                .departmentId(GROUP_ID)
                .institution(institution)
                .institutionCert(institutionCert)
                .departmentName("Original Name")
                .departmentDescription("Original Description")
                .totalSlots(10)
                .usedSlots(0)
                .status(Department.Status.active)
                .build();
    }

    private InstitutionCertificate institutionCert(Long institutionId) {
        Institution institution = new Institution();
        institution.setInstitutionId(institutionId);
        return InstitutionCertificate.builder()
                .institutionCertId(INSTITUTION_CERT_ID)
                .institution(institution)
                .totalSlots(100)
                .build();
    }

    private DepartmentDto createDto(Long institutionId) {
        DepartmentDto dto = new DepartmentDto();
        dto.setInstitutionId(institutionId);
        dto.setInstitutionCertId(INSTITUTION_CERT_ID);
        dto.setDepartmentName("New Group");
        dto.setDepartmentDescription("New Description");
        dto.setTotalSlots(10);
        return dto;
    }

    @Test
    void create_institutionCertBelongsToDifferentInstitution_throwsNotFound() {
        when(institutionCertRepository.findById(INSTITUTION_CERT_ID)).thenReturn(Optional.of(institutionCert(OTHER_INSTITUTION_ID)));

        assertThrows(EntityNotFoundException.class,
                () -> service.create(createDto(CALLER_INSTITUTION_ID)));

        verify(groupRepository, never()).save(any());
    }

    @Test
    void create_matchingInstitution_succeedsAndReturnsMappedDto() {
        when(institutionCertRepository.findById(INSTITUTION_CERT_ID)).thenReturn(Optional.of(institutionCert(CALLER_INSTITUTION_ID)));
        when(groupRepository.save(any(Department.class))).thenAnswer(inv -> {
            Department entity = inv.getArgument(0);
            entity.setDepartmentId(GROUP_ID);
            return entity;
        });

        DepartmentDto result = service.create(createDto(CALLER_INSTITUTION_ID));

        assertEquals(GROUP_ID, result.getDepartmentId());
        assertEquals("New Group", result.getDepartmentName());
    }

    @Test
    void update_differentInstitution_throwsNotFoundAndDoesNotSave() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(OTHER_INSTITUTION_ID)));

        DepartmentDto dto = new DepartmentDto();
        dto.setDepartmentName("Hacked Name");
        dto.setDepartmentDescription("Hacked Description");

        assertThrows(EntityNotFoundException.class,
                () -> service.update(GROUP_ID, dto, CALLER_INSTITUTION_ID));

        verify(groupRepository, never()).save(any());
    }

    @Test
    void update_sameInstitution_succeedsAndPersistsNewFields() {
        Department existing = group(CALLER_INSTITUTION_ID);
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(existing));
        when(groupRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        DepartmentDto dto = new DepartmentDto();
        dto.setDepartmentName("Updated Name");
        dto.setDepartmentDescription("Updated Description");

        DepartmentDto result = service.update(GROUP_ID, dto, CALLER_INSTITUTION_ID);

        assertEquals("Updated Name", result.getDepartmentName());
        assertEquals("Updated Description", result.getDepartmentDescription());
        assertEquals("Updated Name", existing.getDepartmentName());
        assertEquals("Updated Description", existing.getDepartmentDescription());
    }

    @Test
    void delete_differentInstitution_throwsNotFoundAndDoesNotSave() {
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group(OTHER_INSTITUTION_ID)));

        assertThrows(EntityNotFoundException.class,
                () -> service.delete(GROUP_ID, CALLER_INSTITUTION_ID));

        verify(groupRepository, never()).save(any());
    }

    @Test
    void delete_sameInstitution_setsStatusToArchived() {
        Department existing = group(CALLER_INSTITUTION_ID);
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(existing));
        when(groupRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        service.delete(GROUP_ID, CALLER_INSTITUTION_ID);

        assertEquals(Department.Status.archived, existing.getStatus());
        verify(groupRepository).save(existing);
    }
}
