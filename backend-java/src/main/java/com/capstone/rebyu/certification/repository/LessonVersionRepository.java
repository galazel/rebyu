package com.capstone.rebyu.certification.repository;

import com.capstone.rebyu.certification.entity.LessonVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LessonVersionRepository extends JpaRepository<LessonVersion, Long> {

    /** List view: everything but the (large) content column. */
    interface Summary {
        Long getLessonVersionId();
        String getSavedByName();
        LocalDateTime getCreatedAt();
    }

    List<Summary> findAllByLessonIdOrderByCreatedAtDescLessonVersionIdDesc(Long lessonId);

    Optional<LessonVersion> findFirstByLessonIdOrderByCreatedAtDescLessonVersionIdDesc(Long lessonId);

    Optional<LessonVersion> findByLessonVersionIdAndLessonId(Long lessonVersionId, Long lessonId);

    boolean existsByLessonId(Long lessonId);
}
