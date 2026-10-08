package com.capstone.rebyu.learningtools.repository;

import com.capstone.rebyu.learningtools.entity.LearnerNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearnerNoteRepository extends JpaRepository<LearnerNote, Long> {

    List<LearnerNote> findByLearner_LearnerIdAndCertificationIdOrderByCreatedAtAsc(
            Long learnerId, Long certificationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LearnerNote n WHERE n.learner.learnerId = :learnerId "
            + "AND n.certificationId = :certificationId")
    int deleteAllForLearnerAndCertification(
            @Param("learnerId") Long learnerId, @Param("certificationId") Long certificationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LearnerNote n WHERE n.learner.learnerId = :learnerId "
            + "AND n.certificationId = :certificationId AND n.done = TRUE")
    int deleteCompletedForLearnerAndCertification(
            @Param("learnerId") Long learnerId, @Param("certificationId") Long certificationId);
}
