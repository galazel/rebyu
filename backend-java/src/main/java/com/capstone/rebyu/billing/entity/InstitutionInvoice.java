package com.capstone.rebyu.billing.entity;

import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A B2B invoice raised when a partnership request is approved: the
 * institution's learner slots, priced per slot, per certification.
 */
@Entity
@Table(name = "institution_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionInvoice {

    public enum Status { draft, issued, payment_submitted, paid, rejected, cancelled }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "institution_invoice_id")
    private Long institutionInvoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_type", nullable = false, length = 30)
    @Builder.Default
    private String invoiceType = "initial_access";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partnership_request_id")
    private PartnershipRequest partnershipRequest;

    @Column(name = "bill_to_name", nullable = false, length = 150)
    private String billToName;

    @Column(name = "bill_to_email", nullable = false, length = 254)
    private String billToEmail;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "PHP";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "payment_proof_key", length = 500)
    private String paymentProofKey;

    @Column(name = "verified_by_user_id")
    private Long verifiedByUserId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** PayMongo hosted checkout for this invoice, once the institution starts paying. */
    @Column(name = "checkout_session_id", length = 100)
    private String checkoutSessionId;

    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    @Column(name = "provider_payment_id", length = 100)
    private String providerPaymentId;

    /* What has been given back, and the provider's record of giving it. Kept
       beside the payment rather than replacing it: the invoice was paid, and a
       refund is a second event, not an edit to the first. A partial refund
       (one certification dropped out of several) leaves the invoice paid with
       an amount recorded here; a full one also flips it to cancelled. */
    @Column(name = "refunded_amount", precision = 12, scale = 2)
    private java.math.BigDecimal refundedAmount;

    @Column(name = "refund_reference", length = 120)
    private String refundReference;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    /* pending / succeeded / failed, as PayMongo last reported it. A refund is
       accepted long before it settles, so "we have a refund id" and "the money
       went back" are different facts and are stored as such. */
    @Column(name = "refund_status", length = 20)
    private String refundStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Status status = Status.issued;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InstitutionInvoiceItem> items = new ArrayList<>();
}
