package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.enrollment.mapper.InstitutionCertificationLearnerMapper;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
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
public class InstitutionCertificationLearnerService {
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;
    private final InstitutionCertificationLearnerMapper institutionCertificationLearnerMapper;

    public List<InstitutionCertificationLearnerDto> getAll() {
        log.debug("Fetching all institution certification learners");
        return institutionCertificationLearnerRepository.findAll().stream()
                .map(institutionCertificationLearnerMapper::toDto).toList();
    }

    public InstitutionCertificationLearnerDto getById(Long id) {
        log.debug("Fetching institution certification learner id: {}", id);
        return institutionCertificationLearnerMapper.toDto(findEntity(id));
    }

    public InstitutionCertificationLearnerDto create(InstitutionCertificationLearnerDto dto) {
        log.info("Creating new institution certification learner");
        InstitutionCertificationLearner entity = institutionCertificationLearnerMapper.toEntity(dto);
        entity.setInstitutionCertLearnerId(null);
        InstitutionCertificationLearnerDto result = institutionCertificationLearnerMapper.toDto(institutionCertificationLearnerRepository.save(entity));
        log.info("InstitutionCertificationLearner created with id: {}", result.getInstitutionCertLearnerId());
        return result;
    }

    public InstitutionCertificationLearnerDto update(Long id, InstitutionCertificationLearnerDto dto) {
        log.info("Updating institution certification learner id: {}", id);
        findEntity(id);
        InstitutionCertificationLearner entity = institutionCertificationLearnerMapper.toEntity(dto);
        entity.setInstitutionCertLearnerId(id);
        InstitutionCertificationLearnerDto result = institutionCertificationLearnerMapper.toDto(institutionCertificationLearnerRepository.save(entity));
        log.info("InstitutionCertificationLearner id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting institution certification learner id: {}", id);
        institutionCertificationLearnerRepository.delete(findEntity(id));
        log.info("InstitutionCertificationLearner id: {} deleted", id);
    }

    private InstitutionCertificationLearner findEntity(Long id) {
        return institutionCertificationLearnerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("InstitutionCertificationLearner not found: " + id));
    }
}
