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
