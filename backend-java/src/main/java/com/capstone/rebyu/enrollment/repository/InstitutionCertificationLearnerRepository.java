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

    /** All learner allocations under one institution — the tenant-scoped portal view. */
    List<InstitutionCertificationLearner> findByInstitutionCert_Institution_InstitutionId(Long institutionId);

    /** True when a learner holds any allocation under the given institution (tenant membership check). */
    boolean existsByLearner_LearnerIdAndInstitutionCert_Institution_InstitutionId(Long learnerId, Long institutionId);

    /**
     * True when an institution sponsors this learner into this certification.
     * An org-sponsored learner has no learner_certifications row -- that table
     * is only written by the self-purchase flow -- so any "is this learner
     * enrolled?" check has to consider this table as well, or every institution
     * learner looks unenrolled.
     */
    boolean existsByLearner_LearnerIdAndInstitutionCert_Certification_CertificationIdAndStatus(
            Long learnerId, Long certificationId, InstitutionCertificationLearner.Status status);

    /** Unique active learners under an institution — the institutional seat unit. */
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
