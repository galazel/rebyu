package com.capstone.rebyu.enrollment.repository;

import com.capstone.rebyu.enrollment.entity.LearnerCertificationAward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LearnerCertificationAwardRepository extends JpaRepository<LearnerCertificationAward, Long> {

    Optional<LearnerCertificationAward> findByLearnerIdAndCertificationId(Long learnerId, Long certificationId);

    List<LearnerCertificationAward> findByLearnerIdOrderByCreatedAtDesc(Long learnerId);

    /** Every award held by a set of learners, for rollups that would otherwise ask per learner. */
    List<LearnerCertificationAward> findByLearnerIdIn(Collection<Long> learnerIds);

    boolean existsByCertificateNumber(String certificateNumber);
}
