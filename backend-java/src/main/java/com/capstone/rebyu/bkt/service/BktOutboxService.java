package com.capstone.rebyu.bkt.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.dto.BktMasteryEvent;
import com.capstone.rebyu.bkt.entity.BktEventOutbox;
import com.capstone.rebyu.bkt.entity.BktOutboxStatus;
import com.capstone.rebyu.bkt.repository.BktEventOutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
@Service
public class BktOutboxService {

    private final BktEventOutboxRepository outboxRepository;
    private final BktEventFactory eventFactory;
    private final QuestionRepository questionRepository;
    private final BktProperties properties;
    private final ObjectMapper objectMapper;


    public int enqueueForAttempt(
            AssessmentAttempt attempt,
            List<AssessmentAttemptQuestion> questions,
            Map<Long, AssessmentAttemptAnswer> answersByQuestionId) {

        if (!properties.isEnabled()) {
            return 0;
        }
        try {
            String rawAssessmentType = attempt.getExam().getExamType().getExamTypeText();
            Long certificationId = attempt.getExam().getCertification().getCertificationId();
            Long examId = attempt.getExam().getExamId();
            Long attemptId = attempt.getAssessmentAttemptId();
            String batchId = "attempt-" + attemptId;

            Set<String> alreadyEnqueued = new HashSet<>(outboxRepository.findEventIdsByBatchId(batchId));

            int created = 0;
            for (AssessmentAttemptQuestion question : questions) {
                AssessmentAttemptAnswer answer =
                        answersByQuestionId.get(question.getAttemptQuestionId());

                if (answer == null || answer.isPendingManualEvaluation() || question.getLessonId() == null) {
                    continue;
                }
                if (alreadyEnqueued.contains(eventFactory.buildEventId(
                        attemptId, question.getAttemptQuestionId(), 1))) {
                    continue;
                }

                Question sourceQuestion = questionRepository
                        .findById(question.getSourceQuestionId())
                        .orElse(null);

                BktMasteryEvent event = eventFactory.buildEvent(
                        attempt, question, answer, sourceQuestion,
                        certificationId, rawAssessmentType);
                if (event == null || !alreadyEnqueued.add(event.sourceEventId())) {
                    continue;
                }

                outboxRepository.save(BktEventOutbox.builder()
                        .eventId(event.sourceEventId())
                        .batchId(batchId)
                        .learnerId(attempt.getLearnerId())
                        .certificationId(certificationId)
                        .examId(examId)
                        .examResultId(attemptId)
                        .attemptNo(attempt.getAttemptNumber())
                        .eventType("MASTERY")
                        .payloadJson(objectMapper.writeValueAsString(event))
                        .status(BktOutboxStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build());
                created++;
            }
            if (created > 0) {
                log.info("Enqueued {} BKT event(s) for attempt {} ({})",
                        created, attemptId, rawAssessmentType);
            }
            return created;
        } catch (Exception e) {
            log.warn("Could not enqueue BKT events for attempt {}: {}",
                    attempt.getAssessmentAttemptId(), e.getMessage());
            return 0;
        }
    }

    public boolean enqueueEvent(BktMasteryEvent event, String batchId, Long certificationId, Long examResultId) {
        if (!properties.isEnabled()) {
            return false;
        }
        try {
            if (outboxRepository.existsByEventId(event.sourceEventId())) {
                return false;
            }
            outboxRepository.save(BktEventOutbox.builder()
                    .eventId(event.sourceEventId())
                    .batchId(batchId)
                    .learnerId(event.learnerId())
                    .certificationId(certificationId)
                    .examResultId(examResultId)
                    .attemptNo(1)
                    .eventType("MASTERY")
                    .payloadJson(objectMapper.writeValueAsString(event))
                    .status(BktOutboxStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build());
            return true;
        } catch (Exception e) {
            log.warn("Could not enqueue BKT event {}: {}", event.sourceEventId(), e.getMessage());
            return false;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int resetForRetry(List<Long> ids) {
        int reset = 0;
        for (BktEventOutbox row : outboxRepository.findAllById(ids)) {
            row.setStatus(BktOutboxStatus.PENDING);
            row.setRetryCount(0);
            row.setNextRetryAt(null);
            row.setLockedAt(null);
            row.setLockedBy(null);
            reset++;
        }
        return reset;
    }


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<BktEventOutbox> claimBatch(int limit, String workerId) {
        List<BktEventOutbox> claimed =
                outboxRepository.claimPending(LocalDateTime.now(), limit);
        LocalDateTime now = LocalDateTime.now();
        for (BktEventOutbox row : claimed) {
            row.setStatus(BktOutboxStatus.PROCESSING);
            row.setLockedAt(now);
            row.setLockedBy(workerId);
        }
        outboxRepository.saveAll(claimed);
        return claimed;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markProcessed(List<Long> ids) {
        LocalDateTime now = LocalDateTime.now();
        for (BktEventOutbox row : outboxRepository.findAllById(ids)) {
            row.setStatus(BktOutboxStatus.PROCESSED);
            row.setProcessedAt(now);
            row.setLastError(null);
            row.setLockedBy(null);
            row.setLockedAt(null);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRetry(List<Long> ids, String error) {
        LocalDateTime now = LocalDateTime.now();
        for (BktEventOutbox row : outboxRepository.findAllById(ids)) {
            int attempts = row.getRetryCount() + 1;
            row.setRetryCount(attempts);
            row.setLastError(truncate(error));
            row.setLockedBy(null);
            row.setLockedAt(null);
            if (attempts >= properties.getMaxRetries()) {
                row.setStatus(BktOutboxStatus.DEAD_LETTER);
            } else {
                row.setStatus(BktOutboxStatus.PENDING);
                row.setNextRetryAt(now.plusSeconds(backoffSeconds(attempts)));
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markDeadLetter(List<Long> ids, String error) {
        for (BktEventOutbox row : outboxRepository.findAllById(ids)) {
            row.setStatus(BktOutboxStatus.DEAD_LETTER);
            row.setLastError(truncate(error));
            row.setLockedBy(null);
            row.setLockedAt(null);
        }
    }

    long backoffSeconds(int attempts) {
        long delay = (long) properties.getRetryInitialDelaySeconds()
                * (1L << Math.min(attempts - 1, 20));
        return Math.min(delay, properties.getRetryMaxDelaySeconds());
    }

    private static String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }
}
