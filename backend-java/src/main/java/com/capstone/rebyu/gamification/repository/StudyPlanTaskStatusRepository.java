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

  /** Every recorded status on one plan -- what the scheduler reads on load. */
  List<StudyPlanTaskStatus> findByPlan_PlanId(Long planId);

  /**
   * Every recorded status the learner has, across plans. The scheduler watches
   * all active plans at once, so fetching per plan would be a request per plan
   * on every page load.
   */
  List<StudyPlanTaskStatus> findByLearner_LearnerId(Long learnerId);

  Optional<StudyPlanTaskStatus> findByPlan_PlanIdAndEventId(Long planId, String eventId);

  /**
   * Records a task's status, whether or not a row for it already exists.
   *
   * <p>Read-then-insert loses this race, and the race is routine rather than
   * exotic: the activity host writes IN_PROGRESS as it opens and COMPLETED as
   * it finishes, and a remount fires the pair again. Two of them find no row,
   * both insert, and the second dies on
   * {@code uk_study_plan_task_plan_event}. The write that died was usually the
   * COMPLETED one -- so the task stayed unfinished and the scheduler offered
   * it again, forever, no matter how many times the learner actually did it.
   *
   * <p>{@code ON CONFLICT} makes the decision in the database, where the
   * constraint is, so concurrent writers converge instead of colliding.
   * {@code started_at} keeps its first value: a resumed session still reports
   * when the learner actually began. {@code completed_at} is only ever set,
   * never cleared, so re-reporting IN_PROGRESS after finishing cannot erase
   * the completion.
   */
  /* flush/clear because the statement is native: it goes straight to the
     database, so without clearing, the read-back below can be answered
     from a persistence context that never saw this write. */
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
