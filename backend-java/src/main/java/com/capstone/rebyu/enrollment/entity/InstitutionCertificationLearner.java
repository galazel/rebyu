package com.capstone.rebyu.enrollment.entity;


import com.capstone.rebyu.organization.entity.OrganizationCertificate;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "organization_certification_learners",
        uniqueConstraints = @UniqueConstraint(columnNames = {"org_cert_id", "learner_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationCertificationLearner {

    public enum Status {
        active, completed, revoked
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orgCertLearnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_cert_id", nullable = false)
    private OrganizationCertificate orgCert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "progress_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.active;
}
