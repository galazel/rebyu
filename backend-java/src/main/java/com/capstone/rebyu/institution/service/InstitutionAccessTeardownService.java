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
        List<InstitutionCertificate> held = allocations.findByInstitution_InstitutionId(institutionId);

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

    private void deleteAllocationTree(Long institutionCertId) {
        String departmentsOf = "SELECT department_id FROM departments WHERE institution_cert_id = ?";

        jdbc.update("""
                DELETE FROM department_learners
                 WHERE institution_cert_learner_id IN (
                       SELECT institution_cert_learner_id FROM institution_certification_learners
                        WHERE institution_cert_id = ?)""", institutionCertId);
        jdbc.update("DELETE FROM department_learners WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM institution_certification_learners WHERE institution_cert_id = ?",
                institutionCertId);

        jdbc.update("DELETE FROM learner_invitations WHERE institution_cert_id = ? OR department_id IN ("
                + departmentsOf + ")", institutionCertId, institutionCertId);

        jdbc.update("DELETE FROM department_announcements WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM department_head_assignments WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);
        jdbc.update("DELETE FROM institution_sections WHERE department_id IN (" + departmentsOf + ")",
                institutionCertId);

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
