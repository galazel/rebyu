package com.capstone.rebyu.gamification.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(
    name = "study_plan_task_status",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_study_plan_task_plan_event",
        columnNames = {"plan_id", "event_id"}))
public class StudyPlanTaskStatus {

  public static final String PENDING = "PENDING";

  public static final String IN_PROGRESS = "IN_PROGRESS";

  public static final String COMPLETED = "COMPLETED";

  public static final String SKIPPED = "SKIPPED";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long taskStatusId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "plan_id")
  private StudyPlan plan;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "learner_id")
  private Learner learner;

  @Column(name = "event_id", nullable = false)
  private String eventId;

  @Column(nullable = false)
  private String status;

  private LocalDateTime startedAt;
  private LocalDateTime completedAt;
  private LocalDateTime updatedAt;
}
