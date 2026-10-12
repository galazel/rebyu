package com.capstone.rebyu.aigateway.repository;

import com.capstone.rebyu.aigateway.entity.LessonDialogueSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonDialogueSessionRepository extends JpaRepository<LessonDialogueSession, Long> {
    List<LessonDialogueSession> findTop20ByLearnerIdAndLessonIdOrderByCompletedAtDesc(Long learnerId, Long lessonId);
}
