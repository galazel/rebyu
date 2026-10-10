package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByLesson_LessonId(Long lessonId);

    List<Question> findByParentQuestion_QuestionId(Long questionId);

    List<Question> findByParentQuestion_QuestionIdOrderByQuestionIdAsc(Long questionId);

    @Query("""
            SELECT q FROM Question q
            WHERE q.parentQuestion.questionId IN :parentIds
            ORDER BY q.parentQuestion.questionId ASC, q.questionId ASC
            """)
    List<Question> findSubQuestionsByParentIdIn(@Param("parentIds") Collection<Long> parentIds);

    List<Question> findByParentQuestionIsNullAndLesson_LessonIdOrderByQuestionIdAsc(Long lessonId);

    List<Question> findByParentQuestionIsNullAndLesson_MiddleCategory_MiddleCategoryIdOrderByQuestionIdAsc(
            Long middleCategoryId);

    List<Question> findByParentQuestionIsNullAndLesson_MiddleCategory_MajorCategory_MajorCategoryIdOrderByQuestionIdAsc(
            Long majorCategoryId);

    List<Question> findByParentQuestionIsNullAndLesson_MiddleCategory_MajorCategory_Certification_CertificationIdOrderByQuestionIdAsc(
            Long certificationId);


    @Query("""
            SELECT q.questionId AS questionId, l.lessonId AS lessonId,
                   q.difficultyLevel AS difficultyLevel, q.questionText AS questionText,
                   og.departmentId AS ownerDepartmentId,
                   q.questionType AS questionType
            FROM Question q JOIN q.lesson l LEFT JOIN q.ownerDepartment og
            WHERE q.parentQuestion IS NULL AND l.lessonId = :lessonId
            ORDER BY q.questionId ASC
            """)
    List<QuestionSelectionView> findSelectionViewsByLesson(@Param("lessonId") Long lessonId);

    @Query("""
            SELECT q.questionId AS questionId, l.lessonId AS lessonId,
                   q.difficultyLevel AS difficultyLevel, q.questionText AS questionText,
                   og.departmentId AS ownerDepartmentId,
                   q.questionType AS questionType
            FROM Question q JOIN q.lesson l LEFT JOIN q.ownerDepartment og
            WHERE q.parentQuestion IS NULL AND l.middleCategory.middleCategoryId = :middleCategoryId
            ORDER BY q.questionId ASC
            """)
    List<QuestionSelectionView> findSelectionViewsByMiddleCategory(
            @Param("middleCategoryId") Long middleCategoryId);

    @Query("""
            SELECT q.questionId AS questionId, l.lessonId AS lessonId,
                   q.difficultyLevel AS difficultyLevel, q.questionText AS questionText,
                   og.departmentId AS ownerDepartmentId,
                   q.questionType AS questionType
            FROM Question q JOIN q.lesson l LEFT JOIN q.ownerDepartment og
            WHERE q.parentQuestion IS NULL
              AND l.middleCategory.majorCategory.majorCategoryId = :majorCategoryId
            ORDER BY q.questionId ASC
            """)
    List<QuestionSelectionView> findSelectionViewsByMajorCategory(
            @Param("majorCategoryId") Long majorCategoryId);

    @Query("""
            SELECT q.questionId AS questionId, l.lessonId AS lessonId,
                   q.difficultyLevel AS difficultyLevel, q.questionText AS questionText,
                   og.departmentId AS ownerDepartmentId,
                   q.questionType AS questionType
            FROM Question q JOIN q.lesson l LEFT JOIN q.ownerDepartment og
            WHERE q.parentQuestion IS NULL
              AND l.middleCategory.majorCategory.certification.certificationId = :certificationId
            ORDER BY q.questionId ASC
            """)
    List<QuestionSelectionView> findSelectionViewsByCertification(
            @Param("certificationId") Long certificationId);

    @Query("""
            SELECT q.questionId AS questionId, l.lessonId AS lessonId,
                   q.difficultyLevel AS difficultyLevel, q.questionText AS questionText,
                   og.departmentId AS ownerDepartmentId,
                   q.questionType AS questionType
            FROM Question q JOIN q.lesson l LEFT JOIN q.ownerDepartment og
            WHERE q.questionId IN :ids
            """)
    List<QuestionSelectionView> findSelectionViewsByIdIn(@Param("ids") Collection<Long> ids);

    /**
     * A lesson's questions with everything the question list shows, in one query: the
     * choices, the three type configs (one-to-one inverse sides would otherwise load one
     * query each) and the author. Lazily that was ~5 queries per question.
     */
    @EntityGraph(attributePaths = {
            "choices", "diagramQuestionConfig", "programmingQuestionConfig", "textQuestionConfig",
            "createdBy", "ownerDepartment"})
    @Query("SELECT DISTINCT q FROM Question q WHERE q.lesson.lessonId = :lessonId ORDER BY q.questionId")
    List<Question> findForListingByLessonId(@Param("lessonId") Long lessonId);

    /** Every question one department wrote, newest first, loaded for the question list. */
    @EntityGraph(attributePaths = {
            "choices", "diagramQuestionConfig", "programmingQuestionConfig", "textQuestionConfig",
            "createdBy", "ownerDepartment"})
    @Query("SELECT DISTINCT q FROM Question q WHERE q.ownerDepartment.departmentId = :departmentId "
            + "ORDER BY q.questionId DESC")
    List<Question> findForListingByOwnerDepartmentId(@Param("departmentId") Long departmentId);

    @EntityGraph(attributePaths = {
            "choices", "diagramQuestionConfig", "programmingQuestionConfig", "textQuestionConfig"})
    @Query("SELECT DISTINCT q FROM Question q WHERE q.questionId IN :ids")
    List<Question> findForAttemptByIdIn(@Param("ids") Collection<Long> ids);

    @EntityGraph(attributePaths = {
            "choices", "createdBy", "ownerDepartment",
            "diagramQuestionConfig", "programmingQuestionConfig", "textQuestionConfig"})
    @Query("""
            SELECT DISTINCT q FROM Question q
            WHERE q.lesson.middleCategory.majorCategory.certification.certificationId = :certificationId
            """)
    List<Question> findBankByCertificationId(@Param("certificationId") Long certificationId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Question q WHERE q.questionId = :id")
    void deleteByQuestionId(@Param("id") Long id);
}
