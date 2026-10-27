package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "live_teaching_sessions", indexes = @Index(name = "idx_live_teaching_owner_lesson", columnList = "user_id,lesson_id"))
@Getter @Setter @NoArgsConstructor
public class LiveTeachingSession {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "lesson_id", nullable = false) private Long lessonId;
    @Column(nullable = false, length = 32) private String status = "INITIALIZING";
    @Column(name = "context_json", nullable = false, columnDefinition = "text") private String contextJson = "{}";
    @Column(name = "transcript_json", nullable = false, columnDefinition = "text") private String transcriptJson = "[]";
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    @Version private Long version;
}
