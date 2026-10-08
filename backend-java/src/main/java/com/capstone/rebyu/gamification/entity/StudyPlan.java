package com.capstone.rebyu.gamification.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "study_plan")
public class StudyPlan {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long planId;

  @ManyToOne
  @JoinColumn(name = "learner_id")
  private Learner learner;

  @Column(name = "certification_id")
  private Long certificationId;

  private String goal;

  @Column(columnDefinition = "TEXT")
  private String schedule;

  private LocalDateTime createdAt;
  private LocalDateTime completedAt;
  private String status;
}
