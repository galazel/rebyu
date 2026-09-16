package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface AiGenerationUsageRepository extends JpaRepository<AiGenerationUsage, Long> {

    long countByLearnerIdAndUsageDate(Long learnerId, LocalDate usageDate);
}
