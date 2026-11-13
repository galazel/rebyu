package com.capstone.rebyu.institution.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * The single source of truth for seat counts.
 *
 * A seat is taken by an enrollment that is active or completed, or by a pending
 * invitation that has not expired. Nothing else holds a seat: a removed, revoked or
 * deleted learner, or an expired / revoked / accepted invitation, frees it.
 *
 * The {@code used_slots} columns are a cache of that rule. The +1/-1 bookkeeping in
 * the invite and removal flows used to be the only thing keeping them right, and any
 * path that forgot it (account deletion, cascade deletes, expiry in another service)
 * left seats stuck as "used". Recounting after every seat-changing action, and on a
 * schedule, makes the columns match reality no matter which path changed it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLedgerService {

    private final JdbcTemplate jdbc;

    private static final String CERT_RECOUNT = """
            UPDATE institution_certificates ic
               SET used_slots = live.used
              FROM (SELECT c.institution_cert_id,
                           (SELECT count(*) FROM institution_certification_learners icl
                             WHERE icl.institution_cert_id = c.institution_cert_id
                               AND icl.status IN ('active', 'completed'))
                         + (SELECT count(*) FROM learner_invitations li
                             WHERE li.institution_cert_id = c.institution_cert_id
                               AND li.status = 'PENDING' AND li.expires_at > now()) AS used
                      FROM institution_certificates c
                     WHERE c.status IN ('pending', 'active', 'suspended') %s) live
             WHERE ic.institution_cert_id = live.institution_cert_id
               AND ic.used_slots IS DISTINCT FROM live.used""";

    private static final String DEPT_RECOUNT = """
            UPDATE departments d
               SET used_slots = live.used
              FROM (SELECT x.department_id,
                           (SELECT count(*) FROM department_learners dl
                              JOIN institution_certification_learners icl
                                ON icl.institution_cert_learner_id = dl.institution_cert_learner_id
                             WHERE dl.department_id = x.department_id AND dl.status = 'active'
                               AND icl.status IN ('active', 'completed'))
                         + (SELECT count(*) FROM learner_invitations li
                             WHERE li.department_id = x.department_id
                               AND li.status = 'PENDING' AND li.expires_at > now()) AS used
                      FROM departments x
                     WHERE true %s) live
             WHERE d.department_id = live.department_id
               AND d.used_slots IS DISTINCT FROM live.used""";

    /** Seats taken on one certification right now, by the rule above. */
    public int usedSeats(Long institutionCertId) {
        Integer n = jdbc.queryForObject("""
                SELECT (SELECT count(*) FROM institution_certification_learners
                         WHERE institution_cert_id = ? AND status IN ('active', 'completed'))
                     + (SELECT count(*) FROM learner_invitations
                         WHERE institution_cert_id = ? AND status = 'PENDING' AND expires_at > now())""",
                Integer.class, institutionCertId, institutionCertId);
        return n == null ? 0 : n;
    }

    /** Recount every institution. Cheap: two set-based UPDATEs that only touch rows that drifted. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recountAll() {
        int certs = jdbc.update(CERT_RECOUNT.formatted(""));
        int depts = jdbc.update(DEPT_RECOUNT.formatted(""));
        if (certs + depts > 0) log.info("Seat ledger corrected {} certification and {} department counter(s)", certs, depts);
        return certs + depts;
    }

    /** Recount one institution, inside the caller's transaction so the caller sees the result. */
    @Transactional
    public void recountInstitution(Long institutionId) {
        if (institutionId == null) {
            recountAll();
            return;
        }
        jdbc.update(CERT_RECOUNT.formatted("AND c.institution_id = ?"), institutionId);
        jdbc.update(DEPT_RECOUNT.formatted("AND x.institution_id = ?"), institutionId);
    }

    /**
     * Recount once the caller's transaction commits (so deletes are visible), or now
     * when there is no transaction. Use after any action that adds or frees a seat.
     */
    public void recountAfterCommit() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    safeRecount();
                }
            });
        } else {
            safeRecount();
        }
    }

    private void safeRecount() {
        try {
            recountAll();
        } catch (RuntimeException e) {
            log.warn("Seat ledger recount failed: {}", e.getMessage());
        }
    }

    /** Safety net: invitations expire by the clock, not by an action. */
    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT1M")
    public void scheduledRecount() {
        safeRecount();
    }
}
