package com.capstone.rebyu.certification.repository;

import com.capstone.rebyu.certification.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByMiddleCategory_MiddleCategoryId(Long middleCategoryId);

    List<Lesson> findByMiddleCategory_MajorCategory_Certification_CertificationId(Long certificationId);

    /** A certification's lesson count without loading the lessons (and their content). */
    long countByMiddleCategory_MajorCategory_Certification_CertificationId(Long certificationId);

    List<Lesson> findByMiddleCategory_MajorCategory_Certification_CertificationIdAndMiddleCategory_MajorCategory_OwnerDepartmentIsNull(
            Long certificationId);

    @Query("SELECT l.lessonId AS lessonId, "
            + "mc.middleCategoryId AS middleCategoryId, "
            + "maj.majorCategoryId AS majorCategoryId "
            + "FROM Lesson l "
            + "JOIN l.middleCategory mc "
            + "JOIN mc.majorCategory maj "
            + "WHERE maj.certification.certificationId = :certificationId "
            + "AND maj.ownerDepartment IS NULL")
    List<CurriculumLessonIdView> findOfficialLessonIdsByCertificationId(
            @Param("certificationId") Long certificationId);

    /** {@link #findOfficialLessonIdsByCertificationId}, for many certifications in one query. */
    interface OfficialLessonIdsView extends CurriculumLessonIdView {
        Long getCertificationId();
    }

    @Query("SELECT maj.certification.certificationId AS certificationId, l.lessonId AS lessonId, "
            + "mc.middleCategoryId AS middleCategoryId, maj.majorCategoryId AS majorCategoryId "
            + "FROM Lesson l JOIN l.middleCategory mc JOIN mc.majorCategory maj "
            + "WHERE maj.certification.certificationId IN :certificationIds "
            + "AND maj.ownerDepartment IS NULL")
    List<OfficialLessonIdsView> findOfficialLessonIdsByCertificationIds(
            @Param("certificationIds") java.util.Collection<Long> certificationIds);

    /** An official lesson with its module and major category, without the lesson content. */
    interface LessonPlacementView {
        Long getLessonId();
        String getName();
        Long getMiddleCategoryId();
        String getMiddleTitle();
        Long getMajorCategoryId();
        String getMajorTitle();
    }

    @Query("SELECT l.lessonId AS lessonId, l.name AS name, "
            + "mc.middleCategoryId AS middleCategoryId, mc.title AS middleTitle, "
            + "maj.majorCategoryId AS majorCategoryId, maj.title AS majorTitle "
            + "FROM Lesson l JOIN l.middleCategory mc JOIN mc.majorCategory maj "
            + "WHERE maj.certification.certificationId = :certificationId "
            + "AND maj.ownerDepartment IS NULL ORDER BY l.lessonId")
    List<LessonPlacementView> findOfficialPlacementsByCertificationId(
            @Param("certificationId") Long certificationId);

    /** A lesson's id, module and name -- everything but its content. */
    interface LessonOutlineView {
        Long getLessonId();
        Long getMiddleCategoryId();
        String getName();
    }

    /**
     * Lesson outlines for many certifications in one query. Selects no content
     * column: lesson content is most of a certification's size, and reading it
     * for a list was the slowest, most often dropped query in the app.
     */
    @Query("SELECT l.lessonId AS lessonId, mc.middleCategoryId AS middleCategoryId, l.name AS name "
            + "FROM Lesson l JOIN l.middleCategory mc JOIN mc.majorCategory maj "
            + "WHERE maj.certification.certificationId IN :certificationIds "
            + "ORDER BY l.lessonId")
    List<LessonOutlineView> findOutlinesByCertificationIds(
            @Param("certificationIds") java.util.Collection<Long> certificationIds);

    /** Lesson names by id, without loading lesson content. */
    interface LessonNameView {
        Long getLessonId();
        String getName();
    }

    @Query("SELECT l.lessonId AS lessonId, l.name AS name FROM Lesson l WHERE l.lessonId IN :lessonIds")
    List<LessonNameView> findNamesByIdIn(@Param("lessonIds") java.util.Collection<Long> lessonIds);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.middleCategory mc " +
            "JOIN FETCH mc.majorCategory maj " +
            "WHERE maj.certification.certificationId = :certificationId")
    List<Lesson> findAllWithCategoriesByCertificationId(@Param("certificationId") Long certificationId);
}
