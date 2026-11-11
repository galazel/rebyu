package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.AssessmentIntegrityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentIntegrityEventRepository extends JpaRepository<AssessmentIntegrityEvent, Long> {

    List<AssessmentIntegrityEvent> findByAttempt_AssessmentAttemptIdOrderByOccurredAtAsc(Long attemptId);

    long countByAttempt_AssessmentAttemptId(Long attemptId);

    List<AssessmentIntegrityEvent> findByLearnerIdOrderByOccurredAtAsc(Long learnerId);
}
