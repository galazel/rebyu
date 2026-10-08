package com.capstone.rebyu.learningtools.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "learner_dashboard_layouts",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_dashboard_layout_learner", columnNames = "learner_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerDashboardLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "layout_id")
    private Long layoutId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false, unique = true)
    private Learner learner;

    @Column(name = "tile_order", nullable = false, columnDefinition = "TEXT")
    private String tileOrder;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
