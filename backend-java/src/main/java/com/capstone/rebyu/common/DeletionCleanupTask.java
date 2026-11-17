package com.capstone.rebyu.common;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Schema anchor for the durable deletion-cleanup queue. Migrations never run here, so without
 * an entity Hibernate never creates this table, and every first sign-in fails on the
 * {@link DeletionCleanupService#identityPending} check. Rows are written with plain SQL that
 * relies on the column defaults, which is why they are declared in the column definitions.
 */
@Entity
@Table(name = "deletion_cleanup_tasks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"kind", "target"}))
@Getter
@NoArgsConstructor
public class DeletionCleanupTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cleanup_id")
    private Long cleanupId;

    @Column(name = "kind", nullable = false, length = 16)
    private String kind;

    @Column(name = "target", nullable = false, columnDefinition = "TEXT")
    private String target;

    @Column(name = "attempts", nullable = false, columnDefinition = "INTEGER NOT NULL DEFAULT 0")
    private Integer attempts;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "created_at", nullable = false,
            columnDefinition = "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;
}
