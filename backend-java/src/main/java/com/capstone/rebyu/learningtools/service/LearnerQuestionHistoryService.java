package com.capstone.rebyu.learningtools.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearnerQuestionHistoryService {

  private final JdbcTemplate jdbc;

  @Transactional(readOnly = true)
  public List<Long> missedQuestionIds(Long learnerId, Long certificationId, Long lessonId) {
    StringBuilder sql = new StringBuilder("""
        SELECT aq.source_question_id
        FROM assessment_attempt_answers ans
        JOIN assessment_attempt_questions aq ON aq.attempt_question_id = ans.attempt_question_id
        JOIN assessment_attempts a ON a.assessment_attempt_id = ans.assessment_attempt_id
        JOIN exams e ON e.exam_id = a.exam_id
        LEFT JOIN questions q ON q.question_id = aq.source_question_id
        WHERE a.learner_id = ? AND a.status = 'SUBMITTED' AND ans.is_correct = false
          AND aq.source_question_id IS NOT NULL
        """);

    List<Object> params = new ArrayList<>(List.of(learnerId));

    if (certificationId != null) {
      sql.append(" AND e.certification_id = ?\n");
      params.add(certificationId);
    }

    if (lessonId != null) {
      sql.append(" AND coalesce(aq.lesson_id, q.lesson_id) = ?\n");
      params.add(lessonId);
    }

    sql.append("""
        GROUP BY aq.source_question_id
        ORDER BY count(*) DESC, max(a.submitted_at) DESC
        """);

    return jdbc.queryForList(sql.toString(), Long.class, params.toArray());
  }

  @Transactional(readOnly = true)
  public List<Long> answeredQuestionIds(Long learnerId, Long certificationId) {
    return jdbc.queryForList("""
        SELECT aq.source_question_id
        FROM assessment_attempt_answers ans
        JOIN assessment_attempt_questions aq ON aq.attempt_question_id = ans.attempt_question_id
        JOIN assessment_attempts a ON a.assessment_attempt_id = ans.assessment_attempt_id
        JOIN exams e ON e.exam_id = a.exam_id
        WHERE a.learner_id = ? AND a.status = 'SUBMITTED'
          AND e.certification_id = ?
          AND aq.source_question_id IS NOT NULL
        GROUP BY aq.source_question_id
        ORDER BY max(a.submitted_at) DESC
        """, Long.class, learnerId, certificationId);
  }
}
