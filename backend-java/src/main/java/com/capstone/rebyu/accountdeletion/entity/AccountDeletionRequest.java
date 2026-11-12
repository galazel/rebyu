package com.capstone.rebyu.accountdeletion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A user asking for their account to be deleted. An admin approves (the account and its data
 * are erased) or declines it.
 *
 * <p>{@code user_id} deliberately has no foreign key and is NOT in the cascade registry: the row
 * is the record that the deletion was asked for and carried out, so it must outlive the account.
 * It keeps an email/name snapshot, and the id is cleared once the account is gone.
 */
@Entity
@Table(
        name = "account_deletion_requests",
        indexes = {
                @Index(name = "ix_account_deletion_user", columnList = "user_id"),
                @Index(name = "ix_account_deletion_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountDeletionRequest {

    /** What gets deleted: a learner account, a department head's account, or a whole institution. */
    public enum Kind { LEARNER, DEPARTMENT_HEAD, INSTITUTION }

    public enum Status { PENDING, APPROVED, DECLINED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "institution_id")
    private Long institutionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "institution_name", length = 255)
    private String institutionName;

    @Column(length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "reviewed_by_user_id")
    private Long reviewedByUserId;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "admin_note", length = 1000)
    private String adminNote;
}
