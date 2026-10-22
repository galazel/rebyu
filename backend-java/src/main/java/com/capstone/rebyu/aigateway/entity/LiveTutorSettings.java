package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "live_tutor_settings")
@Getter @Setter
public class LiveTutorSettings {
    @Id private Long id = 1L;
    private boolean enabled = true;
    private int dailySessionLimit = 5;
    private int maxDurationSeconds = 1800;
    @Column(nullable = false, length = 100)
    private String voiceId = "XrExE9yKIg1WjnnlVkGX";
    private Instant updatedAt;
    private String updatedBy;
}
