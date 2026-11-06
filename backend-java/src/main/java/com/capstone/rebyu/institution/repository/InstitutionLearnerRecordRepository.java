package com.capstone.rebyu.institution.repository;

import com.capstone.rebyu.institution.entity.InstitutionLearnerRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstitutionLearnerRecordRepository extends JpaRepository<InstitutionLearnerRecord, Long> {
    List<InstitutionLearnerRecord> findByArchiveIdOrderByLearnerNameAsc(Long archiveId);

    List<InstitutionLearnerRecord> findByInstitutionCertIdAndArchiveIdIsNullOrderByLeftAtDesc(Long institutionCertId);

    List<InstitutionLearnerRecord> findByInstitutionIdOrderByLeftAtDesc(Long institutionId);
}
