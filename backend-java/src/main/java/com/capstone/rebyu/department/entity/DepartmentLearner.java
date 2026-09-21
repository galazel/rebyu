package com.capstone.rebyu.department.entity;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Uniqueness is enforced by a partial index (uq_institution_group_assignee_active,
// scoped to status='active') rather than a @Table-level constraint here, so a
// learner removed from a group can be re-added without colliding with their
// own archived row. Do not add a uniqueConstraints attribute back -- Hibernate's
// ddl-auto=update would create its own non-partial constraint alongside it.
@Entity
@Table(name = "department_learners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentLearner {

    public enum Status {
        active, archived
    }

    public enum Role {
        lead, member
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentLearnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_cert_learner_id", nullable = false)
    private InstitutionCertificationLearner institutionCertLearner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.active;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.member;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    /** The section within the department this learner sits in; null = unsectioned. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private InstitutionSection section;
}
