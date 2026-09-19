package com.capstone.rebyu.adaptive.repository;

import com.capstone.rebyu.adaptive.entity.LearnerAbility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerAbilityRepository extends JpaRepository<LearnerAbility, Long> {

    Optional<LearnerAbility> findByLearnerIdAndScopeKey(Long learnerId, String scopeKey);
}
