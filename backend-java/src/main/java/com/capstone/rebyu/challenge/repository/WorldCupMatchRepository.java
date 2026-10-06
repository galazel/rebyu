package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.WorldCupMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorldCupMatchRepository extends JpaRepository<WorldCupMatch, Long> {

  List<WorldCupMatch> findByBracketIdOrderByRoundAscMatchIndexAsc(Long bracketId);

  List<WorldCupMatch> findByBracketIdAndRound(Long bracketId, String round);

  @Query("SELECT m FROM WorldCupMatch m WHERE m.bracketId = :bracketId " +
         "AND (m.player1Id = :learnerId OR m.player2Id = :learnerId) " +
         "AND m.round = :round")
  Optional<WorldCupMatch> findPlayerMatch(Long bracketId, Long learnerId, String round);

  @Query("SELECT m FROM WorldCupMatch m WHERE m.bracketId = :bracketId " +
         "AND (m.player1Id = :learnerId OR m.player2Id = :learnerId) " +
         "ORDER BY m.matchId DESC")
  List<WorldCupMatch> findPlayerMatches(Long bracketId, Long learnerId);

  @Query("SELECT DISTINCT m.bracketId FROM WorldCupMatch m " +
         "WHERE m.player1Id = :learnerId OR m.player2Id = :learnerId " +
         "ORDER BY m.bracketId DESC")
  List<Long> findBracketIdsByLearnerId(Long learnerId);
}
