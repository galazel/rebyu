package com.capstone.rebyu.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    public enum AccountStatus {
        active, inactive, suspended
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_type_id", nullable = false)
    private UserType userType;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    private AccountStatus accountStatus = AccountStatus.active;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    // Stable Amazon Cognito subject linked to this account. Nullable so
    // pre-Cognito accounts keep working until their first federated sign-in.
    @Column(name = "cognito_sub", unique = true, length = 64)
    private String cognitoSub;

    // When this account last made a signed-in request. "Online" on the admin
    // dashboard means seen within the last few minutes -- a timestamp rather
    // than an isOnline flag, because closing the tab never logs anyone out.
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;
}
