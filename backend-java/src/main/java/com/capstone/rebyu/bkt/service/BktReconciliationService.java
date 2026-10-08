package com.capstone.rebyu.bkt.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.dto.BktReconciliationSummary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BktReconciliationService {

    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final BktOutboxService outboxService;
    private final BktProperties properties;
    private final TransactionTemplate transactionTemplate;

    public BktReconciliationService(
            AssessmentAttemptRepository attemptRepository,
            AssessmentAttemptQuestionRepository attemptQuestionRepository,
            AssessmentAttemptAnswerRepository attemptAnswerRepository,
            BktOutboxService outboxService,
            BktProperties properties,
            PlatformTransactionManager transactionManager) {
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.outboxService = outboxService;
        this.properties = properties;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Scheduled(
            fixedDelayString = "${bkt.reconciliation-interval-ms:900000}",
            initialDelayString = "${bkt.reconciliation-initial-delay-ms:60000}")
    public void scheduledReconcile() {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            BktReconciliationSummary summary = reconcile(properties.getReconciliationBatchSize());
            if (summary.eventsCreated() > 0) {
                log.info("BKT reconciliation created {} missing event(s) across {} attempt(s)",
                        summary.eventsCreated(), summary.attemptsScanned());
            }
        } catch (Exception e) {
            log.warn("BKT reconciliation run failed: {}", e.getMessage());
        }
    }

    public BktReconciliationSummary reconcile(int maxAttempts) {
        List<Long> attemptIds = transactionTemplate.execute(status ->
                attemptRepository.findRecentSubmittedIdsMissingBktEvents(Math.max(1, maxAttempts)));

        int scanned = 0;
        int created = 0;
        for (Long attemptId : attemptIds == null ? List.<Long>of() : attemptIds) {
            scanned++;
            Integer c = transactionTemplate.execute(status -> reconcileOne(attemptId));
            created += c == null ? 0 : c;
        }
        return new BktReconciliationSummary(scanned, created, LocalDateTime.now());
    }

    private int reconcileOne(Long attemptId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId).orElse(null);
        if (attempt == null || attempt.getStatus() != AssessmentAttempt.Status.SUBMITTED) {
            return 0;
        }
        List<AssessmentAttemptQuestion> questions = attemptQuestionRepository
                .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(attemptId);
        Map<Long, AssessmentAttemptAnswer> answersByQuestion = new HashMap<>();
        for (AssessmentAttemptAnswer answer :
                attemptAnswerRepository.findByAttempt_AssessmentAttemptId(attemptId)) {
            answersByQuestion.put(answer.getAttemptQuestion().getAttemptQuestionId(), answer);
        }
        return outboxService.enqueueForAttempt(attempt, questions, answersByQuestion);
    }
}
