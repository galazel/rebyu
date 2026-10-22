package com.capstone.rebyu.aigateway.repository;

import com.capstone.rebyu.aigateway.entity.LiveTeachingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface LiveTeachingSessionRepository extends JpaRepository<LiveTeachingSession, UUID> {
    Optional<LiveTeachingSession> findFirstByUserIdAndLessonIdAndStatusNotOrderByUpdatedAtDesc(Long userId, Long lessonId, String status);
}
