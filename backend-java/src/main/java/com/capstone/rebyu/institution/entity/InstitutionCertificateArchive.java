package com.capstone.rebyu.institution.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One finished access term of an institution's certification: what it was (dates,
 * seats) and when it was archived. Its learners' records are kept in
 * {@link InstitutionLearnerRecord} rows pointing here.
 */
@Entity
@Table(name = "institution_certificate_archives",
        indexes = @Index(name = "ix_cert_archives_institution", columnList = "institution_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionCertificateArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "archive_id")
    private Long archiveId;

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "institution_cert_id", nullable = false)
    private Long institutionCertId;

    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    @Column(name = "certification_title", length = 255)
    private String certificationTitle;

    @Column(name = "access_start_date")
    private LocalDate accessStartDate;

    @Column(name = "access_expiry_date")
    private LocalDate accessExpiryDate;

    @Column(name = "total_slots")
    private Integer totalSlots;

    @Column(name = "used_slots")
    private Integer usedSlots;

    @Column(name = "learner_count", nullable = false)
    private int learnerCount;

    @Column(name = "reason", length = 30, nullable = false)
    private String reason;

    @Column(name = "archived_at", nullable = false)
    private LocalDateTime archivedAt;
}
