package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface AiGenerationUsageRepository extends JpaRepository<AiGenerationUsage, Long> {

    long countByLearnerIdAndUsageDate(Long learnerId, LocalDate usageDate);

    java.util.List<AiGenerationUsage> findByLearnerIdAndUsageDateBetween(Long learnerId, LocalDate from, LocalDate to);

    long countByLearnerIdAndKindInAndUsageDateBetween(
            Long learnerId, java.util.Collection<String> kinds, LocalDate from, LocalDate to);
}
