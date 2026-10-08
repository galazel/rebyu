package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByOwnerDepartment_DepartmentId(Long departmentId);

    List<Exam> findByCertification_CertificationId(Long certificationId);

    boolean existsByLesson_LessonId(Long lessonId);

    List<Exam> findByLearner_LearnerIdAndLesson_LessonIdAndExamType_ExamTypeText(
            Long learnerId, Long lessonId, String examTypeText);

    @Query("SELECT COUNT(e) > 0 FROM Exam e WHERE e.lesson.lessonId = :lessonId AND e.isGenerated = false")
    boolean existsOfficialByLessonId(@Param("lessonId") Long lessonId);

    boolean existsByMiddleCategory_MiddleCategoryId(Long middleCategoryId);

    boolean existsByMajorCategory_MajorCategoryId(Long majorCategoryId);

    boolean existsByCertification_CertificationIdAndExamType_ExamTypeText(
            Long certificationId, String examTypeText);

    @Query("""
            SELECT COUNT(e) > 0 FROM Exam e
            WHERE e.certification.certificationId = :certificationId
              AND e.ownerDepartment IS NULL
              AND e.examType.examTypeText = :examTypeText
              AND e.status = :status
            """)
    boolean existsOfficialPublishedByType(
            @Param("certificationId") Long certificationId,
            @Param("examTypeText") String examTypeText,
            @Param("status") Exam.Status status);

    @Query("""
            SELECT COUNT(a) > 0 FROM AssessmentAttempt a
            WHERE a.learnerId = :learnerId
              AND a.exam.certification.certificationId = :certificationId
              AND a.status = :attemptStatus
              AND a.exam.ownerDepartment IS NULL
              AND a.exam.examType.examTypeText = :examTypeText
            """)
    boolean existsSubmittedAttemptOfOfficialType(
            @Param("learnerId") Long learnerId,
            @Param("certificationId") Long certificationId,
            @Param("examTypeText") String examTypeText,
            @Param("attemptStatus") com.capstone.rebyu.assessment.entity.AssessmentAttempt.Status attemptStatus);

    @Query("""
            SELECT MAX(e.publishedAt) FROM Exam e
            WHERE e.learner.learnerId = :learnerId
              AND e.examType.examTypeText = :examTypeText
            """)
    java.time.LocalDateTime findLastServedAt(
            @Param("learnerId") Long learnerId, @Param("examTypeText") String examTypeText);


    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'LESSON_QUIZ'
               AND e.ownerDepartment IS NULL
               AND e.lesson.middleCategory.middleCategoryId = :middleCategoryId
               AND e.lesson.lessonId < :lessonId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedEarlierLessonQuizzes(
            @Param("middleCategoryId") Long middleCategoryId,
            @Param("lessonId") Long lessonId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);

    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'LESSON_QUIZ'
               AND e.ownerDepartment IS NULL
               AND e.lesson.middleCategory.middleCategoryId = :middleCategoryId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedLessonQuizzesInMiddle(
            @Param("middleCategoryId") Long middleCategoryId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);

    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'MIDDLE_EXAM'
               AND e.ownerDepartment IS NULL
               AND e.middleCategory.majorCategory.majorCategoryId = :majorCategoryId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedMiddleExamsInMajor(
            @Param("majorCategoryId") Long majorCategoryId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);
}
