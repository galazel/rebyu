package com.capstone.rebyu.department.service;

import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.reference.ReferenceOption;
import com.capstone.rebyu.reference.ReferenceOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Institutions do not create departments. One department exists per college (the certification's
 * department in Reference lists > Programs) and covers every certification the institution holds
 * from that college. It is created or joined when an access activates; its slots are the sum of
 * its certifications' slots.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificationDepartmentService implements ApplicationRunner {

    private final DepartmentRepository departments;
    private final InstitutionCertificateRepository allocations;
    private final DepartmentHeadRepository members;
    private final ReferenceOptionRepository referenceOptions;

    @Transactional
    public void ensureFor(InstitutionCertificate allocation) {
        if (allocation == null || allocation.getStatus() != InstitutionCertificate.Status.active) return;
        Long institutionId = allocation.getInstitution().getInstitutionId();
        List<Department> institutionDepartments = departments.findByInstitution_InstitutionId(institutionId).stream()
                .filter(d -> d.getStatus() == Department.Status.active)
                .toList();

        Department covering = institutionDepartments.stream()
                .filter(d -> d.covers(allocation.getInstitutionCertId()))
                .findFirst()
                .orElse(null);
        if (covering != null) {
            syncSlots(covering);
            return;
        }

        String name = allocation.getCertification().getDepartment();
        if (name == null || name.isBlank()) name = allocation.getCertification().getTitle();
        String collegeName = name.trim();

        Department sameCollege = institutionDepartments.stream()
                .filter(d -> d.getDepartmentName() != null && d.getDepartmentName().trim().equalsIgnoreCase(collegeName))
                .min(Comparator.comparing(Department::getDepartmentId))
                .orElse(null);
        if (sameCollege != null) {
            sameCollege.getInstitutionCerts().add(allocation);
            syncSlots(sameCollege);
            log.info("Allocation {} joined department '{}' ({})", allocation.getInstitutionCertId(),
                    collegeName, sameCollege.getDepartmentId());
            return;
        }

        var owner = members.findByInstitution_InstitutionId(institutionId).stream()
                .filter(m -> m.getHeadRole() == DepartmentHead.HeadRole.owner)
                .map(DepartmentHead::getUser)
                .findFirst()
                .orElse(null);
        if (owner == null) {
            log.info("Allocation {} has no institution owner yet; its department is created later",
                    allocation.getInstitutionCertId());
            return;
        }

        Department department = new Department();
        department.setInstitution(allocation.getInstitution());
        department.getInstitutionCerts().add(allocation);
        department.setDepartmentName(collegeName);
        department.setDepartmentDescription(referenceOptions
                .findByKindAndLabelIgnoreCase(ReferenceOption.KIND_PROGRAM, collegeName)
                .map(ReferenceOption::getDescription)
                .orElse(null));
        department.setUsedSlots(0);
        department.setCreatedBy(owner);
        department.setCreatedAt(LocalDateTime.now());
        department.setStatus(Department.Status.active);
        syncSlots(department);
        log.info("Created department '{}' for allocation {}", collegeName, allocation.getInstitutionCertId());
    }

    /** A department's slots are the sum of its certifications' slots. */
    private void syncSlots(Department department) {
        int total = department.getInstitutionCerts().stream()
                .mapToInt(cert -> cert.getTotalSlots() == null ? 0 : cert.getTotalSlots())
                .sum();
        department.setTotalSlots(total);
        departments.save(department);
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        allocations.findAll().forEach(this::ensureFor);
    }
}
