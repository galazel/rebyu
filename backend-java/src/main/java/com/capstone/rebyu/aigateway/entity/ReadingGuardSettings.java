package com.capstone.rebyu.aigateway.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

/** Single-row config for the lesson skim challenge. */
@Entity
@Table(name = "reading_guard_settings")
@Getter @Setter
public class ReadingGuardSettings {
    @Id private Long id = 1L;
    /** Quiet period after a skim challenge or reminder, shared across lessons. */
    @Column(nullable = false)
    private int skimCooldownSeconds = 180;
    private Instant updatedAt;
    private String updatedBy;
}
