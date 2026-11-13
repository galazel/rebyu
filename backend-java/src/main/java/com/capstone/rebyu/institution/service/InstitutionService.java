package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.institution.dto.InstitutionDto;
import com.capstone.rebyu.institution.mapper.InstitutionMapper;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
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
public class InstitutionService {
    private final InstitutionRepository institutionRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final com.capstone.rebyu.common.DeletionCleanupService cleanup;
    private final InstitutionMapper institutionMapper;
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;

    public List<InstitutionDto> getAll() {
        log.debug("Fetching all institutions");
        return institutionRepository.findAll().stream()
                .map(this::toDtoWithAggregates)
                .toList();
    }

    public InstitutionDto getById(Long id) {
        log.debug("Fetching institution id: {}", id);
        return toDtoWithAggregates(findEntity(id));
    }

    private InstitutionDto toDtoWithAggregates(Institution entity) {
        InstitutionDto dto = institutionMapper.toDto(entity);
        dto.setCertificationCount(
                institutionCertificateRepository.findByInstitution_InstitutionId(entity.getInstitutionId()).size());
        long learnerCount = institutionCertificationLearnerRepository
                .findByInstitutionCert_Institution_InstitutionId(entity.getInstitutionId())
                .stream()
                .map(l -> l.getLearner().getLearnerId())
                .distinct()
                .count();
        dto.setLearnerCount((int) learnerCount);
        dto.setStatus(entity.isVerified() ? "active" : "pending");
        return dto;
    }

    public InstitutionDto create(InstitutionDto dto) {
        log.info("Creating new institution");
        Institution entity = institutionMapper.toEntity(dto);
        entity.setInstitutionId(null);
        InstitutionDto result = institutionMapper.toDto(institutionRepository.save(entity));
        log.info("Institution created with id: {}", result.getInstitutionId());
        return result;
    }

    public InstitutionDto update(Long id, InstitutionDto dto) {
        log.info("Updating institution id: {}", id);
        findEntity(id);
        Institution entity = institutionMapper.toEntity(dto);
        entity.setInstitutionId(id);
        InstitutionDto result = institutionMapper.toDto(institutionRepository.save(entity));
        log.info("Institution id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting institution id: {}", id);
        findEntity(id);
        java.util.List<String> fileKeys = jdbc.queryForList(
                "SELECT storage_key FROM institution_files WHERE institution_id = ? AND storage_key IS NOT NULL",
                String.class, id);
        institutionRepository.flush();
        preserveCertificationAccess(id);
        cascade.delete("institutions", "institution_id", id);
        fileKeys.stream().distinct().forEach(cleanup::file);
        log.info("Institution id: {} deleted", id);
    }

    private void preserveCertificationAccess(Long institutionId) {
        // Institution memberships are removed below; the learner's course access
        // is independent (also see V73/V74). Cover legacy active/completed assignments.
        // Consistent lock ordering serializes two institutions deleting assignments
        // for the same learner without creating duplicate lasting enrollments.
        jdbc.queryForList("SELECT l.learner_id FROM learners l WHERE EXISTS ("
                + "SELECT 1 FROM institution_certification_learners a "
                + "JOIN institution_certificates c ON c.institution_cert_id = a.institution_cert_id "
                + "WHERE c.institution_id = ? AND a.learner_id = l.learner_id "
                + "AND a.status IN ('active', 'completed')) ORDER BY l.learner_id FOR UPDATE",
                Long.class, institutionId);
        jdbc.update("""
                INSERT INTO learner_certifications
                    (learner_id, certification_id, order_detail_id, enrolled_at, status)
                SELECT a.learner_id, c.certification_id, NULL, MIN(a.assigned_at), 'active'
                FROM institution_certification_learners a
                JOIN institution_certificates c ON c.institution_cert_id = a.institution_cert_id
                WHERE c.institution_id = ? AND a.status IN ('active', 'completed')
                  AND NOT EXISTS (SELECT 1 FROM learner_certifications e
                                  WHERE e.learner_id = a.learner_id
                                    AND e.certification_id = c.certification_id AND e.status = 'active')
                GROUP BY a.learner_id, c.certification_id
                """, institutionId);
    }

    private Institution findEntity(Long id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Institution not found: " + id));
    }
}
