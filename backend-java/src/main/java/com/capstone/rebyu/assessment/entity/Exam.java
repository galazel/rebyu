package com.capstone.rebyu.assessment.entity;


import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "exams",
        indexes = @Index(name = "ix_exam_certification", columnList = "certification_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    public enum Status {
        DRAFT, PUBLISHED, ARCHIVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long examId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id", nullable = false)
    private Certification certification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_type_id", nullable = false)
    private ExamType examType;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "is_generated", nullable = false)
    private boolean isGenerated = false;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    public static final int LESSON_QUIZ_MINUTES = 10;
    public static final int MIDDLE_EXAM_MINUTES = 20;
    public static final int MAJOR_EXAM_MINUTES = 30;

    public Integer getDurationMinutes() {
        if (durationMinutes != null) return durationMinutes;
        String type = examType == null ? null : examType.getExamTypeText();
        if (type == null) return null;
        return switch (type) {
            case "LESSON_QUIZ" -> LESSON_QUIZ_MINUTES;
            case "MIDDLE_EXAM" -> MIDDLE_EXAM_MINUTES;
            case "MAJOR_EXAM" -> MAJOR_EXAM_MINUTES;
            default -> null;
        };
    }

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "passing_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal passingScore = new BigDecimal("70.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private Status status;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "middle_category_id")
    private MiddleCategory middleCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_category_id")
    private MajorCategory majorCategory;

    @Column(name = "target_scope", length = 20)
    private String targetScope;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "release_answers_after_submit")
    private Boolean releaseAnswersAfterSubmit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_department_id")
    private Department ownerDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id")
    private Learner learner;

    public Status effectiveStatus() {
        return status == null ? Status.DRAFT : status;
    }

    public boolean effectiveReleaseAnswers() {
        return releaseAnswersAfterSubmit == null || releaseAnswersAfterSubmit;
    }
}
