package com.capstone.rebyu.billing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One certification line on an institution invoice: slots × unit price, with the access window bought. */
@Entity
@Table(name = "institution_invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionInvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "institution_invoice_item_id")
    private Long institutionInvoiceItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_invoice_id", nullable = false)
    private InstitutionInvoice invoice;

    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    /** Snapshot at issue time, so a later rename does not rewrite history. */
    @Column(name = "certification_title", nullable = false, length = 150)
    private String certificationTitle;

    @Column(name = "learner_slots", nullable = false)
    private Integer learnerSlots;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "access_start_date")
    private LocalDate accessStartDate;

    @Column(name = "access_end_date")
    private LocalDate accessEndDate;
}
