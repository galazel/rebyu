package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * One arena's admin configuration: its run settings, and how its problem set
 * is grouped.
 *
 * <p>Keyed by the arena's string id: the
 * arenas are built surfaces, not data, so there is no arena row to hang this
 * off.
 *
 * <h3>Settings</h3>
 * A JSON object of numeric knobs -- node count, time limit, scoring weights,
 * lobby size. Stored as one document rather than a column per knob because each
 * arena has a different set, and the service validates the keys per arena.
 *
 * <h3>Node layout</h3>
 * The arena's problems live in its CHALLENGE exam, whose {@code exam_questions}
 * rows carry only a display order. Which roadmap node (or World Cup stage) each
 * belongs to is kept here, as a JSON array aligned to that display order --
 * {@code [1,1,1,2,2]} is three questions in node one, then two in node two.
 * Without it a saved roadmap reloads as one undivided list.
 */
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

  /**
   * Whether learners can enter. Null reads as live: the column arrives on
   * existing rows empty, and an arena an admin never paused should stay open.
   */
  @Column(name = "live")
  private Boolean live;

  /**
   * World Cup only: certification ids switched off as tracks, as a JSON array.
   * Stored as the ones turned OFF so a new certification is a track by default.
   */
  @Column(name = "disabled_tracks_json", columnDefinition = "TEXT")
  private String disabledTracksJson;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
