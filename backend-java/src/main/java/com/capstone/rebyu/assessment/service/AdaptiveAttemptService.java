package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Candidate;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Selection;
import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.engine.IrtModel.ItemParams;
import com.capstone.rebyu.adaptive.entity.QuestionItemParameter;
import com.capstone.rebyu.adaptive.repository.QuestionItemParameterRepository;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.adaptive.service.LearnerAbilityService;
import com.capstone.rebyu.adaptive.service.QuestionBankSizeService;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveAnswerResponseDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveProgressDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveVerdictDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AttemptAnswerDraftDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.LearnerAttemptQuestionDto;
import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.entity.Choice;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.common.BusinessRuleException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * The adaptive session: one question at a time, chosen by the engine from
 * what the learner has answered so far.
 *
 * <p>Sits beside {@link AssessmentAttemptService} in its package so it can
 * reuse the same snapshot builder and the same graders -- there is exactly one
 * way an answer is marked in this system, and this class does not add a
 * second. What it adds is everything between two answers: the ability update
 * (IRT), the knowledge-state update (BKT), the item's own learning (online
 * difficulty), and the choice of what to ask next.
 *
 * <p>Main-round items are marked as they are answered. Final-round items
 * (programming, diagram, critical thinking) are saved as they are answered
 * and marked together at submit, where the graders run concurrently -- a
 * learner should not sit through a test-runner and a diagram comparison
 * between every problem, and nothing after the final round depends on them.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveAttemptService {

    private final AssessmentAttemptService attempts;
    private final AdaptiveProperties properties;
    private final AdaptivePolicy policy;
    private final BktProperties bktProperties;
    private final QuestionBankSizeService bankSize;
    private final LearnerAbilityService abilities;
    private final QuestionItemParameterRepository itemParameters;
    private final QuestionRepository questionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final ObjectMapper objectMapper;

    /*
     * The candidate pool of an exam -- every question in its scope with its
     * item parameters -- cached for a few minutes. Building it is the widest
     * query in the session (a mock exam's scope is the whole certification),
     * and it is needed after every answer to pick the next item; the bank
     * does not change between two answers, and a parameter nudged online is
     * written back into the cached entry as it happens.
     */
    private record CachedPool(List<QuestionSelectionView> views, Map<Long, Candidate> candidates,
                              Map<Long, QuestionItemParameter> parameters, java.time.Instant at) {
    }

    /*
     * Questions served recently, whole (choices and configs loaded), keyed by
     * id. The item chosen for a learner is loaded once when it is served and
     * read again from here when it is marked one request later -- against a
     * database in another region every round trip saved is felt. Detached
     * entities, read only; nothing here is ever saved back.
     */
    private final Map<Long, Question> questionCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int QUESTION_CACHE_MAX = 4000;

    private static final java.time.Duration POOL_TTL = java.time.Duration.ofMinutes(5);
    private final Map<Long, CachedPool> poolCache = new java.util.concurrent.ConcurrentHashMap<>();

    // ------------------------------------------------------------------
    // Start
    // ------------------------------------------------------------------

    @Transactional
    public AssessmentAttempt start(Exam exam, Long learnerId, int attemptNumber, String idempotencyKey) {
        com.capstone.rebyu.common.PhaseTimer timer = com.capstone.rebyu.common.PhaseTimer.start("adaptive start exam=" + exam.getExamId(), log);
        List<QuestionSelectionView> pool = cachedPool(exam).views();
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "pool");
        QuestionBankSizeService.BankSize size = bankSize.measure(exam, pool);
        if (pool.isEmpty() || size.main() == 0) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    bankSize.shortfallMessage(exam, size));
        }

        String examType = exam.getExamType().getExamTypeText();
        int target = policy.targetCount(examType);
        int finalRound = Math.min(properties.getFinalRoundMax(), size.workspace());
        int mainTarget = Math.max(1, target - finalRound);
        /* A thin bank still runs, just shorter: repeats are what the tiers are
           for, but a paper of ten from a bank of four would be nothing but
           repeats, so the target is capped at what the bank can carry. */
        mainTarget = Math.min(mainTarget, Math.max(1, size.main()));
        target = mainTarget + finalRound;

        Map<Long, Integer> poolCountByLesson = new LinkedHashMap<>();
        Map<String, Integer> poolCountByType = new LinkedHashMap<>();
        for (QuestionSelectionView view : pool) {
            if (!AdaptivePolicy.isWorkspaceType(view.getQuestionType())) {
                poolCountByLesson.merge(view.getLessonId(), 1, Integer::sum);
                poolCountByType.merge(AdaptiveItemSelector.normaliseType(view.getQuestionType()), 1, Integer::sum);
            }
        }
        Long certificationId = exam.getCertification().getCertificationId();
        LearnerAbilityService.Seed seed = abilities.seed(learnerId, certificationId, poolCountByLesson);

        AdaptiveSessionState state = new AdaptiveSessionState();
        state.setMu0(seed.mu0());
        state.setSigma0(seed.sigma0());
        state.setTheta(seed.mu0());
        state.setSe(seed.sigma0());
        state.setTargetCount(target);
        state.setMainCount(mainTarget);
        state.setFinalRoundCount(finalRound);
        state.setStage(AdaptiveSessionState.STAGE_MAIN);
        state.setPKnownByLesson(new LinkedHashMap<>(seed.pKnownByLesson()));
        state.setParamsByLesson(new LinkedHashMap<>(seed.paramsByLesson()));
        state.setPoolCountByLesson(poolCountByLesson);
        state.setPoolCountByType(poolCountByType);

        /* What this learner has met before, in any attempt of anything, and
           what was on their last attempt of this very exam. Snapshotted now so
           the tiers do not shift under the session as it writes its own rows. */
        List<Long> poolIds = pool.stream().map(QuestionSelectionView::getQuestionId).toList();
        Set<Long> seen = new LinkedHashSet<>();
        Long lastAttemptId = attemptRepository
                .findByExam_ExamIdAndLearnerIdAndStatus(exam.getExamId(), learnerId, AssessmentAttempt.Status.SUBMITTED)
                .stream()
                .filter(a -> a.getSubmittedAt() != null)
                .max(Comparator.comparing(AssessmentAttempt::getSubmittedAt))
                .map(AssessmentAttempt::getAssessmentAttemptId)
                .orElse(null);
        Set<Long> lastAttemptIds = new LinkedHashSet<>();
        if (!poolIds.isEmpty()) {
            for (var row : attemptQuestionRepository.findExposure(learnerId, poolIds)) {
                seen.add(row.getSourceQuestionId());
            }
            if (lastAttemptId != null) {
                for (AssessmentAttemptQuestion q : attemptQuestionRepository
                        .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(lastAttemptId)) {
                    lastAttemptIds.add(q.getSourceQuestionId());
                }
            }
        }
        state.setSeenQuestionIds(seen);
        state.setLastAttemptQuestionIds(lastAttemptIds);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "seed + exposure");

        /* Per-assessment point overrides from the optional seed list, read once. */
        Map<Long, BigDecimal> overrides = new LinkedHashMap<>();
        for (ExamQuestion seedRow : examQuestionRepository.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId())) {
            if (seedRow.getPoints() != null) overrides.put(seedRow.getQuestion().getQuestionId(), seedRow.getPoints());
        }
        state.setPointsOverride(overrides);

        LocalDateTime now = LocalDateTime.now();
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .exam(exam)
                .learnerId(learnerId)
                .enrollmentId(attempts.findEnrollmentId(exam, learnerId))
                .attemptNumber(attemptNumber)
                .status(AssessmentAttempt.Status.IN_PROGRESS)
                .startedAt(now)
                .expiresAt(exam.getDurationMinutes() != null ? now.plusMinutes(exam.getDurationMinutes()) : null)
                .idempotencyKey(idempotencyKey != null && !idempotencyKey.isBlank()
                        ? idempotencyKey : UUID.randomUUID().toString())
                .adaptive(true)
                .thetaStart(seed.mu0())
                .thetaCurrent(seed.mu0())
                .thetaSe(seed.sigma0())
                .targetQuestionCount(target)
                .finalRoundCount(finalRound)
                .phase(AdaptiveSessionState.STAGE_MAIN)
                .build();
        attempt = attemptRepository.save(attempt);

        /* Two items at once: the one being asked and the one behind it. The
           client shows the reserve the moment the first is answered and the
           server catches up in the background, so the learner never waits on
           a round trip between questions. The reserve is chosen from all
           answers but the very latest -- one step of lag, on a paper of ten
           to sixty items. */
        LearnerAttemptQuestionDto first = serveNext(attempt, state);
        attempt.setCurrentQuestionId(first.attemptQuestionId());
        topUpReserve(attempt, state);
        saveState(attempt, state);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "serve first");
        com.capstone.rebyu.common.PhaseTimer.finish(timer);
        return attempt;
    }

    private CachedPool cachedPool(Exam exam) {
        CachedPool cached = poolCache.get(exam.getExamId());
        if (cached != null && cached.at().plus(POOL_TTL).isAfter(java.time.Instant.now())) {
            return cached;
        }
        List<QuestionSelectionView> views = bankSize.pool(exam);
        Map<Long, QuestionItemParameter> parameters = views.isEmpty() ? Map.of() : itemParameters
                .findAllById(views.stream().map(QuestionSelectionView::getQuestionId).toList())
                .stream().collect(Collectors.toMap(QuestionItemParameter::getQuestionId, x -> x));
        Map<Long, Candidate> candidates = new LinkedHashMap<>();
        for (Candidate c : toCandidates(views, parameters)) candidates.put(c.questionId(), c);
        CachedPool fresh = new CachedPool(views, candidates, new java.util.concurrent.ConcurrentHashMap<>(parameters), java.time.Instant.now());
        poolCache.put(exam.getExamId(), fresh);
        return fresh;
    }

    // ------------------------------------------------------------------
    // Answer
    // ------------------------------------------------------------------

    @Transactional
    public AdaptiveAnswerResponseDto answer(Long attemptId, Long learnerId, AttemptAnswerDraftDto draft) {
        AssessmentAttempt attempt = attempts.requireOwnedAttempt(attemptId, learnerId);
        if (!attempt.isAdaptive()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This assessment is not adaptive.");
        }
        attempts.requireEditable(attempt);
        if (draft == null || draft.attemptQuestionId() == null) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException("No answer was sent.");
        }
        AssessmentAttemptQuestion item = attempts.requireAttemptQuestion(attempt, draft.attemptQuestionId());
        AdaptiveSessionState state = loadState(attempt);
        com.capstone.rebyu.common.PhaseTimer timer = com.capstone.rebyu.common.PhaseTimer.start("adaptive answer attempt=" + attemptId, log);

        /* Only the item being asked can be answered; anything else is a
           replay (the same answer arriving twice) or an out-of-order request. */
        boolean isCurrent = Objects.equals(attempt.getCurrentQuestionId(), item.getAttemptQuestionId());
        if (!isCurrent) {
            Optional<AssessmentAttemptAnswer> existing = attemptAnswerRepository
                    .findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
                            attemptId, item.getAttemptQuestionId());
            if (existing.isPresent() && state.getServedQuestionIds().contains(item.getSourceQuestionId())) {
                return replay(attempt, state, item, existing.get());
            }
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "That question is not the one being asked.");
        }

        boolean finalRound = AdaptiveSessionState.STAGE_FINAL.equals(item.getStage());
        if (!finalRound && !attempts.hasAnswerContent(draft)) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "Choose or type an answer first.");
        }

        AssessmentAttemptAnswer answer = attemptAnswerRepository
                .findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
                        attemptId, item.getAttemptQuestionId())
                .orElseGet(() -> AssessmentAttemptAnswer.builder().attempt(attempt).attemptQuestion(item).build());
        answer.setLearnerAnswer(draft.learnerAnswer());
        answer.setSelectedChoiceId(draft.selectedChoiceId());
        answer.setSubmittedCode(draft.submittedCode());
        answer.setProgrammingLanguage(draft.programmingLanguage());
        answer.setDiagramSubmissionData(draft.diagramSubmissionData());
        LocalDateTime savedAt = LocalDateTime.now();
        answer.setAnsweredAt(savedAt);
        answer.setLastSavedAt(savedAt);
        answer = attemptAnswerRepository.save(answer);

        com.capstone.rebyu.common.PhaseTimer.mark(timer, "save answer");
        AdaptiveVerdictDto verdict = null;
        if (!finalRound) {
            verdict = gradeNow(attempt, item, answer, state);
            com.capstone.rebyu.common.PhaseTimer.mark(timer, "grade + update");
        }
        state.setAnsweredCount(state.getAnsweredCount() + 1);

        /* What comes next: the reserve becomes the question being asked, and
           a new reserve is served behind it. */
        boolean enteringFinal = false;
        LearnerAttemptQuestionDto next = null;
        if (!state.getQueuedAttemptQuestionIds().isEmpty()) {
            Long nextId = state.getQueuedAttemptQuestionIds().remove(0);
            AssessmentAttemptQuestion queued = attemptQuestionRepository.findById(nextId).orElse(null);
            if (queued != null) {
                next = withKey(attempt, queued, attempts.toLearnerQuestion(queued));
                attempt.setCurrentQuestionId(queued.getAttemptQuestionId());
                boolean nowFinal = AdaptiveSessionState.STAGE_FINAL.equals(queued.getStage());
                if (nowFinal && !state.inFinalRound()) {
                    state.setStage(AdaptiveSessionState.STAGE_FINAL);
                    attempt.setPhase(AdaptiveSessionState.STAGE_FINAL);
                    enteringFinal = true;
                }
            }
        }
        List<LearnerAttemptQuestionDto> reserve = next == null ? List.of() : topUpReserve(attempt, state);
        if (next == null) {
            finish(attempt, state);
        }
        saveState(attempt, state);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "serve next + state");
        com.capstone.rebyu.common.PhaseTimer.finish(timer);
        return new AdaptiveAnswerResponseDto(verdict, progressOf(attempt, state), next, reserve, enteringFinal, state.done());
    }

    /**
     * Keeps RESERVE_DEPTH items served behind the one being asked, and returns
     * every reserve item (old and new) so the client can hold all of them.
     * Two ahead rather than one: the client shows a reserve the instant an
     * answer is given, and with a slow link one item was not always back in
     * time for the next press.
     */
    private List<LearnerAttemptQuestionDto> topUpReserve(AssessmentAttempt attempt, AdaptiveSessionState state) {
        List<LearnerAttemptQuestionDto> reserve = new ArrayList<>();
        for (Long id : state.getQueuedAttemptQuestionIds()) {
            attemptQuestionRepository.findById(id)
                    .map(q -> withKey(attempt, q, attempts.toLearnerQuestion(q)))
                    .ifPresent(reserve::add);
        }
        while (state.getQueuedAttemptQuestionIds().size() < AdaptiveSessionState.RESERVE_DEPTH
                && state.getServedCount() < state.getTargetCount()) {
            LearnerAttemptQuestionDto served = serveNext(attempt, state);
            if (served == null) break;
            state.getQueuedAttemptQuestionIds().add(served.attemptQuestionId());
            reserve.add(served);
        }
        return reserve;
    }

    /** A second delivery of an answer already taken: the same response, nothing recomputed. */
    private AdaptiveAnswerResponseDto replay(
            AssessmentAttempt attempt, AdaptiveSessionState state,
            AssessmentAttemptQuestion item, AssessmentAttemptAnswer answer) {
        AdaptiveVerdictDto verdict = AssessmentAttemptService.hasDefinitiveVerdict(answer)
                ? verdictOf(attempt, item, answer) : null;
        LearnerAttemptQuestionDto next = null;
        List<LearnerAttemptQuestionDto> reserve = new ArrayList<>();
        if (attempt.getCurrentQuestionId() != null) {
            next = attemptQuestionRepository.findById(attempt.getCurrentQuestionId())
                    .map(q -> withKey(attempt, q, attempts.toLearnerQuestion(q))).orElse(null);
        }
        for (Long id : state.getQueuedAttemptQuestionIds()) {
            attemptQuestionRepository.findById(id)
                    .map(q -> withKey(attempt, q, attempts.toLearnerQuestion(q))).ifPresent(reserve::add);
        }
        return new AdaptiveAnswerResponseDto(verdict, progressOf(attempt, state), next, reserve, false, state.done());
    }

    private AdaptiveVerdictDto gradeNow(
            AssessmentAttempt attempt, AssessmentAttemptQuestion item,
            AssessmentAttemptAnswer answer, AdaptiveSessionState state) {

        Question source = loadQuestion(item.getSourceQuestionId());
        if (source == null) {
            answer.setIsCorrect(false);
            answer.setEarnedPoints(BigDecimal.ZERO);
            answer.setPendingManualEvaluation(false);
            attemptAnswerRepository.save(answer);
            return new AdaptiveVerdictDto(false, BigDecimal.ZERO, item.getPoints(), null, null, null, null,
                    "This question is no longer available and was not counted against you.", List.of());
        }
        Map<Long, Question> sources = Map.of(source.getQuestionId(), source);
        Map<Long, List<Question>> subs = subQuestionsOf(source);
        BigDecimal points = item.getPoints() == null ? BigDecimal.ONE : item.getPoints();

        GradingBatch batch = attempts.prepareGradingBatch(
                List.of(item), Map.of(item.getAttemptQuestionId(), answer), sources, subs);
        attempts.scoreAnswer(item, answer, points, batch, sources, subs);
        attemptAnswerRepository.save(answer);

        /* The engine's view of the response: right or wrong. Partial credit
           counts as right above the same threshold the mastery service uses. */
        boolean correct = Boolean.TRUE.equals(answer.getIsCorrect());
        if (!correct && answer.getEarnedPoints() != null && points.signum() > 0) {
            correct = answer.getEarnedPoints().doubleValue() / points.doubleValue()
                    >= bktProperties.getPartialCreditCorrectThreshold();
        }

        // --- IRT: ability -------------------------------------------------
        ItemParams params = itemParamsOf(attempt.getExam(), source);
        double thetaBefore = state.getTheta();
        state.getResponses().add(new AdaptiveSessionState.ResponseRecord(
                source.getQuestionId(), item.getLessonId(), params, correct));
        IrtModel.Estimate estimate = IrtModel.estimateEap(state.getMu0(), state.getSigma0(), state.irtResponses());
        state.setTheta(estimate.theta());
        state.setSe(estimate.standardError());
        item.setThetaAfter(estimate.theta());
        attemptQuestionRepository.save(item);
        attempt.setThetaCurrent(estimate.theta());
        attempt.setThetaSe(estimate.standardError());

        // --- BKT: knowledge of this lesson --------------------------------
        Long lessonId = item.getLessonId();
        if (lessonId != null) {
            BktModel.Params bkt = state.getParamsByLesson().getOrDefault(lessonId, defaultBkt());
            double p = state.getPKnownByLesson().getOrDefault(lessonId, bkt.prior());
            state.getPKnownByLesson().put(lessonId, BktModel.update(p, correct, bkt));
        }

        // --- The item learns too ------------------------------------------
        ItemParams learned = learnItem(attempt.getExam(), source, params, thetaBefore, correct);
        CachedPool pool = poolCache.get(attempt.getExam().getExamId());
        Candidate old = pool == null ? null : pool.candidates().get(source.getQuestionId());
        if (old != null) {
            pool.candidates().put(source.getQuestionId(), new Candidate(old.questionId(), old.lessonId(),
                    old.questionType(), old.questionText(), learned, old.workspace()));
        }

        return verdictOf(attempt, item, answer, source, subs);
    }

    private Question loadQuestion(Long questionId) {
        Question cached = questionCache.get(questionId);
        if (cached != null) return cached;
        Question loaded = questionRepository.findForAttemptByIdIn(List.of(questionId)).stream().findFirst().orElse(null);
        if (loaded != null) {
            if (questionCache.size() >= QUESTION_CACHE_MAX) questionCache.clear();
            questionCache.put(questionId, loaded);
        }
        return loaded;
    }

    private AdaptiveVerdictDto verdictOf(AssessmentAttempt attempt, AssessmentAttemptQuestion item, AssessmentAttemptAnswer answer) {
        Question source = loadQuestion(item.getSourceQuestionId());
        return verdictOf(attempt, item, answer, source, source == null ? Map.of() : subQuestionsOf(source));
    }

    /** A multiple-choice question has no parts; only the other types are asked for theirs. */
    private Map<Long, List<Question>> subQuestionsOf(Question source) {
        if (AssessmentAttemptService.isMultipleChoice(source.getQuestionType())) return Map.of();
        return questionRepository.findSubQuestionsByParentIdIn(List.of(source.getQuestionId()))
                .stream().collect(Collectors.groupingBy(q -> q.getParentQuestion().getQuestionId()));
    }

    /**
     * What the learner is told about the item just answered. The correct
     * answer and its explanation are released only when the assessment
     * releases answers -- that setting keeps its meaning here.
     */
    private AdaptiveVerdictDto verdictOf(
            AssessmentAttempt attempt, AssessmentAttemptQuestion item, AssessmentAttemptAnswer answer,
            Question source, Map<Long, List<Question>> subs) {
        boolean release = attempt.getExam().effectiveReleaseAnswers();
        Long correctChoiceId = null;
        String correctChoiceText = null;
        String explanation = null;
        String acceptedAnswer = null;
        if (source != null && release) {
            if (AssessmentAttemptService.isMultipleChoice(item.getQuestionType())) {
                Choice correct = source.getChoices().stream().filter(Choice::isCorrect).findFirst().orElse(null);
                if (correct != null) {
                    correctChoiceId = correct.getChoiceId();
                    correctChoiceText = correct.getChoiceText();
                    explanation = correct.getExplanation();
                }
            } else if (source.getTextQuestionConfig() != null) {
                acceptedAnswer = source.getTextQuestionConfig().getCorrectAnswer();
            }
        }
        List<com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.SubQuestionAnswerReviewDto> subReviews =
                source == null ? List.of() : attempts.buildSubQuestionAnswerReviews(source, answer, subs);
        return new AdaptiveVerdictDto(
                answer.getIsCorrect(), answer.getEarnedPoints(), item.getPoints(),
                correctChoiceId, correctChoiceText, acceptedAnswer, explanation, answer.getFeedback(), subReviews);
    }

    // ------------------------------------------------------------------
    // Selection
    // ------------------------------------------------------------------

    /**
     * Picks and snapshots the next item. Returns null when the pool for the
     * current stage is exhausted, which ends the session early.
     */
    private LearnerAttemptQuestionDto serveNext(AssessmentAttempt attempt, AdaptiveSessionState state) {
        /* An item's round is its position on the paper: the last
           finalRoundCount slots are the final round. */
        boolean finalRound = state.getServedCount() + 1 > state.getMainCount();
        List<Candidate> candidates = cachedPool(attempt.getExam()).candidates().values().stream()
                .filter(c -> c.workspace() == finalRound)
                .toList();

        AdaptiveItemSelector.Settings settings = new AdaptiveItemSelector.Settings(
                properties.getLessonExplorationWeight(), properties.getRandomesqueTopK(), !finalRound);
        Optional<Selection> selection = AdaptiveItemSelector.select(state, candidates, settings, ThreadLocalRandom.current());
        if (selection.isEmpty()) {
            log.warn("Adaptive attempt {}: no candidate left for stage {} after {} items",
                    attempt.getAssessmentAttemptId(), state.getStage(), state.getServedCount());
            return null;
        }
        Candidate chosen = selection.get().candidate();
        Question question = loadQuestion(chosen.questionId());
        if (question == null) {
            return null;
        }

        BigDecimal points = state.getPointsOverride().getOrDefault(question.getQuestionId(), question.getTotalPoints());
        AssessmentAttemptService.SnapshotContext context =
                AssessmentAttemptService.isMultipleChoice(question.getQuestionType())
                        ? AssessmentAttemptService.SnapshotContext.empty()
                        : attempts.buildSnapshotContext(List.of(question));
        AssessmentAttemptQuestion item = AssessmentAttemptQuestion.builder()
                .attempt(attempt)
                .sourceQuestionId(question.getQuestionId())
                .questionType(AssessmentAttemptService.normalizeQuestionType(question.getQuestionType()))
                .questionTextSnapshot(question.getQuestionText())
                .questionDataSnapshot(attempts.buildLearnerSafeSnapshot(question, context))
                .displayOrder(state.getServedCount() + 1)
                .points(points)
                .lessonId(question.getLesson().getLessonId())
                .thetaBefore(state.getTheta())
                .itemInformation(selection.get().reason().information())
                .selectionReason(toJson(selection.get().reason()))
                .servedAt(LocalDateTime.now())
                .stage(finalRound ? AdaptiveSessionState.STAGE_FINAL : AdaptiveSessionState.STAGE_MAIN)
                .build();
        item = attemptQuestionRepository.save(item);

        state.setServedCount(state.getServedCount() + 1);
        state.getServedQuestionIds().add(question.getQuestionId());
        state.getServedStems().add(QuestionStem.of(question.getQuestionText()));
        if (!finalRound) {
            state.getServedCountByLesson().merge(item.getLessonId(), 1, Integer::sum);
            state.getServedCountByType().merge(AdaptiveItemSelector.normaliseType(question.getQuestionType()), 1, Integer::sum);
        }
        return withKey(attempt, item, attempts.toLearnerQuestion(item), question);
    }

    /**
     * The answer key rides with a main-round item so the client can mark the
     * answer the instant it is given, without a round trip. Only when the
     * assessment releases answers, and never for a final-round item, whose
     * marking is a grader's job.
     */
    /** Adds the answer key to a served item's DTO where one applies (start/resume response). */
    public LearnerAttemptQuestionDto decorate(AssessmentAttempt attempt, AssessmentAttemptQuestion item, LearnerAttemptQuestionDto dto) {
        return withKey(attempt, item, dto);
    }

    private LearnerAttemptQuestionDto withKey(AssessmentAttempt attempt, AssessmentAttemptQuestion item, LearnerAttemptQuestionDto dto) {
        if (AdaptiveSessionState.STAGE_FINAL.equals(item.getStage())) return dto;
        return withKey(attempt, item, dto, loadQuestion(item.getSourceQuestionId()));
    }

    private LearnerAttemptQuestionDto withKey(AssessmentAttempt attempt, AssessmentAttemptQuestion item,
                                              LearnerAttemptQuestionDto dto, Question source) {
        if (source == null || AdaptiveSessionState.STAGE_FINAL.equals(item.getStage())
                || !attempt.getExam().effectiveReleaseAnswers()) {
            return dto;
        }
        if (AssessmentAttemptService.isMultipleChoice(item.getQuestionType())) {
            Choice correct = source.getChoices().stream().filter(Choice::isCorrect).findFirst().orElse(null);
            if (correct == null) return dto;
            return dto.withAnswerKey(new com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveAnswerKeyDto(
                    correct.getChoiceId(), correct.getChoiceText(), List.of(), correct.getExplanation()));
        }
        if ("SHORT_ANSWER".equals(item.getQuestionType()) && source.getTextQuestionConfig() != null
                && "EXACT_MATCH".equalsIgnoreCase(source.getTextQuestionConfig().getCheckingMethod())
                && (dto.subQuestions() == null || dto.subQuestions().isEmpty())) {
            List<String> accepted = new ArrayList<>();
            if (source.getTextQuestionConfig().getCorrectAnswer() != null) accepted.add(source.getTextQuestionConfig().getCorrectAnswer());
            String variations = source.getTextQuestionConfig().getAcceptedVariations();
            if (variations != null) {
                for (String v : variations.split("\\r?\\n")) if (!v.isBlank()) accepted.add(v.trim());
            }
            return dto.withAnswerKey(new com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveAnswerKeyDto(
                    null, null, accepted, null));
        }
        return dto;
    }

    private List<Candidate> toCandidates(List<QuestionSelectionView> views, Map<Long, QuestionItemParameter> known) {
        if (views.isEmpty()) return List.of();
        List<Candidate> out = new ArrayList<>(views.size());
        for (QuestionSelectionView view : views) {
            QuestionItemParameter stored = known.get(view.getQuestionId());
            ItemParams params = stored != null
                    ? new ItemParams(stored.getDiscrimination(), stored.getDifficulty(), stored.getGuessing())
                    : IrtModel.defaultParams(view.getDifficultyLevel(),
                            AdaptivePolicy.isMultipleChoice(view.getQuestionType()), 4);
            out.add(new Candidate(view.getQuestionId(), view.getLessonId(), view.getQuestionType(),
                    view.getQuestionText(), params, AdaptivePolicy.isWorkspaceType(view.getQuestionType())));
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Item parameters
    // ------------------------------------------------------------------

    private ItemParams itemParamsOf(Exam exam, Question source) {
        Candidate cached = cachedPool(exam).candidates().get(source.getQuestionId());
        if (cached != null) return cached.params();
        return itemParameters.findById(source.getQuestionId())
                .map(p -> new ItemParams(p.getDiscrimination(), p.getDifficulty(), p.getGuessing()))
                .orElseGet(() -> IrtModel.defaultParams(source.getDifficultyLevel(),
                        AdaptivePolicy.isMultipleChoice(source.getQuestionType()),
                        source.getChoices() == null ? 4 : source.getChoices().size()));
    }

    /** Online learning of the item's difficulty from this one response. */
    private ItemParams learnItem(Exam exam, Question source, ItemParams before, double thetaBefore, boolean correct) {
        CachedPool pool = cachedPool(exam);
        QuestionItemParameter row = pool.parameters().get(source.getQuestionId());
        boolean isNew = row == null;
        if (isNew) {
            row = QuestionItemParameter.builder()
                    .questionId(source.getQuestionId())
                    .discrimination(before.a()).difficulty(before.b()).guessing(before.c())
                    .responseCount(0).source(QuestionItemParameter.SOURCE_ONLINE).build();
        }
        boolean calibrated = QuestionItemParameter.SOURCE_CALIBRATED.equals(row.getSource());
        double k0 = calibrated ? properties.getCalibratedKDifficulty() : properties.getOnlineKDifficulty();
        double k = k0 / (1.0 + row.getResponseCount() / 20.0);
        ItemParams after = IrtModel.updateDifficulty(before, thetaBefore, correct, k);
        row.setDifficulty(after.b());
        row.setResponseCount(row.getResponseCount() + 1);
        row.setUpdatedAt(LocalDateTime.now());
        /* One statement either way: an upsert for a row never written, a
           column update for one that exists -- no read-before-write. */
        itemParameters.upsert(row.getQuestionId(), row.getDiscrimination(), row.getDifficulty(), row.getGuessing(),
                row.getResponseCount(), row.getSource(), row.getUpdatedAt());
        pool.parameters().put(source.getQuestionId(), row);
        return after;
    }

    private BktModel.Params defaultBkt() {
        return new BktModel.Params(properties.getDefaultPrior(), properties.getDefaultLearn(),
                properties.getDefaultGuess(), properties.getDefaultSlip());
    }

    // ------------------------------------------------------------------
    // End of session
    // ------------------------------------------------------------------

    private void finish(AssessmentAttempt attempt, AdaptiveSessionState state) {
        state.setStage(AdaptiveSessionState.STAGE_DONE);
        state.setTargetCount(state.getServedCount());
        attempt.setPhase(AdaptiveSessionState.STAGE_DONE);
        attempt.setTargetQuestionCount(state.getServedCount());
        attempt.setCurrentQuestionId(null);
        persistLearner(attempt, state);
    }

    /* The learner's ability and knowledge states, written once the session
       is over. Writing them after every answer cost two round trips an item;
       the attempt row carries the running theta meanwhile, and an abandoned
       attempt is not evidence the next session should start from anyway. */
    private void persistLearner(AssessmentAttempt attempt, AdaptiveSessionState state) {
        Long certificationId = attempt.getExam().getCertification().getCertificationId();
        abilities.persistAbility(attempt.getLearnerId(), certificationId, state, state.getResponses().size());
        abilities.persistSkillStates(attempt.getLearnerId(), state);
    }

    /** Called by submit once the paper is scored: the final-round items now have marks too. */
    @Transactional
    public void onSubmitted(AssessmentAttempt attempt) {
        AdaptiveSessionState state = loadState(attempt);
        if (!state.done()) {
            state.setStage(AdaptiveSessionState.STAGE_DONE);
            attempt.setPhase(AdaptiveSessionState.STAGE_DONE);
            attempt.setCurrentQuestionId(null);
            persistLearner(attempt, state);
            saveState(attempt, state);
        }
    }

    // ------------------------------------------------------------------
    // Progress / state
    // ------------------------------------------------------------------

    public AdaptiveProgressDto progressOf(AssessmentAttempt attempt) {
        return progressOf(attempt, loadState(attempt));
    }

    private AdaptiveProgressDto progressOf(AssessmentAttempt attempt, AdaptiveSessionState state) {
        return new AdaptiveProgressDto(
                state.getAnsweredCount(), state.getTargetCount(), state.getMainCount(),
                state.getFinalRoundCount(), state.getStage(), attempt.getCurrentQuestionId(),
                state.getQueuedAttemptQuestionId());
    }

    private AdaptiveSessionState loadState(AssessmentAttempt attempt) {
        try {
            if (attempt.getAdaptiveStateJson() != null) {
                return objectMapper.readValue(attempt.getAdaptiveStateJson(), AdaptiveSessionState.class);
            }
        } catch (Exception e) {
            log.error("Adaptive state of attempt {} is unreadable: {}", attempt.getAssessmentAttemptId(), e.getMessage());
        }
        AdaptiveSessionState empty = new AdaptiveSessionState();
        empty.setStage(attempt.getPhase() == null ? AdaptiveSessionState.STAGE_DONE : attempt.getPhase());
        empty.setTargetCount(attempt.getTargetQuestionCount() == null ? 0 : attempt.getTargetQuestionCount());
        return empty;
    }

    private void saveState(AssessmentAttempt attempt, AdaptiveSessionState state) {
        attempt.setAdaptiveStateJson(toJson(state));
        attemptRepository.save(attempt);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialise adaptive state", e);
        }
    }
}
