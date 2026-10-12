package com.capstone.rebyu.reflection.repository;

import com.capstone.rebyu.reflection.entity.ReflectionSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReflectionSubmissionRepository extends JpaRepository<ReflectionSubmission, Long> {

    List<ReflectionSubmission> findByReflectionIdAndLearnerIdOrderBySubmittedAtDesc(Long reflectionId, Long learnerId);

    boolean existsByReflectionIdAndLearnerIdAndPassedTrue(Long reflectionId, Long learnerId);
}
