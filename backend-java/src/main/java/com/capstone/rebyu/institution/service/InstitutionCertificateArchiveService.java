package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.entity.InstitutionCertificateArchive;
import com.capstone.rebyu.institution.entity.InstitutionLearnerRecord;
import com.capstone.rebyu.institution.repository.InstitutionCertificateArchiveRepository;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * When an institution's access to a certification runs out, the term is archived:
 * its learners leave the institution (they keep their own enrolment), their records
 * are frozen under an {@link InstitutionCertificateArchive}, and the allocation is
 * marked expired with its seats freed, so a renewal starts on a clean roster.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionCertificateArchiveService {

    private final com.capstone.rebyu.institution.service.SeatLedgerService seatLedger;

    private final InstitutionCertificateRepository allocations;
    private final InstitutionCertificateArchiveRepository archives;
    private final InstitutionCertificationLearnerRepository enrollments;
    private final InstitutionMembershipService membership;

    /** Daily, shortly after midnight, and once when the server starts. */
    @Scheduled(cron = "${institution.expiry-sweep-cron:0 10 0 * * *}")
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void archiveExpired() {
        LocalDate today = LocalDate.now();
        List<InstitutionCertificate> due = allocations
                .findByStatusAndAccessExpiryDateBefore(InstitutionCertificate.Status.active, today);
        for (InstitutionCertificate allocation : due) {
            try {
                archive(allocation, "expired");
            } catch (RuntimeException e) {
                log.error("Could not archive expired allocation {}: {}", allocation.getInstitutionCertId(), e.getMessage(), e);
            }
        }
        if (!due.isEmpty()) log.info("Archived {} expired certification allocation(s)", due.size());
    }

    @Transactional
    public InstitutionCertificateArchive archive(InstitutionCertificate allocation, String reason) {
        LocalDateTime now = LocalDateTime.now();
        InstitutionCertificateArchive archive = archives.save(InstitutionCertificateArchive.builder()
                .institutionId(allocation.getInstitution().getInstitutionId())
                .institutionCertId(allocation.getInstitutionCertId())
                .certificationId(allocation.getCertification().getCertificationId())
                .certificationTitle(allocation.getCertification().getTitle())
                .accessStartDate(allocation.getAccessStartDate())
                .accessExpiryDate(allocation.getAccessExpiryDate())
                .totalSlots(allocation.getTotalSlots())
                .usedSlots(allocation.getUsedSlots())
                .reason(reason)
                .archivedAt(now)
                .learnerCount(0)
                .build());

        // Figures are frozen at the end of the access window, not at the sweep.
        LocalDateTime cutOff = allocation.getAccessExpiryDate() == null
                ? now : allocation.getAccessExpiryDate().atTime(23, 59, 59);
        int released = membership.release(
                enrollments.findByInstitutionCert_InstitutionCertId(allocation.getInstitutionCertId()),
                InstitutionLearnerRecord.Reason.expired, archive, cutOff.isAfter(now) ? now : cutOff);

        archive.setLearnerCount(released);
        archives.save(archive);
        allocation.setStatus(InstitutionCertificate.Status.expired);
        allocation.setUsedSlots(0);
        seatLedger.recountAfterCommit();
        allocations.save(allocation);
        log.info("Archived allocation {} ({}): {} learner(s) released", allocation.getInstitutionCertId(),
                allocation.getCertification().getTitle(), released);
        return archive;
    }

    @Transactional(readOnly = true)
    public List<InstitutionCertificateArchive> archivesOf(Long institutionId) {
        return archives.findByInstitutionIdOrderByArchivedAtDesc(institutionId);
    }

    @Transactional(readOnly = true)
    public InstitutionCertificateArchive requireArchive(Long archiveId, Long institutionId) {
        return archives.findById(archiveId)
                .filter(a -> a.getInstitutionId().equals(institutionId))
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Archive not found: " + archiveId));
    }
}
