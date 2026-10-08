package com.capstone.rebyu.partnership.entity;


import com.capstone.rebyu.certification.entity.Certification;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "partnership_request_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnershipRequestItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long partnershipRequestItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PartnershipRequest partnershipRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id", nullable = false)
    private Certification certification;

    @Column(nullable = false)
    private Integer slots;

    @Column(name = "requested_access_start_date")
    private java.time.LocalDate requestedAccessStartDate;

    @Column(name = "requested_access_end_date")
    private java.time.LocalDate requestedAccessEndDate;
}
