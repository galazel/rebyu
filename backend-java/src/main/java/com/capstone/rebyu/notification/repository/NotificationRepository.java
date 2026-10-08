package com.capstone.rebyu.notification.repository;

import com.capstone.rebyu.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    long countByUser_UserIdAndReadAtIsNull(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.readAt = :readAt "
            + "WHERE n.user.userId = :userId AND n.readAt IS NULL")
    int markAllReadForUser(@Param("userId") Long userId, @Param("readAt") OffsetDateTime readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Notification n WHERE n.user.userId = :userId")
    int deleteAllForUser(@Param("userId") Long userId);
}
