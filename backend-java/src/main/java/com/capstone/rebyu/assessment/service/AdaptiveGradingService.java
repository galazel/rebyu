package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Marks, off the request thread, the answers an adaptive attempt was
 * submitted with still open: code (a test runner), diagrams (a structural
 * comparison), written answers (a model call). Each takes seconds; the
 * learner has their provisional result already and this fills it in.
 *
 * <p>One transaction per attempt, on a small pool. The graders themselves
 * run concurrently inside it exactly as they do at a synchronous submit
 * ({@link AssessmentAttemptService#prepareGradingBatch}). When every mark is
 * in, the totals are recomputed and everything that hangs off a final
 * score -- XP, achievements, the result row, the diagnostic gate, the BKT
 * evidence -- is run by the same {@code finalizeSubmission} the synchronous
 * path uses. The learner is told through the bell.
 *
 * <p>A crash mid-way leaves {@code grading_pending} set; the sweep picks
 * such attempts up again a minute later, so no paper stays provisional
 * because a server restarted.
 */
@Slf4j
@Service
public class AdaptiveGradingService {

    private final AssessmentAttemptService attempts;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final QuestionRepository questionRepository;
    private final LearnerRepository learnerRepository;
    private final NotificationService notifications;
    private final TransactionTemplate transactionTemplate;
    private final ThreadPoolTaskExecutor executor;
    private final Set<Long> inFlight = ConcurrentHashMap.newKeySet();

    public AdaptiveGradingService(
            AssessmentAttemptService attempts,
            AssessmentAttemptRepository attemptRepository,
            AssessmentAttemptQuestionRepository attemptQuestionRepository,
            AssessmentAttemptAnswerRepository attemptAnswerRepository,
            QuestionRepository questionRepository,
            LearnerRepository learnerRepository,
            NotificationService notifications,
            PlatformTransactionManager transactionManager) {
        this.attempts = attempts;
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.questionRepository = questionRepository;
        this.learnerRepository = learnerRepository;
        this.notifications = notifications;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(64);
        pool.setThreadNamePrefix("adaptive-grading-");
        pool.setWaitForTasksToCompleteOnShutdown(true);
        pool.initialize();
        this.executor = pool;
    }

    /** Queues the attempt's open answers for marking. Safe to call more than once. */
    public void gradeInBackground(Long attemptId) {
        if (attemptId == null || !inFlight.add(attemptId)) {
            return;
        }
        try {
            executor.execute(() -> {
                try {
                    grade(attemptId);
                } catch (Exception e) {
                    log.error("Background marking of attempt {} failed; the sweep will retry: {}", attemptId, e.getMessage(), e);
                } finally {
                    inFlight.remove(attemptId);
                }
            });
        } catch (RuntimeException rejected) {
            inFlight.remove(attemptId);
            log.warn("Background marking of attempt {} could not be queued; the sweep will retry", attemptId);
        }
    }

    /** Anything left provisional for over a minute is picked up again. */
    @Scheduled(fixedDelayString = "${adaptive.grading-sweep-ms:120000}", initialDelayString = "60000")
    public void sweep() {
        List<AssessmentAttempt> stale = attemptRepository.findByStatusAndGradingPendingTrueAndSubmittedAtBefore(
                AssessmentAttempt.Status.SUBMITTED, LocalDateTime.now().minusMinutes(1));
        for (AssessmentAttempt attempt : stale) {
            gradeInBackground(attempt.getAssessmentAttemptId());
        }
    }

    private void grade(Long attemptId) {
        Outcome outcome = transactionTemplate.execute(status -> gradeInTransaction(attemptId));
        if (outcome != null && outcome.finished()) {
            tellLearner(outcome);
        }
    }

    private record Outcome(boolean finished, Long learnerId, String title, BigDecimal percentage,
                           Boolean passed, Long attemptId) {
    }

    private Outcome gradeInTransaction(Long attemptId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId).orElse(null);
        if (attempt == null || !attempt.isGradingPending()
                || attempt.getStatus() != AssessmentAttempt.Status.SUBMITTED) {
            return null;
        }
        List<AssessmentAttemptQuestion> questions = attemptQuestionRepository
                .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(attemptId);
        Map<Long, AssessmentAttemptAnswer> answersByQuestion = new HashMap<>();
        for (AssessmentAttemptAnswer answer : attemptAnswerRepository.findByAttempt_AssessmentAttemptId(attemptId)) {
            answersByQuestion.put(answer.getAttemptQuestion().getAttemptQuestionId(), answer);
        }
        Map<Long, AssessmentAttemptAnswer> open = answersByQuestion.entrySet().stream()
                .filter(e -> e.getValue().isPendingManualEvaluation())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        if (!open.isEmpty()) {
            Map<Long, Question> sources = questionRepository.findForAttemptByIdIn(questions.stream()
                            .filter(q -> open.containsKey(q.getAttemptQuestionId()))
                            .map(AssessmentAttemptQuestion::getSourceQuestionId)
                            .filter(Objects::nonNull).distinct().toList())
                    .stream().collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));
            Map<Long, List<Question>> subs = sources.isEmpty() ? Map.of()
                    : questionRepository.findSubQuestionsByParentIdIn(sources.keySet()).stream()
                            .collect(Collectors.groupingBy(s -> s.getParentQuestion().getQuestionId(),
                                    LinkedHashMap::new, Collectors.toList()));
            GradingBatch batch = attempts.prepareGradingBatch(questions, open, sources, subs);
            for (AssessmentAttemptQuestion question : questions) {
                AssessmentAttemptAnswer answer = open.get(question.getAttemptQuestionId());
                if (answer == null) continue;
                BigDecimal points = question.getPoints() == null ? BigDecimal.ONE : question.getPoints();
                attempts.scoreAnswer(question, answer, points, batch, sources, subs);
                attemptAnswerRepository.save(answer);
            }
        }

        attempts.applyTotals(attempt, questions, answersByQuestion);
        attempt.setGradingPending(false);
        attemptRepository.save(attempt);
        attempts.finalizeSubmission(attempt, questions, answersByQuestion);
        log.info("Attempt {} fully marked in the background: {}% ({} item(s) were open)",
                attemptId, attempt.getPercentage(), open.size());
        return new Outcome(true, attempt.getLearnerId(), attempt.getExam().getTitle(),
                attempt.getPercentage(), attempt.getPassed(), attemptId);
    }

    private void tellLearner(Outcome outcome) {
        try {
            transactionTemplate.executeWithoutResult(status -> learnerRepository.findById(outcome.learnerId())
                    .map(Learner::getUser)
                    .ifPresent(user -> notifications.notify(user,
                            "Your " + outcome.title() + " is fully marked",
                            "Final score " + (outcome.percentage() == null ? "" : outcome.percentage().stripTrailingZeros().toPlainString() + "%")
                                    + (Boolean.TRUE.equals(outcome.passed()) ? " — passed." : " — not passed this time."),
                            "/learner/results/" + outcome.attemptId())));
        } catch (Exception e) {
            log.warn("Could not notify learner {} about attempt {}: {}", outcome.learnerId(), outcome.attemptId(), e.getMessage());
        }
    }
}
