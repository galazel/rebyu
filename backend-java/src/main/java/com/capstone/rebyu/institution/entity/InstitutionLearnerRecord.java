package com.capstone.rebyu.institution.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A frozen copy of a learner's institution record, written the moment they leave
 * (removed by a head, or the certification's access expired). The live rows can
 * change afterwards — the learner keeps studying on their own, or is invited back —
 * so exports of former learners and archived terms read these instead.
 */
@Entity
@Table(name = "institution_learner_records", indexes = {
        @Index(name = "ix_learner_records_institution", columnList = "institution_id"),
        @Index(name = "ix_learner_records_cert", columnList = "institution_cert_id"),
        @Index(name = "ix_learner_records_archive", columnList = "archive_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionLearnerRecord {

    public enum Reason { removed, expired }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Long recordId;

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "institution_cert_id", nullable = false)
    private Long institutionCertId;

    @Column(name = "certification_id")
    private Long certificationId;

    @Column(name = "certification_title", length = 255)
    private String certificationTitle;

    /** The term this record was archived with; null when the learner was removed individually. */
    @Column(name = "archive_id")
    private Long archiveId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "learner_name", length = 255)
    private String learnerName;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "department_name", length = 255)
    private String departmentName;

    @Column(name = "section_name", length = 255)
    private String sectionName;

    @Column(name = "program_name", length = 255)
    private String programName;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "left_at", nullable = false)
    private LocalDateTime leftAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", length = 20, nullable = false)
    private Reason reason;

    @Column(name = "progress_percentage", precision = 5, scale = 1)
    private BigDecimal progressPercentage;

    @Column(name = "lessons_completed")
    private Long lessonsCompleted;

    @Column(name = "graded_attempts")
    private Long gradedAttempts;

    @Column(name = "passed_attempts")
    private Long passedAttempts;

    @Column(name = "pass_rate")
    private Integer passRate;

    @Column(name = "average_score")
    private Integer averageScore;

    @Column(name = "badge_earned")
    private Boolean badgeEarned;

    @Column(name = "badge_earned_at")
    private LocalDateTime badgeEarnedAt;

    @Column(name = "mock_exam_passed")
    private Boolean mockExamPassed;

    @Column(name = "best_mock_exam_score", precision = 5, scale = 1)
    private BigDecimal bestMockExamScore;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;
}
