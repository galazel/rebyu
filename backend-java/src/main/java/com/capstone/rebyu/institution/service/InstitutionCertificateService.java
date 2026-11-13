package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.mapper.InstitutionCertificateMapper;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
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
public class InstitutionCertificateService {
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final InstitutionCertificateMapper institutionCertificateMapper;
    private final SeatLedgerService seatLedger;

    private InstitutionCertificateDto liveDto(InstitutionCertificate entity) {
        InstitutionCertificateDto dto = institutionCertificateMapper.toDto(entity);
        dto.setUsedSlots(seatLedger.usedSeats(entity.getInstitutionCertId()));
        dto.setRemainingSlots(Math.max(0, dto.getTotalSlots() - dto.getUsedSlots()));
        return dto;
    }

    public List<InstitutionCertificateDto> getAll() {
        log.debug("Fetching all institution certificates");
        return institutionCertificateRepository.findAll().stream().map(this::liveDto).toList();
    }

    public InstitutionCertificateDto getById(Long id) {
        log.debug("Fetching institution certificate id: {}", id);
        return liveDto(findEntity(id));
    }

    public InstitutionCertificateDto create(InstitutionCertificateDto dto) {
        log.info("Creating new institution certificate");
        InstitutionCertificate entity = institutionCertificateMapper.toEntity(dto);
        entity.setInstitutionCertId(null);
        InstitutionCertificateDto result = institutionCertificateMapper.toDto(institutionCertificateRepository.save(entity));
        log.info("InstitutionCertificate created with id: {}", result.getInstitutionCertId());
        return result;
    }

    public InstitutionCertificateDto update(Long id, InstitutionCertificateDto dto) {
        log.info("Updating institution certificate id: {}", id);
        findEntity(id);
        InstitutionCertificate entity = institutionCertificateMapper.toEntity(dto);
        entity.setInstitutionCertId(id);
        InstitutionCertificateDto result = institutionCertificateMapper.toDto(institutionCertificateRepository.save(entity));
        log.info("InstitutionCertificate id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting institution certificate id: {}", id);
        institutionCertificateRepository.delete(findEntity(id));
        log.info("InstitutionCertificate id: {} deleted", id);
    }

    private InstitutionCertificate findEntity(Long id) {
        return institutionCertificateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("InstitutionCertificate not found: " + id));
    }
}
