package com.capstone.rebyu.certification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One part of a real certification exam -- FE's Subject A and Subject B, IT
 * Passport's Strategy / Management / Technology fields -- with its own item
 * count and, where the part is timed separately, its own time limit.
 */
@Entity
@Table(name = "certification_exam_sections",
        indexes = @Index(name = "idx_exam_sections_certification", columnList = "certification_id"))
@Getter
@Setter
@NoArgsConstructor
public class CertificationExamSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exam_section_id")
    private Long examSectionId;

    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "total_items")
    private Integer totalItems;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "question_types", length = 200)
    private String questionTypes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
