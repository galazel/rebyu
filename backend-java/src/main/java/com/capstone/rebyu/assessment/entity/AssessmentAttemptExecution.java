package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_attempt_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttemptExecution {

    public enum Mode {
        RUN, CHECK
    }

    public enum Status {
        UNAVAILABLE,
        QUEUED,
        RUNNING,
        COMPLETED,
        ERROR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "execution_id")
    private Long executionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_question_id", nullable = false)
    private AssessmentAttemptQuestion attemptQuestion;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 10)
    private Mode mode;

    @Column(name = "language", length = 30)
    private String language;

    @Column(name = "submitted_code", columnDefinition = "TEXT")
    private String submittedCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Status status;

    @Column(name = "passed_tests")
    private Integer passedTests;

    @Column(name = "total_tests")
    private Integer totalTests;

    @Column(name = "output", columnDefinition = "TEXT")
    private String output;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
