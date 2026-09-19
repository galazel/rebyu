package com.capstone.rebyu.organization.service;

import com.capstone.rebyu.organization.dto.OrganizationCertificateDto;
import com.capstone.rebyu.organization.mapper.OrganizationCertificateMapper;
import com.capstone.rebyu.organization.entity.OrganizationCertificate;
import com.capstone.rebyu.organization.repository.OrganizationCertificateRepository;
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
public class OrganizationCertificateService {
    private final OrganizationCertificateRepository organizationCertificateRepository;
    private final OrganizationCertificateMapper organizationCertificateMapper;

    public List<OrganizationCertificateDto> getAll() {
        log.debug("Fetching all organization certificates");
        return organizationCertificateRepository.findAll().stream().map(organizationCertificateMapper::toDto).toList();
    }

    public OrganizationCertificateDto getById(Long id) {
        log.debug("Fetching organization certificate id: {}", id);
        return organizationCertificateMapper.toDto(findEntity(id));
    }

    public OrganizationCertificateDto create(OrganizationCertificateDto dto) {
        log.info("Creating new organization certificate");
        OrganizationCertificate entity = organizationCertificateMapper.toEntity(dto);
        entity.setOrgCertId(null);
        OrganizationCertificateDto result = organizationCertificateMapper.toDto(organizationCertificateRepository.save(entity));
        log.info("OrganizationCertificate created with id: {}", result.getOrgCertId());
        return result;
    }

    public OrganizationCertificateDto update(Long id, OrganizationCertificateDto dto) {
        log.info("Updating organization certificate id: {}", id);
        findEntity(id);
        OrganizationCertificate entity = organizationCertificateMapper.toEntity(dto);
        entity.setOrgCertId(id);
        OrganizationCertificateDto result = organizationCertificateMapper.toDto(organizationCertificateRepository.save(entity));
        log.info("OrganizationCertificate id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting organization certificate id: {}", id);
        organizationCertificateRepository.delete(findEntity(id));
        log.info("OrganizationCertificate id: {} deleted", id);
    }

    private OrganizationCertificate findEntity(Long id) {
        return organizationCertificateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OrganizationCertificate not found: " + id));
    }
}
