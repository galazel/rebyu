package com.capstone.rebyu.assessment.entity;

import jakarta.persistence.CheckConstraint;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "assessment_timer_settings", check = {
        @CheckConstraint(constraint = "id = 1"),
        @CheckConstraint(constraint = "lesson_quiz_minutes > 0"),
        @CheckConstraint(constraint = "middle_exam_minutes > 0"),
        @CheckConstraint(constraint = "major_exam_minutes > 0")
})
public class AssessmentTimerSettings {
    @Id
    private Integer id;

    @Column(name = "lesson_quiz_minutes", nullable = false)
    private int lessonQuizMinutes;

    @Column(name = "middle_exam_minutes", nullable = false)
    private int middleExamMinutes;

    @Column(name = "major_exam_minutes", nullable = false)
    private int majorExamMinutes;
}
