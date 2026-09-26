package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.ChallengeArenaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChallengeArenaConfigRepository extends JpaRepository<ChallengeArenaConfig, String> {}
