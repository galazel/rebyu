package com.capstone.rebyu.gamification.repository;

import com.capstone.rebyu.gamification.entity.StudyPlanTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyPlanTaskStatusRepository extends JpaRepository<StudyPlanTaskStatus, Long> {

  List<StudyPlanTaskStatus> findByPlan_PlanId(Long planId);

  List<StudyPlanTaskStatus> findByLearner_LearnerId(Long learnerId);

  Optional<StudyPlanTaskStatus> findByPlan_PlanIdAndEventId(Long planId, String eventId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(value = """
      INSERT INTO study_plan_task_status
             (plan_id, learner_id, event_id, status, started_at, completed_at, updated_at)
      VALUES (:planId, :learnerId, :eventId, :status, :startedAt, :completedAt, :updatedAt)
      ON CONFLICT (plan_id, event_id) DO UPDATE SET
             status       = EXCLUDED.status,
             updated_at   = EXCLUDED.updated_at,
             started_at   = COALESCE(study_plan_task_status.started_at, EXCLUDED.started_at),
             completed_at = COALESCE(EXCLUDED.completed_at, study_plan_task_status.completed_at)
      """, nativeQuery = true)
  void upsertStatus(@Param("planId") Long planId,
                    @Param("learnerId") Long learnerId,
                    @Param("eventId") String eventId,
                    @Param("status") String status,
                    @Param("startedAt") LocalDateTime startedAt,
                    @Param("completedAt") LocalDateTime completedAt,
                    @Param("updatedAt") LocalDateTime updatedAt);
}
