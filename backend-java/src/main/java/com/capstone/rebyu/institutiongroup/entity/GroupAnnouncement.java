package com.capstone.rebyu.institutiongroup.entity;

import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A message a group's leader posts to that group. Archived rather than deleted. */
@Entity
@Table(name = "group_announcements", indexes = @Index(name = "ix_group_announcements_group", columnList = "institution_group_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupAnnouncement {

    public enum Status {
        active, archived
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long groupAnnouncementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_group_id", nullable = false)
    private InstitutionGroup institutionGroup;

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
