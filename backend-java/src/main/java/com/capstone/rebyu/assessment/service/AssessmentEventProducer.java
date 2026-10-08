package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.AssessmentRetakeRequestedMessage;
import com.capstone.rebyu.assessment.dto.AssessmentSubmittedMessage;
import com.capstone.rebyu.config.RabbitMqConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishAssessmentSubmitted(Long assessmentAttemptId) {
        afterCommit(() -> sendSubmitted(assessmentAttemptId));
    }

    public void publishAssessmentRetakeRequested(Long assessmentAttemptId) {
        afterCommit(() -> sendRetakeRequested(assessmentAttemptId));
    }

    private static void afterCommit(Runnable send) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    private void sendSubmitted(Long assessmentAttemptId) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE,
                    RabbitMqConfig.ASSESSMENT_SUBMITTED_ROUTING_KEY,
                    new AssessmentSubmittedMessage(assessmentAttemptId));
        } catch (Exception e) {
            log.warn("Could not publish assessment submitted trigger for attempt {}: {}",
                    assessmentAttemptId, e.getMessage());
        }
    }

    private void sendRetakeRequested(Long assessmentAttemptId) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE,
                    RabbitMqConfig.ASSESSMENT_RETAKE_ROUTING_KEY,
                    new AssessmentRetakeRequestedMessage(assessmentAttemptId));
        } catch (Exception e) {
            log.warn("Could not publish assessment retake trigger for attempt {}: {}",
                    assessmentAttemptId, e.getMessage());
        }
    }
}
