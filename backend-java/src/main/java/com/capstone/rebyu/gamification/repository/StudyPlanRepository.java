package com.capstone.rebyu.gamification.repository;

import com.capstone.rebyu.gamification.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
  List<StudyPlan> findByLearner_LearnerIdOrderByCreatedAtDesc(Long learnerId);

  Optional<StudyPlan> findFirstByLearner_LearnerIdAndCertificationIdAndStatusOrderByCreatedAtDesc(
      Long learnerId, Long certificationId, String status);

  Optional<StudyPlan> findFirstByLearner_LearnerIdAndStatusOrderByCreatedAtDesc(
      Long learnerId, String status);

  Optional<StudyPlan> findFirstByLearner_LearnerIdAndCertificationIdIsNullAndStatusOrderByCreatedAtDesc(
      Long learnerId, String status);

  List<StudyPlan> findByLearner_LearnerIdAndCertificationIdAndStatus(
      Long learnerId, Long certificationId, String status);

  List<StudyPlan> findByLearner_LearnerIdAndCertificationIdIsNullAndStatus(
      Long learnerId, String status);
}
