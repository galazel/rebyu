package com.capstone.rebyu.user.presence;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * One row per user per day they used REBYU.
 *
 * <p>{@code users.last_seen_at} only knows the present moment; the admin
 * dashboard's weekly, monthly and yearly "active users" lines are counted
 * from these rows.
 */
@Entity
@Table(
        name = "user_activity_days",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_activity_days_user_date",
                columnNames = {"user_id", "activity_date"}))
@Data
@NoArgsConstructor
public class UserActivityDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userActivityDayId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;
}
