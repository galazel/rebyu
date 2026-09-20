package com.capstone.rebyu.enrollment.entity;


import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "learner_certifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerCertification {

    public enum Status {
        active, expired, revoked
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnerCertificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id", nullable = false)
    private Certification certification;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_detail_id", nullable = false, unique = true)
    private LearnerOrderDetail orderDetail;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.active;

    /** Set once the learner submits the certification's diagnostic assessment. */
    @Column(name = "diagnostic_completed_at")
    private LocalDateTime diagnosticCompletedAt;

    @Column(name = "diagnostic_attempt_id")
    private Long diagnosticAttemptId;
}
