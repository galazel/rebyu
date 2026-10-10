package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    /** Every exam one learner has passed across several certifications, in one query. */
    @Query("""
            SELECT DISTINCT a.exam.examId FROM AssessmentAttempt a
            WHERE a.learnerId = :learnerId AND a.status = :status AND a.passed = true
              AND a.exam.certification.certificationId IN :certificationIds
            """)
    List<Long> findPassedExamIds(
            @Param("learnerId") Long learnerId,
            @Param("status") AssessmentAttempt.Status status,
            @Param("certificationIds") java.util.Collection<Long> certificationIds);

    /** A learner's attempts in one certification with each exam and its type, in one query. */
    @Query("""
            SELECT a FROM AssessmentAttempt a
            JOIN FETCH a.exam e LEFT JOIN FETCH e.examType
            WHERE a.learnerId = :learnerId AND a.status = :status
              AND e.certification.certificationId = :certificationId
            """)
    List<AssessmentAttempt> findWithExamByLearnerAndCertification(
            @Param("learnerId") Long learnerId,
            @Param("certificationId") Long certificationId,
            @Param("status") AssessmentAttempt.Status status);

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

    List<AssessmentAttempt> findByExam_ExamIdAndLearnerIdAndStatus(
            Long examId, Long learnerId, AssessmentAttempt.Status status);


    long countByStatus(AssessmentAttempt.Status status);

    long countByStatusAndPassed(AssessmentAttempt.Status status, Boolean passed);

    @org.springframework.data.jpa.repository.Query("""
            SELECT AVG(a.percentage) FROM AssessmentAttempt a
            WHERE a.status = :status AND a.percentage IS NOT NULL
            """)
    Double averagePercentageByStatus(
            @org.springframework.data.repository.query.Param("status") AssessmentAttempt.Status status);

    long countByStatusAndSubmittedAtGreaterThanEqual(
            AssessmentAttempt.Status status, java.time.LocalDateTime since);


    interface LearnerAttemptStats {
        Long getLearnerId();
        long getAttempts();
        long getPassedAttempts();
        Double getAverageScore();
        java.time.LocalDateTime getLastSubmittedAt();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT a.learnerId AS learnerId,
                   COUNT(a) AS attempts,
                   SUM(CASE WHEN a.passed = TRUE THEN 1 ELSE 0 END) AS passedAttempts,
                   AVG(a.percentage) AS averageScore,
                   MAX(a.submittedAt) AS lastSubmittedAt
            FROM AssessmentAttempt a
            WHERE a.learnerId IN :learnerIds AND a.status = :status
              AND a.submittedAt >= :from AND a.submittedAt <= :to
            GROUP BY a.learnerId
            """)
    List<LearnerAttemptStats> statsByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("status") AssessmentAttempt.Status status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);

    interface CertificationScoreRow {
        Long getCertificationId();
        Double getAverageScore();
        long getAttempts();
        long getPassedAttempts();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT a.exam.certification.certificationId AS certificationId,
                   AVG(a.percentage) AS averageScore,
                   COUNT(a) AS attempts,
                   SUM(CASE WHEN a.passed = true THEN 1 ELSE 0 END) AS passedAttempts
            FROM AssessmentAttempt a
            WHERE a.learnerId IN :learnerIds
              AND a.submittedAt IS NOT NULL
              AND a.percentage IS NOT NULL
              AND a.submittedAt >= :from AND a.submittedAt <= :to
            GROUP BY a.exam.certification.certificationId
            """)
    List<CertificationScoreRow> certificationScoresByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);

    interface ExamOutcomeRow {
        Long getExamId();
        String getExamTitle();
        String getExamType();
        Long getCertificationId();
        String getCertificationTitle();
        java.math.BigDecimal getPassingScore();
        long getAttempts();
        long getPassedAttempts();
        Double getAverageScore();
        long getLearners();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT a.exam.examId AS examId,
                   a.exam.title AS examTitle,
                   a.exam.examType.examTypeText AS examType,
                   a.exam.certification.certificationId AS certificationId,
                   a.exam.certification.title AS certificationTitle,
                   a.exam.passingScore AS passingScore,
                   COUNT(a) AS attempts,
                   SUM(CASE WHEN a.passed = true THEN 1 ELSE 0 END) AS passedAttempts,
                   AVG(a.percentage) AS averageScore,
                   COUNT(DISTINCT a.learnerId) AS learners
            FROM AssessmentAttempt a
            WHERE a.learnerId IN :learnerIds
              AND a.exam.certification.certificationId IN :certificationIds
              AND a.submittedAt IS NOT NULL
              AND a.percentage IS NOT NULL
              AND a.submittedAt >= :from AND a.submittedAt <= :to
            GROUP BY a.exam.examId, a.exam.title, a.exam.examType.examTypeText,
                     a.exam.certification.certificationId, a.exam.certification.title,
                     a.exam.passingScore
            """)
    List<ExamOutcomeRow> examOutcomesByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("certificationIds") java.util.Collection<Long> certificationIds,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);

    interface LearnerMockExamResult {
        Long getLearnerId();
        Double getBestScore();
        java.time.LocalDateTime getPassedAt();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT a.learnerId AS learnerId,
                   MAX(a.percentage) AS bestScore,
                   MAX(a.submittedAt) AS passedAt
            FROM AssessmentAttempt a
            WHERE a.learnerId IN :learnerIds
              AND a.status = com.capstone.rebyu.assessment.entity.AssessmentAttempt.Status.SUBMITTED
              AND a.passed = TRUE
              AND a.exam.examType.examTypeText = 'MOCK_EXAM'
              AND a.exam.certification.certificationId = :certificationId
            GROUP BY a.learnerId
            """)
    List<LearnerMockExamResult> passedMockExamsByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("certificationId") Long certificationId);

    List<AssessmentAttempt> findByStatusAndGradingPendingTrueAndSubmittedAtBefore(
            AssessmentAttempt.Status status, java.time.LocalDateTime before);
}
