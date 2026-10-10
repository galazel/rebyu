package com.capstone.rebyu.progress.repository;

import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.entity.LearnerCompletedLessonId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearnerCompletedLessonRepository extends JpaRepository<LearnerCompletedLesson, LearnerCompletedLessonId> {

    List<LearnerCompletedLesson> findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
            Long learnerId, Long certificationId);

    List<LearnerCompletedLesson> findByLearner_LearnerId(Long learnerId);

    long countByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
            Long learnerId, Long certificationId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT l.lesson.lessonId
            FROM LearnerCompletedLesson l
            WHERE l.learner.learnerId = :learnerId
              AND l.lesson.middleCategory.majorCategory.certification.certificationId = :certificationId
            """)
    List<Long> completedLessonIds(
            @org.springframework.data.repository.query.Param("learnerId") Long learnerId,
            @org.springframework.data.repository.query.Param("certificationId") Long certificationId);

    interface LessonsDone {
        Long getLearnerId();
        long getLessonsCompleted();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT l.learner.learnerId AS learnerId, COUNT(l) AS lessonsCompleted
            FROM LearnerCompletedLesson l
            WHERE l.learner.learnerId IN :learnerIds
              AND l.completedAt >= :from AND l.completedAt <= :to
            GROUP BY l.learner.learnerId
            """)
    List<LessonsDone> lessonsCompletedByLearnerIds(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);

    interface CompletedPerCertification {
        Long getCertificationId();
        long getCompleted();
    }

    /** Lessons one learner completed in each of several certifications, in one query. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT l.lesson.middleCategory.majorCategory.certification.certificationId AS certificationId,
                   COUNT(l) AS completed
            FROM LearnerCompletedLesson l
            WHERE l.learner.learnerId = :learnerId
              AND l.lesson.middleCategory.majorCategory.certification.certificationId IN :certificationIds
            GROUP BY l.lesson.middleCategory.majorCategory.certification.certificationId
            """)
    List<CompletedPerCertification> countCompletedPerCertification(
            @org.springframework.data.repository.query.Param("learnerId") Long learnerId,
            @org.springframework.data.repository.query.Param("certificationIds")
            java.util.Collection<Long> certificationIds);

    /** Lessons each learner completed in one certification -- one query for a whole roster. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT l.learner.learnerId AS learnerId, COUNT(l) AS lessonsCompleted
            FROM LearnerCompletedLesson l
            WHERE l.learner.learnerId IN :learnerIds
              AND l.lesson.middleCategory.majorCategory.certification.certificationId = :certificationId
            GROUP BY l.learner.learnerId
            """)
    List<LessonsDone> lessonsCompletedInCertification(
            @org.springframework.data.repository.query.Param("learnerIds") java.util.Collection<Long> learnerIds,
            @org.springframework.data.repository.query.Param("certificationId") Long certificationId);
}
