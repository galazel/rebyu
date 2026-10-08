package com.capstone.rebyu.learningtools.entity;

import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
    name = "learner_review_items",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_learner_review_item",
        columnNames = {"learner_id", "source_question_id"}),
    indexes = @Index(name = "ix_learner_review_due", columnList = "learner_id, due_on"))
public class LearnerReviewItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long reviewItemId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "learner_id", nullable = false)
  private Learner learner;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "source_question_id", nullable = false)
  private Question sourceQuestion;

  @Column(name = "lesson_id")
  private Long lessonId;

  @Column(name = "certification_id")
  private Long certificationId;

  @Column(nullable = false)
  private int repetitions;

  @Column(nullable = false)
  private int intervalDays;

  @Column(nullable = false)
  private double easeFactor;

  @Column(name = "due_on", nullable = false)
  private LocalDate dueOn;

  @Column(nullable = false)
  private int lapses;

  private LocalDateTime lastReviewedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
