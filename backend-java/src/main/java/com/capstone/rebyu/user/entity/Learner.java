package com.capstone.rebyu.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "learners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Learner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 50)
    private String firstName;

    @Column(nullable = false, length = 50)
    private String lastName;

    /**
     * Object key of the learner's profile picture, or null for the initials
     * that stood in before they uploaded one.
     *
     * <p>A key rather than a URL: the file is served through the same signed
     * links every other upload uses, and a URL stored here would either expire
     * in the row or have to be public for good.
     */
    @Column(name = "avatar_key", length = 512)
    private String avatarKey;
}
