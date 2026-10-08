package com.capstone.rebyu.enrollment.repository;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.user.entity.Learner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InstitutionCertificationLearnerRepository extends JpaRepository<InstitutionCertificationLearner, Long> {
    boolean existsByInstitutionCertAndLearner(InstitutionCertificate institutionCert, Learner learner);

    List<InstitutionCertificationLearner> findByLearner_LearnerIdAndStatus(
            Long learnerId, InstitutionCertificationLearner.Status status);

    List<InstitutionCertificationLearner> findByLearner_LearnerId(Long learnerId);

    List<InstitutionCertificationLearner> findByInstitutionCert_Institution_InstitutionId(Long institutionId);

    boolean existsByLearner_LearnerIdAndInstitutionCert_Institution_InstitutionId(Long learnerId, Long institutionId);

    boolean existsByLearner_LearnerIdAndInstitutionCert_Certification_CertificationIdAndStatus(
            Long learnerId, Long certificationId, InstitutionCertificationLearner.Status status);

    @Query("""
            SELECT COUNT(DISTINCT o.learner.learnerId)
            FROM InstitutionCertificationLearner o
            WHERE o.institutionCert.institution.institutionId = :institutionId
              AND o.status = :status
            """)
    long countDistinctActiveLearners(
            @Param("institutionId") Long institutionId,
            @Param("status") InstitutionCertificationLearner.Status status);
}
