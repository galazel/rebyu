package com.capstone.rebyu.reflection.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A topic's self-reflection: the practice assignment a learner writes before the
 * topic's (middle category's) exam. Written by the certification generator, or
 * back-filled on first open. Python inserts rows too -- see
 * {@code python-backend/app/db/java_tables.py#middle_reflections}.
 */
@Entity
@Table(name = "middle_reflections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiddleReflection {

    public static final int DEFAULT_PASS_PERCENT = 80;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reflection_id")
    private Long reflectionId;

    @Column(name = "middle_category_id", nullable = false, unique = true)
    private Long middleCategoryId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "scenario", nullable = false, columnDefinition = "text")
    private String scenario;

    @Column(name = "prompt", nullable = false, columnDefinition = "text")
    private String prompt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parts", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> parts = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rubric", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<Criterion> rubric = new ArrayList<>();

    @Column(name = "pass_percent", nullable = false)
    @Builder.Default
    private Integer passPercent = DEFAULT_PASS_PERCENT;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public record Criterion(String title, String description, String zeroPoint, String onePoint) {}
}
