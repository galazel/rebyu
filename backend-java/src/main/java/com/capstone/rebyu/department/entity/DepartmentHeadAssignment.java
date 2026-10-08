package com.capstone.rebyu.department.entity;

import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "department_head_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentHeadAssignment {

    public enum Status {
        active, archived
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentHeadAssignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.active;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;
}
