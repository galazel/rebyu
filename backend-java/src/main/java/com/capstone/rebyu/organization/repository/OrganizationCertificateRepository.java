package com.capstone.rebyu.institution.repository;

import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionCertificateRepository extends JpaRepository<InstitutionCertificate, Long> {

    Optional<InstitutionCertificate> findByInstitution_InstitutionIdAndCertification_CertificationId(
            Long institutionId, Long certificationId);

    List<InstitutionCertificate> findByInstitution_InstitutionId(Long institutionId);

    long countByInstitution_InstitutionIdAndStatus(
            Long institutionId, InstitutionCertificate.Status status);
}
