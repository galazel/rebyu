package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.common.TutorLockedException;
import com.capstone.rebyu.aigateway.entity.TutorConduct;
import com.capstone.rebyu.aigateway.repository.TutorConductRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Strikes for severe tutor messages, and the seven-hour lockout they lead to.
 *
 * Python decides whether a message is severe ({@code POST /tutor/screen}, pattern rules
 * only); this side counts. 1st strike: warning. 2nd: final warning. 3rd: every AI tutor
 * feature (chat, Dialogue, Live Tutor) is refused for {@link #LOCKOUT}. Strikes reset once
 * a lockout is served, or after {@link #QUIET_RESET} with no new strike.
 *
 * Admins are never screened or locked. If the screen itself fails, the turn goes ahead
 * (Python's own guard still blocks the message) -- an outage must not lock anyone out.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TutorConductService {

    public static final int FINAL_WARNING_AT = 2;
    public static final int LOCK_AT = 3;
    public static final Duration LOCKOUT = Duration.ofHours(7);
    public static final Duration QUIET_RESET = Duration.ofDays(7);

    private final TutorConductRepository conduct;
    private final AiServiceClient aiServiceClient;
    private final TransactionTemplate transactions;
    private final TutorSafetyAlertService safetyAlerts;

    private static Long subject(CurrentUserDto user) {
        return user != null && user.learnerId() != null && !"ADMIN".equalsIgnoreCase(user.role())
                ? user.learnerId() : null;
    }

    /** Throws {@link TutorLockedException} while the learner is locked out. */
    public void requireAllowed(CurrentUserDto user) {
        Long learnerId = subject(user);
        if (learnerId == null) return;
        conduct.findById(learnerId)
                .map(TutorConduct::getLockedUntil)
                .filter(until -> until.isAfter(Instant.now()))
                .ifPresent(until -> { throw new TutorLockedException(until); });
    }

    /**
     * Screens one learner message. Returns the notice to show (warning / final warning),
     * or null when the message is fine. Throws {@link TutorLockedException} when this
     * message is the one that locks the learner out -- the turn is then not run at all.
     */
    public Map<String, Object> screen(CurrentUserDto user, String message, String surface) {
        Long learnerId = subject(user);
        if (learnerId == null || message == null || message.isBlank()) return null;
        AiServiceClient.TutorScreen screened;
        try {
            screened = aiServiceClient.screenTutorMessage(message);
        } catch (RuntimeException unavailable) {
            log.warn("Tutor conduct screen unavailable, turn allowed: {}", unavailable.toString());
            return null;
        }
        // A safety alert is raised first and on its own: a learner at risk is never struck, and
        // a message that also locks the learner out must still reach staff.
        if (screened.alert() != null) {
            try {
                safetyAlerts.raise(learnerId, TutorSafetyAlertService.kindOf(screened.alert()), surface, message);
            } catch (RuntimeException failed) {
                log.error("Could not record tutor safety alert {} for learner {}", screened.alert(), learnerId, failed);
            }
        }
        String reason = screened.strike();
        if (reason == null) return null;

        TutorConduct record = transactions.execute(status -> strike(learnerId, reason));
        log.info("Tutor conduct strike {} for learner {} on {} ({})",
                record.getStrikes(), learnerId, surface, reason);
        if (record.getLockedUntil() != null && record.getLockedUntil().isAfter(Instant.now())) {
            throw new TutorLockedException(record.getLockedUntil());
        }
        return notice(record);
    }

    private TutorConduct strike(Long learnerId, String reason) {
        Instant now = Instant.now();
        TutorConduct record = conduct.findForUpdate(learnerId).orElseGet(() ->
                TutorConduct.builder().learnerId(learnerId).build());
        boolean servedLockout = record.getLockedUntil() != null && !record.getLockedUntil().isAfter(now);
        boolean quiet = record.getLastStrikeAt() != null && record.getLastStrikeAt().plus(QUIET_RESET).isBefore(now);
        if (servedLockout || quiet) {
            record.setStrikes(0);
            record.setLockedUntil(null);
        }
        record.setStrikes(record.getStrikes() + 1);
        record.setTotalStrikes(record.getTotalStrikes() + 1);
        record.setLastReason(reason);
        record.setLastStrikeAt(now);
        if (record.getStrikes() >= LOCK_AT) {
            record.setLockedUntil(now.plus(LOCKOUT));
            record.setLockouts(record.getLockouts() + 1);
        }
        return conduct.save(record);
    }

    private static Map<String, Object> notice(TutorConduct record) {
        Map<String, Object> notice = new LinkedHashMap<>();
        notice.put("level", record.getStrikes() >= FINAL_WARNING_AT ? "final" : "warning");
        notice.put("strikes", record.getStrikes());
        notice.put("strikesBeforeLock", Math.max(0, LOCK_AT - record.getStrikes()));
        notice.put("lockoutHours", LOCKOUT.toHours());
        notice.put("reason", record.getLastReason());
        return notice;
    }

    /** The learner's current standing, for the tutor panel to show on open. */
    public Map<String, Object> status(CurrentUserDto user) {
        Map<String, Object> status = new LinkedHashMap<>();
        Long learnerId = subject(user);
        TutorConduct record = learnerId == null ? null : conduct.findById(learnerId).orElse(null);
        Instant now = Instant.now();
        boolean locked = record != null && record.getLockedUntil() != null && record.getLockedUntil().isAfter(now);
        boolean stale = record == null || (record.getLockedUntil() != null && !locked)
                || (record.getLastStrikeAt() != null && record.getLastStrikeAt().plus(QUIET_RESET).isBefore(now));
        status.put("locked", locked);
        status.put("lockedUntil", locked ? record.getLockedUntil().toString() : null);
        status.put("strikes", locked ? record.getStrikes() : stale ? 0 : record.getStrikes());
        status.put("lockAt", LOCK_AT);
        status.put("lockoutHours", LOCKOUT.toHours());
        return status;
    }
}
