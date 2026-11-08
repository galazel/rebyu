package com.capstone.rebyu.progress.telemetry.repository;

import com.capstone.rebyu.progress.telemetry.entity.LearnerStudyTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface LearnerStudyTelemetryRepository extends JpaRepository<LearnerStudyTelemetry, Long> {
    List<LearnerStudyTelemetry> findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationIdAndOccurredAtGreaterThanEqualOrderByOccurredAtAsc(
        Long learnerId, Long certificationId, LocalDateTime since);
}
