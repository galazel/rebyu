package com.capstone.rebyu.partnership.entity;


import com.capstone.rebyu.institution.entity.Institution;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "partnership_requests", indexes = {
        @Index(name = "idx_partnership_request_status", columnList = "status"),
        @Index(name = "idx_partnership_request_org_email", columnList = "institution_email"),
        @Index(name = "idx_partnership_request_reference", columnList = "reference_number")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnershipRequest {

    public enum Status {
        PENDING, UNDER_REVIEW, MEETING_SCHEDULED, APPROVED, REJECTED, CANCELLED
    }

    /**
     * What is being asked for, which is not the same question as what state the
     * asking is in.
     *
     * Each carries its own reference prefix, so a reference read out over the
     * phone or quoted in an email says what it is before anyone looks it up:
     * PR- a first partnership, AD- more slots on one that exists, RN- a fresh
     * window for one that is ending, CN- ending one early.
     */
    public enum RequestType {
        NEW("PR"), ADDITIONAL("AD"), RENEWAL("RN"), CANCELLATION("CN");

        private final String prefix;

        RequestType(String prefix) {
            this.prefix = prefix;
        }

        public String prefix() {
            return prefix;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    // Public reference number returned to the requester for status lookup.
    @Column(name = "reference_number", unique = true, length = 32)
    private String referenceNumber;

    // Null until the request is approved and an Institution record is created.
    // A public institution representative has no account when they submit.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    // Institution details captured on the public request (denormalized so no
    // unverified institution pollutes the institutions table before approval).
    @Column(name = "institution_name", length = 150)
    private String institutionName;

    @Column(name = "institution_email", length = 254)
    private String institutionEmail;

    @Column(name = "contact_person_name", length = 150)
    private String contactPersonName;

    @Column(name = "contact_number", length = 40)
    private String contactNumber;

    @Column(name = "institution_address", columnDefinition = "text")
    private String institutionAddress;

    @Column(name = "business_description", columnDefinition = "text")
    private String businessDescription;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private Status status = Status.PENDING;

    /* NEW for every row that predates this column: the public form only ever
       made first partnerships, and the portal made nothing else until the
       "request more access" path existed. */
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 20)
    private RequestType requestType = RequestType.NEW;

    // Review audit fields, populated when an admin approves or rejects.
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "admin_remarks", columnDefinition = "text")
    private String adminRemarks;

    // Prevents duplicate submissions of the same partnership request.
    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    // Optimistic lock so two near-simultaneous approve/reject calls on the
    // same request can't both succeed (mirrors InstitutionCertificate.version).
    @Version
    @Column(name = "version")
    private Long version;
}
