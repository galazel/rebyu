package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
    name = "world_cup_editions",
    uniqueConstraints = @UniqueConstraint(name = "uk_world_cup_week", columnNames = "week_start"))
public class WorldCupEdition {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long editionId;

  @Column(name = "week_start", nullable = false)
  private LocalDate weekStart;

  @Column(name = "certification_id", nullable = false)
  private Long certificationId;

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
