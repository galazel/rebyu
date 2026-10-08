package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "world_cup_matches", indexes = {
    @Index(name = "idx_wcm_bracket", columnList = "bracket_id"),
    @Index(name = "idx_wcm_players", columnList = "player1_id, player2_id")
})
public class WorldCupMatch {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "match_id")
  private Long matchId;

  @Column(name = "bracket_id", nullable = false)
  private Long bracketId;

  @Column(name = "round", length = 20, nullable = false)
  private String round;

  @Column(name = "match_index", nullable = false)
  private int matchIndex;

  @Column(name = "player1_id")
  private Long player1Id;

  @Column(name = "player2_id")
  private Long player2Id;

  @Column(name = "player1_attempt_id")
  private Long player1AttemptId;

  @Column(name = "player2_attempt_id")
  private Long player2AttemptId;

  @Column(name = "player1_score")
  private Double player1Score;

  @Column(name = "player2_score")
  private Double player2Score;

  @Column(name = "status", length = 20, nullable = false)
  private String status;

  @Column(name = "winner_learner_id")
  private Long winnerLearnerId;

  @Column(name = "started_at")
  private LocalDateTime startedAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;
}
