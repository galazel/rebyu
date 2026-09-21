package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.institution.dto.DepartmentHeadDto;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.mapper.DepartmentHeadMapper;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentHeadService {
    private final DepartmentHeadRepository departmentHeadRepository;
    private final DepartmentHeadMapper departmentHeadMapper;

    public List<DepartmentHeadDto> getAll() {
        log.debug("Fetching all institution members");
        return departmentHeadRepository.findAll().stream().map(departmentHeadMapper::toDto).toList();
    }

    public List<DepartmentHeadDto> getByInstitutionId(Long institutionId) {
        log.debug("Fetching members for institutionId: {}", institutionId);
        return departmentHeadRepository.findByInstitution_InstitutionId(institutionId)
                .stream().map(departmentHeadMapper::toDto).toList();
    }

    public DepartmentHeadDto getById(Long id) {
        log.debug("Fetching institution member id: {}", id);
        return departmentHeadMapper.toDto(findEntity(id));
    }

    public DepartmentHeadDto create(DepartmentHeadDto dto) {
        log.info("Creating new institution member");
        DepartmentHead entity = departmentHeadMapper.toEntity(dto);
        entity.setDepartmentHeadId(null);
        DepartmentHeadDto result = departmentHeadMapper.toDto(departmentHeadRepository.save(entity));
        log.info("DepartmentHead created with id: {}", result.getDepartmentHeadId());
        return result;
    }

    public DepartmentHeadDto update(Long id, DepartmentHeadDto dto) {
        log.info("Updating institution member id: {}", id);
        findEntity(id);
        DepartmentHead entity = departmentHeadMapper.toEntity(dto);
        entity.setDepartmentHeadId(id);
        DepartmentHeadDto result = departmentHeadMapper.toDto(departmentHeadRepository.save(entity));
        log.info("DepartmentHead id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting institution member id: {}", id);
        departmentHeadRepository.delete(findEntity(id));
        log.info("DepartmentHead id: {} deleted", id);
    }

    private DepartmentHead findEntity(Long id) {
        return departmentHeadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DepartmentHead not found: " + id));
    }
}
