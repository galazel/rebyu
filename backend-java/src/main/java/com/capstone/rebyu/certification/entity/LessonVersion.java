package com.capstone.rebyu.certification.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One saved state of a lesson's content, so editors can browse and restore earlier versions. */
@Entity
@Table(name = "lesson_versions", indexes = @Index(name = "idx_lesson_versions_lesson", columnList = "lesson_id, created_at"))
@Data
@NoArgsConstructor
public class LessonVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lessonVersionId;

    // Plain id (no FK) like lesson_images; CascadeDeleteService lists it as a soft reference of lessons.
    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "lesson_component_structure", nullable = false, columnDefinition = "TEXT")
    private String lessonComponentStructure;

    @Column(name = "saved_by_user_id")
    private Long savedByUserId;

    @Column(name = "saved_by_name", length = 255)
    private String savedByName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
