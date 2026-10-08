package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptAnswerRepository
        extends JpaRepository<AssessmentAttemptAnswer, Long> {

    List<AssessmentAttemptAnswer> findByAttempt_AssessmentAttemptId(Long assessmentAttemptId);

    Optional<AssessmentAttemptAnswer> findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
            Long assessmentAttemptId, Long attemptQuestionId);

    List<AssessmentAttemptAnswer> findByAttempt_AssessmentAttemptIdIn(
            List<Long> assessmentAttemptIds);

    interface LessonAccuracyRow {
        Long getLessonId();
        long getAnswered();
        long getCorrect();
    }

    @Query(value = """
            SELECT q.lesson_id AS lessonId,
                   count(*) AS answered,
                   count(*) FILTER (WHERE a.is_correct) AS correct
            FROM assessment_attempt_answers a
            JOIN assessment_attempt_questions aq ON aq.attempt_question_id = a.attempt_question_id
            JOIN assessment_attempts t ON t.assessment_attempt_id = a.assessment_attempt_id
            JOIN questions q ON q.question_id = aq.source_question_id
            JOIN lessons l ON l.lesson_id = q.lesson_id
            JOIN middle_categories m ON m.middle_category_id = l.middle_category_id
            JOIN major_categories j ON j.major_category_id = m.major_category_id
            WHERE t.learner_id = :learnerId
              AND t.submitted_at IS NOT NULL
              AND a.is_correct IS NOT NULL
              AND j.certification_id = :certificationId
            GROUP BY q.lesson_id
            """, nativeQuery = true)
    List<LessonAccuracyRow> lessonAccuracy(@Param("learnerId") Long learnerId,
                                           @Param("certificationId") Long certificationId);

    interface TopicDifficultyRow {
        Long getLessonId();
        String getLessonTitle();
        String getCategoryTitle();
        Long getCertificationId();
        String getCertificationTitle();
        long getAnswered();
        long getCorrect();
        long getLearners();
    }

    @Query(value = """
            SELECT q.lesson_id AS lessonId,
                   l.name AS lessonTitle,
                   m.title AS categoryTitle,
                   j.certification_id AS certificationId,
                   c.title AS certificationTitle,
                   count(*) AS answered,
                   count(*) FILTER (WHERE a.is_correct) AS correct,
                   count(DISTINCT t.learner_id) AS learners
            FROM assessment_attempt_answers a
            JOIN assessment_attempt_questions aq ON aq.attempt_question_id = a.attempt_question_id
            JOIN assessment_attempts t ON t.assessment_attempt_id = a.assessment_attempt_id
            JOIN questions q ON q.question_id = aq.source_question_id
            JOIN lessons l ON l.lesson_id = q.lesson_id
            JOIN middle_categories m ON m.middle_category_id = l.middle_category_id
            JOIN major_categories j ON j.major_category_id = m.major_category_id
            JOIN certifications c ON c.certification_id = j.certification_id
            WHERE t.learner_id IN :learnerIds
              AND j.certification_id IN :certificationIds
              AND t.submitted_at IS NOT NULL
              AND t.submitted_at >= :from AND t.submitted_at <= :to
              AND a.is_correct IS NOT NULL
            GROUP BY q.lesson_id, l.name, m.title, j.certification_id, c.title
            HAVING count(*) >= :minAnswers
            """, nativeQuery = true)
    List<TopicDifficultyRow> topicDifficulty(@Param("learnerIds") Collection<Long> learnerIds,
                                             @Param("certificationIds") Collection<Long> certificationIds,
                                             @Param("minAnswers") long minAnswers,
                                             @Param("from") java.time.LocalDateTime from,
                                             @Param("to") java.time.LocalDateTime to);
}
