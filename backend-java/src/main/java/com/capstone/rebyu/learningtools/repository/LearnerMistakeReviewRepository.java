package com.capstone.rebyu.learningtools.repository;

import com.capstone.rebyu.learningtools.entity.LearnerMistakeReview;
import com.capstone.rebyu.learningtools.entity.LearnerMistakeReviewId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearnerMistakeReviewRepository
        extends JpaRepository<LearnerMistakeReview, LearnerMistakeReviewId> {

    @Modifying
    @Query(value = """
            INSERT INTO learner_mistake_reviews(learner_id, source_question_id, reviewed_at)
            VALUES (:learnerId, :questionId, now())
            ON CONFLICT (learner_id, source_question_id) DO UPDATE SET reviewed_at = now()
            """, nativeQuery = true)
    void markReviewed(@Param("learnerId") Long learnerId, @Param("questionId") Long questionId);

    void deleteById_LearnerIdAndId_SourceQuestionId(Long learnerId, Long sourceQuestionId);
}
