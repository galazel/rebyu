package com.capstone.rebyu.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private final JdbcTemplate jdbc;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final com.capstone.rebyu.common.DeletionCleanupService cleanup;
    private final org.springframework.context.ApplicationEventPublisher events;

    @Transactional
    public void deleteLearner(Long learnerId) {
        Long userId = jdbc.query("SELECT user_id FROM learners WHERE learner_id = ?",
                rs -> rs.next() ? rs.getObject(1, Long.class) : null, learnerId);
        erase(userId, List.of(learnerId));
    }

    @Transactional
    public void deleteUser(Long userId) {
        List<Long> learnerIds = jdbc.queryForList(
                "SELECT learner_id FROM learners WHERE user_id = ?", Long.class, userId);
        erase(userId, learnerIds);
    }

    private void erase(Long userId, List<Long> learnerIds) {
        List<String> fileKeys = new ArrayList<>();
        for (Long learnerId : learnerIds) {
            fileKeys.addAll(attachmentKeysOf(learnerId));
        }
        String cognitoSub = userId == null ? null : jdbc.query(
                "SELECT cognito_sub FROM users WHERE user_id = ?",
                rs -> rs.next() ? rs.getString(1) : null, userId);

        // The shared walker also follows id columns with no foreign key -- a learner's quiz and
        // exam attempts among them, which the old walk silently left behind.
        if (!learnerIds.isEmpty()) {
            cascade.delete("learners", "learner_id", learnerIds);
        }

        if (userId != null) {
            String email = jdbc.query("SELECT lower(email) FROM users WHERE user_id = ?",
                    rs -> rs.next() ? rs.getString(1) : null, userId);
            cascade.delete("users", "user_id", userId);
            if (email != null && !email.isBlank()) {
                deleteRowsLinkedByEmail(email);
            }
        }

        learnerIds.forEach(cleanup::learner);
        fileKeys.stream().distinct().forEach(cleanup::file);
        if (cognitoSub != null && !cognitoSub.isBlank()) {
            cleanup.identity(cognitoSub);
            // Drop the cached identity, or the deleted user keeps working for up to 30 s.
            events.publishEvent(new com.capstone.rebyu.auth.service.IdentityChangedEvent(cognitoSub));
        }
        log.info("Deleted user {} (learner ids {}, {} stored files queued for cleanup, sign-in cleanup {})",
                userId, learnerIds, fileKeys.size(), cognitoSub == null ? "not needed" : "queued");
    }

    /**
     * Rows tied to the person only by their email address, which no id walk can reach:
     * department head invitations sent to it, and partnership requests it submitted that never
     * became an institution (an approved one belongs to the institution and goes with it).
     */
    private void deleteRowsLinkedByEmail(String email) {
        // Invitations may predate this account and have no learner_id FK yet.
        List<Long> learnerInvitations = jdbc.queryForList(
                "SELECT invitation_id FROM learner_invitations WHERE lower(email) = ?", Long.class, email);
        if (!learnerInvitations.isEmpty()) {
            cascade.delete("learner_invitations", "invitation_id", learnerInvitations);
        }
        List<Long> invitations = jdbc.queryForList(
                "SELECT department_head_invitation_id FROM department_head_invitations WHERE lower(email) = ?",
                Long.class, email);
        if (!invitations.isEmpty()) {
            cascade.delete("department_head_invitations", "department_head_invitation_id", invitations);
        }
        List<Long> requests = jdbc.queryForList(
                "SELECT request_id FROM partnership_requests "
                        + "WHERE lower(institution_email) = ? AND institution_id IS NULL",
                Long.class, email);
        if (!requests.isEmpty()) {
            cascade.delete("partnership_requests", "request_id", requests);
        }
    }

    private List<String> attachmentKeysOf(Long learnerId) {
        List<String> keys = new ArrayList<>(jdbc.queryForList(
                "SELECT avatar_key FROM learners WHERE learner_id = ? AND avatar_key IS NOT NULL "
                        + "AND avatar_key NOT LIKE '/%'", String.class, learnerId));
        keys.addAll(jdbc.queryForList(
                "SELECT attachment_key FROM community_posts "
                        + "WHERE author_learner_id = ? AND attachment_key IS NOT NULL",
                String.class, learnerId));
        keys.addAll(jdbc.queryForList(
                "SELECT resource_url FROM learner_library_items "
                        + "WHERE learner_id = ? AND item_type = 'file' "
                        + "AND resource_url IS NOT NULL AND resource_url NOT LIKE '/%'",
                String.class, learnerId));
        return keys;
    }
}
