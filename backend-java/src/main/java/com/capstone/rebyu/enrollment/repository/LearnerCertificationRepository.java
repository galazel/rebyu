package com.capstone.rebyu.enrollment.repository;

import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnerCertificationRepository extends JpaRepository<LearnerCertification, Long> {

    java.util.Optional<LearnerCertification> findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
            Long learnerId, Long certificationId, LearnerCertification.Status status);

    java.util.List<LearnerCertification> findByLearner_LearnerId(Long learnerId);

    boolean existsByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
            Long learnerId, Long certificationId, LearnerCertification.Status status);

    long countByStatus(LearnerCertification.Status status);

    interface CertificationEnrolment {
        Long getCertificationId();
        String getTitle();
        long getLearners();
        long getEnrollments();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT c.certificationId AS certificationId,
                   c.title AS title,
                   COUNT(DISTINCT lc.learner.learnerId) AS learners,
                   COUNT(lc) AS enrollments
            FROM LearnerCertification lc
            JOIN lc.certification c
            WHERE lc.status = :status
            GROUP BY c.certificationId, c.title
            ORDER BY COUNT(DISTINCT lc.learner.learnerId) DESC
            """)
    java.util.List<CertificationEnrolment> learnersPerCertification(
            @org.springframework.data.repository.query.Param("status") LearnerCertification.Status status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(DISTINCT lc.learner.learnerId) FROM LearnerCertification lc
            WHERE lc.status = :status
            """)
    long countDistinctLearnersByStatus(
            @org.springframework.data.repository.query.Param("status") LearnerCertification.Status status);
}
