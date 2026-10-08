package com.capstone.rebyu.learningtools.repository;

import com.capstone.rebyu.learningtools.entity.GeneratedStudySet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GeneratedStudySetRepository extends JpaRepository<GeneratedStudySet, Long> {

    @Query("""
            SELECT s FROM GeneratedStudySet s JOIN FETCH s.items
            WHERE s.studySetId = :studySetId AND s.learner.learnerId = :learnerId
            """)
    Optional<GeneratedStudySet> findByStudySetIdAndLearnerIdWithItems(
            @Param("studySetId") Long studySetId, @Param("learnerId") Long learnerId);

    @Query("""
            SELECT s FROM GeneratedStudySet s
            JOIN FETCH s.lesson l JOIN FETCH l.middleCategory m JOIN FETCH m.majorCategory
            WHERE s.studySetId = :studySetId
            """)
    Optional<GeneratedStudySet> findByIdWithCurriculum(@Param("studySetId") Long studySetId);

    Optional<GeneratedStudySet> findFirstByLearner_LearnerIdAndSourceAndGenerationVersion(
            Long learnerId, String source, String generationVersion);

    @Query("""
            SELECT s.title FROM GeneratedStudySet s
            WHERE s.learner.learnerId = :learnerId
              AND s.lesson.lessonId = :lessonId
              AND s.studyType = :studyType
            """)
    List<String> findTitlesByLearnerLessonAndType(
            @Param("learnerId") Long learnerId,
            @Param("lessonId") Long lessonId,
            @Param("studyType") String studyType);
}
