package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.dto.OrganizationCertificationLearnerDto;
import com.capstone.rebyu.enrollment.mapper.OrganizationCertificationLearnerMapper;
import com.capstone.rebyu.enrollment.entity.OrganizationCertificationLearner;
import com.capstone.rebyu.enrollment.repository.OrganizationCertificationLearnerRepository;
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
public class OrganizationCertificationLearnerService {
    private final OrganizationCertificationLearnerRepository organizationCertificationLearnerRepository;
    private final OrganizationCertificationLearnerMapper organizationCertificationLearnerMapper;

    public List<OrganizationCertificationLearnerDto> getAll() {
        log.debug("Fetching all organization certification learners");
        return organizationCertificationLearnerRepository.findAll().stream()
                .map(organizationCertificationLearnerMapper::toDto).toList();
    }

    public OrganizationCertificationLearnerDto getById(Long id) {
        log.debug("Fetching organization certification learner id: {}", id);
        return organizationCertificationLearnerMapper.toDto(findEntity(id));
    }

    public OrganizationCertificationLearnerDto create(OrganizationCertificationLearnerDto dto) {
        log.info("Creating new organization certification learner");
        OrganizationCertificationLearner entity = organizationCertificationLearnerMapper.toEntity(dto);
        entity.setOrgCertLearnerId(null);
        OrganizationCertificationLearnerDto result = organizationCertificationLearnerMapper.toDto(organizationCertificationLearnerRepository.save(entity));
        log.info("OrganizationCertificationLearner created with id: {}", result.getOrgCertLearnerId());
        return result;
    }

    public OrganizationCertificationLearnerDto update(Long id, OrganizationCertificationLearnerDto dto) {
        log.info("Updating organization certification learner id: {}", id);
        findEntity(id);
        OrganizationCertificationLearner entity = organizationCertificationLearnerMapper.toEntity(dto);
        entity.setOrgCertLearnerId(id);
        OrganizationCertificationLearnerDto result = organizationCertificationLearnerMapper.toDto(organizationCertificationLearnerRepository.save(entity));
        log.info("OrganizationCertificationLearner id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting organization certification learner id: {}", id);
        organizationCertificationLearnerRepository.delete(findEntity(id));
        log.info("OrganizationCertificationLearner id: {} deleted", id);
    }

    private OrganizationCertificationLearner findEntity(Long id) {
        return organizationCertificationLearnerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OrganizationCertificationLearner not found: " + id));
    }
}
