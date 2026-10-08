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

    @Column(name = "reference_number", unique = true, length = 32)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 20)
    private RequestType requestType = RequestType.NEW;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "admin_remarks", columnDefinition = "text")
    private String adminRemarks;

    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    @Version
    @Column(name = "version")
    private Long version;
}
