package com.capstone.rebyu.learningtools.repository;

import com.capstone.rebyu.learningtools.entity.LearnerActivityProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearnerActivityProgressRepository extends JpaRepository<LearnerActivityProgress, Long> {

    List<LearnerActivityProgress> findByLearnerIdAndProgressKeyStartingWith(Long learnerId, String prefix);

    Optional<LearnerActivityProgress> findByLearnerIdAndProgressKey(Long learnerId, String progressKey);
}
