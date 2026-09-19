package com.capstone.rebyu.enrollment.entity;


import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "institution_certification_learners",
        uniqueConstraints = @UniqueConstraint(columnNames = {"institution_cert_id", "learner_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionCertificationLearner {

    public enum Status {
        active, completed, revoked
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long institutionCertLearnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_cert_id", nullable = false)
    private InstitutionCertificate institutionCert;

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
