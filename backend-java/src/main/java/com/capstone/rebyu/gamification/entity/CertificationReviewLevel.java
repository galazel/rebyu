package com.capstone.rebyu.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certification_review_levels")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificationReviewLevel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "level_number", nullable = false, unique = true)
    private int levelNumber;
    @Column(nullable = false, length = 80)
    private String title;
    @Column(name = "required_xp", nullable = false)
    private long requiredXp;
    @Column(length = 220)
    private String description;
    @Column(name = "image_key", length = 512)
    private String imageKey;
}
