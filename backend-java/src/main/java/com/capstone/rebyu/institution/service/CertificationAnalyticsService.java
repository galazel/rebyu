package com.capstone.rebyu.institution.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * How an institution's own learners are doing in one certification: overall, per lesson and
 * per official assessment. Only learners enrolled through this institution are counted.
 */
@Service
@RequiredArgsConstructor
public class CertificationAnalyticsService {

    private final JdbcTemplate jdbc;

    public record Summary(int enrolled, int finished, BigDecimal averageProgress,
                          int mockPassed, int assessmentAttempts, BigDecimal averageScore) {}

    public record LessonStat(Long lessonId, int completed) {}

    public record AssessmentStat(Long examId, String title, String examType, Long lessonId,
                                 Long middleCategoryId, Long majorCategoryId, int attempts,
                                 int learners, BigDecimal averageScore, BigDecimal passRate) {}

    public record CertificationAnalytics(Long certificationId, Summary summary,
                                         List<LessonStat> lessons, List<AssessmentStat> assessments) {}

    private static final String ROSTER = """
            WITH roster AS (
              SELECT DISTINCT icl.learner_id, icl.status, icl.progress_percentage
                FROM institution_certification_learners icl
                JOIN institution_certificates ic ON ic.institution_cert_id = icl.institution_cert_id
               WHERE ic.institution_id = ? AND ic.certification_id = ?
                 AND icl.status IN ('active', 'completed')
            ),
            official AS (
              SELECT e.exam_id, e.title, t.exam_type_text, e.lesson_id, e.middle_category_id, e.major_category_id
                FROM exams e
                LEFT JOIN exam_types t ON t.exam_type_id = e.exam_type_id
               WHERE e.certification_id = ? AND e.owner_department_id IS NULL AND e.learner_id IS NULL
            )
            """;

    @Transactional(readOnly = true)
    public CertificationAnalytics analytics(Long institutionId, Long certificationId) {
        Object[] scope = {institutionId, certificationId, certificationId};

        Summary summary = jdbc.queryForObject(ROSTER + """
                SELECT (SELECT count(*) FROM roster) AS enrolled,
                       (SELECT count(*) FROM roster WHERE status = 'completed') AS finished,
                       (SELECT coalesce(round(avg(progress_percentage), 1), 0) FROM roster) AS avg_progress,
                       (SELECT count(DISTINCT a.learner_id) FROM assessment_attempts a
                          JOIN official o ON o.exam_id = a.exam_id
                          JOIN roster r ON r.learner_id = a.learner_id
                         WHERE o.exam_type_text = 'MOCK_EXAM' AND a.status = 'SUBMITTED' AND a.passed) AS mock_passed,
                       (SELECT count(*) FROM assessment_attempts a
                          JOIN official o ON o.exam_id = a.exam_id
                          JOIN roster r ON r.learner_id = a.learner_id
                         WHERE a.status = 'SUBMITTED') AS attempts,
                       (SELECT coalesce(round(avg(a.percentage), 1), 0) FROM assessment_attempts a
                          JOIN official o ON o.exam_id = a.exam_id
                          JOIN roster r ON r.learner_id = a.learner_id
                         WHERE a.status = 'SUBMITTED') AS avg_score
                """,
                (rs, i) -> new Summary(rs.getInt("enrolled"), rs.getInt("finished"), rs.getBigDecimal("avg_progress"),
                        rs.getInt("mock_passed"), rs.getInt("attempts"), rs.getBigDecimal("avg_score")),
                scope);

        List<LessonStat> lessons = jdbc.query(ROSTER + """
                SELECT lcl.lesson_id, count(DISTINCT lcl.learner_id) AS completed
                  FROM learner_completed_lessons lcl
                  JOIN roster r ON r.learner_id = lcl.learner_id
                  JOIN lessons l ON l.lesson_id = lcl.lesson_id
                  JOIN middle_categories mc ON mc.middle_category_id = l.middle_category_id
                  JOIN major_categories mj ON mj.major_category_id = mc.major_category_id
                 WHERE mj.certification_id = ?
                 GROUP BY lcl.lesson_id
                """,
                (rs, i) -> new LessonStat(rs.getLong("lesson_id"), rs.getInt("completed")),
                institutionId, certificationId, certificationId, certificationId);

        List<AssessmentStat> assessments = jdbc.query(ROSTER + """
                SELECT o.exam_id, o.title, o.exam_type_text, o.lesson_id, o.middle_category_id, o.major_category_id,
                       count(a.assessment_attempt_id) AS attempts,
                       count(DISTINCT a.learner_id) AS learners,
                       round(avg(a.percentage), 1) AS avg_score,
                       round(100.0 * count(*) FILTER (WHERE a.passed) / nullif(count(a.assessment_attempt_id), 0), 1) AS pass_rate
                  FROM official o
                  JOIN assessment_attempts a ON a.exam_id = o.exam_id AND a.status = 'SUBMITTED'
                  JOIN roster r ON r.learner_id = a.learner_id
                 GROUP BY o.exam_id, o.title, o.exam_type_text, o.lesson_id, o.middle_category_id, o.major_category_id
                """,
                (rs, i) -> new AssessmentStat(rs.getLong("exam_id"), rs.getString("title"), rs.getString("exam_type_text"),
                        (Long) rs.getObject("lesson_id"), (Long) rs.getObject("middle_category_id"),
                        (Long) rs.getObject("major_category_id"), rs.getInt("attempts"), rs.getInt("learners"),
                        rs.getBigDecimal("avg_score"), rs.getBigDecimal("pass_rate")),
                scope);

        return new CertificationAnalytics(certificationId, summary, lessons, assessments);
    }
}
