package com.capstone.rebyu.gamification.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "notification_preference")
public class NotificationPreference {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long prefId;

  // Never serialized: the endpoint returns this entity as-is, and the learner's lazily
  // loaded User could not be written once the session closed (a 500 on every load).
  // It also exposed the learner's account record in a preferences response.
  @com.fasterxml.jackson.annotation.JsonIgnore
  @OneToOne
  @JoinColumn(name = "learner_id")
  private Learner learner;

  private Boolean dailyReminder = true;
  private String dailyReminderTime = "09:00";
  private Boolean streakReminder = true;
  private Boolean socialNotifications = true;
  private Boolean achievementNotifications = true;
}
