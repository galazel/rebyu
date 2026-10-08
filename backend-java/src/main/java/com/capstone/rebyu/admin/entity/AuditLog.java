package com.capstone.rebyu.admin.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_timestamp", columnList = "timestamp"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_entity", columnList = "entity_type,entity_id")
})
public class AuditLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long logId;

  private Long userId;
  private String action;
  private String entityType;
  private Long entityId;
  private String details;
  private LocalDateTime timestamp;
  private String ipAddress;
}
