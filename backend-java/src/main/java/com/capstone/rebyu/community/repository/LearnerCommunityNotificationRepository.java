package com.capstone.rebyu.community.repository;

import com.capstone.rebyu.community.entity.LearnerCommunityNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface LearnerCommunityNotificationRepository extends JpaRepository<LearnerCommunityNotification, Long> {

    List<LearnerCommunityNotification> findTop20ByLearner_LearnerIdOrderByCreatedAtDesc(Long learnerId);

    boolean existsByLearner_LearnerIdAndTitleAndBody(Long learnerId, String title, String body);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE LearnerCommunityNotification n SET n.readAt = :readAt "
            + "WHERE n.learner.learnerId = :learnerId AND n.readAt IS NULL")
    int markAllReadForLearner(@Param("learnerId") Long learnerId, @Param("readAt") OffsetDateTime readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LearnerCommunityNotification n WHERE n.learner.learnerId = :learnerId")
    int deleteAllForLearner(@Param("learnerId") Long learnerId);
}
