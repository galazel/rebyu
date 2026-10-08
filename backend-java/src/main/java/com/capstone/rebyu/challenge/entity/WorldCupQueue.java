package com.capstone.rebyu.challenge.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "world_cup_queue", indexes = {
    @Index(name = "idx_wcq_cert", columnList = "certification_id"),
    @Index(name = "idx_wcq_learner", columnList = "learner_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_wcq_learner_cert", columnNames = {"learner_id", "certification_id"})
})
public class WorldCupQueue {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "queue_id")
  private Long queueId;

  @Column(name = "learner_id", nullable = false)
  private Long learnerId;

  @Column(name = "certification_id", nullable = false)
  private Long certificationId;

  @Column(name = "points", nullable = false)
  private double points;

  @Column(name = "joined_at", nullable = false)
  private LocalDateTime joinedAt;
}
