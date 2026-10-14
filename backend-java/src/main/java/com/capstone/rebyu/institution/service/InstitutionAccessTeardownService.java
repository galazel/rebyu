package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.billing.service.InstitutionRefundService;
import com.capstone.rebyu.billing.service.InstitutionRefundService.RefundResult;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionAccessTeardownService {

    private final JdbcTemplate jdbc;
    private final InstitutionCertificateRepository allocations;
    private final InstitutionRefundService refundService;
    private final com.capstone.rebyu.common.JdbcCascadeDeleter cascade;
    private final com.capstone.rebyu.certification.service.S3StorageService storage;

    public record Impact(
            Long institutionCertId,
            String certificationTitle,
            int totalSlots,
            int departments,
            int enrolments,
            int invitations,
            int exams,
            int questions,
            int curriculumBranches,
            BigDecimal refundable,
            int refundWindowHours) {

        public boolean destroysWork() {
            return departments + enrolments + invitations > 0;
        }
    }

    public record TeardownResult(Impact impact, RefundResult refund) {}

    @Transactional(readOnly = true)
    public Impact describe(Long institutionCertId) {
        InstitutionCertificate allocation = allocations.findById(institutionCertId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Allocation not found: " + institutionCertId));

        return new Impact(
                institutionCertId,
                allocation.getCertification().getTitle(),
                allocation.getTotalSlots() == null ? 0 : allocation.getTotalSlots(),
                count("""
                        SELECT count(*) FROM departments d
                         WHERE EXISTS (SELECT 1 FROM department_certifications dc
                                        WHERE dc.department_id = d.department_id AND dc.institution_cert_id = ?)
                           AND (SELECT count(*) FROM department_certifications dc
                                 WHERE dc.department_id = d.department_id) = 1""", institutionCertId),
                count("SELECT count(*) FROM institution_certification_learners WHERE institution_cert_id = ?", institutionCertId),
                count("SELECT count(*) FROM learner_invitations WHERE institution_cert_id = ?", institutionCertId),
                count("""
                        SELECT count(*) FROM exams e
                          JOIN department_certifications dc ON dc.department_id = e.owner_department_id
                          JOIN institution_certificates ic ON ic.institution_cert_id = dc.institution_cert_id
                         WHERE dc.institution_cert_id = ? AND e.certification_id = ic.certification_id""", institutionCertId),
                count("""
                        SELECT count(*) FROM questions q
                          JOIN department_certifications dc ON dc.department_id = q.owner_department_id
                         WHERE dc.institution_cert_id = ?""", institutionCertId),
                count("""
                        SELECT count(*) FROM major_categories m
                          JOIN department_certifications dc ON dc.department_id = m.owner_department_id
                          JOIN institution_certificates ic ON ic.institution_cert_id = dc.institution_cert_id
                         WHERE dc.institution_cert_id = ? AND m.certification_id = ic.certification_id""", institutionCertId),
                refundService.quote(
                        allocation.getInstitution().getInstitutionId(),
                        allocation.getCertification().getCertificationId()),
                InstitutionRefundService.REFUND_WINDOW_HOURS);
    }

    @Transactional
    public TeardownResult dropCertification(Long institutionCertId, String reason) {
        InstitutionCertificate allocation = allocations.findById(institutionCertId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Allocation not found: " + institutionCertId));
        Impact impact = describe(institutionCertId);
        Long institutionId = allocation.getInstitution().getInstitutionId();
        Long certificationId = allocation.getCertification().getCertificationId();

        RefundResult refund = refundService.refund(institutionId, certificationId, reason);
        deleteAllocationTree(institutionCertId);

        log.info("Dropped certification {} from institution {}: {} department(s), {} enrolment(s), {} refunded",
                certificationId, institutionId, impact.departments(), impact.enrolments(), refund.refunded());
        return new TeardownResult(impact, refund);
    }

    @Transactional
    public TeardownResult cancelPartnership(Long institutionId, String reason) {
        return cancelPartnership(institutionId, reason, java.time.LocalDateTime.now());
    }

    @Transactional
    public TeardownResult cancelPartnership(Long institutionId, String reason, java.time.LocalDateTime requestedAt) {
        List<InstitutionCertificate> held = allocations.findByInstitution_InstitutionId(institutionId);

        RefundResult refund = refundService.refund(institutionId, null, reason, requestedAt);

        int departments = 0, enrolments = 0, invitations = 0;
        for (InstitutionCertificate allocation : held) {
            Impact impact = describe(allocation.getInstitutionCertId());
            departments += impact.departments();
            enrolments += impact.enrolments();
            invitations += impact.invitations();
            deleteAllocationTree(allocation.getInstitutionCertId());
        }

        List<Long> institution = List.of(institutionId);
        cascade.deleteWhere("departments", "institution_id", institution);
        List<String> storedFiles = jdbc.queryForList(
                "SELECT storage_key FROM institution_files WHERE institution_id = ?", String.class, institutionId);
        cascade.deleteWhere("institution_files", "institution_id", institution);
        removeFromStorageAfterCommit(storedFiles);
        cascade.deleteWhere("institutional_licenses", "institution_id", institution);

        log.info("Cancelled partnership for institution {}: {} allocation(s), {} department(s), {} enrolment(s), {} refunded",
                institutionId, held.size(), departments, enrolments, refund.refunded());

        return new TeardownResult(
                new Impact(null, "All certifications", 0, departments, enrolments, invitations,
                        0, 0, 0, refund.refunded(), InstitutionRefundService.REFUND_WINDOW_HOURS),
                refund);
    }

    private void removeFromStorageAfterCommit(List<String> keys) {
        if (keys.isEmpty()) {
            return;
        }
        Runnable removal = () -> keys.forEach(key -> {
            try {
                storage.deleteFile(key);
            } catch (RuntimeException e) {
                log.warn("Could not delete institution file {} from S3: {}", key, e.getMessage());
            }
        });
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            removal.run();
                        }
                    });
        } else {
            removal.run();
        }
    }

    private void deleteAllocationTree(Long institutionCertId) {
        List<Long> touched = jdbc.queryForList(
                "SELECT department_id FROM department_certifications WHERE institution_cert_id = ?",
                Long.class, institutionCertId);
        if (!touched.isEmpty()) {
            Long certificationId = jdbc.queryForObject(
                    "SELECT certification_id FROM institution_certificates WHERE institution_cert_id = ?",
                    Long.class, institutionCertId);
            // The dropped certification's own department content goes with it; a shared
            // department keeps the content of its other certifications.
            String[][] owned = {{"exams", "exam_id"}, {"major_categories", "major_category_id"}};
            String departmentList = String.join(",", java.util.Collections.nCopies(touched.size(), "?"));
            for (String[] table : owned) {
                Object[] args = new Object[touched.size() + 1];
                args[0] = certificationId;
                for (int k = 0; k < touched.size(); k++) args[k + 1] = touched.get(k);
                List<Long> ids = jdbc.queryForList(
                        "SELECT " + table[1] + " FROM " + table[0]
                                + " WHERE certification_id = ? AND owner_department_id IN (" + departmentList + ")",
                        Long.class, args);
                cascade.deleteWhere(table[0], table[1], ids);
            }
        }
        cascade.deleteWhere("institution_certificates", "institution_cert_id", List.of(institutionCertId));
        if (touched.isEmpty()) return;

        // A department shared by several certifications only goes when its last one does.
        String placeholders = String.join(",", java.util.Collections.nCopies(touched.size(), "?"));
        List<Long> empty = jdbc.queryForList(
                "SELECT d.department_id FROM departments d WHERE d.department_id IN (" + placeholders + ") "
                        + "AND NOT EXISTS (SELECT 1 FROM department_certifications dc WHERE dc.department_id = d.department_id)",
                Long.class, touched.toArray());
        cascade.deleteWhere("departments", "department_id", empty);
        jdbc.update("UPDATE departments d SET total_slots = COALESCE((SELECT SUM(ic.total_slots) "
                        + "FROM department_certifications dc JOIN institution_certificates ic "
                        + "ON ic.institution_cert_id = dc.institution_cert_id WHERE dc.department_id = d.department_id), 0) "
                        + "WHERE d.department_id IN (" + placeholders + ")",
                touched.toArray());
    }

    private int count(String sql, Long institutionCertId) {
        Integer value = jdbc.queryForObject(sql, Integer.class, institutionCertId);
        return value == null ? 0 : value;
    }
}
