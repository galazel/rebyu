package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.WorldCupQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorldCupQueueRepository extends JpaRepository<WorldCupQueue, Long> {

  Optional<WorldCupQueue> findByLearnerIdAndCertificationId(Long learnerId, Long certificationId);

  List<WorldCupQueue> findByCertificationIdOrderByPointsDesc(Long certificationId);

  long countByCertificationId(Long certificationId);

  void deleteByLearnerIdAndCertificationId(Long learnerId, Long certificationId);

  void deleteByJoinedAtBefore(LocalDateTime cutoff);
}
