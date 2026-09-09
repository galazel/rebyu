package com.capstone.rebyu.progress.repository;

import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.entity.LearnerCompletedLessonId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearnerCompletedLessonRepository extends JpaRepository<LearnerCompletedLesson, LearnerCompletedLessonId> {

    List<LearnerCompletedLesson> findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
            Long learnerId, Long certificationId);

    List<LearnerCompletedLesson> findByLearner_LearnerId(Long learnerId);

    /**
     * How many of a certification's lessons this learner has finished.
     *
     * <p>A count rather than the rows: progress wants the number, and the rows
     * carry a {@code Lesson} apiece -- content JSONB included -- to be thrown
     * away after {@code size()}.
     */
    long countByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
            Long learnerId, Long certificationId);

    /** Lessons finished per learner, for a whole roster at once. */
    interface LessonsDone {
        Long getLearnerId();
        long getLessonsCompleted();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT l.learner.learnerId AS learnerId, COUNT(l) AS lessonsCompleted
            FROM LearnerCompletedLesson l
            WHERE l.learner.learnerId IN :learnerIds
            GROUP BY l.learner.learnerId
            """)
    List<LessonsDone> lessonsCompletedByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds);
}
