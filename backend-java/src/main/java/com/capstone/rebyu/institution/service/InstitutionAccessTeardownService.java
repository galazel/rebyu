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

/**
 * Taking an institution's access away, and everything hanging off it.
 *
 * Two callers: dropping one certification from an allocation, and cancelling a
 * partnership (which is every certification at once). Both cut access
 * immediately and refund what was paid -- see {@link InstitutionRefundService}
 * for the money.
 *
 * <p><b>This destroys data.</b> An allocation is the root of a tree: the
 * departments carved out of it, the learners enrolled through it, and the
 * invitations sent for it. Deleting the root deletes the tree, and nothing
 * here is recoverable from inside REBYU.
 *
 * <p>So {@link #describe} exists alongside {@link #dropCertification}: the
 * caller asks what would be destroyed, shows it, and only then acts. Both walk
 * the same relationships, so the count shown is the count removed.
 *
 * <p>Order matters and is the reverse of the dependency tree, because every
 * one of these foreign keys is {@code NO ACTION}: the database cascades
 * nothing, so a parent deleted before its children fails the constraint rather
 * than quietly orphaning them. SQL rather than JPA on purpose -- this is a bulk
 * delete down a fixed tree, and loading every row into the persistence context
 * to remove it would be slower and no safer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionAccessTeardownService {

    private final JdbcTemplate jdbc;
    private final InstitutionCertificateRepository allocations;
    private final InstitutionRefundService refundService;

    /** What dropping this allocation would destroy. */
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
            /** What would come back if this were dropped now -- zero once the
                24-hour window has closed. Quoted, not promised: the provider
                still has the last word at the moment of refunding. */
            BigDecimal refundable,
            int refundWindowHours) {

        /** True when something other than the allocation itself goes with it. */
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
                count("SELECT count(*) FROM departments WHERE institution_cert_id = ?", institutionCertId),
                count("SELECT count(*) FROM institution_certification_learners WHERE institution_cert_id = ?", institutionCertId),
                count("SELECT count(*) FROM learner_invitations WHERE institution_cert_id = ?", institutionCertId),
                count("""
                        SELECT count(*) FROM exams e JOIN departments d ON d.department_id = e.owner_department_id
                         WHERE d.institution_cert_id = ?""", institutionCertId),
                count("""
                        SELECT count(*) FROM questions q JOIN departments d ON d.department_id = q.owner_department_id
                         WHERE d.institution_cert_id = ?""", institutionCertId),
                count("""
                        SELECT count(*) FROM major_categories m JOIN departments d ON d.department_id = m.owner_department_id
                         WHERE d.institution_cert_id = ?""", institutionCertId),
                refundService.quote(
                        allocation.getInstitution().getInstitutionId(),
                        allocation.getCertification().getCertificationId()),
                InstitutionRefundService.REFUND_WINDOW_HOURS);
    }

    /**
     * Removes one certification from an institution: the allocation, everything
     * hanging off it, and the money paid for it.
     *
     * <p>The refund runs first. If it is going to fail it should fail while the
     * access still exists, so a retry is possible -- the other order leaves an
     * institution with neither its access nor its money.
     */
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

    /**
     * Ends a partnership: every allocation gone, every paid invoice refunded,
     * every unpaid one cancelled.
     */
    @Transactional
    public TeardownResult cancelPartnership(Long institutionId, String reason) {
        List<InstitutionCertificate> held = allocations.findByInstitution_InstitutionId(institutionId);

        /* One refund pass over the whole institution rather than one per
           allocation: invoices are raised per request, not per certification,
           so asking for "everything" is both cheaper and exactly what ending
           the partnership means. */
        RefundResult refund = refundService.refund(institutionId, null, reason);

        int departments = 0, enrolments = 0, invitations = 0;
        for (InstitutionCertificate allocation : held) {
            Impact impact = describe(allocation.getInstitutionCertId());
            departments += impact.departments();
            enrolments += impact.enrolments();
            invitations += impact.invitations();
            deleteAllocationTree(allocation.getInstitutionCertId());
        }

        log.info("Cancelled partnership for institution {}: {} allocation(s), {} department(s), {} enrolment(s), {} refunded",
                institutionId, held.size(), departments, enrolments, refund.refunded());

        return new TeardownResult(
                new Impact(null, "All certifications", 0, departments, enrolments, invitations,
                        0, 0, 0, refund.refunded(), InstitutionRefundService.REFUND_WINDOW_HOURS),
                refund);
    }

    /** Children before parents, all the way down. */
    private void deleteAllocationTree(Long institutionCertId) {
        String departmentsOf = "SELECT department_id FROM departments WHERE institution_cert_id = ?";

        // Learners: their department membership first, then the enrolment.
        jdbc.update("""
                DELETE FROM department_learners
                 WHERE institution_cert_learner_id IN (
                       SELECT institution_cert_learner_id FROM institution_certification_learners
                        WHERE institution_cert_id = ?)""", institutionCertId);
        jdbc.update("DELETE FROM department_learners WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM institution_certification_learners WHERE institution_cert_id = ?",
                institutionCertId);

        // Invitations hang off both the allocation and, sometimes, a department.
        jdbc.update("DELETE FROM learner_invitations WHERE institution_cert_id = ? OR department_id IN ("
                + departmentsOf + ")", institutionCertId, institutionCertId);

        // What a department owns outright.
        jdbc.update("DELETE FROM department_announcements WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM department_head_assignments WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM institution_sections WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);

        /* Authored content is detached, not deleted. An exam a learner has
           already sat is referenced by their attempt, and a question by their
           answer: removing it would take a learner's own history with it --
           including learners elsewhere, if the question was ever shared. The
           department is gone either way, so the institution loses nothing it
           can see. */
        for (String owned : List.of("exams", "questions", "major_categories")) {
            jdbc.update("UPDATE " + owned + " SET owner_department_id = NULL WHERE owner_department_id IN ("
                    + departmentsOf + ")", institutionCertId);
        }

        jdbc.update("DELETE FROM departments WHERE institution_cert_id = ?", institutionCertId);
        jdbc.update("DELETE FROM institution_certificates WHERE institution_cert_id = ?", institutionCertId);
    }

    private int count(String sql, Long institutionCertId) {
        Integer value = jdbc.queryForObject(sql, Integer.class, institutionCertId);
        return value == null ? 0 : value;
    }
}
