package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByOwnerDepartment_DepartmentId(Long departmentId);

    List<Exam> findByCertification_CertificationId(Long certificationId);

    // Per-scope uniqueness checks (spec §5): one required assessment per scope.
    boolean existsByLesson_LessonId(Long lessonId);

    // Same check, but ignoring AI-tutor-generated practice quizzes: a learner
    // generating one for their own use must never block an admin from later
    // authoring the lesson's real, official quiz. Explicit JPQL rather than a
    // derived `...AndIsGeneratedFalse` name, since Spring Data's derivation
    // off a Lombok `is`-prefixed boolean getter is easy to get subtly wrong.
    @Query("SELECT COUNT(e) > 0 FROM Exam e WHERE e.lesson.lessonId = :lessonId AND e.isGenerated = false")
    boolean existsOfficialByLessonId(@Param("lessonId") Long lessonId);

    boolean existsByMiddleCategory_MiddleCategoryId(Long middleCategoryId);

    boolean existsByMajorCategory_MajorCategoryId(Long majorCategoryId);

    boolean existsByCertification_CertificationIdAndExamType_ExamTypeText(
            Long certificationId, String examTypeText);

    /**
     * Whether this certification has a PUBLISHED, official diagnostic.
     *
     * <p>The gate that asks this used to read every exam on the platform back
     * as entities and filter them in Java, on every assessment page load and
     * every attempt start. The predicate is three columns wide and belongs in
     * SQL: {@code ownerDepartment IS NULL} is what "official" means (a group's own
     * assessment must never gate learners outside -- or inside -- that group),
     * and a null status is DRAFT, matching {@code Exam.effectiveStatus()}.
     */
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

    /**
     * Whether this learner has a submitted attempt of an official exam of the
     * given type in this certification.
     *
     * <p>Answers the diagnostic gate's "has this learner actually sat it?" in
     * one round trip. Read as entities, the same question cost one query for
     * the attempt list and then one more per attempt to resolve the lazy exam
     * behind it just to read its type.
     */
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

    /**
     * When this learner was last served an exam of a given type -- the pop-up
     * knowledge check's cooldown reads this so a learner cannot be interrupted
     * twice in the same sitting. The minted exam is itself the record that a
     * check was served, so no separate bookkeeping table is needed.
     */
    @Query("""
            SELECT MAX(e.publishedAt) FROM Exam e
            WHERE e.learner.learnerId = :learnerId
              AND e.examType.examTypeText = :examTypeText
            """)
    java.time.LocalDateTime findLastServedAt(
            @Param("learnerId") Long learnerId, @Param("examTypeText") String examTypeText);

    /* Curriculum progression.
     *
     * Each of these counts the prerequisites the learner has NOT yet passed,
     * so a result of zero means the gate is open. Institution-owned papers are
     * excluded throughout: a class's assessments are the institution's to
     * sequence, the same exemption the retake gate makes.
     *
     * CLEARED, not merely passed -- the same rule the learning road applies in
     * `curriculum-model.js`: where the sitting measured a proficiency, that
     * proficiency reaching Proficient is the whole test, and the pass mark
     * does not enter into it. An adaptive paper keeps serving harder items
     * until it finds the edge of what the learner knows, so a raw percentage
     * under the pass mark is the normal shape of a sitting that measured a
     * real level -- gating on it as well locked out learners the engine had
     * just rated Proficient.
     *
     * Read from `exam_results` rather than `assessment_attempts` so the server
     * and the screen answer from the same rows: `rating` lives only here.
     * A row with no rating (a fixed paper, or one written before ratings were
     * recorded) clears on the pass alone.
     *
     * Only the LATEST sitting (highest attempt number) is read, matching
     * `examStanding` on the screen: a failed retake shuts the road again
     * until a later sitting clears it. Counting any cleared row let a learner
     * whose last quiz scored 37 still open the topic exam on an older 50+. */

    /** Earlier lessons in this topic whose quiz the learner has not passed. */
    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'LESSON_QUIZ'
               AND e.ownerDepartment IS NULL
               AND e.lesson.middleCategory.middleCategoryId = :middleCategoryId
               AND e.lesson.lessonId < :lessonId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND r.id.attemptNo = (SELECT MAX(r2.id.attemptNo) FROM ExamResult r2
                                                         WHERE r2.exam = e AND r2.learner.learnerId = :learnerId)
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedEarlierLessonQuizzes(
            @Param("middleCategoryId") Long middleCategoryId,
            @Param("lessonId") Long lessonId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);

    /** Lessons in this topic whose quiz the learner has not passed. */
    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'LESSON_QUIZ'
               AND e.ownerDepartment IS NULL
               AND e.lesson.middleCategory.middleCategoryId = :middleCategoryId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND r.id.attemptNo = (SELECT MAX(r2.id.attemptNo) FROM ExamResult r2
                                                         WHERE r2.exam = e AND r2.learner.learnerId = :learnerId)
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedLessonQuizzesInMiddle(
            @Param("middleCategoryId") Long middleCategoryId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);

    /** Topics in this unit whose module exam the learner has not passed. */
    @Query("""
            SELECT COUNT(e) FROM Exam e
             WHERE e.examType.examTypeText = 'MIDDLE_EXAM'
               AND e.ownerDepartment IS NULL
               AND e.middleCategory.majorCategory.majorCategoryId = :majorCategoryId
               AND NOT EXISTS (SELECT 1 FROM ExamResult r
                                WHERE r.exam = e AND r.learner.learnerId = :learnerId
                                  AND r.id.attemptNo = (SELECT MAX(r2.id.attemptNo) FROM ExamResult r2
                                                         WHERE r2.exam = e AND r2.learner.learnerId = :learnerId)
                                  AND ((r.rating IS NOT NULL AND r.rating >= :proficient)
                                     OR (r.rating IS NULL AND r.isPassed = TRUE)))
            """)
    long countUnpassedMiddleExamsInMajor(
            @Param("majorCategoryId") Long majorCategoryId,
            @Param("learnerId") Long learnerId,
            @Param("proficient") java.math.BigDecimal proficient);
}
