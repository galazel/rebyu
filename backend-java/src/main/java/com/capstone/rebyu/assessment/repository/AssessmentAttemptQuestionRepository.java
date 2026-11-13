package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AssessmentAttemptQuestionRepository
        extends JpaRepository<AssessmentAttemptQuestion, Long> {

    List<AssessmentAttemptQuestion> findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(
            Long assessmentAttemptId);

    List<AssessmentAttemptQuestion> findByAttempt_AssessmentAttemptIdIn(
            List<Long> assessmentAttemptIds);

    long countByAttempt_AssessmentAttemptId(Long assessmentAttemptId);

    /** Questions the learner has handed in at least once on this exam (an arena's problems). */
    @Query("""
            SELECT DISTINCT q.sourceQuestionId
            FROM AssessmentAttemptQuestion q JOIN q.attempt a
            WHERE a.learnerId = :learnerId
              AND a.exam.examId = :examId
              AND a.status = com.capstone.rebyu.assessment.entity.AssessmentAttempt.Status.SUBMITTED
            """)
    List<Long> findSubmittedSourceQuestionIds(@Param("learnerId") Long learnerId, @Param("examId") Long examId);

    /** One row per handed-in challenge problem: who, which arena exam, which problem, the run's score. */
    @Query("""
            SELECT a.learnerId AS learnerId, a.exam.examId AS examId, a.exam.targetScope AS arenaId,
                   q.sourceQuestionId AS questionId, a.percentage AS percentage
            FROM AssessmentAttemptQuestion q JOIN q.attempt a
            WHERE a.status = com.capstone.rebyu.assessment.entity.AssessmentAttempt.Status.SUBMITTED
              AND a.exam.examType.examTypeText = :examType
            """)
    List<ChallengeRunView> findSubmittedChallengeRuns(@Param("examType") String examType);

    interface ChallengeRunView {
        Long getLearnerId();
        Long getExamId();
        String getArenaId();
        Long getQuestionId();
        java.math.BigDecimal getPercentage();
    }

    interface ExposureView {
        Long getSourceQuestionId();
        long getTimesSeen();
        LocalDateTime getLastSeenAt();
        Long getLastAttemptId();
    }

    @Query("""
            SELECT q.sourceQuestionId AS sourceQuestionId,
                   COUNT(q) AS timesSeen,
                   MAX(a.startedAt) AS lastSeenAt,
                   MAX(a.assessmentAttemptId) AS lastAttemptId
            FROM AssessmentAttemptQuestion q JOIN q.attempt a
            WHERE a.learnerId = :learnerId AND q.sourceQuestionId IN :questionIds
            GROUP BY q.sourceQuestionId
            """)
    List<ExposureView> findExposure(
            @Param("learnerId") Long learnerId, @Param("questionIds") Collection<Long> questionIds);

    @Query("""
            SELECT DISTINCT q.sourceQuestionId
            FROM AssessmentAttemptQuestion q JOIN q.attempt a
            WHERE a.learnerId = :learnerId AND a.exam.examId = :examId
            """)
    List<Long> findSourceQuestionIdsServedOnExam(
            @Param("learnerId") Long learnerId, @Param("examId") Long examId);
}
