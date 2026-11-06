package com.capstone.rebyu.institution.repository;

import com.capstone.rebyu.institution.entity.InstitutionCertificateArchive;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstitutionCertificateArchiveRepository extends JpaRepository<InstitutionCertificateArchive, Long> {
    List<InstitutionCertificateArchive> findByInstitutionIdOrderByArchivedAtDesc(Long institutionId);
}
