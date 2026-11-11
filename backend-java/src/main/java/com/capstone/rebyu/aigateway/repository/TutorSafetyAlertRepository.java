package com.capstone.rebyu.aigateway.repository;

import com.capstone.rebyu.aigateway.entity.TutorSafetyAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface TutorSafetyAlertRepository extends JpaRepository<TutorSafetyAlert, Long> {

    List<TutorSafetyAlert> findByLearnerIdOrderByCreatedAtDesc(Long learnerId);

    List<TutorSafetyAlert> findByLearnerIdInAndStatusOrderByCreatedAtDesc(
            Collection<Long> learnerIds, TutorSafetyAlert.Status status);

    boolean existsByLearnerIdAndKindAndCreatedAtAfter(Long learnerId, TutorSafetyAlert.Kind kind, Instant after);
}
