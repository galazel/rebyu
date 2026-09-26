package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One week of the World Cup: the certification its bracket runs on, and a
 * question set per bracket stage.
 *
 * <p>Weekly because everyone sits the same tournament at once -- by next week
 * this week's questions are out in the world, so each week is authored fresh.
 * Per stage because the same eight players meet at quarterfinals, semis and the
 * final; one shared set would have the finalists answering questions they had
 * already seen.
 *
 * <p>The questions themselves are ordinary bank questions. {@code stagesJson}
 * records only which ones each stage runs: {@code {"quarterfinal":[12,13],...}}.
 * Publishing copies the set into the World Cup's CHALLENGE exam, which is what
 * learners actually sit; a draft never reaches them.
 */
@Data
@Entity
@Table(
    name = "world_cup_editions",
    uniqueConstraints = @UniqueConstraint(name = "uk_world_cup_week", columnNames = "week_start"))
public class WorldCupEdition {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long editionId;

  /** The Monday the week starts on. */
  @Column(name = "week_start", nullable = false)
  private LocalDate weekStart;

  @Column(name = "certification_id", nullable = false)
  private Long certificationId;

  /** Where new questions are filed: {@code questions.lesson_id} is NOT NULL. */
  @Column(name = "lesson_id", nullable = false)
  private Long lessonId;

  @Column(name = "stages_json", columnDefinition = "TEXT")
  private String stagesJson;

  @Column(nullable = false)
  private boolean published;

  @Column(name = "published_at")
  private LocalDateTime publishedAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
