package com.capstone.rebyu.user.service;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.certification.service.S3StorageService;
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
    private final S3StorageService s3StorageService;
    private final CognitoAdminService cognitoAdminService;
    private final com.capstone.rebyu.bkt.client.BktClient bktClient;
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
            cascade.delete("users", "user_id", userId);
        }

        for (Long learnerId : learnerIds) {
            try {
                bktClient.purgeLearnerState(learnerId);
            } catch (Exception ex) {
                log.error("Learner {} deleted, but their BKT mastery could not be purged. "
                        + "It will be inherited by the next learner issued this id.", learnerId, ex);
            }
        }

        for (String key : fileKeys) {
            try {
                s3StorageService.deleteFile(key);
            } catch (Exception ex) {
                log.warn("Account {} deleted, but stored file {} could not be removed: {}",
                        userId, key, ex.getMessage());
            }
        }
        if (cognitoSub != null && !cognitoSub.isBlank()) {
            cognitoAdminService.deleteAccount(cognitoSub);
            // Drop the cached identity, or the deleted user keeps working for up to 30 s.
            events.publishEvent(new com.capstone.rebyu.auth.service.IdentityChangedEvent(cognitoSub));
        }
        log.info("Deleted user {} (learner ids {}, {} stored files, cognito sub {})",
                userId, learnerIds, fileKeys.size(), cognitoSub == null ? "none" : "removed");
    }

    private List<String> attachmentKeysOf(Long learnerId) {
        List<String> keys = new ArrayList<>(jdbc.queryForList(
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
