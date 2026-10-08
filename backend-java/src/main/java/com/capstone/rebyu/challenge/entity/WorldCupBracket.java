package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "world_cup_brackets", indexes = {
    @Index(name = "idx_wcb_edition", columnList = "edition_id"),
    @Index(name = "idx_wcb_certification", columnList = "certification_id")
})
public class WorldCupBracket {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "bracket_id")
  private Long bracketId;

  @Column(name = "edition_id")
  private Long editionId;

  @Column(name = "certification_id", nullable = false)
  private Long certificationId;

  @Column(name = "players_json", columnDefinition = "TEXT", nullable = false)
  private String playersJson;

  @Column(name = "current_round", length = 20, nullable = false)
  private String currentRound;

  @Column(name = "winner_learner_id")
  private Long winnerLearnerId;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;
}
