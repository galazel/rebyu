package com.capstone.rebyu.progress.repository;

import com.capstone.rebyu.progress.entity.LearnerReadSection;
import com.capstone.rebyu.progress.entity.LearnerReadSectionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearnerReadSectionRepository extends JpaRepository<LearnerReadSection, LearnerReadSectionId> {

    List<LearnerReadSection> findByLearner_LearnerIdAndLesson_LessonId(Long learnerId, Long lessonId);

    void deleteByLearner_LearnerIdAndLesson_LessonIdAndId_SectionKey(Long learnerId, Long lessonId, String sectionKey);

    @Modifying
    @Query(value = """
            INSERT INTO learner_read_sections (learner_id, lesson_id, section_key, read_at)
            VALUES (:learnerId, :lessonId, :sectionKey, now())
            ON CONFLICT DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("learnerId") Long learnerId, @Param("lessonId") Long lessonId, @Param("sectionKey") String sectionKey);
}
