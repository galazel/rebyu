package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.aigateway.client.AiServiceException;
import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto.SubQuestionGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto.SubAnswerGradeDto;
import com.capstone.rebyu.aigateway.service.AiAnswerGradingService;
import com.capstone.rebyu.assessment.dto.attempt.DiagramAttemptDtos.*;
import com.capstone.rebyu.assessment.dto.attempt.ChoiceCheckDtos.*;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.*;
import com.capstone.rebyu.assessment.dto.attempt.ProgrammingAttemptDtos.*;
import com.capstone.rebyu.assessment.entity.*;
import com.capstone.rebyu.assessment.repository.*;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.service.BktOutboxService;
import com.capstone.rebyu.gamification.RewardAmounts;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.gamification.service.StreakService;
import com.capstone.rebyu.progress.service.AchievementAwardService;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.common.PhaseTimer;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto;
import com.capstone.rebyu.execution.dto.CodeExecutionRequestDto.TestCaseInputDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto.TestCaseResultDto;
import com.capstone.rebyu.execution.service.CodeExecutionService;
import com.capstone.rebyu.diagram.dto.DiagramGradingRequestDto;
import com.capstone.rebyu.challenge.entity.ChallengeArenaConfig;
import com.capstone.rebyu.challenge.repository.ChallengeArenaConfigRepository;
import com.capstone.rebyu.challenge.entity.WorldCupMatch;
import com.capstone.rebyu.challenge.repository.WorldCupMatchRepository;
import com.capstone.rebyu.challenge.service.ArenaScoring;
import com.capstone.rebyu.challenge.service.ChallengeArenaService;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import com.capstone.rebyu.diagram.service.DiagramGradingService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentAttemptService {

    private static final Duration SUBMIT_GRACE = Duration.ofSeconds(30);
    private static final BigDecimal PROFICIENT_RATING = new BigDecimal("50");
    private static final String TYPE_DIAGNOSTIC = "DIAGNOSTIC";
    private static final String TYPE_QUIZ = "QUIZ";
    private static final String TYPE_MOCK = "MOCK_EXAM";
    private static final String TYPE_CHALLENGE = "CHALLENGE";
    private static final Set<String> RETAKE_GATED_TYPES = Set.of("QUIZ", "LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM");
    private static final Set<String> CAPPED_ARENAS = Set.of("codestrike", "blueprint");

    private final ExamRepository examRepository;
    private final ChallengeArenaConfigRepository arenaConfigRepository;
    private final BktProperties bktProperties;
    private final ExamQuestionRepository examQuestionRepository;
    private final QuestionRepository questionRepository;
    private final TextQuestionConfigRepository textQuestionConfigRepository;
    private final ProgrammingQuestionConfigRepository programmingQuestionConfigRepository;
    private final DiagramQuestionConfigRepository diagramQuestionConfigRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final LearnerCertificationRepository learnerCertificationRepository;
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;
    private final ExamResultRepository examResultRepository;
    private final AssessmentAttemptExecutionRepository executionRepository;
    private final QuestionRubricCriterionRepository rubricCriterionRepository;
    private final LessonRepository lessonRepository;
    private final LearnerEntitlementService learnerEntitlementService;
    private final BktOutboxService bktOutboxService;
    private final ObjectMapper objectMapper;
    private final AiAnswerGradingService aiAnswerGradingService;
    private final CodeExecutionService codeExecutionService;
    private final DiagramGradingService diagramGradingService;
    private final AttemptGradingBatchService gradingBatchService;
    private final org.springframework.beans.factory.ObjectProvider<AdaptiveAttemptService> adaptiveAttemptService;
    private final org.springframework.beans.factory.ObjectProvider<AdaptiveGradingService> adaptiveGradingService;
    private final com.capstone.rebyu.adaptive.service.AdaptivePolicy adaptivePolicy;
    private final com.capstone.rebyu.enrollment.service.CertificationAwardService certificationAwardService;
    private final AssessmentEventProducer assessmentEventProducer;
    private final RewardService rewardService;
    private final StreakService streakService;
    private final AchievementAwardService achievementAwardService;
    private final WorldCupMatchRepository worldCupMatchRepository;

    private static int assessmentAttemptedXp()    { return RewardAmounts.getAssessmentAttemptedXp(); }
    private static int assessmentPassedTopupXp()  { return RewardAmounts.getAssessmentPassedTopupXp(); }
    private static int assessmentPerfectTopupXp() { return RewardAmounts.getAssessmentPerfectTopupXp(); }

    private static int checkAttemptedXp()    { return RewardAmounts.getCheckAttemptedXp(); }
    private static int checkPassedTopupXp()  { return RewardAmounts.getCheckPassedTopupXp(); }
    private static int checkPerfectTopupXp() { return RewardAmounts.getCheckPerfectTopupXp(); }

    private static final String KNOWLEDGE_CHECK_EXAM_TYPE = "KNOWLEDGE_CHECK";

    private static final BigDecimal PERFECT_PERCENTAGE = new BigDecimal("100");

    private static final int MAX_EXECUTION_HISTORY = 20;

    @Value("${rebyu.assessment.mock-exam-requires-entitlement:false}")
    private boolean mockExamRequiresEntitlement;


    @Transactional(readOnly = true)
    public LearnerAssessmentDto getLearnerAssessment(Long examId, Long learnerId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + examId));
        if (exam.effectiveStatus() != Exam.Status.PUBLISHED) {
            throw new BusinessRuleException.AssessmentNotPublishedException();
        }
        String lockReason = resolveLockReason(exam, learnerId);
        String examType = exam.getExamType().getExamTypeText();
        long questionCount = adaptivePolicy.isAdaptive(exam)
                ? adaptivePolicy.targetCount(examType)
                : examQuestionRepository.countByExam_ExamId(examId);
        return new LearnerAssessmentDto(
                exam.getExamId(),
                exam.getTitle(),
                exam.getExamType().getExamTypeText(),
                exam.getDescription(),
                exam.getInstructions(),
                exam.getDurationMinutes(),
                (int) questionCount,
                exam.getPassingScore(),
                lockReason == null,
                lockReason
        );
    }


    @Transactional
    public AssessmentAttemptStartResponseDto startAttempt(
            Long examId, Long learnerId, String idempotencyKey, Integer questionIndex, Long matchId) {

        if (learnerId == null) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "A learner profile is required to start an assessment.");
        }

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<AssessmentAttempt> byKey = attemptRepository.findByIdempotencyKey(idempotencyKey);
            if (byKey.isPresent()
                    && byKey.get().getStatus() == AssessmentAttempt.Status.IN_PROGRESS) {
                return buildStartResponse(byKey.get(), true);
            }
            if (byKey.isPresent()) {
                idempotencyKey = null;
            }
        }

        PhaseTimer timer = PhaseTimer.start("startAttempt exam=" + examId, log);

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + examId));
        if (exam.effectiveStatus() != Exam.Status.PUBLISHED) {
            throw new BusinessRuleException.AssessmentNotPublishedException();
        }

        if (TYPE_MOCK.equals(exam.getExamType().getExamTypeText())
                && exam.getOwnerDepartment() == null) {
            learnerEntitlementService.requireLearnerEntitlement(
                    learnerId, Entitlements.MOCK_EXAM_ACCESS,
                    exam.getCertification().getCertificationId());
        }

        String lockReason = resolveLockReason(exam, learnerId);
        PhaseTimer.mark(timer, "access gate");
        if (lockReason != null) {
            throw new BusinessRuleException.AssessmentLockedException(lockReason);
        }

        Optional<AssessmentAttempt> inProgress = attemptRepository
                .findFirstByExam_ExamIdAndLearnerIdAndStatus(
                        examId, learnerId, AssessmentAttempt.Status.IN_PROGRESS);
        if (inProgress.isPresent()) {
            AssessmentAttempt attempt = inProgress.get();
            if (attempt.getExpiresAt() == null
                    || LocalDateTime.now().isBefore(attempt.getExpiresAt())) {
                return buildStartResponse(attempt, true);
            }
            attempt.setStatus(AssessmentAttempt.Status.EXPIRED);
            attemptRepository.save(attempt);
        }

        int nextAttemptNumber = attemptRepository
                .findTopByExam_ExamIdAndLearnerIdOrderByAttemptNumberDesc(examId, learnerId)
                .map(previous -> previous.getAttemptNumber() + 1)
                .orElse(1);

        if (adaptivePolicy.isAssembledPaper(exam)) {
            AssessmentAttempt attempt = adaptiveAttemptService.getObject()
                    .startAssembledPaper(exam, learnerId, nextAttemptNumber, idempotencyKey);
            PhaseTimer.mark(timer, "assembled start");
            if (nextAttemptNumber > 1) {
                assessmentEventProducer.publishAssessmentRetakeRequested(attempt.getAssessmentAttemptId());
            }
            log.info("Started assembled attempt {} (#{}) of exam {} for learner {}",
                    attempt.getAssessmentAttemptId(), nextAttemptNumber, examId, learnerId);
            AssessmentAttemptStartResponseDto response = buildStartResponse(attempt, false);
            PhaseTimer.finish(timer);
            return response;
        }

        if (adaptivePolicy.isLiveAdaptive(exam)) {
            AssessmentAttempt attempt = adaptiveAttemptService.getObject()
                    .start(exam, learnerId, nextAttemptNumber, idempotencyKey);
            PhaseTimer.mark(timer, "adaptive start");
            if (nextAttemptNumber > 1) {
                assessmentEventProducer.publishAssessmentRetakeRequested(attempt.getAssessmentAttemptId());
            }
            log.info("Started adaptive attempt {} (#{}) of exam {} for learner {}",
                    attempt.getAssessmentAttemptId(), nextAttemptNumber, examId, learnerId);
            AssessmentAttemptStartResponseDto response = buildStartResponse(attempt, false);
            PhaseTimer.finish(timer);
            return response;
        }

        List<ExamQuestion> examQuestions =
                examQuestionRepository.findByExam_ExamIdOrderByDisplayOrderAsc(examId);
        if (examQuestions.isEmpty()) {
            throw new BusinessRuleException.AssessmentNotPublishedException();
        }

        Map<Long, BigDecimal> pointOverrideByQuestionId = new HashMap<>();
        for (ExamQuestion examQuestion : examQuestions) {
            if (examQuestion.getPoints() != null) {
                pointOverrideByQuestionId.put(examQuestion.getQuestion().getQuestionId(), examQuestion.getPoints());
            }
        }
        List<Long> baselineIds = examQuestions.stream()
                .map(examQuestion -> examQuestion.getQuestion().getQuestionId())
                .toList();
        Map<Long, Question> baselineById = questionRepository.findForAttemptByIdIn(baselineIds).stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (x, y) -> x));
        List<Question> questionsToUse = baselineIds.stream()
                .map(baselineById::get)
                .filter(Objects::nonNull)
                .toList();
        PhaseTimer.mark(timer, "load questions");

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                && exam.getTargetScope() != null
                && arenaConfigRepository.findById(exam.getTargetScope())
                        .map(ChallengeArenaConfig::getLive)
                        .orElse(null) == Boolean.FALSE) {
            throw new IllegalArgumentException("This arena is closed for now. Check back later.");
        }

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                && exam.getTargetScope() != null) {
            int required = ChallengeArenaService
                    .settingsOf(exam.getTargetScope(), arenaConfigRepository.findById(exam.getTargetScope()))
                    .getOrDefault(ChallengeArenaService.ENTRY_XP, 0);
            if (required > 0) {
                long held = rewardService.balance(learnerId).xp();
                if (held < required) {
                    throw new IllegalArgumentException(
                            "This arena needs " + required + " XP to enter. You have "
                                    + held + " — earn " + (required - held) + " more and come back.");
                }
            }
        }

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                && CAPPED_ARENAS.contains(exam.getTargetScope())
                && questionsToUse.size() > Entitlements.FREE_ARENA_PROBLEM_LIMIT
                && !learnerEntitlementService.hasLearnerEntitlement(
                        learnerId, Entitlements.CHALLENGES_ACCESS, null)) {
            questionsToUse = questionsToUse.subList(0, Entitlements.FREE_ARENA_PROBLEM_LIMIT);
        }

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                && questionIndex != null
                && questionIndex >= 0 && questionIndex < questionsToUse.size()) {
            questionsToUse = List.of(questionsToUse.get(questionIndex));
        }

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                && "worldcup".equals(exam.getTargetScope())
                && matchId != null) {
            WorldCupMatch match = worldCupMatchRepository.findById(matchId).orElse(null);
            if (match != null) {
                int limit = switch (match.getRound()) {
                    case "QUARTERFINAL" -> 10;
                    case "SEMIFINAL"    -> 15;
                    default             -> questionsToUse.size();
                };
                if (limit < questionsToUse.size()) {
                    List<Question> shuffled = new ArrayList<>(questionsToUse);
                    java.util.Collections.shuffle(shuffled);
                    questionsToUse = shuffled.subList(0, limit);
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .exam(exam)
                .learnerId(learnerId)
                .enrollmentId(findEnrollmentId(exam, learnerId))
                .attemptNumber(nextAttemptNumber)
                .status(AssessmentAttempt.Status.IN_PROGRESS)
                .startedAt(now)
                .expiresAt(exam.getDurationMinutes() != null
                        ? now.plusMinutes(exam.getDurationMinutes())
                        : null)
                .idempotencyKey(idempotencyKey != null && !idempotencyKey.isBlank()
                        ? idempotencyKey
                        : UUID.randomUUID().toString())
                .build();
        attempt = attemptRepository.save(attempt);
        PhaseTimer.mark(timer, "create attempt");


        SnapshotContext snapshotContext = buildSnapshotContext(questionsToUse);

        int order = 1;
        for (Question question : questionsToUse) {
            attemptQuestionRepository.save(AssessmentAttemptQuestion.builder()
                    .attempt(attempt)
                    .sourceQuestionId(question.getQuestionId())
                    .questionType(normalizeQuestionType(question.getQuestionType()))
                    .questionTextSnapshot(question.getQuestionText())
                    .questionDataSnapshot(buildLearnerSafeSnapshot(question, snapshotContext))
                    .displayOrder(order++)
                    .points(pointOverrideByQuestionId.get(question.getQuestionId()))
                    .lessonId(question.getLesson().getLessonId())
                    .build());
        }

        PhaseTimer.mark(timer, "snapshot questions");

        if (nextAttemptNumber > 1) {
            assessmentEventProducer.publishAssessmentRetakeRequested(attempt.getAssessmentAttemptId());
        }

        log.info("Started attempt {} (#{}) of exam {} for learner {}",
                attempt.getAssessmentAttemptId(), nextAttemptNumber, examId, learnerId);
        AssessmentAttemptStartResponseDto response = buildStartResponse(attempt, false);
        PhaseTimer.mark(timer, "build response");
        PhaseTimer.finish(timer);
        return response;
    }


    @Transactional
    public void autosaveAnswers(Long attemptId, AutosaveAnswersRequestDto request) {
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, request.learnerId());
        requireEditable(attempt);
        upsertAnswers(attempt, request.answers());
    }


    @Transactional
    public void setFlag(Long attemptId, Long attemptQuestionId, Long learnerId, boolean flagged) {
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, learnerId);
        requireEditable(attempt);
        AssessmentAttemptQuestion question = requireAttemptQuestion(attempt, attemptQuestionId);
        question.setFlagged(flagged);
        attemptQuestionRepository.save(question);
    }

    @Transactional
    public void setSkip(Long attemptId, Long attemptQuestionId, Long learnerId, boolean skipped) {
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, learnerId);
        requireEditable(attempt);
        AssessmentAttemptQuestion question = requireAttemptQuestion(attempt, attemptQuestionId);
        question.setSkipped(skipped);
        attemptQuestionRepository.save(question);
    }

    @Transactional
    public void setCurrentItem(Long attemptId, Long attemptQuestionId, Long learnerId) {
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, learnerId);
        requireEditable(attempt);
        requireAttemptQuestion(attempt, attemptQuestionId);
        attempt.setCurrentQuestionId(attemptQuestionId);
        attemptRepository.save(attempt);
    }

    AssessmentAttemptQuestion requireAttemptQuestion(AssessmentAttempt attempt, Long attemptQuestionId) {
        AssessmentAttemptQuestion question = attemptQuestionRepository.findById(attemptQuestionId)
                .orElseThrow(() -> new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "That item does not belong to this attempt."));
        if (!question.getAttempt().getAssessmentAttemptId().equals(attempt.getAssessmentAttemptId())) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "That item does not belong to this attempt.");
        }
        return question;
    }

    void requireEditable(AssessmentAttempt attempt) {
        if (attempt.getStatus() != AssessmentAttempt.Status.IN_PROGRESS) {
            throw new BusinessRuleException.AssessmentAttemptAlreadySubmittedException();
        }
        if (attempt.getExpiresAt() != null
                && LocalDateTime.now().isAfter(attempt.getExpiresAt().plus(SUBMIT_GRACE))) {
            throw new BusinessRuleException.AssessmentLockedException(
                    "The time limit for this assessment has passed.");
        }
    }


    @Transactional
    public AssessmentAttemptResultDto submitAttempt(
            Long attemptId, SubmitAssessmentAttemptRequestDto request) {

        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, request.learnerId());

        if (attempt.getStatus() == AssessmentAttempt.Status.SUBMITTED) {
            return getResult(attemptId, request.learnerId());
        }
        if (attempt.getStatus() != AssessmentAttempt.Status.IN_PROGRESS) {
            throw new BusinessRuleException.AssessmentAttemptAlreadySubmittedException();
        }
        if (attempt.getExpiresAt() != null
                && LocalDateTime.now().isAfter(attempt.getExpiresAt().plus(SUBMIT_GRACE))) {
            attempt.setStatus(AssessmentAttempt.Status.EXPIRED);
        }

        boolean timedOutNow = attempt.getStatus() == AssessmentAttempt.Status.EXPIRED
                || (attempt.getExpiresAt() != null && !LocalDateTime.now().isBefore(attempt.getExpiresAt()));
        if (attempt.isAdaptive() && !timedOutNow
                && !com.capstone.rebyu.adaptive.engine.AdaptiveSessionState.STAGE_DONE.equals(attempt.getPhase())) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "Answer the remaining questions before finishing this assessment.");
        }

        if (request.answers() != null && !request.answers().isEmpty()) {
            upsertAnswers(attempt, request.answers());
        }

        PhaseTimer timer = PhaseTimer.start("submitAttempt attempt=" + attemptId, log);

        List<AssessmentAttemptQuestion> questions = attemptQuestionRepository
                .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(attemptId);
        Map<Long, AssessmentAttemptAnswer> answersByQuestion = new HashMap<>();
        for (AssessmentAttemptAnswer answer :
                attemptAnswerRepository.findByAttempt_AssessmentAttemptId(attemptId)) {
            answersByQuestion.put(answer.getAttemptQuestion().getAttemptQuestionId(), answer);
        }

        boolean timedOut = attempt.getStatus() == AssessmentAttempt.Status.EXPIRED
                || (attempt.getExpiresAt() != null && !LocalDateTime.now().isBefore(attempt.getExpiresAt()));
        if (!timedOut && attempt.getExam() != null && attempt.getExam().getExamType() != null
                && TYPE_DIAGNOSTIC.equals(attempt.getExam().getExamType().getExamTypeText())) {
            long unanswered = questions.stream()
                    .filter(q -> !hasAnswerContent(answersByQuestion.get(q.getAttemptQuestionId())))
                    .count();
            if (unanswered > 0) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "Answer every question before submitting your diagnostic ("
                                + unanswered + " left). It decides where your study plan starts.");
            }
        }



        Map<Long, Question> sourceQuestions = questionRepository
                .findForAttemptByIdIn(questions.stream()
                        .map(AssessmentAttemptQuestion::getSourceQuestionId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));

        Map<Long, List<Question>> subQuestionsByParentId = sourceQuestions.isEmpty()
                ? Map.of()
                : questionRepository.findSubQuestionsByParentIdIn(sourceQuestions.keySet()).stream()
                        .collect(Collectors.groupingBy(
                                sub -> sub.getParentQuestion().getQuestionId(),
                                LinkedHashMap::new, Collectors.toList()));

        PhaseTimer.mark(timer, "load paper");

        boolean deferSlowGrading = attempt.isAdaptive();
        Map<Long, AssessmentAttemptAnswer> toGrade = attempt.isAdaptive()
                ? Map.of()
                : answersByQuestion;
        GradingBatch gradingBatch = prepareGradingBatch(
                questions, toGrade, sourceQuestions, subQuestionsByParentId);
        PhaseTimer.mark(timer, "graders (ai/code/diagram)");

        int leftPending = 0;
        for (AssessmentAttemptQuestion attemptQuestion : questions) {
            AssessmentAttemptAnswer answer = answersByQuestion.get(attemptQuestion.getAttemptQuestionId());
            if (answer == null) {
                continue;
            }
            if (attempt.isAdaptive() && hasDefinitiveVerdict(answer)) {
                continue;
            }
            if (deferSlowGrading && hasSubmittedContent(answer)) {
                answer.setPendingManualEvaluation(true);
                answer.setIsCorrect(null);
                answer.setCredit(null);
                attemptAnswerRepository.save(answer);
                leftPending++;
                continue;
            }
            scoreAnswer(attemptQuestion, answer, gradingBatch, sourceQuestions, subQuestionsByParentId);
            attemptAnswerRepository.save(answer);
        }

        LocalDateTime now = LocalDateTime.now();
        attempt.setStatus(AssessmentAttempt.Status.SUBMITTED);
        attempt.setSubmittedAt(now);
        attempt.setDurationSeconds((int) Duration.between(attempt.getStartedAt(), now).getSeconds());
        attempt.setGradingPending(leftPending > 0);
        applyTotals(attempt, questions, answersByQuestion);
        attemptRepository.save(attempt);
        PhaseTimer.mark(timer, "score + persist");

        if (attempt.isAdaptive()) {
            adaptiveAttemptService.getObject().onSubmitted(attempt);
            PhaseTimer.mark(timer, "adaptive close");
        } else if (attempt.getAdaptiveStateJson() != null) {
            adaptiveAttemptService.getObject().onAssembledPaperSubmitted(attempt, questions, answersByQuestion);
            PhaseTimer.mark(timer, "assembled close");
        }
        streakService.recordActivity(attempt.getLearnerId());
        PhaseTimer.mark(timer, "streak");

        if (leftPending > 0) {
            final Long id = attemptId;
            final int pending = leftPending;
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            adaptiveGradingService.getObject().gradeInBackground(id);
                        }
                    });
            log.info("Attempt {} submitted provisionally: {} item(s) marking in the background", id, pending);
        } else {
            finalizeSubmission(attempt, questions, answersByQuestion);
            PhaseTimer.mark(timer, "finalise (xp, achievements, result, bkt)");
        }

        assessmentEventProducer.publishAssessmentSubmitted(attemptId);
        PhaseTimer.mark(timer, "rabbit publish");

        log.info("Attempt {} submitted: {}% ({} of {} item(s) right)",
                attemptId, attempt.getPercentage(), attempt.getCorrectCount(), attempt.getItemCount());
        AssessmentAttemptResultDto result = getResult(attemptId, request.learnerId());
        PhaseTimer.mark(timer, "build result");
        PhaseTimer.finish(timer);
        return result;
    }

    void applyTotals(AssessmentAttempt attempt, List<AssessmentAttemptQuestion> questions,
                     Map<Long, AssessmentAttemptAnswer> answersByQuestion) {
        int items = questions.size();
        int answered = 0;
        int correct = 0;
        boolean weighted = questions.stream().anyMatch(q -> q.getPoints() != null);
        BigDecimal totalPoints = BigDecimal.ZERO;
        BigDecimal earnedPoints = BigDecimal.ZERO;
        double earnedShare = 0.0;
        for (AssessmentAttemptQuestion attemptQuestion : questions) {
            BigDecimal weight = attemptQuestion.getPoints() == null ? BigDecimal.ONE : attemptQuestion.getPoints();
            totalPoints = totalPoints.add(weight);
            AssessmentAttemptAnswer answer = answersByQuestion.get(attemptQuestion.getAttemptQuestionId());
            if (answer == null || !hasSubmittedContent(answer)) {
                continue;
            }
            answered++;
            if (countsAsCorrect(answer)) {
                correct++;
            }
            earnedShare += scoreOf(attemptQuestion, answer);
            if (answer.getCredit() != null) {
                earnedPoints = earnedPoints.add(weight.multiply(answer.getCredit()));
            }
        }
        BigDecimal percentage;
        if (weighted && totalPoints.signum() > 0) {
            percentage = earnedPoints.multiply(BigDecimal.valueOf(100)).divide(totalPoints, 2, RoundingMode.HALF_UP);
        } else if (items > 0) {
            percentage = BigDecimal.valueOf(earnedShare * 100.0 / items).setScale(2, RoundingMode.HALF_UP);
        } else {
            percentage = BigDecimal.ZERO;
        }
        BigDecimal passingScore = attempt.getExam().getPassingScore() == null
                ? BigDecimal.ZERO : attempt.getExam().getPassingScore();
        attempt.setItemCount(items);
        attempt.setAnsweredCount(answered);
        attempt.setCorrectCount(correct);
        attempt.setTotalPoints(weighted ? totalPoints.setScale(2, RoundingMode.HALF_UP) : null);
        attempt.setEarnedPoints(weighted ? earnedPoints.setScale(2, RoundingMode.HALF_UP) : null);
        attempt.setPercentage(percentage);
        attempt.setPassed(percentage.compareTo(passingScore) >= 0);
    }

    double scoreOf(AssessmentAttemptQuestion question, AssessmentAttemptAnswer answer) {
        if (answer == null || answer.isPendingManualEvaluation()) {
            return 0.0;
        }
        if (AdaptivePolicy.usesPartialCredit(question.getQuestionType())) {
            BigDecimal credit = answer.getCredit();
            if (credit != null) {
                return Math.min(1.0, Math.max(0.0, credit.doubleValue()));
            }
        }
        return countsAsCorrect(answer) ? 1.0 : 0.0;
    }

    boolean countsAsCorrect(AssessmentAttemptAnswer answer) {
        if (answer == null || answer.isPendingManualEvaluation()) {
            return false;
        }
        if (Boolean.TRUE.equals(answer.getIsCorrect())) {
            return true;
        }
        BigDecimal credit = answer.getCredit();
        return credit != null && credit.doubleValue() >= bktProperties.getPartialCreditCorrectThreshold();
    }

    void finalizeSubmission(AssessmentAttempt attempt, List<AssessmentAttemptQuestion> questions,
                            Map<Long, AssessmentAttemptAnswer> answersByQuestion) {
        awardAssessmentXp(attempt);
        achievementAwardService.evaluate(attempt.getLearnerId());
        recordLegacyExamResult(attempt);
        completeDiagnosticGateIfApplicable(attempt);
        certificationAwardService.awardForAttempt(attempt);
        bktOutboxService.enqueueForAttempt(attempt, questions, answersByQuestion);
    }

    private void awardAssessmentXp(AssessmentAttempt attempt) {
        Long learnerId = attempt.getLearnerId();
        Long examId = attempt.getExam().getExamId();

        boolean isCheck = KNOWLEDGE_CHECK_EXAM_TYPE.equals(
                attempt.getExam().getExamType().getExamTypeText());

        int attemptedXp = isCheck ? checkAttemptedXp() : assessmentAttemptedXp();
        int passedXp = isCheck ? checkPassedTopupXp() : assessmentPassedTopupXp();
        int perfectXp = isCheck ? checkPerfectTopupXp() : assessmentPerfectTopupXp();

        rewardService.awardXp(learnerId, attemptedXp, "ASSESSMENT_COMPLETED",
                "assessment-completed:" + examId);

        if (!Boolean.TRUE.equals(attempt.getPassed())) {
            return;
        }
        rewardService.awardXp(learnerId, passedXp, "ASSESSMENT_PASSED",
                "assessment-passed:" + examId);

        if (attempt.getPercentage() != null
                && attempt.getPercentage().compareTo(PERFECT_PERCENTAGE) >= 0) {
            rewardService.awardXp(learnerId, perfectXp, "ASSESSMENT_PERFECT",
                    "assessment-perfect:" + examId);
        }
    }


    @Transactional(readOnly = true)
    public AssessmentAttemptResultDto getResult(Long attemptId, Long learnerId) {
        PhaseTimer timer = PhaseTimer.start("getResult attempt=" + attemptId, log);
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, learnerId);
        if (attempt.getStatus() == AssessmentAttempt.Status.IN_PROGRESS) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This attempt has not been submitted yet.");
        }
        boolean releaseAnswers = attempt.getExam().effectiveReleaseAnswers();

        List<AssessmentAttemptQuestion> questions = attemptQuestionRepository
                .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(attemptId);
        Map<Long, AssessmentAttemptAnswer> answersByQuestion = new HashMap<>();
        for (AssessmentAttemptAnswer answer :
                attemptAnswerRepository.findByAttempt_AssessmentAttemptId(attemptId)) {
            answersByQuestion.put(answer.getAttemptQuestion().getAttemptQuestionId(), answer);
        }



        List<Long> sourceQuestionIds = questions.stream()
                .map(AssessmentAttemptQuestion::getSourceQuestionId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Question> sourceQuestions = sourceQuestionIds.isEmpty()
                ? Map.of()
                : questionRepository.findForAttemptByIdIn(sourceQuestionIds).stream()
                        .collect(Collectors.toMap(Question::getQuestionId, q -> q, (a, b) -> a));
        Map<Long, List<Question>> subQuestionsByParentId = sourceQuestionIds.isEmpty()
                ? Map.of()
                : questionRepository.findSubQuestionsByParentIdIn(sourceQuestionIds).stream()
                        .collect(Collectors.groupingBy(
                                sub -> sub.getParentQuestion().getQuestionId(),
                                LinkedHashMap::new, Collectors.toList()));

        PhaseTimer.mark(timer, "load questions + answers");

        List<AttemptAnswerReviewDto> reviews = new ArrayList<>();
        int correct = 0;
        int incorrect = 0;
        int pending = 0;
        int unanswered = 0;

        Map<Long, Integer> lessonItems = new LinkedHashMap<>();
        Map<Long, Integer> lessonCorrect = new LinkedHashMap<>();
        Map<Long, Integer> lessonPending = new LinkedHashMap<>();

        for (AssessmentAttemptQuestion attemptQuestion : questions) {
            AssessmentAttemptAnswer answer =
                    answersByQuestion.get(attemptQuestion.getAttemptQuestionId());
            Question source = sourceQuestions.get(attemptQuestion.getSourceQuestionId());

            Long lessonId = attemptQuestion.getLessonId();
            if (lessonId != null) {
                lessonItems.merge(lessonId, 1, Integer::sum);
                if (countsAsCorrect(answer)) {
                    lessonCorrect.merge(lessonId, 1, Integer::sum);
                }
                if (answer != null && answer.isPendingManualEvaluation()) {
                    lessonPending.merge(lessonId, 1, Integer::sum);
                }
            }

            String selectedChoiceText = null;
            String correctChoiceText = null;
            String explanation = null;
            if (source != null && isMultipleChoice(source.getQuestionType())) {
                Choice correctChoice = source.getChoices().stream()
                        .filter(Choice::isCorrect).findFirst().orElse(null);
                if (releaseAnswers && correctChoice != null) {
                    correctChoiceText = correctChoice.getChoiceText();
                    explanation = correctChoice.getExplanation();
                }
                if (answer != null && answer.getSelectedChoiceId() != null) {
                    selectedChoiceText = source.getChoices().stream()
                            .filter(c -> c.getChoiceId().equals(answer.getSelectedChoiceId()))
                            .map(Choice::getChoiceText).findFirst().orElse(null);
                }
            } else if (source != null && "SHORT_ANSWER".equals(source.getQuestionType()) && releaseAnswers) {
                correctChoiceText = Optional.ofNullable(source.getTextQuestionConfig())
                        .map(TextQuestionConfig::getCorrectAnswer)
                        .filter(text -> text != null && !text.isBlank())
                        .orElse(null);
            }

            if (answer == null || !hasSubmittedContent(answer)) {
                unanswered++;
            } else if (answer.isPendingManualEvaluation()) {
                pending++;
            } else if (countsAsCorrect(answer)) {
                correct++;
            } else {
                incorrect++;
            }

            reviews.add(new AttemptAnswerReviewDto(
                    attemptQuestion.getAttemptQuestionId(),
                    attemptQuestion.getDisplayOrder(),
                    attemptQuestion.getQuestionType(),
                    attemptQuestion.getQuestionTextSnapshot(),
                    answer == null ? null : answer.getIsCorrect(),
                    answer != null && answer.isPendingManualEvaluation(),
                    answer == null ? null : answer.getCredit(),
                    attemptQuestion.getPoints(),
                    answer == null ? null : answer.getLearnerAnswer(),
                    answer == null ? null : answer.getSelectedChoiceId(),
                    selectedChoiceText,
                    correctChoiceText,
                    explanation,
                    answer == null ? null : answer.getSubmittedCode(),
                    answer == null ? null : answer.getProgrammingLanguage(),
                    answer != null && answer.getDiagramSubmissionData() != null,
                    answer == null ? null : answer.getFeedback(),
                    buildSubQuestionAnswerReviews(source, answer, subQuestionsByParentId),
                    buildDiagramElementReviews(answer, releaseAnswers),
                    buildProgrammingTestReviews(attemptQuestion, answer, source, releaseAnswers),
                    programOutputFor(answer),
                    programErrorFor(answer),
                    source == null ? null : source.getDifficultyLevel(),
                    source == null ? null : source.getImageKey(),
                    source == null || !isMultipleChoice(source.getQuestionType())
                            ? List.of()
                            : source.getChoices().stream()
                                    .filter(c -> c.getImageKey() != null && !c.getImageKey().isBlank())
                                    .map(c -> new ReviewChoiceImageDto(c.getChoiceId(), c.getImageKey()))
                                    .toList()
            ));
        }

        Map<Long, String> lessonNames = lessonItems.isEmpty()
                ? Map.of()
                : lessonRepository.findAllById(lessonItems.keySet()).stream()
                        .collect(Collectors.toMap(Lesson::getLessonId, Lesson::getName, (a, b) -> a));

        List<LessonPerformanceDto> lessonBreakdown = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : lessonItems.entrySet()) {
            Long lessonId = entry.getKey();
            int items = entry.getValue();
            int right = lessonCorrect.getOrDefault(lessonId, 0);
            BigDecimal lessonPercentage = items > 0
                    ? BigDecimal.valueOf(right).multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(items), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            String title = lessonNames.getOrDefault(lessonId, "Lesson " + lessonId);
            lessonBreakdown.add(new LessonPerformanceDto(
                    lessonId, title, items, right, lessonPercentage,
                    lessonPending.getOrDefault(lessonId, 0)));
        }

        PhaseTimer.mark(timer, "build review");
        PhaseTimer.finish(timer);

        Exam exam = attempt.getExam();
        return new AssessmentAttemptResultDto(
                attempt.getAssessmentAttemptId(),
                exam.getExamId(),
                exam.getTitle(),
                exam.getExamType().getExamTypeText(),
                attempt.getAttemptNumber(),
                attempt.getSubmittedAt(),
                attempt.getDurationSeconds(),
                attempt.getPercentage(),
                attempt.getPassed(),
                exam.getPassingScore(),
                correct, incorrect, pending, unanswered,
                proficiencyOf(attempt),
                attempt.getTotalPoints(),
                attempt.getEarnedPoints(),
                reviews,
                lessonBreakdown,
                exam.getCertification().getCertificationId(),
                attempt.isGradingPending()
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAttempts(Long learnerId) {
        List<Map<String, Object>> summaries = new ArrayList<>();
        for (AssessmentAttempt attempt :
                attemptRepository.findByLearnerIdOrderByStartedAtDesc(learnerId)) {
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("assessmentAttemptId", attempt.getAssessmentAttemptId());
            summary.put("assessmentId", attempt.getExam().getExamId());
            summary.put("assessmentTitle", attempt.getExam().getTitle());
            summary.put("attemptNumber", attempt.getAttemptNumber());
            summary.put("status", attempt.getStatus().name());
            summary.put("startedAt", attempt.getStartedAt());
            summary.put("submittedAt", attempt.getSubmittedAt());
            summary.put("percentage", attempt.getPercentage());
            summary.put("passed", attempt.getPassed());
            summary.put("correctCount", attempt.getCorrectCount());
            summary.put("answeredCount", attempt.getAnsweredCount());
            summary.put("itemCount", attempt.getItemCount());
            summary.put("proficiency", proficiencyOf(attempt));
            summary.put("totalPoints", attempt.getTotalPoints());
            summary.put("earnedPoints", attempt.getEarnedPoints());
            summaries.add(summary);
        }
        return summaries;
    }

    @Transactional(readOnly = true)
    public List<AttemptSummaryDto> listAttemptsForAssessment(Long examId, Long learnerId) {
        List<AttemptSummaryDto> summaries = new ArrayList<>();
        for (AssessmentAttempt attempt : attemptRepository
                .findByExam_ExamIdAndLearnerIdOrderByAttemptNumberDesc(examId, learnerId)) {
            summaries.add(new AttemptSummaryDto(
                    attempt.getAssessmentAttemptId(),
                    attempt.getExam().getExamId(),
                    attempt.getExam().getTitle(),
                    attempt.getAttemptNumber(),
                    attempt.getStatus().name(),
                    attempt.getStartedAt(),
                    attempt.getSubmittedAt(),
                    attempt.getDurationSeconds(),
                    attempt.getPercentage(),
                    attempt.getPassed(),
                    attempt.getCorrectCount(),
                    attempt.getAnsweredCount(),
                    attempt.getItemCount(),
                    proficiencyOf(attempt),
                    attempt.getTotalPoints(),
                    attempt.getEarnedPoints()));
        }
        return summaries;
    }


    static ProficiencyDto proficiencyOf(AssessmentAttempt attempt) {
        if (attempt == null || !attempt.isAdaptive() || attempt.getThetaCurrent() == null) {
            return null;
        }
        double theta = attempt.getThetaCurrent();
        double rating = Math.round(IrtModel.proficiencyRating(theta));
        return new ProficiencyDto(
                BigDecimal.valueOf(rating).setScale(0, RoundingMode.HALF_UP),
                IrtModel.proficiencyLabel(rating),
                BigDecimal.valueOf(theta).setScale(2, RoundingMode.HALF_UP),
                attempt.getThetaSe() == null ? null : BigDecimal.valueOf(attempt.getThetaSe()).setScale(2, RoundingMode.HALF_UP));
    }

    AssessmentAttempt requireOwnedAttempt(Long attemptId, Long learnerId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        if (learnerId == null || !attempt.getLearnerId().equals(learnerId)) {
            throw new EntityNotFoundException("Attempt not found: " + attemptId);
        }
        return attempt;
    }

    private String resolveLockReason(Exam exam, Long learnerId) {
        Long certificationId = exam.getCertification().getCertificationId();

        if (TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())) {
            if ("worldcup".equals(exam.getTargetScope())
                    && !learnerEntitlementService.hasLearnerEntitlement(
                            learnerId, Entitlements.WORLD_CUP_ACCESS, null)) {
                return "World Cup is part of REBYU Pro. Upgrade to enter the bracket.";
            }
            return null;
        }

        Optional<LearnerCertification> enrollment = learnerCertificationRepository
                .findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
                        learnerId, certificationId, LearnerCertification.Status.active);

        boolean institutionSponsored = institutionCertificationLearnerRepository
                .existsByLearner_LearnerIdAndInstitutionCert_Certification_CertificationIdAndStatus(
                        learnerId, certificationId, InstitutionCertificationLearner.Status.active);

        if (enrollment.isEmpty() && !institutionSponsored) {
            return "Enroll in this certification before taking its assessments.";
        }
        String type = exam.getExamType().getExamTypeText();
        if (TYPE_MOCK.equals(type)
                && exam.getOwnerDepartment() == null
                && !learnerEntitlementService.hasLearnerEntitlement(
                        learnerId, Entitlements.MOCK_EXAM_ACCESS, certificationId)) {
            return "Mock exams are part of REBYU Pro. Upgrade to take this mock exam.";
        }
        boolean diagnosticSat = diagnosticSat(enrollment.orElse(null), learnerId, certificationId);

        if (TYPE_DIAGNOSTIC.equals(type) && diagnosticSat) {
            return "You have already completed the diagnostic assessment for this certification.";
        }
        if (RETAKE_GATED_TYPES.contains(type)
                && exam.getOwnerDepartment() == null
                && attemptRepository.existsByExam_ExamIdAndLearnerIdAndStatus(
                        exam.getExamId(), learnerId, AssessmentAttempt.Status.SUBMITTED)
                && !learnerEntitlementService.hasLearnerEntitlement(
                        learnerId, Entitlements.QUIZ_RETAKES, certificationId)) {
            return "Retakes are part of REBYU Pro. Your first attempt is saved in your history.";
        }
        if (!TYPE_DIAGNOSTIC.equals(type)
                && !diagnosticSat
                && publishedDiagnosticExists(certificationId)) {
            return "Complete the diagnostic assessment before studying lessons.";
        }
        return progressionLockReason(exam, type, learnerId);
    }

    private String progressionLockReason(Exam exam, String type, Long learnerId) {
        if (exam.getOwnerDepartment() != null) {
            return null;
        }
        switch (type == null ? "" : type) {
            case "LESSON_QUIZ" -> {
                Lesson lesson = exam.getLesson();
                if (lesson == null || lesson.getMiddleCategory() == null) {
                    return null;
                }
                long blocking = examRepository.countUnpassedEarlierLessonQuizzes(
                        lesson.getMiddleCategory().getMiddleCategoryId(),
                        lesson.getLessonId(), learnerId, PROFICIENT_RATING);
                return blocking == 0 ? null
                        : "Clear the previous lesson's quiz before taking this one.";
            }
            case "MIDDLE_EXAM" -> {
                if (exam.getMiddleCategory() == null) {
                    return null;
                }
                long blocking = examRepository.countUnpassedLessonQuizzesInMiddle(
                        exam.getMiddleCategory().getMiddleCategoryId(), learnerId, PROFICIENT_RATING);
                return blocking == 0 ? null
                        : "Clear every lesson quiz in this topic before taking its exam.";
            }
            case "MAJOR_EXAM" -> {
                if (exam.getMajorCategory() == null) {
                    return null;
                }
                long blocking = examRepository.countUnpassedMiddleExamsInMajor(
                        exam.getMajorCategory().getMajorCategoryId(), learnerId, PROFICIENT_RATING);
                return blocking == 0 ? null
                        : "Clear every topic exam in this unit before taking the unit exam.";
            }
            default -> {
                return null;
            }
        }
    }

    private boolean diagnosticSat(LearnerCertification enrollment, Long learnerId, Long certificationId) {
        if (enrollment != null && enrollment.getDiagnosticCompletedAt() != null) {
            return true;
        }
        return examRepository.existsSubmittedAttemptOfOfficialType(
                learnerId, certificationId, TYPE_DIAGNOSTIC, AssessmentAttempt.Status.SUBMITTED);
    }

    private boolean publishedDiagnosticExists(Long certificationId) {
        return examRepository.existsOfficialPublishedByType(
                certificationId, TYPE_DIAGNOSTIC, Exam.Status.PUBLISHED);
    }

    Long findEnrollmentId(Exam exam, Long learnerId) {
        return learnerCertificationRepository
                .findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
                        learnerId,
                        exam.getCertification().getCertificationId(),
                        LearnerCertification.Status.active)
                .map(LearnerCertification::getLearnerCertificationId)
                .orElse(null);
    }

    private void completeDiagnosticGateIfApplicable(AssessmentAttempt attempt) {
        if (!TYPE_DIAGNOSTIC.equals(attempt.getExam().getExamType().getExamTypeText())) {
            return;
        }
        Optional<LearnerCertification> activeEnrollment = attempt.getEnrollmentId() != null
                ? learnerCertificationRepository.findById(attempt.getEnrollmentId())
                : learnerCertificationRepository
                        .findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
                                attempt.getLearnerId(),
                                attempt.getExam().getCertification().getCertificationId(),
                                LearnerCertification.Status.active);

        activeEnrollment
                .ifPresent(enrollment -> {
                    if (enrollment.getDiagnosticCompletedAt() == null) {
                        enrollment.setDiagnosticCompletedAt(LocalDateTime.now());
                        enrollment.setDiagnosticAttemptId(attempt.getAssessmentAttemptId());
                        learnerCertificationRepository.save(enrollment);
                    }
                });
    }

    private void recordLegacyExamResult(AssessmentAttempt attempt) {
        try {
            ExamResultId id = new ExamResultId();
            id.setLearnerId(attempt.getLearnerId());
            id.setExamId(attempt.getExam().getExamId());
            id.setAttemptNo(attempt.getAttemptNumber());
            if (examResultRepository.existsById(id)) {
                return;
            }
            com.capstone.rebyu.user.entity.Learner learnerRef =
                    new com.capstone.rebyu.user.entity.Learner();
            learnerRef.setLearnerId(attempt.getLearnerId());
            examResultRepository.save(ExamResult.builder()
                    .id(id)
                    .learner(learnerRef)
                    .exam(attempt.getExam())
                    .takenAt(attempt.getSubmittedAt())
                    .score(attempt.getPercentage())
                    .durationSeconds(attempt.getDurationSeconds() == null
                            ? 0 : attempt.getDurationSeconds())
                    .isPassed(Boolean.TRUE.equals(attempt.getPassed()))
                    .rating(attempt.getThetaCurrent() == null ? null
                            : java.math.BigDecimal.valueOf(
                                    com.capstone.rebyu.adaptive.engine.IrtModel.proficiencyRating(attempt.getThetaCurrent()))
                                    .setScale(2, java.math.RoundingMode.HALF_UP))
                    .build());
        } catch (Exception e) {
            log.warn("Could not record legacy exam result for attempt {}: {}",
                    attempt.getAssessmentAttemptId(), e.getMessage());
        }
    }

    void upsertAnswers(AssessmentAttempt attempt, List<AttemptAnswerDraftDto> drafts) {
        if (drafts == null) {
            return;
        }
        for (AttemptAnswerDraftDto draft : drafts) {
            if (draft == null || draft.attemptQuestionId() == null) {
                continue;
            }
            AssessmentAttemptQuestion attemptQuestion = attemptQuestionRepository
                    .findById(draft.attemptQuestionId())
                    .orElseThrow(() -> new BusinessRuleException.InvalidAssessmentSubmissionException(
                            "One of the answers does not belong to this attempt."));
            if (!attemptQuestion.getAttempt().getAssessmentAttemptId()
                    .equals(attempt.getAssessmentAttemptId())) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "One of the answers does not belong to this attempt.");
            }

            AssessmentAttemptAnswer answer = attemptAnswerRepository
                    .findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
                            attempt.getAssessmentAttemptId(), draft.attemptQuestionId())
                    .orElseGet(() -> AssessmentAttemptAnswer.builder()
                            .attempt(attempt)
                            .attemptQuestion(attemptQuestion)
                            .build());

            boolean unchanged =
                    equalsNullable(answer.getLearnerAnswer(), draft.learnerAnswer())
                            && equalsNullable(answer.getSelectedChoiceId(), draft.selectedChoiceId())
                            && equalsNullable(answer.getSubmittedCode(), draft.submittedCode())
                            && equalsNullable(answer.getProgrammingLanguage(), draft.programmingLanguage())
                            && equalsNullable(answer.getDiagramSubmissionData(), draft.diagramSubmissionData());
            if (unchanged && answer.getAttemptAnswerId() != null) {
                continue;
            }

            boolean codeChanged = !equalsNullable(answer.getSubmittedCode(), draft.submittedCode());

            answer.setLearnerAnswer(draft.learnerAnswer());
            answer.setSelectedChoiceId(draft.selectedChoiceId());
            answer.setSubmittedCode(draft.submittedCode());
            answer.setProgrammingLanguage(draft.programmingLanguage());
            answer.setDiagramSubmissionData(draft.diagramSubmissionData());

            if (codeChanged && answer.getExecutionResult() != null) {
                answer.setExecutionResult(null);
                answer.setCredit(null);
                answer.setIsCorrect(null);
                answer.setPendingManualEvaluation(true);
            }

            LocalDateTime now = LocalDateTime.now();
            answer.setAnsweredAt(now);
            answer.setLastSavedAt(now);
            attemptAnswerRepository.save(answer);

            if (attemptQuestion.isSkipped() && hasAnswerContent(draft)) {
                attemptQuestion.setSkipped(false);
                attemptQuestionRepository.save(attemptQuestion);
            }
        }
    }

    boolean hasAnswerContent(AttemptAnswerDraftDto draft) {
        return (draft.learnerAnswer() != null && !draft.learnerAnswer().isBlank())
                || draft.selectedChoiceId() != null
                || (draft.submittedCode() != null && !draft.submittedCode().isBlank())
                || (draft.diagramSubmissionData() != null && !draft.diagramSubmissionData().isBlank());
    }

    private static boolean hasAnswerContent(AssessmentAttemptAnswer answer) {
        return answer != null
                && ((answer.getLearnerAnswer() != null && !answer.getLearnerAnswer().isBlank())
                || answer.getSelectedChoiceId() != null
                || (answer.getSubmittedCode() != null && !answer.getSubmittedCode().isBlank())
                || (answer.getDiagramSubmissionData() != null && !answer.getDiagramSubmissionData().isBlank()));
    }

    private static boolean equalsNullable(Object a, Object b) {
        return a == null ? b == null : a.equals(b);
    }

    static boolean isMultipleChoice(String questionType) {
        return "MULTIPLE_CHOICE".equalsIgnoreCase(questionType)
                || "MCQ".equalsIgnoreCase(questionType);
    }

    static String normalizeQuestionType(String questionType) {
        return isMultipleChoice(questionType) ? "MULTIPLE_CHOICE" : questionType;
    }

    static final BigDecimal UNIT = BigDecimal.ONE;

    void scoreAnswer(
            AssessmentAttemptQuestion attemptQuestion,
            AssessmentAttemptAnswer answer,
            GradingBatch batch,
            Map<Long, Question> sourceQuestions,
            Map<Long, List<Question>> subQuestionsByParentId) {
        BigDecimal points = UNIT;

        String type = attemptQuestion.getQuestionType();
        Question source = sourceQuestions.get(attemptQuestion.getSourceQuestionId());

        if (isMultipleChoice(type) && source != null) {
            boolean correct = answer.getSelectedChoiceId() != null
                    && source.getChoices().stream()
                            .anyMatch(choice -> choice.getChoiceId()
                                    .equals(answer.getSelectedChoiceId())
                                    && choice.isCorrect());
            answer.setIsCorrect(correct);
            answer.setCredit(correct ? points : BigDecimal.ZERO);
            answer.setPendingManualEvaluation(false);
            return;
        }

        if ("SHORT_ANSWER".equals(type) && source != null
                && gradeFillInTheBlank(source, answer, points, subQuestionsByParentId)) {
            return;
        }

        if ("SHORT_ANSWER".equals(type) && source != null) {
            Optional<TextQuestionConfig> config =
                    Optional.ofNullable(source.getTextQuestionConfig());
            if (config.isPresent()
                    && "EXACT_MATCH".equalsIgnoreCase(config.get().getCheckingMethod())
                    && answer.getLearnerAnswer() != null) {
                boolean correct = matchesTextAnswer(answer.getLearnerAnswer(), config.get());
                answer.setIsCorrect(correct);
                answer.setCredit(correct ? points : BigDecimal.ZERO);
                answer.setPendingManualEvaluation(false);
                return;
            }

            if (config.isPresent()
                    && "AI_SEMANTIC".equalsIgnoreCase(config.get().getCheckingMethod())
                    && gradeDescriptiveAnswer(attemptQuestion, source, answer, points, batch)) {
                return;
            }
        }

        if ("DESCRIPTIVE".equals(type) && source != null
                && gradeDescriptiveAnswer(attemptQuestion, source, answer, points, batch)) {
            return;
        }

        if (isWorkspaceType(type) && source != null) {
            String criticalThinkingType = resolveCriticalThinkingType(type, source);

            if (criticalThinkingType == null
                    && gradeCriticalThinkingAnswer(
                            attemptQuestion, source, answer, points, batch, subQuestionsByParentId)) {
                return;
            }

            if ("PROGRAMMING".equals(criticalThinkingType)) {
                if (hasFreshVerdict(answer)) {
                    applyCodeStrikeWeightsFromStoredRun(attemptQuestion, answer, points);
                    return;
                }
                gradeProgrammingOnSubmit(attemptQuestion, source, answer, points, batch);
                if (hasDefinitiveVerdict(answer)) {
                    return;
                }
            }

            if ("DIAGRAM".equals(criticalThinkingType)
                    && gradeDiagramAnswer(attemptQuestion, source, answer, points, batch)) {
                return;
            }
        }

        if (!hasSubmittedContent(answer)) {
            answer.setIsCorrect(false);
            answer.setCredit(BigDecimal.ZERO);
            answer.setPendingManualEvaluation(false);
            return;
        }

        log.warn("No automatic grader produced a verdict for attemptQuestion {} (type {}); "
                        + "closing it out at zero",
                attemptQuestion.getAttemptQuestionId(), type);
        answer.setIsCorrect(false);
        answer.setCredit(BigDecimal.ZERO);
        answer.setPendingManualEvaluation(false);
        if (answer.getFeedback() == null || answer.getFeedback().isBlank()) {
            answer.setFeedback("This answer could not be marked automatically and was scored "
                    + "zero. If you believe it deserves credit, raise it with your instructor.");
        }
    }

    GradingBatch prepareGradingBatch(
            List<AssessmentAttemptQuestion> questions,
            Map<Long, AssessmentAttemptAnswer> answersByQuestion,
            Map<Long, Question> sourceQuestions,
            Map<Long, List<Question>> subQuestionsByParentId) {

        AttemptGradingBatchService.Workload workload = new AttemptGradingBatchService.Workload();

        for (AssessmentAttemptQuestion attemptQuestion : questions) {
            AssessmentAttemptAnswer answer =
                    answersByQuestion.get(attemptQuestion.getAttemptQuestionId());
            if (answer == null || !hasSubmittedContent(answer)) {
                continue;
            }

            Long key = attemptQuestion.getAttemptQuestionId();
            String type = attemptQuestion.getQuestionType();
            Question source = sourceQuestions.get(attemptQuestion.getSourceQuestionId());
            if (source == null) {
                continue;
            }
            BigDecimal points = UNIT;

            if ("DESCRIPTIVE".equals(type) || isAiSemanticShortAnswer(type, source)) {
                AnswerGradingRequestDto request = descriptiveGradingRequest(
                        attemptQuestion, source, answer, points);
                workload.ai(key, () -> gradeWithRetry(request));
                continue;
            }

            if (isWorkspaceType(type)) {
                String criticalThinkingType = resolveCriticalThinkingType(type, source);

                if (criticalThinkingType == null) {
                    AnswerGradingRequestDto request =
                            criticalThinkingGradingRequest(
                                    attemptQuestion, source, answer, points, subQuestionsByParentId);
                    if (request != null) {
                        workload.ai(key, () -> gradeWithRetry(request));
                    }
                    continue;
                }

                if ("PROGRAMMING".equals(criticalThinkingType) && !hasFreshVerdict(answer)) {
                    List<TestCaseInputDto> inputs = programmingInputsFor(source);
                    String code = answer.getSubmittedCode();
                    String language = answer.getProgrammingLanguage();
                    if (!inputs.isEmpty() && code != null && !code.isBlank()) {
                        workload.code(key, () -> Optional.ofNullable(
                                codeExecutionService.execute(
                                        new CodeExecutionRequestDto(language, code, inputs))));
                    }
                    continue;
                }

                if ("DIAGRAM".equals(criticalThinkingType)) {
                    diagramGradingRequest(source, answer, points).ifPresent(request ->
                            workload.diagram(key, () -> Optional.ofNullable(
                                    diagramGradingService.grade(request))));
                }
            }
        }

        return gradingBatchService.run(workload);
    }

    private Optional<DiagramGradingRequestDto> diagramGradingRequest(
            Question source, AssessmentAttemptAnswer answer, BigDecimal points) {
        return diagramQuestionConfigRepository
                .findByQuestion_QuestionId(source.getQuestionId())
                .map(DiagramQuestionConfig::getReferenceDiagramXml)
                .filter(xml -> xml != null && !xml.isBlank())
                .map(xml -> new DiagramGradingRequestDto(
                        xml, answer.getDiagramSubmissionData(), points));
    }

    private boolean isAiSemanticShortAnswer(String type, Question source) {
        return "SHORT_ANSWER".equals(type)
                && Optional.ofNullable(source.getTextQuestionConfig())
                        .map(config -> "AI_SEMANTIC".equalsIgnoreCase(config.getCheckingMethod()))
                        .orElse(false);
    }

    private List<TestCaseInputDto> programmingInputsFor(Question source) {
        return loadIndexedProgrammingTestCases(source).stream()
                .map(it -> new TestCaseInputDto(
                        it.index(), it.testCase().isSample(),
                        it.testCase().getInputData(), it.testCase().getExpectedOutput()))
                .toList();
    }

    static boolean hasSubmittedContent(AssessmentAttemptAnswer answer) {
        return (answer.getLearnerAnswer() != null && !answer.getLearnerAnswer().isBlank())
                || answer.getSelectedChoiceId() != null
                || (answer.getSubmittedCode() != null && !answer.getSubmittedCode().isBlank())
                || (answer.getDiagramSubmissionData() != null
                        && !answer.getDiagramSubmissionData().isBlank());
    }

    static boolean hasDefinitiveVerdict(AssessmentAttemptAnswer answer) {
        return !answer.isPendingManualEvaluation() && answer.getIsCorrect() != null;
    }

    private boolean hasFreshVerdict(AssessmentAttemptAnswer answer) {
        if (!hasDefinitiveVerdict(answer)) {
            return false;
        }
        String gradedHash = verdictCodeHash(answer);
        return gradedHash != null && gradedHash.equals(hashCode(answer.getSubmittedCode()));
    }

    private String verdictCodeHash(AssessmentAttemptAnswer answer) {
        String payload = answer.getExecutionResult();
        if (payload == null || payload.isBlank()) {
            return null;
        }
        try {
            String hash = objectMapper.readTree(payload).path("codeHash").asText(null);
            return hash == null || hash.isBlank() ? null : hash;
        } catch (Exception e) {
            return null;
        }
    }

    private void gradeProgrammingOnSubmit(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points,
            GradingBatch batch) {

        String code = answer.getSubmittedCode();
        if (code == null || code.isBlank()) {
            answer.setIsCorrect(false);
            answer.setCredit(BigDecimal.ZERO);
            answer.setPendingManualEvaluation(false);
            return;
        }

        List<IndexedTestCase> testCases = loadIndexedProgrammingTestCases(source);
        if (testCases.isEmpty()) {
            noteVerdictFromEarlierCode(answer);
            return;
        }

        List<TestCaseInputDto> inputs = testCases.stream()
                .map(it -> new TestCaseInputDto(
                        it.index(), it.testCase().isSample(),
                        it.testCase().getInputData(), it.testCase().getExpectedOutput()))
                .toList();

        CodeExecutionResultDto result =
                batch.codeResults().get(attemptQuestion.getAttemptQuestionId());
        if (result == null) {
            try {
                result = codeExecutionService.execute(new CodeExecutionRequestDto(
                        answer.getProgrammingLanguage(), code, inputs));
            } catch (RuntimeException ex) {
                log.warn("Submit-time programming grading failed for attemptQuestion {}: {}",
                        attemptQuestion.getAttemptQuestionId(), ex.toString());
                noteVerdictFromEarlierCode(answer);
                return;
            }
        }

        boolean definitive = result != null
                && ("COMPLETED".equals(result.status()) || "COMPILE_ERROR".equals(result.status()));
        if (!definitive) {
            noteVerdictFromEarlierCode(answer);
            return;
        }

        answer.setExecutionResult(serializeExecutionResult(
                attemptQuestion.getAttemptQuestionId(),
                AssessmentAttemptExecution.Mode.CHECK, result, hashCode(code)));

        int total = result.totalTests() == null ? 0 : result.totalTests();
        int passed = result.passedTests() == null ? 0 : result.passedTests();
        if (total > 0) {
            BigDecimal ratio = BigDecimal.valueOf(passed)
                    .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
            answer.setCredit(points.multiply(ratio).setScale(4, RoundingMode.HALF_UP));
            answer.setIsCorrect(passed == total);
            applyCodeStrikeWeights(attemptQuestion, answer, points, passed, total, result.executionTimeMs());
        } else {
            answer.setCredit(BigDecimal.ZERO);
            answer.setIsCorrect(false);
        }
        answer.setPendingManualEvaluation(false);
    }

    private void applyCodeStrikeWeightsFromStoredRun(
            AssessmentAttemptQuestion attemptQuestion, AssessmentAttemptAnswer answer, BigDecimal points) {
        String payload = answer.getExecutionResult();
        if (payload == null || payload.isBlank()) {
            return;
        }
        try {
            JsonNode run = objectMapper.readTree(payload);
            int total = run.path("totalTests").asInt(0);
            if (total <= 0) {
                return;
            }
            int passed = run.path("passedTests").asInt(0);
            Long maxTimeMs = run.hasNonNull("executionTimeMs") ? run.get("executionTimeMs").asLong() : null;
            applyCodeStrikeWeights(attemptQuestion, answer, points, passed, total, maxTimeMs);
        } catch (Exception e) {
            log.warn("Could not re-weigh CodeStrike answer {}: {}", answer.getAttemptAnswerId(), e.toString());
        }
    }

    private void applyCodeStrikeWeights(
            AssessmentAttemptQuestion attemptQuestion, AssessmentAttemptAnswer answer,
            BigDecimal points, int passed, int total, Long maxTimeMs) {
        AssessmentAttempt attempt = attemptQuestion.getAttempt();
        Exam exam = attempt == null ? null : attempt.getExam();
        if (exam == null || exam.getExamType() == null
                || !TYPE_CHALLENGE.equals(exam.getExamType().getExamTypeText())
                || !"codestrike".equals(exam.getTargetScope())) {
            return;
        }

        Map<String, Integer> settings = ChallengeArenaService.settingsOf(
                "codestrike", arenaConfigRepository.findById("codestrike"));
        ArenaScoring.Breakdown breakdown = ArenaScoring.codeStrike(
                settings, passed, total, maxTimeMs,
                attempt.getStartedAt(), LocalDateTime.now(), exam.getDurationMinutes());

        answer.setCredit(points.multiply(breakdown.fraction()).setScale(4, RoundingMode.HALF_UP));
        String existing = answer.getFeedback();
        answer.setFeedback(existing == null || existing.isBlank()
                ? breakdown.summary()
                : existing + "\n\n" + breakdown.summary());
    }

    private void noteVerdictFromEarlierCode(AssessmentAttemptAnswer answer) {
        if (hasFreshVerdict(answer) || !hasDefinitiveVerdict(answer)) {
            return;
        }
        String note = "This mark comes from the last time you ran Check, on an earlier version "
                + "of your code -- the submitted version could not be run again. If that looks "
                + "wrong, raise it with your instructor.";
        String existing = answer.getFeedback();
        answer.setFeedback(existing == null || existing.isBlank() ? note : existing + "\n\n" + note);
    }

    private boolean gradeDiagramAnswer(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points,
            GradingBatch batch) {

        DiagramGradingResultDto result =
                batch.diagramResults().get(attemptQuestion.getAttemptQuestionId());
        if (result == null) {
            Optional<DiagramGradingRequestDto> request =
                    diagramGradingRequest(source, answer, points);
            if (request.isEmpty()) {
                return false;
            }
            result = diagramGradingService.grade(request.get());
        }

        if ("INVALID_REFERENCE".equals(result.status())) {
            return false;
        }

        answer.setCredit(result.earnedPoints());
        answer.setFeedback(result.feedback());
        answer.setIsCorrect(isPassingShare(result.earnedPoints(), points));
        answer.setPendingManualEvaluation(false);
        answer.setDiagramGradingResult(serializeDiagramGradingResult(result));
        return true;
    }

    private String serializeDiagramGradingResult(DiagramGradingResultDto result) {
        try {
            return objectMapper.writeValueAsString(result.elementResults());
        } catch (Exception e) {
            log.warn("Could not serialize diagram grading result");
            return null;
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static boolean matchesTextAnswer(String learnerAnswer, TextQuestionConfig config) {
        String normalized = normalize(learnerAnswer);
        if (normalized.isEmpty()) {
            return false;
        }
        if (normalized.equals(normalize(config.getCorrectAnswer()))) {
            return true;
        }
        String variations = config.getAcceptedVariations();
        if (variations != null && !variations.isBlank()) {
            for (String variation : variations.split("\\n")) {
                if (normalized.equals(normalize(variation))) {
                    return true;
                }
            }
        }
        return false;
    }


    private static boolean isWorkspaceType(String questionType) {
        return "CRITICAL_THINKING".equals(questionType)
                || TYPE_PROGRAMMING_ITEM.equals(questionType)
                || TYPE_DIAGRAM_ITEM.equals(questionType);
    }

    private static final String TYPE_PROGRAMMING_ITEM = "PROGRAMMING";
    private static final String TYPE_DIAGRAM_ITEM = "DIAGRAM";

    private String resolveCriticalThinkingType(String questionType, Question source) {
        if (TYPE_PROGRAMMING_ITEM.equals(questionType)) {
            return "PROGRAMMING";
        }
        if (TYPE_DIAGRAM_ITEM.equals(questionType)) {
            return "DIAGRAM";
        }
        if (source.getProgrammingQuestionConfig() != null) {
            return "PROGRAMMING";
        }
        if (source.getDiagramQuestionConfig() != null) {
            return "DIAGRAM";
        }
        return null;
    }

    private static final int GRADING_ATTEMPTS = 3;

    private Optional<AnswerGradingResultDto> gradeWithRetry(AnswerGradingRequestDto request) {
        for (int attempt = 1; attempt <= GRADING_ATTEMPTS; attempt++) {
            Optional<AnswerGradingResultDto> graded;
            try {
                graded = aiAnswerGradingService.grade(request);
            } catch (AiServiceException permanent) {
                log.error("AI grading cannot succeed for this request; not retrying: {}",
                        permanent.getMessage());
                return Optional.empty();
            }
            if (graded.isPresent()) {
                return graded;
            }
            if (attempt < GRADING_ATTEMPTS) {
                log.warn("AI grading returned nothing (attempt {} of {}); retrying",
                        attempt, GRADING_ATTEMPTS);
                try {
                    Thread.sleep(1000L * attempt);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        log.error("AI grading failed after {} attempts -- the answer will be closed out "
                + "unmarked. Check the AI service is reachable.", GRADING_ATTEMPTS);
        return Optional.empty();
    }

    private AnswerGradingRequestDto descriptiveGradingRequest(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points) {
        String learnerText = answer.getLearnerAnswer() == null ? "" : answer.getLearnerAnswer();
        return new AnswerGradingRequestDto(
                attemptQuestion.getQuestionTextSnapshot(), points,
                rubricGuidanceFor(source.getQuestionId()),
                rubricCriteriaFor(source.getQuestionId()), learnerText, null);
    }

    private boolean gradeDescriptiveAnswer(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points,
            GradingBatch batch) {

        Optional<AnswerGradingResultDto> graded = Optional.ofNullable(
                batch.aiResults().get(attemptQuestion.getAttemptQuestionId()));
        if (graded.isEmpty()) {
            graded = gradeWithRetry(
                    descriptiveGradingRequest(attemptQuestion, source, answer, points));
        }
        if (graded.isEmpty()) {
            return false;
        }
        AnswerGradingResultDto result = graded.get();
        answer.setCredit(result.earnedPoints());
        answer.setFeedback(result.feedback());
        answer.setIsCorrect(isPassingShare(result.earnedPoints(), points));
        answer.setPendingManualEvaluation(false);
        return true;
    }

    private boolean gradeFillInTheBlank(
            Question source, AssessmentAttemptAnswer answer, BigDecimal points,
            Map<Long, List<Question>> subQuestionsByParentId) {
        List<Question> blanks = subQuestionsByParentId
                .getOrDefault(source.getQuestionId(), List.of());
        if (blanks.isEmpty()) {
            return false;
        }

        Map<Long, BigDecimal> pointSplit = splitPointsAcrossSubQuestions(blanks, points);
        Map<Long, String> submitted = parseSubAnswerText(answer.getLearnerAnswer());

        BigDecimal earned = BigDecimal.ZERO;
        int correctBlanks = 0;
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Question blank : blanks) {
            TextQuestionConfig config = blank.getTextQuestionConfig();
            String typed = submitted.get(blank.getQuestionId());
            BigDecimal max = pointSplit.getOrDefault(blank.getQuestionId(), BigDecimal.ZERO);

            boolean correct = config != null
                    && typed != null && !typed.isBlank()
                    && matchesTextAnswer(typed, config);
            if (correct) {
                correctBlanks++;
                earned = earned.add(max);
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("subQuestionId", blank.getQuestionId());
            row.put("questionText", blank.getQuestionText());
            row.put("learnerAnswer", typed);
            row.put("earnedPoints", correct ? max : BigDecimal.ZERO);
            row.put("maxPoints", max);
            row.put("feedback", correct ? "Correct" : "Not the expected term");
            rows.add(row);
        }

        answer.setCredit(earned);
        answer.setIsCorrect(correctBlanks == blanks.size());
        answer.setPendingManualEvaluation(false);
        try {
            answer.setSubAnswerScores(objectMapper.writeValueAsString(rows));
        } catch (Exception e) {
            log.warn("Could not serialize fill-in-the-blank sub-answer scores");
        }
        return true;
    }

    private AnswerGradingRequestDto criticalThinkingGradingRequest(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points,
            Map<Long, List<Question>> subQuestionsByParentId) {
        List<Question> subQuestions = subQuestionsByParentId
                .getOrDefault(source.getQuestionId(), List.of());
        if (subQuestions.isEmpty()) {
            return null;
        }
        Map<Long, BigDecimal> pointSplit = splitPointsAcrossSubQuestions(subQuestions, points);
        Map<Long, String> subAnswerText = parseSubAnswerText(answer.getLearnerAnswer());

        List<SubQuestionGradingRequestDto> subRequests = new ArrayList<>();
        for (Question sub : subQuestions) {
            subRequests.add(new SubQuestionGradingRequestDto(
                    sub.getQuestionId(), sub.getQuestionText(),
                    pointSplit.get(sub.getQuestionId()),
                    rubricGuidanceFor(sub.getQuestionId()),
                    rubricCriteriaFor(sub.getQuestionId()),
                    subAnswerText.getOrDefault(sub.getQuestionId(), "")));
        }
        return new AnswerGradingRequestDto(
                attemptQuestion.getQuestionTextSnapshot(), points,
                rubricGuidanceFor(source.getQuestionId()),
                rubricCriteriaFor(source.getQuestionId()), null, subRequests);
    }

    private boolean gradeCriticalThinkingAnswer(
            AssessmentAttemptQuestion attemptQuestion,
            Question source,
            AssessmentAttemptAnswer answer,
            BigDecimal points,
            GradingBatch batch,
            Map<Long, List<Question>> subQuestionsByParentId) {
        List<Question> subQuestions = subQuestionsByParentId
                .getOrDefault(source.getQuestionId(), List.of());
        if (subQuestions.isEmpty()) {
            return false;
        }

        Map<Long, BigDecimal> pointSplit = splitPointsAcrossSubQuestions(subQuestions, points);
        Map<Long, String> subAnswerText = parseSubAnswerText(answer.getLearnerAnswer());

        List<SubQuestionGradingRequestDto> subRequests = new ArrayList<>();
        for (Question sub : subQuestions) {
            subRequests.add(new SubQuestionGradingRequestDto(
                    sub.getQuestionId(),
                    sub.getQuestionText(),
                    pointSplit.get(sub.getQuestionId()),
                    rubricGuidanceFor(sub.getQuestionId()),
                    rubricCriteriaFor(sub.getQuestionId()),
                    subAnswerText.getOrDefault(sub.getQuestionId(), "")));
        }

        Optional<AnswerGradingResultDto> graded = Optional.ofNullable(
                batch.aiResults().get(attemptQuestion.getAttemptQuestionId()));
        if (graded.isEmpty()) {
            graded = gradeWithRetry(new AnswerGradingRequestDto(
                    attemptQuestion.getQuestionTextSnapshot(), points,
                    rubricGuidanceFor(source.getQuestionId()),
                    rubricCriteriaFor(source.getQuestionId()), null, subRequests));
        }
        if (graded.isEmpty()) {
            return false;
        }
        AnswerGradingResultDto result = graded.get();
        answer.setCredit(result.earnedPoints());
        answer.setFeedback(result.feedback());
        answer.setIsCorrect(isPassingShare(result.earnedPoints(), points));
        answer.setPendingManualEvaluation(false);
        answer.setSubAnswerScores(
                serializeSubAnswerScores(subQuestions, pointSplit, subAnswerText, result));
        return true;
    }

    private String rubricGuidanceFor(Long questionId) {
        return textQuestionConfigRepository.findByQuestion_QuestionId(questionId)
                .filter(config -> "AI_SEMANTIC".equalsIgnoreCase(config.getCheckingMethod()))
                .map(TextQuestionConfig::getCorrectAnswer)
                .orElse(null);
    }

    private List<AnswerGradingRequestDto.RubricCriterionDto> rubricCriteriaFor(Long questionId) {
        List<AnswerGradingRequestDto.RubricCriterionDto> criteria = new ArrayList<>();
        for (QuestionRubricCriterion criterion :
                rubricCriterionRepository.findByQuestion_QuestionIdOrderByDisplayOrderAsc(questionId)) {
            criteria.add(new AnswerGradingRequestDto.RubricCriterionDto(
                    criterion.getName(), criterion.getMaxPoints()));
        }
        return criteria;
    }

    private Map<Long, BigDecimal> splitPointsAcrossSubQuestions(
            List<Question> subQuestions, BigDecimal totalPoints) {
        Map<Long, BigDecimal> allocation = new LinkedHashMap<>();
        if (subQuestions.isEmpty() || totalPoints == null || totalPoints.signum() <= 0) {
            return allocation;
        }

        Map<Long, BigDecimal> weights = new LinkedHashMap<>();
        BigDecimal weightSum = BigDecimal.ZERO;
        for (Question sub : subQuestions) {
            weights.put(sub.getQuestionId(), BigDecimal.ONE);
            weightSum = weightSum.add(BigDecimal.ONE);
        }

        BigDecimal running = BigDecimal.ZERO;
        for (int i = 0; i < subQuestions.size(); i++) {
            Long id = subQuestions.get(i).getQuestionId();
            BigDecimal share;
            if (i == subQuestions.size() - 1) {
                share = totalPoints.subtract(running).setScale(4, RoundingMode.HALF_UP);
            } else {
                share = totalPoints.multiply(weights.get(id))
                        .divide(weightSum, 4, RoundingMode.HALF_UP);
                running = running.add(share);
            }
            allocation.put(id, share);
        }
        return allocation;
    }

    private Map<Long, String> parseSubAnswerText(String learnerAnswer) {
        Map<Long, String> result = new LinkedHashMap<>();
        if (learnerAnswer == null || learnerAnswer.isBlank()) {
            return result;
        }
        try {
            JsonNode node = objectMapper.readTree(learnerAnswer);
            if (!node.isObject()) {
                return result;
            }
            node.fields().forEachRemaining(entry -> {
                try {
                    result.put(Long.valueOf(entry.getKey()), entry.getValue().asText(""));
                } catch (NumberFormatException ignored) {
                }
            });
        } catch (Exception e) {
            log.warn("Could not parse critical-thinking sub-answer JSON");
        }
        return result;
    }

    private String serializeSubAnswerScores(
            List<Question> subQuestions,
            Map<Long, BigDecimal> pointSplit,
            Map<Long, String> subAnswerText,
            AnswerGradingResultDto result) {
        Map<Long, SubAnswerGradeDto> scoreById = new LinkedHashMap<>();
        for (SubAnswerGradeDto score : result.subScores()) {
            scoreById.put(score.subQuestionId(), score);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Question sub : subQuestions) {
            SubAnswerGradeDto scored = scoreById.get(sub.getQuestionId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("subQuestionId", sub.getQuestionId());
            row.put("questionText", sub.getQuestionText());
            row.put("learnerAnswer", subAnswerText.get(sub.getQuestionId()));
            row.put("earnedPoints", scored == null ? null : scored.earnedPoints());
            row.put("maxPoints", pointSplit.get(sub.getQuestionId()));
            row.put("feedback", scored == null ? null : scored.feedback());
            rows.add(row);
        }
        try {
            return objectMapper.writeValueAsString(rows);
        } catch (Exception e) {
            log.warn("Could not serialize sub-answer scores");
            return null;
        }
    }

    private Boolean isPassingShare(BigDecimal earned, BigDecimal max) {
        if (earned == null || max == null || max.signum() <= 0) {
            return null;
        }
        double share = earned.doubleValue() / max.doubleValue();
        return share >= bktProperties.getPartialCreditCorrectThreshold();
    }

    List<SubQuestionAnswerReviewDto> buildSubQuestionAnswerReviews(
            Question source, AssessmentAttemptAnswer answer,
            Map<Long, List<Question>> subQuestionsByParentId) {
        if (source == null) {
            return List.of();
        }
        List<Question> subQuestions = subQuestionsByParentId
                .getOrDefault(source.getQuestionId(), List.of());
        if (subQuestions.isEmpty()) {
            return List.of();
        }

        Map<Long, String> rawAnswers = parseSubAnswerText(answer == null ? null : answer.getLearnerAnswer());
        Map<Long, JsonNode> scored = parseSubAnswerScores(answer == null ? null : answer.getSubAnswerScores());

        List<SubQuestionAnswerReviewDto> reviews = new ArrayList<>();
        for (Question sub : subQuestions) {
            JsonNode scoreNode = scored.get(sub.getQuestionId());
            reviews.add(new SubQuestionAnswerReviewDto(
                    sub.getQuestionId(),
                    sub.getQuestionText(),
                    rawAnswers.get(sub.getQuestionId()),
                    scoreNode != null && scoreNode.hasNonNull("earnedPoints")
                            ? scoreNode.get("earnedPoints").decimalValue() : null,
                    scoreNode != null && scoreNode.hasNonNull("maxPoints")
                            ? scoreNode.get("maxPoints").decimalValue() : null,
                    scoreNode != null && scoreNode.hasNonNull("feedback")
                            ? scoreNode.get("feedback").asText() : null
            ));
        }
        return reviews;
    }

    private List<DiagramElementReviewDto> buildDiagramElementReviews(
            AssessmentAttemptAnswer answer, boolean releaseAnswers) {
        if (!releaseAnswers || answer == null || answer.getDiagramGradingResult() == null) {
            return List.of();
        }
        try {
            JsonNode array = objectMapper.readTree(answer.getDiagramGradingResult());
            if (!array.isArray()) {
                return List.of();
            }
            List<DiagramElementReviewDto> reviews = new ArrayList<>();
            for (JsonNode node : array) {
                reviews.add(new DiagramElementReviewDto(
                        node.path("kind").asText(null),
                        node.path("expectedDescription").asText(null),
                        node.path("matched").asBoolean(false),
                        node.path("matchQuality").asText(null),
                        node.hasNonNull("learnerDescription") ? node.get("learnerDescription").asText() : null,
                        node.hasNonNull("reason") ? node.get("reason").asText() : null,
                        node.hasNonNull("earnedPoints") ? node.get("earnedPoints").decimalValue() : null,
                        node.hasNonNull("maxPoints") ? node.get("maxPoints").decimalValue() : null
                ));
            }
            return reviews;
        } catch (Exception e) {
            log.warn("Could not parse persisted diagram grading result");
            return List.of();
        }
    }

    private List<ProgrammingTestReviewDto> buildProgrammingTestReviews(
            AssessmentAttemptQuestion attemptQuestion,
            AssessmentAttemptAnswer answer,
            Question source,
            boolean releaseAnswers) {

        if (answer == null || answer.getExecutionResult() == null
                || answer.getSubmittedCode() == null || answer.getSubmittedCode().isBlank()) {
            return List.of();
        }

        Map<Integer, String> labels = new LinkedHashMap<>();
        for (LearnerTestCaseDto snapshotCase : readSnapshotTestCases(attemptQuestion)) {
            labels.put(snapshotCase.index(), snapshotCase.label());
        }

        Map<Integer, ProgrammingTestCase> authored = new LinkedHashMap<>();
        if (source != null) {
            for (IndexedTestCase indexed : loadIndexedProgrammingTestCases(source)) {
                authored.put(indexed.index(), indexed.testCase());
            }
        }

        try {
            JsonNode tests = objectMapper.readTree(answer.getExecutionResult()).path("testResults");
            if (!tests.isArray()) {
                return List.of();
            }
            List<ProgrammingTestReviewDto> reviews = new ArrayList<>();
            for (JsonNode test : tests) {
                int index = test.path("index").asInt();
                boolean sample = test.path("sample").asBoolean(false);
                ProgrammingTestCase authoredCase = authored.get(index);
                reviews.add(new ProgrammingTestReviewDto(
                        index,
                        labels.getOrDefault(index, (sample ? "Sample " : "Hidden ") + index),
                        sample,
                        test.path("passed").asBoolean(false),
                        test.path("status").asText(null),
                        authoredCase != null ? authoredCase.getInputData() : null,
                        releaseAnswers && authoredCase != null
                                ? authoredCase.getExpectedOutput() : null,
                        test.hasNonNull("actualOutput")
                                ? test.get("actualOutput").asText() : null));
            }
            return reviews;
        } catch (Exception e) {
            log.warn("Could not parse persisted execution result for attempt question {}",
                    attemptQuestion.getAttemptQuestionId());
            return List.of();
        }
    }

    private String programOutputFor(AssessmentAttemptAnswer answer) {
        JsonNode payload = gradedPayload(answer);
        if (payload == null) {
            return null;
        }
        JsonNode tests = payload.path("testResults");
        if (!tests.isArray() || tests.isEmpty()) {
            return payload.hasNonNull("output") ? payload.get("output").asText() : null;
        }
        for (JsonNode test : tests) {
            if (test.path("sample").asBoolean(false) && test.hasNonNull("actualOutput")) {
                return test.get("actualOutput").asText();
            }
        }
        return null;
    }

    private String programErrorFor(AssessmentAttemptAnswer answer) {
        JsonNode payload = gradedPayload(answer);
        if (payload == null || !payload.hasNonNull("error")) {
            return null;
        }
        if ("COMPILE_ERROR".equals(payload.path("status").asText(null))) {
            return payload.get("error").asText();
        }
        JsonNode tests = payload.path("testResults");
        if (!tests.isArray() || tests.isEmpty()) {
            return payload.get("error").asText();
        }
        for (JsonNode test : tests) {
            String status = test.path("status").asText("");
            if (status.equals("RUNTIME_ERROR") || status.equals("TIME_LIMIT_EXCEEDED")) {
                return test.path("sample").asBoolean(false) ? payload.get("error").asText() : null;
            }
        }
        return null;
    }

    private JsonNode gradedPayload(AssessmentAttemptAnswer answer) {
        if (answer == null || answer.getExecutionResult() == null
                || answer.getSubmittedCode() == null || answer.getSubmittedCode().isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(answer.getExecutionResult());
        } catch (Exception e) {
            return null;
        }
    }

    private Map<Long, JsonNode> parseSubAnswerScores(String subAnswerScoresJson) {
        Map<Long, JsonNode> result = new LinkedHashMap<>();
        if (subAnswerScoresJson == null || subAnswerScoresJson.isBlank()) {
            return result;
        }
        try {
            JsonNode array = objectMapper.readTree(subAnswerScoresJson);
            if (!array.isArray()) {
                return result;
            }
            for (JsonNode node : array) {
                if (node.hasNonNull("subQuestionId")) {
                    result.put(node.get("subQuestionId").asLong(), node);
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse persisted sub-answer scores");
        }
        return result;
    }

    private AssessmentAttemptStartResponseDto buildStartResponse(
            AssessmentAttempt attempt, boolean resumed) {

        List<AssessmentAttemptQuestion> questions = attemptQuestionRepository
                .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(
                        attempt.getAssessmentAttemptId());

        List<LearnerAttemptQuestionDto> questionDtos = new ArrayList<>();
        List<Long> flaggedIds = new ArrayList<>();
        List<Long> skippedIds = new ArrayList<>();
        for (AssessmentAttemptQuestion attemptQuestion : questions) {
            LearnerAttemptQuestionDto dto = toLearnerQuestion(attemptQuestion);
            if (attempt.isAdaptive()) {
                dto = adaptiveAttemptService.getObject().decorate(attempt, attemptQuestion, dto);
            }
            questionDtos.add(dto);
            if (attemptQuestion.isFlagged()) {
                flaggedIds.add(attemptQuestion.getAttemptQuestionId());
            }
            if (attemptQuestion.isSkipped()) {
                skippedIds.add(attemptQuestion.getAttemptQuestionId());
            }
        }

        Map<Long, AttemptAnswerDraftDto> savedAnswers = new LinkedHashMap<>();
        for (AssessmentAttemptAnswer answer :
                attemptAnswerRepository.findByAttempt_AssessmentAttemptId(
                        attempt.getAssessmentAttemptId())) {
            savedAnswers.put(
                    answer.getAttemptQuestion().getAttemptQuestionId(),
                    new AttemptAnswerDraftDto(
                            answer.getAttemptQuestion().getAttemptQuestionId(),
                            answer.getLearnerAnswer(),
                            answer.getSelectedChoiceId(),
                            answer.getSubmittedCode(),
                            answer.getProgrammingLanguage(),
                            answer.getDiagramSubmissionData()));
        }

        Exam exam = attempt.getExam();
        return new AssessmentAttemptStartResponseDto(
                attempt.getAssessmentAttemptId(),
                exam.getExamId(),
                exam.getTitle(),
                exam.getExamType().getExamTypeText(),
                attempt.getAttemptNumber(),
                attempt.getStartedAt() == null
                        ? null : attempt.getStartedAt().atZone(java.time.ZoneId.systemDefault()).toOffsetDateTime(),
                attempt.getExpiresAt() == null
                        ? null : attempt.getExpiresAt().atZone(java.time.ZoneId.systemDefault()).toOffsetDateTime(),
                resumed,
                questionDtos,
                savedAnswers,
                attempt.getCurrentQuestionId(),
                flaggedIds,
                skippedIds,
                attempt.isAdaptive() ? adaptiveAttemptService.getObject().progressOf(attempt) : null
        );
    }

    record SnapshotContext(
            Map<Long, List<Question>> subQuestionsByParentId,
            Map<Long, List<QuestionRubricCriterion>> rubricByQuestionId) {

        static SnapshotContext empty() {
            return new SnapshotContext(Map.of(), Map.of());
        }

        List<Question> subQuestionsOf(Long questionId) {
            return subQuestionsByParentId.getOrDefault(questionId, List.of());
        }

        List<QuestionRubricCriterion> rubricOf(Long questionId) {
            return rubricByQuestionId.getOrDefault(questionId, List.of());
        }
    }

    SnapshotContext buildSnapshotContext(List<Question> questions) {
        List<Long> questionIds = questions.stream()
                .map(Question::getQuestionId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (questionIds.isEmpty()) {
            return SnapshotContext.empty();
        }
        Map<Long, List<Question>> subQuestions = questionRepository
                .findSubQuestionsByParentIdIn(questionIds).stream()
                .collect(Collectors.groupingBy(
                        sub -> sub.getParentQuestion().getQuestionId(),
                        LinkedHashMap::new, Collectors.toList()));
        Map<Long, List<QuestionRubricCriterion>> rubric = rubricCriterionRepository
                .findByQuestion_QuestionIdInOrderByQuestion_QuestionIdAscDisplayOrderAsc(questionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        criterion -> criterion.getQuestion().getQuestionId(),
                        LinkedHashMap::new, Collectors.toList()));
        return new SnapshotContext(subQuestions, rubric);
    }

    String buildLearnerSafeSnapshot(Question question, SnapshotContext context) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("questionImageKey", question.getImageKey());

        if (isMultipleChoice(question.getQuestionType())) {
            List<Map<String, Object>> choices = new ArrayList<>();
            for (Choice choice : question.getChoices()) {
                Map<String, Object> safe = new LinkedHashMap<>();
                safe.put("choiceId", choice.getChoiceId());
                safe.put("choiceText", choice.getChoiceText());
                safe.put("imageKey", choice.getImageKey());
                choices.add(safe);
            }
            data.put("choices", choices);
        }

        if (isWorkspaceType(question.getQuestionType())) {
            ProgrammingQuestionConfig programmingConfig = question.getProgrammingQuestionConfig();
            if (programmingConfig != null) {
                data.put("criticalThinkingType", "PROGRAMMING");
                data.put("starterCode", programmingConfig.getStarterCode());
                List<Map<String, Object>> tests = new ArrayList<>();
                int index = 1;
                int sampleNo = 1;
                int hiddenNo = 1;
                for (ProgrammingTestCase testCase : programmingConfig.getTestCases()) {
                    Map<String, Object> safe = new LinkedHashMap<>();
                    boolean sample = testCase.isSample();
                    safe.put("index", index++);
                    safe.put("sample", sample);
                    safe.put("label", sample ? "Sample " + (sampleNo++) : "Hidden " + (hiddenNo++));
                    safe.put("input", sample ? testCase.getInputData() : null);
                    tests.add(safe);
                }
                data.put("testCases", tests);
            }
            DiagramQuestionConfig diagramConfig = question.getDiagramQuestionConfig();
            if (diagramConfig != null) {
                data.put("criticalThinkingType", "DIAGRAM");
                data.put("diagramType", diagramConfig.getDiagramType());
                data.put("instructions", diagramConfig.getInstructions());
            }
        }

        List<Map<String, Object>> subQuestions = new ArrayList<>();
        for (Question sub : context.subQuestionsOf(question.getQuestionId())) {
            Map<String, Object> safe = new LinkedHashMap<>();
            safe.put("subQuestionId", sub.getQuestionId());
            safe.put("questionText", sub.getQuestionText());
            subQuestions.add(safe);
        }
        data.put("subQuestions", subQuestions);

        List<QuestionRubricCriterion> criteria = context.rubricOf(question.getQuestionId());
        if (!criteria.isEmpty()) {
            List<Map<String, Object>> rubric = new ArrayList<>();
            for (QuestionRubricCriterion criterion : criteria) {
                Map<String, Object> safe = new LinkedHashMap<>();
                safe.put("name", criterion.getName());
                safe.put("maxPoints", criterion.getMaxPoints());
                rubric.add(safe);
            }
            data.put("rubric", rubric);
        }

        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            log.warn("Could not serialize snapshot for question {}", question.getQuestionId());
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    LearnerAttemptQuestionDto toLearnerQuestion(AssessmentAttemptQuestion attemptQuestion) {
        Map<String, Object> data = Map.of();
        try {
            if (attemptQuestion.getQuestionDataSnapshot() != null) {
                data = objectMapper.readValue(
                        attemptQuestion.getQuestionDataSnapshot(),
                        new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception e) {
            log.warn("Could not parse snapshot for attempt question {}",
                    attemptQuestion.getAttemptQuestionId());
        }

        List<LearnerChoiceDto> choices = new ArrayList<>();
        Object rawChoices = data.get("choices");
        if (rawChoices instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    choices.add(new LearnerChoiceDto(
                            map.get("choiceId") == null
                                    ? null : Long.valueOf(map.get("choiceId").toString()),
                            (String) map.get("choiceText"),
                            (String) map.get("imageKey")));
                }
            }
        }

        if (choices.isEmpty() && isMultipleChoice(attemptQuestion.getQuestionType())) {
            questionRepository.findById(attemptQuestion.getSourceQuestionId())
                    .ifPresent(source -> source.getChoices().forEach(choice ->
                            choices.add(new LearnerChoiceDto(
                                    choice.getChoiceId(),
                                    choice.getChoiceText(),
                                    choice.getImageKey()))));
        }

        List<LearnerSubQuestionDto> subQuestions = new ArrayList<>();
        Object rawSubs = data.get("subQuestions");
        if (rawSubs instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    subQuestions.add(new LearnerSubQuestionDto(
                            map.get("subQuestionId") == null
                                    ? null : Long.valueOf(map.get("subQuestionId").toString()),
                            (String) map.get("questionText")));
                }
            }
        }

        return new LearnerAttemptQuestionDto(
                attemptQuestion.getAttemptQuestionId(),
                attemptQuestion.getDisplayOrder(),
                normalizeQuestionType(attemptQuestion.getQuestionType()),
                (String) data.get("criticalThinkingType"),
                attemptQuestion.getQuestionTextSnapshot(),
                (String) data.get("questionImageKey"),
                choices,
                (String) data.get("starterCode"),
                (String) data.get("diagramType"),
                (String) data.get("instructions"),
                subQuestions,
                attemptQuestion.getPoints(),
                parseLearnerTestCases(data),
                parseRubric(data),
                attemptQuestion.getStage(),
                null
        );
    }


    @Transactional
    public DiagramCheckResultDto checkDiagram(
            Long attemptId, Long attemptQuestionId, DiagramCheckRequestDto request) {

        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, request.learnerId());
        requireEditable(attempt);
        AssessmentAttemptQuestion question = requireAttemptQuestion(attempt, attemptQuestionId);
        if (!isWorkspaceType(question.getQuestionType())) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This item is not a diagram question.");
        }

        upsertAnswers(attempt, List.of(new AttemptAnswerDraftDto(
                attemptQuestionId, null, null, null, null, request.diagramData())));

        return new DiagramCheckResultDto(
                "PENDING",
                "Your diagram has been saved. It will be evaluated against the rubric "
                        + "after you submit the assessment.",
                readSnapshotRubric(question));
    }

    @Transactional
    public ChoiceCheckResultDto checkChoice(
            Long attemptId, Long attemptQuestionId, ChoiceCheckRequestDto request) {

        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, request.learnerId());
        requireEditable(attempt);
        AssessmentAttemptQuestion question = requireAttemptQuestion(attempt, attemptQuestionId);
        if (!isMultipleChoice(question.getQuestionType())) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This item is not a choice question.");
        }

        Question source = question.getSourceQuestionId() == null ? null
                : questionRepository.findById(question.getSourceQuestionId()).orElse(null);
        if (source == null) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This item can no longer be marked.");
        }

        upsertAnswers(attempt, List.of(new AttemptAnswerDraftDto(
                attemptQuestionId, null, request.selectedChoiceId(), null, null, null)));

        Choice correctChoice = source.getChoices().stream()
                .filter(Choice::isCorrect).findFirst().orElse(null);
        boolean correct = correctChoice != null
                && correctChoice.getChoiceId().equals(request.selectedChoiceId());

        boolean releaseAnswers = attempt.getExam().effectiveReleaseAnswers();
        return new ChoiceCheckResultDto(
                correct,
                releaseAnswers && correctChoice != null ? correctChoice.getChoiceId() : null,
                releaseAnswers && correctChoice != null ? correctChoice.getExplanation() : null,
                releaseAnswers);
    }

    private List<RubricCriterionDto> readSnapshotRubric(AssessmentAttemptQuestion attemptQuestion) {
        try {
            if (attemptQuestion.getQuestionDataSnapshot() == null) {
                return List.of();
            }
            Map<String, Object> data = objectMapper.readValue(
                    attemptQuestion.getQuestionDataSnapshot(),
                    new TypeReference<Map<String, Object>>() {});
            return parseRubric(data);
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<RubricCriterionDto> parseRubric(Map<String, Object> data) {
        List<RubricCriterionDto> rubric = new ArrayList<>();
        Object raw = data.get("rubric");
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object maxPoints = map.get("maxPoints");
                    rubric.add(new RubricCriterionDto(
                            (String) map.get("name"),
                            maxPoints == null ? null : new java.math.BigDecimal(maxPoints.toString()),
                            null,
                            null,
                            "PENDING"));
                }
            }
        }
        return rubric;
    }


    @Transactional
    public ExecutionResultDto runProgramming(
            Long attemptId, Long attemptQuestionId, ProgrammingRunRequestDto request) {
        return executeProgramming(
                attemptId, attemptQuestionId, request, AssessmentAttemptExecution.Mode.RUN);
    }

    @Transactional
    public ExecutionResultDto checkProgramming(
            Long attemptId, Long attemptQuestionId, ProgrammingRunRequestDto request) {
        throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                "Test cases are checked when you submit the attempt. Use Run to see your program's output.");
    }

    private ExecutionResultDto executeProgramming(
            Long attemptId, Long attemptQuestionId,
            ProgrammingRunRequestDto request, AssessmentAttemptExecution.Mode mode) {

        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, request.learnerId());
        requireEditable(attempt);
        AssessmentAttemptQuestion attemptQuestion = requireAttemptQuestion(attempt, attemptQuestionId);
        if (!isWorkspaceType(attemptQuestion.getQuestionType())) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This item is not a programming question.");
        }

        upsertAnswers(attempt, List.of(new AttemptAnswerDraftDto(
                attemptQuestionId, null, null, request.code(), request.language(), null)));

        if (mode == AssessmentAttemptExecution.Mode.RUN) {
            return runForOutputOnly(attempt, attemptQuestion, request);
        }

        List<LearnerTestCaseDto> learnerTests = readSnapshotTestCases(attemptQuestion);
        Question source = questionRepository
                .findById(attemptQuestion.getSourceQuestionId()).orElse(null);
        List<IndexedTestCase> allTestCases = source == null
                ? List.of() : loadIndexedProgrammingTestCases(source);
        List<IndexedTestCase> scopedTestCases = mode == AssessmentAttemptExecution.Mode.RUN
                ? allTestCases.stream().filter(it -> it.testCase().isSample()).toList()
                : allTestCases;

        LocalDateTime now = LocalDateTime.now();
        if (scopedTestCases.isEmpty()) {
            String message = allTestCases.isEmpty()
                    ? "No test cases are configured for this item yet."
                    : "No sample test cases are available for Run — use Check to grade against all tests.";
            AssessmentAttemptExecution execution = executionRepository.save(
                    AssessmentAttemptExecution.builder()
                            .attempt(attempt).attemptQuestion(attemptQuestion).mode(mode)
                            .language(request.language()).submittedCode(request.code())
                            .status(AssessmentAttemptExecution.Status.UNAVAILABLE)
                            .totalTests(learnerTests.isEmpty() ? null : learnerTests.size())
                            .output(message)
                            .createdAt(now)
                            .build());
            return new ExecutionResultDto(
                    execution.getExecutionId(), mode.name(), execution.getStatus().name(),
                    message, request.language(), null, execution.getTotalTests(), now, learnerTests,
                    null, null);
        }

        List<TestCaseInputDto> inputs = scopedTestCases.stream()
                .map(it -> new TestCaseInputDto(
                        it.index(), it.testCase().isSample(),
                        it.testCase().getInputData(), it.testCase().getExpectedOutput()))
                .toList();

        CodeExecutionResultDto result = codeExecutionService.execute(
                new CodeExecutionRequestDto(request.language(), request.code(), inputs));

        applyExecutionResultToAnswer(attemptQuestion, mode, result, hashCode(request.code()));

        AssessmentAttemptExecution execution = executionRepository.save(
                AssessmentAttemptExecution.builder()
                        .attempt(attempt)
                        .attemptQuestion(attemptQuestion)
                        .mode(mode)
                        .language(request.language())
                        .submittedCode(request.code())
                        .status(toExecutionEntityStatus(result.status()))
                        .passedTests(result.passedTests())
                        .totalTests(result.totalTests())
                        .output(executionOutputSummary(result))
                        .createdAt(now)
                        .build());

        return new ExecutionResultDto(
                execution.getExecutionId(),
                mode.name(),
                execution.getStatus().name(),
                executionOutputSummary(result),
                request.language(),
                result.passedTests(),
                result.totalTests(),
                now,
                mergeTestStatuses(learnerTests, result, scopedTestCases),
                result.output(),
                result.error());
    }

    private ExecutionResultDto runForOutputOnly(
            AssessmentAttempt attempt, AssessmentAttemptQuestion attemptQuestion,
            ProgrammingRunRequestDto request) {
        Question source = questionRepository
                .findById(attemptQuestion.getSourceQuestionId()).orElse(null);
        List<IndexedTestCase> allCases = source == null ? List.of() : loadIndexedProgrammingTestCases(source);
        String stdin = allCases.stream()
                .map(IndexedTestCase::testCase)
                .filter(ProgrammingTestCase::isSample)
                .map(ProgrammingTestCase::getInputData)
                .filter(input -> input != null)
                .findFirst()
                .or(() -> allCases.stream()
                        .map(IndexedTestCase::testCase)
                        .map(ProgrammingTestCase::getInputData)
                        .filter(input -> input != null)
                        .findFirst())
                .orElse("");

        CodeExecutionResultDto result = codeExecutionService.execute(new CodeExecutionRequestDto(
                request.language(), request.code(),
                List.of(new TestCaseInputDto(1, true, stdin, null))));

        boolean ran = "COMPLETED".equals(result.status()) || "COMPILE_ERROR".equals(result.status());
        String message = ran ? null : result.error();
        LocalDateTime now = LocalDateTime.now();

        AssessmentAttemptExecution execution = executionRepository.save(
                AssessmentAttemptExecution.builder()
                        .attempt(attempt)
                        .attemptQuestion(attemptQuestion)
                        .mode(AssessmentAttemptExecution.Mode.RUN)
                        .language(request.language())
                        .submittedCode(request.code())
                        .status(toExecutionEntityStatus(result.status()))
                        .output(firstNonBlankText(result.error(), result.output()))
                        .createdAt(now)
                        .build());

        return new ExecutionResultDto(
                execution.getExecutionId(),
                AssessmentAttemptExecution.Mode.RUN.name(),
                execution.getStatus().name(),
                message,
                request.language(),
                null,
                null,
                now,
                List.of(),
                result.output(),
                ran ? result.error() : null);
    }

    private static String firstNonBlankText(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private record IndexedTestCase(int index, ProgrammingTestCase testCase) {}

    private List<IndexedTestCase> loadIndexedProgrammingTestCases(Question source) {
        return programmingQuestionConfigRepository.findByQuestion_QuestionId(source.getQuestionId())
                .map(config -> {
                    List<IndexedTestCase> indexed = new ArrayList<>();
                    int index = 1;
                    for (ProgrammingTestCase testCase : config.getTestCases()) {
                        indexed.add(new IndexedTestCase(index++, testCase));
                    }
                    return indexed;
                })
                .orElse(List.of());
    }

    private void applyExecutionResultToAnswer(
            AssessmentAttemptQuestion attemptQuestion,
            AssessmentAttemptExecution.Mode mode,
            CodeExecutionResultDto result,
            String codeHash) {
        AssessmentAttemptAnswer answer = attemptAnswerRepository
                .findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
                        attemptQuestion.getAttempt().getAssessmentAttemptId(),
                        attemptQuestion.getAttemptQuestionId())
                .orElse(null);
        if (answer == null) {
            return;
        }

        answer.setExecutionResult(serializeExecutionResult(
                attemptQuestion.getAttemptQuestionId(), mode, result, codeHash));

        boolean definitive = "COMPLETED".equals(result.status()) || "COMPILE_ERROR".equals(result.status());
        if (mode == AssessmentAttemptExecution.Mode.CHECK && definitive) {
            BigDecimal points = UNIT;
            int total = result.totalTests() == null ? 0 : result.totalTests();
            int passed = result.passedTests() == null ? 0 : result.passedTests();
            if (total > 0) {
                BigDecimal ratio = BigDecimal.valueOf(passed)
                        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
                answer.setCredit(points.multiply(ratio).setScale(4, RoundingMode.HALF_UP));
                answer.setIsCorrect(passed == total);
            } else {
                answer.setCredit(BigDecimal.ZERO);
                answer.setIsCorrect(false);
            }
            answer.setPendingManualEvaluation(false);
        }
        attemptAnswerRepository.save(answer);
    }

    private String serializeExecutionResult(
            Long attemptQuestionId, AssessmentAttemptExecution.Mode mode,
            CodeExecutionResultDto result, String codeHash) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("codeHash", codeHash);
        payload.put("mode", mode.name());
        payload.put("status", result.status());
        payload.put("output", result.output());
        payload.put("error", result.error());
        payload.put("executionTimeMs", result.executionTimeMs());
        payload.put("memoryKb", result.memoryKb());
        payload.put("passedTests", result.passedTests());
        payload.put("totalTests", result.totalTests());
        List<Map<String, Object>> tests = new ArrayList<>();
        for (TestCaseResultDto testResult : result.testResults()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("index", testResult.index());
            row.put("sample", testResult.sample());
            row.put("passed", testResult.passed());
            row.put("status", testResult.status());
            row.put("actualOutput", testResult.actualOutput());
            tests.add(row);
        }
        payload.put("testResults", tests);
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("Could not serialize execution result for attempt question {}", attemptQuestionId);
            return null;
        }
    }

    private AssessmentAttemptExecution.Status toExecutionEntityStatus(String status) {
        return switch (status) {
            case "COMPLETED" -> AssessmentAttemptExecution.Status.COMPLETED;
            case "COMPILE_ERROR" -> AssessmentAttemptExecution.Status.ERROR;
            default -> AssessmentAttemptExecution.Status.UNAVAILABLE;
        };
    }

    private String executionOutputSummary(CodeExecutionResultDto result) {
        if ("COMPILE_ERROR".equals(result.status())) {
            return "Compilation failed:\n" + (result.error() == null ? "" : result.error());
        }
        if ("UNAVAILABLE".equals(result.status()) || "UNSUPPORTED_LANGUAGE".equals(result.status())) {
            return result.error();
        }
        if (result.error() != null && !result.error().isBlank()) {
            return result.error();
        }
        if (result.totalTests() != null) {
            return result.passedTests() + " / " + result.totalTests() + " test case(s) passed.";
        }
        return result.output();
    }

    private List<LearnerTestCaseDto> mergeTestStatuses(
            List<LearnerTestCaseDto> learnerTests, CodeExecutionResultDto result,
            List<IndexedTestCase> ranTestCases) {
        Map<Integer, TestCaseResultDto> byIndex = new LinkedHashMap<>();
        for (TestCaseResultDto testResult : result.testResults()) {
            byIndex.put(testResult.index(), testResult);
        }
        Map<Integer, ProgrammingTestCase> ranByIndex = new LinkedHashMap<>();
        for (IndexedTestCase indexed : ranTestCases) {
            ranByIndex.put(indexed.index(), indexed.testCase());
        }
        List<LearnerTestCaseDto> merged = new ArrayList<>();
        for (LearnerTestCaseDto test : learnerTests) {
            TestCaseResultDto matched = byIndex.get(test.index());
            ProgrammingTestCase source = ranByIndex.get(test.index());
            boolean showOutputs = test.sample() && source != null && source.isSample();
            merged.add(new LearnerTestCaseDto(
                    test.index(), test.label(), test.sample(), test.input(),
                    matched != null ? matched.status() : test.status(),
                    showOutputs ? source.getExpectedOutput() : null,
                    showOutputs && matched != null ? matched.actualOutput() : null));
        }
        return merged;
    }

    private String hashCode(String code) {
        if (code == null) {
            return null;
        }
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<ExecutionHistoryItemDto> listExecutions(
            Long attemptId, Long attemptQuestionId, Long learnerId) {
        AssessmentAttempt attempt = requireOwnedAttempt(attemptId, learnerId);
        requireAttemptQuestion(attempt, attemptQuestionId);
        return executionRepository
                .findByAttemptQuestion_AttemptQuestionIdOrderByCreatedAtDesc(
                        attemptQuestionId, PageRequest.of(0, MAX_EXECUTION_HISTORY))
                .stream()
                .map(execution -> new ExecutionHistoryItemDto(
                        execution.getExecutionId(),
                        execution.getMode().name(),
                        execution.getLanguage(),
                        execution.getStatus().name(),
                        execution.getPassedTests(),
                        execution.getTotalTests(),
                        execution.getCreatedAt()))
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<LearnerTestCaseDto> readSnapshotTestCases(AssessmentAttemptQuestion attemptQuestion) {
        try {
            if (attemptQuestion.getQuestionDataSnapshot() == null) {
                return List.of();
            }
            Map<String, Object> data = objectMapper.readValue(
                    attemptQuestion.getQuestionDataSnapshot(),
                    new TypeReference<Map<String, Object>>() {});
            return parseLearnerTestCases(data);
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<LearnerTestCaseDto> parseLearnerTestCases(Map<String, Object> data) {
        List<LearnerTestCaseDto> tests = new ArrayList<>();
        Object raw = data.get("testCases");
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object indexValue = map.get("index");
                    tests.add(new LearnerTestCaseDto(
                            indexValue == null ? tests.size() + 1
                                    : Integer.parseInt(indexValue.toString()),
                            (String) map.get("label"),
                            Boolean.TRUE.equals(map.get("sample")),
                            (String) map.get("input"),
                            "NOT_RUN",
                            null,
                            null));
                }
            }
        }
        return tests;
    }
}
