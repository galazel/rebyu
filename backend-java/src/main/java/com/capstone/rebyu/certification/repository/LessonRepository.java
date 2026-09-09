package com.capstone.rebyu.certification.repository;

import com.capstone.rebyu.certification.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByMiddleCategory_MiddleCategoryId(Long middleCategoryId);

    List<Lesson> findByMiddleCategory_MajorCategory_Certification_CertificationId(Long certificationId);

    /**
     * Official lessons only -- excludes lessons an Institution group authored
     * under its own major categories. Admin-side flows (AI generation, publish
     * validation) must never read or write a group's own content.
     */
    List<Lesson> findByMiddleCategory_MajorCategory_Certification_CertificationIdAndMiddleCategory_MajorCategory_OwnerGroupIsNull(
            Long certificationId);

    /**
     * The certification's official lessons as ids only -- see
     * {@link CurriculumLessonIdView} for why this is not the entity query.
     */
    @Query("SELECT l.lessonId AS lessonId, "
            + "mc.middleCategoryId AS middleCategoryId, "
            + "maj.majorCategoryId AS majorCategoryId "
            + "FROM Lesson l "
            + "JOIN l.middleCategory mc "
            + "JOIN mc.majorCategory maj "
            + "WHERE maj.certification.certificationId = :certificationId "
            + "AND maj.ownerGroup IS NULL")
    List<CurriculumLessonIdView> findOfficialLessonIdsByCertificationId(
            @Param("certificationId") Long certificationId);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.middleCategory mc " +
            "JOIN FETCH mc.majorCategory maj " +
            "WHERE maj.certification.certificationId = :certificationId")
    List<Lesson> findAllWithCategoriesByCertificationId(@Param("certificationId") Long certificationId);
}
