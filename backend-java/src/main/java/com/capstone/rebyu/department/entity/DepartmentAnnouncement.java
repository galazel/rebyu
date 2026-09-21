package com.capstone.rebyu.department.entity;

import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A message a group's leader posts to that group. Archived rather than deleted. */
@Entity
@Table(name = "department_announcements", indexes = @Index(name = "ix_department_announcements_department", columnList = "department_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentAnnouncement {

    public enum Status {
        active, archived
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentAnnouncementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    // Nullable: an announcement outlives the account that wrote it
    // (see AccountDeletionService's attribution columns).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
