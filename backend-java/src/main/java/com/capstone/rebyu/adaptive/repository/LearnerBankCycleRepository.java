package com.capstone.rebyu.adaptive.repository;

import com.capstone.rebyu.adaptive.entity.LearnerBankCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerBankCycleRepository extends JpaRepository<LearnerBankCycle, Long> {
    Optional<LearnerBankCycle> findByLearnerIdAndCertificationId(Long learnerId, Long certificationId);
}
