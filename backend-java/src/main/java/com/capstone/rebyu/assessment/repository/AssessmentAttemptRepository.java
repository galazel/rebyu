package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    /**
     * Reconciliation: of the {@code window} most recently submitted attempts, the
     * ids of those with fewer outbox events than answers that should be evidence
     * (graded, not pending manual marking, mapped to a lesson).
     *
     * <p>Counted in the database and returned as bare ids on purpose. The job used
     * to load every one of those attempts whole -- question snapshots, submitted
     * code, diagrams, run results, and each source question with its configs --
     * every fifteen minutes, to find out that nearly all of them were already
     * done. That re-read was the bulk of the database's outbound data transfer.
     */
    @Query(value = """
            SELECT a.assessment_attempt_id
            FROM (SELECT assessment_attempt_id, submitted_at
                  FROM assessment_attempts
                  WHERE status = 'SUBMITTED'
                  ORDER BY submitted_at DESC NULLS LAST
                  LIMIT :window) a
            WHERE (SELECT count(*)
                   FROM assessment_attempt_answers ans
                   JOIN assessment_attempt_questions q ON q.attempt_question_id = ans.attempt_question_id
                   WHERE ans.assessment_attempt_id = a.assessment_attempt_id
                     AND ans.pending_manual_evaluation = false
                     AND q.lesson_id IS NOT NULL)
                > (SELECT count(*)
                   FROM bkt_event_outbox o
                   WHERE o.batch_id = 'attempt-' || a.assessment_attempt_id)
            ORDER BY a.submitted_at DESC NULLS LAST
            """, nativeQuery = true)
    List<Long> findRecentSubmittedIdsMissingBktEvents(@Param("window") int window);

    Optional<AssessmentAttempt> findByIdempotencyKey(String idempotencyKey);

    Optional<AssessmentAttempt> findFirstByExam_ExamIdAndLearnerIdAndStatus(
            Long examId, Long learnerId, AssessmentAttempt.Status status);

    Optional<AssessmentAttempt> findTopByExam_ExamIdAndLearnerIdOrderByAttemptNumberDesc(
            Long examId, Long learnerId);

    List<AssessmentAttempt> findByLearnerIdOrderByStartedAtDesc(Long learnerId);

    List<AssessmentAttempt> findByStatusAndExam_ExamType_ExamTypeText(AssessmentAttempt.Status status, String examTypeText);

    List<AssessmentAttempt> findByLearnerIdAndExam_ExamType_ExamTypeText(Long learnerId, String examTypeText);

    List<AssessmentAttempt> findByExam_ExamIdAndLearnerIdOrderByAttemptNumberDesc(
            Long examId, Long learnerId);

    boolean existsByExam_ExamIdAndLearnerIdAndStatus(
            Long examId, Long learnerId, AssessmentAttempt.Status status);

    List<AssessmentAttempt> findByLearnerIdAndExam_Certification_CertificationIdAndStatus(
            Long learnerId, Long certificationId, AssessmentAttempt.Status status);

    /** Past graded attempts of this exam by this learner, for adaptive retake analysis. */
    List<AssessmentAttempt> findByExam_ExamIdAndLearnerIdAndStatus(
            Long examId, Long learnerId, AssessmentAttempt.Status status);

    // --- Platform aggregates (admin dashboard) -----------------------------

    long countByStatus(AssessmentAttempt.Status status);

    long countByStatusAndPassed(AssessmentAttempt.Status status, Boolean passed);

    /** Mean percentage across graded attempts. Null when nothing is graded yet. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT AVG(a.percentage) FROM AssessmentAttempt a
            WHERE a.status = :status AND a.percentage IS NOT NULL
            """)
    Double averagePercentageByStatus(
            @org.springframework.data.repository.query.Param("status") AssessmentAttempt.Status status);

    long countByStatusAndSubmittedAtGreaterThanEqual(
            AssessmentAttempt.Status status, java.time.LocalDateTime since);

    // --- Per-learner rollups (institution dashboard) ------------------------

    /** One row per learner. Projection interface so the rollup stays in SQL. */
    interface LearnerAttemptStats {
        Long getLearnerId();
        long getAttempts();
        long getPassedAttempts();
        Double getAverageScore();
        java.time.LocalDateTime getLastSubmittedAt();
    }

    /**
     * Graded-attempt statistics for a whole roster in one query.
     *
     * Batched on purpose: the institution dashboard renders a row per member,
     * and doing this per learner is the N+1 that makes a 200-seat institution's
     * dashboard take seconds.
     */
    @org.springframework.data.jpa.repository.Query("""
            SELECT a.learnerId AS learnerId,
                   COUNT(a) AS attempts,
                   SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) AS passedAttempts,
                   AVG(a.percentage) AS averageScore,
                   MAX(a.submittedAt) AS lastSubmittedAt
            FROM AssessmentAttempt a
            WHERE a.learnerId IN :learnerIds AND a.status = :status
            GROUP BY a.learnerId
            """)
    List<LearnerAttemptStats> statsByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("status") AssessmentAttempt.Status status);

    /** Submitted attempts whose background marking has not finished -- the sweep's worklist. */
    List<AssessmentAttempt> findByStatusAndGradingPendingTrueAndSubmittedAtBefore(
            AssessmentAttempt.Status status, java.time.LocalDateTime before);
}
