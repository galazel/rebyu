package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "challenge_arena_configs")
public class ChallengeArenaConfig {

  @Id
  @Column(name = "arena_id", length = 40)
  private String arenaId;

  @Column(name = "settings_json", columnDefinition = "TEXT")
  private String settingsJson;

  @Column(name = "node_layout_json", columnDefinition = "TEXT")
  private String nodeLayoutJson;

  @Column(name = "live")
  private Boolean live;

  @Column(name = "disabled_tracks_json", columnDefinition = "TEXT")
  private String disabledTracksJson;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
