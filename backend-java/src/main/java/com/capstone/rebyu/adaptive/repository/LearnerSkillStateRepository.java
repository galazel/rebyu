package com.capstone.rebyu.adaptive.repository;

import com.capstone.rebyu.adaptive.entity.LearnerSkillState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LearnerSkillStateRepository extends JpaRepository<LearnerSkillState, Long> {

    List<LearnerSkillState> findByLearnerIdAndLessonIdIn(Long learnerId, Collection<Long> lessonIds);
}
