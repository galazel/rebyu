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
}
