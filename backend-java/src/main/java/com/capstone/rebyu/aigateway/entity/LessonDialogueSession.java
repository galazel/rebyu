package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** One finished guided Dialogue: its talking points, the whole transcript and the summary. */
@Entity
@Table(name = "lesson_dialogue_sessions",
        indexes = @Index(name = "ix_lesson_dialogue_sessions_learner", columnList = "learner_id, lesson_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonDialogueSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topics", columnDefinition = "jsonb")
    private List<String> topics;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "history", columnDefinition = "jsonb")
    private List<Map<String, Object>> history;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "summary", columnDefinition = "jsonb")
    private Map<String, Object> summary;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
}
