package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.WorldCupBracket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorldCupBracketRepository extends JpaRepository<WorldCupBracket, Long> {

  List<WorldCupBracket> findByEditionIdOrderByCreatedAtDesc(Long editionId);

  List<WorldCupBracket> findByCertificationIdOrderByCreatedAtDesc(Long certificationId);

  Optional<WorldCupBracket> findFirstByCertificationIdAndCurrentRoundNotOrderByCreatedAtDesc(
      Long certificationId, String excludeRound);
}
