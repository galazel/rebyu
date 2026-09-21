package com.capstone.rebyu.partnership.service;

import com.capstone.rebyu.billing.entity.InstitutionInvoice;
import com.capstone.rebyu.billing.entity.InstitutionInvoiceItem;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.partnership.entity.PartnershipRequestItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Turning an approved, paid request into certification access.
 *
 * Two steps, because the institution pays before it gets in:
 * <ol>
 *   <li>{@link #reserve} on approval -- allocations are written as
 *       {@code pending} with the slots and window asked for, so the portal
 *       shows what is coming and invitations stay refused.</li>
 *   <li>{@link #activateForInvoice} when the invoice is paid -- pending rows
 *       flip to {@code active}; an allocation that already existed is topped
 *       up and its window widened instead.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstitutionAccessGrantService {

    private static final int DEFAULT_ACCESS_MONTHS = 12;

    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final CertificationRepository certificationRepository;

    /** Records what was approved, without granting it. Existing allocations are left untouched until payment. */
    @Transactional
    public void reserve(Institution institution, List<PartnershipRequestItem> items) {
        LocalDate today = LocalDate.now();
        for (PartnershipRequestItem item : items) {
            Long certificationId = item.getCertification().getCertificationId();
            boolean exists = institutionCertificateRepository
                    .findByInstitution_InstitutionIdAndCertification_CertificationId(institution.getInstitutionId(), certificationId)
                    .isPresent();
            if (exists) continue;
            LocalDate start = item.getRequestedAccessStartDate() != null ? item.getRequestedAccessStartDate() : today;
            LocalDate end = item.getRequestedAccessEndDate() != null ? item.getRequestedAccessEndDate() : start.plusMonths(DEFAULT_ACCESS_MONTHS);
            institutionCertificateRepository.save(InstitutionCertificate.builder()
                    .institution(institution)
                    .certification(item.getCertification())
                    .totalSlots(item.getSlots() == null ? 0 : item.getSlots())
                    .usedSlots(0)
                    .accessStartDate(start)
                    .accessExpiryDate(end)
                    .status(InstitutionCertificate.Status.pending)
                    .build());
        }
    }

    /** Grants everything on a paid invoice. Idempotent per invoice line as far as slot counts allow. */
    @Transactional
    public void activateForInvoice(InstitutionInvoice invoice) {
        Institution institution = invoice.getInstitution();
        LocalDate today = LocalDate.now();
        for (InstitutionInvoiceItem line : invoice.getItems()) {
            LocalDate start = line.getAccessStartDate() != null ? line.getAccessStartDate() : today;
            LocalDate end = line.getAccessEndDate() != null ? line.getAccessEndDate() : start.plusMonths(DEFAULT_ACCESS_MONTHS);
            int slots = line.getLearnerSlots() == null ? 0 : line.getLearnerSlots();

            InstitutionCertificate existing = institutionCertificateRepository
                    .findByInstitution_InstitutionIdAndCertification_CertificationId(
                            institution.getInstitutionId(), line.getCertificationId())
                    .orElse(null);

            if (existing == null) {
                institutionCertificateRepository.save(InstitutionCertificate.builder()
                        .institution(institution)
                        .certification(certificationRepository.getReferenceById(line.getCertificationId()))
                        .totalSlots(slots)
                        .usedSlots(0)
                        .accessStartDate(start)
                        .accessExpiryDate(end)
                        .status(InstitutionCertificate.Status.active)
                        .build());
            } else if (existing.getStatus() == InstitutionCertificate.Status.pending) {
                // The row reserve() wrote: the slots are already on it, so only flip it on.
                existing.setTotalSlots(slots);
                existing.setAccessStartDate(start);
                existing.setAccessExpiryDate(end);
                existing.setStatus(InstitutionCertificate.Status.active);
                institutionCertificateRepository.save(existing);
            } else {
                // A live allocation being topped up: add slots, never overwrite;
                // widen the window, never shorten it. remaining_slots is
                // DB-computed, so only total_slots changes.
                existing.setTotalSlots(existing.getTotalSlots() + slots);
                if (existing.getAccessStartDate() == null || start.isBefore(existing.getAccessStartDate())) {
                    existing.setAccessStartDate(start);
                }
                if (existing.getAccessExpiryDate() == null || end.isAfter(existing.getAccessExpiryDate())) {
                    existing.setAccessExpiryDate(end);
                }
                existing.setStatus(InstitutionCertificate.Status.active);
                institutionCertificateRepository.save(existing);
            }
        }
        log.info("Access activated for institution {} from invoice {}",
                institution.getInstitutionId(), invoice.getInvoiceNumber());
    }
}
