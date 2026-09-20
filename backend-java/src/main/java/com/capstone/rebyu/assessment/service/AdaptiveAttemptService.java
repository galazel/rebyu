package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Candidate;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Selection;
import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.engine.IrtModel.ItemParams;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.adaptive.service.LearnerAbilityService;
import com.capstone.rebyu.adaptive.service.QuestionBankSizeService;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveAnswerResponseDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AdaptiveAnswersResponseDto;
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
     * does not change between two answers.
     */
    private record CachedPool(List<QuestionSelectionView> views, Map<Long, Candidate> candidates,
                              java.time.Instant at) {
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

    /*
     * A question's parts and rubric, loaded with it: a short-answer item with
     * blanks is asked for its parts when it is served and again when it is
     * marked, and a written item for its rubric -- two queries each time,
     * against the same rows. Keyed like questionCache and cleared with it.
     */
    private final Map<Long, AssessmentAttemptService.SnapshotContext> contextCache = new java.util.concurrent.ConcurrentHashMap<>();

    /*
     * What each served item looked like when it went out, keyed by
     * attempt-question id. An answer moves the next reserve item into the
     * asked position, and the client already holds that item from when it was
     * served -- so nothing is re-read to name it; on a miss (another node, a
     * restart) it is read from the database as before.
     */
    private final Map<Long, LearnerAttemptQuestionDto> servedCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int SERVED_CACHE_MAX = 20000;

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
        int finalRound = AdaptivePolicy.allowsFinalRound(examType)
                ? Math.min(properties.getFinalRoundMax(), size.workspace()) : 0;
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
        List<LearnerAttemptQuestionDto> served = serveMany(attempt, state, 1 + AdaptiveSessionState.START_RESERVE);
        if (served.isEmpty()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    bankSize.shortfallMessage(exam, size));
        }
        attempt.setCurrentQuestionId(served.get(0).attemptQuestionId());
        for (LearnerAttemptQuestionDto reserve : served.subList(1, served.size())) {
            state.getQueuedAttemptQuestionIds().add(reserve.attemptQuestionId());
        }
        saveState(attempt, state);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "serve first + reserve");
        com.capstone.rebyu.common.PhaseTimer.finish(timer);
        return attempt;
    }

    private CachedPool cachedPool(Exam exam) {
        CachedPool cached = poolCache.get(exam.getExamId());
        if (cached != null && cached.at().plus(POOL_TTL).isAfter(java.time.Instant.now())) {
            return cached;
        }
        List<QuestionSelectionView> views = bankSize.pool(exam);
        Map<Long, Candidate> candidates = new LinkedHashMap<>();
        for (Candidate c : toCandidates(views)) candidates.put(c.questionId(), c);
        CachedPool fresh = new CachedPool(views, candidates, java.time.Instant.now());
        poolCache.put(exam.getExamId(), fresh);
        return fresh;
    }

    // ------------------------------------------------------------------
    // Answer
    // ------------------------------------------------------------------

    @Transactional
    public AdaptiveAnswerResponseDto answer(Long attemptId, Long learnerId, AttemptAnswerDraftDto draft) {
        if (draft == null || draft.attemptQuestionId() == null) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException("No answer was sent.");
        }
        AdaptiveAnswersResponseDto batch = answerAll(attemptId, learnerId, List.of(draft));
        return new AdaptiveAnswerResponseDto(batch.verdicts().get(draft.attemptQuestionId()), batch.progress(),
                batch.next(), batch.queued(), batch.enteringFinalRound(), batch.completed());
    }

    /**
     * Takes every answer the client has queued, in the order given, in one
     * request. A learner who answers faster than one round trip per item
     * used to build a backlog the client drained one request at a time, and
     * once it fell three behind the next question was not there yet; now the
     * whole backlog costs one request, and the reserve is topped up once at
     * the end rather than after each answer.
     *
     * <p>Each answer must be for the item being asked at its turn; one that
     * is not is a replay (answered again, returned as it was) or out of
     * order (refused). The verdicts come back keyed by item.
     */
    @Transactional
    public AdaptiveAnswersResponseDto answerAll(Long attemptId, Long learnerId, List<AttemptAnswerDraftDto> drafts) {
        AssessmentAttempt attempt = attempts.requireOwnedAttempt(attemptId, learnerId);
        if (!attempt.isAdaptive()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    "This assessment is not adaptive.");
        }
        attempts.requireEditable(attempt);
        if (drafts == null || drafts.isEmpty() || drafts.stream().anyMatch(d -> d == null || d.attemptQuestionId() == null)) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException("No answer was sent.");
        }
        AdaptiveSessionState state = loadState(attempt);
        com.capstone.rebyu.common.PhaseTimer timer = com.capstone.rebyu.common.PhaseTimer.start(
                "adaptive answer attempt=" + attemptId + " x" + drafts.size(), log);

        /* The items answered, in one read. */
        Map<Long, AssessmentAttemptQuestion> items = new LinkedHashMap<>();
        for (AssessmentAttemptQuestion q : attemptQuestionRepository.findAllById(
                drafts.stream().map(AttemptAnswerDraftDto::attemptQuestionId).distinct().toList())) {
            if (Objects.equals(q.getAttempt().getAssessmentAttemptId(), attemptId)) items.put(q.getAttemptQuestionId(), q);
        }
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "load items");

        Map<Long, AdaptiveVerdictDto> verdicts = new LinkedHashMap<>();
        boolean enteringFinal = false;
        LearnerAttemptQuestionDto next = null;
        for (AttemptAnswerDraftDto draft : drafts) {
            AssessmentAttemptQuestion item = items.get(draft.attemptQuestionId());
            if (item == null) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "That question is not on this paper.");
            }
            /* Only the item being asked can be answered; anything else is a
               replay (the same answer arriving twice) or an out-of-order request. */
            if (!Objects.equals(attempt.getCurrentQuestionId(), item.getAttemptQuestionId())) {
                Optional<AssessmentAttemptAnswer> existing = attemptAnswerRepository
                        .findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(
                                attemptId, item.getAttemptQuestionId());
                if (existing.isPresent() && state.getServedQuestionIds().contains(item.getSourceQuestionId())) {
                    if (AssessmentAttemptService.hasDefinitiveVerdict(existing.get())) {
                        verdicts.put(item.getAttemptQuestionId(), verdictOf(attempt, item, existing.get()));
                    }
                    continue;
                }
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "That question is not the one being asked.");
            }

            boolean finalRound = AdaptiveSessionState.STAGE_FINAL.equals(item.getStage());
            if (!finalRound && !attempts.hasAnswerContent(draft)) {
                throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                        "Choose or type an answer first.");
            }

            /* The item being asked has no answer row yet -- one would have
               made this a replay above -- so it is written, not looked up. */
            AssessmentAttemptAnswer answer = AssessmentAttemptAnswer.builder().attempt(attempt).attemptQuestion(item).build();
            answer.setLearnerAnswer(draft.learnerAnswer());
            answer.setSelectedChoiceId(draft.selectedChoiceId());
            answer.setSubmittedCode(draft.submittedCode());
            answer.setProgrammingLanguage(draft.programmingLanguage());
            answer.setDiagramSubmissionData(draft.diagramSubmissionData());
            LocalDateTime savedAt = LocalDateTime.now();
            answer.setAnsweredAt(savedAt);
            answer.setLastSavedAt(savedAt);
            answer = attemptAnswerRepository.save(answer);

            if (!finalRound) {
                verdicts.put(item.getAttemptQuestionId(), gradeNow(attempt, item, answer, state));
            }
            state.setAnsweredCount(state.getAnsweredCount() + 1);

            /* What comes next: the reserve becomes the question being asked. */
            next = null;
            if (!state.getQueuedAttemptQuestionIds().isEmpty()) {
                Long nextId = state.getQueuedAttemptQuestionIds().remove(0);
                next = servedDto(attempt, nextId);
                if (next != null) {
                    attempt.setCurrentQuestionId(nextId);
                    boolean nowFinal = AdaptiveSessionState.STAGE_FINAL.equals(next.stage());
                    if (nowFinal && !state.inFinalRound()) {
                        state.setStage(AdaptiveSessionState.STAGE_FINAL);
                        attempt.setPhase(AdaptiveSessionState.STAGE_FINAL);
                        enteringFinal = true;
                    }
                }
            }
            if (next == null) {
                attempt.setCurrentQuestionId(null);
            }
        }
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "save + mark");

        /* Only what is newly served goes back: the client keeps every item it
           was handed, keyed by position, so the reserve it already holds is
           not read and sent again. */
        List<LearnerAttemptQuestionDto> reserve = List.of();
        if (attempt.getCurrentQuestionId() != null) {
            reserve = topUpReserve(attempt, state);
        } else if (!state.done()) {
            finish(attempt, state);
        }
        saveState(attempt, state);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "serve reserve + state");
        com.capstone.rebyu.common.PhaseTimer.finish(timer);
        return new AdaptiveAnswersResponseDto(verdicts, progressOf(attempt, state), next, reserve, enteringFinal, state.done());
    }

    /**
     * Keeps RESERVE_DEPTH items served behind the one being asked, and returns
     * every reserve item (old and new) so the client can hold all of them.
     * Two ahead rather than one: the client shows a reserve the instant an
     * answer is given, and with a slow link one item was not always back in
     * time for the next press.
     */
    private List<LearnerAttemptQuestionDto> topUpReserve(AssessmentAttempt attempt, AdaptiveSessionState state) {
        int wanted = AdaptiveSessionState.RESERVE_DEPTH - state.getQueuedAttemptQuestionIds().size();
        if (wanted <= 0 || state.getServedCount() >= state.getTargetCount()) return List.of();
        List<LearnerAttemptQuestionDto> served = serveMany(attempt, state, wanted);
        for (LearnerAttemptQuestionDto dto : served) {
            state.getQueuedAttemptQuestionIds().add(dto.attemptQuestionId());
        }
        return served;
    }

    /** The item as it was served, from memory when possible. */
    private LearnerAttemptQuestionDto servedDto(AssessmentAttempt attempt, Long attemptQuestionId) {
        LearnerAttemptQuestionDto cached = servedCache.get(attemptQuestionId);
        if (cached != null) return cached;
        return attemptQuestionRepository.findById(attemptQuestionId)
                .map(q -> withKey(attempt, q, attempts.toLearnerQuestion(q))).orElse(null);
    }

    private void remember(LearnerAttemptQuestionDto dto) {
        if (servedCache.size() >= SERVED_CACHE_MAX) servedCache.clear();
        servedCache.put(dto.attemptQuestionId(), dto);
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
            next = servedDto(attempt, attempt.getCurrentQuestionId());
        }
        for (Long id : state.getQueuedAttemptQuestionIds()) {
            LearnerAttemptQuestionDto dto = servedDto(attempt, id);
            if (dto != null) reserve.add(dto);
        }
        return new AdaptiveAnswerResponseDto(verdict, progressOf(attempt, state), next, reserve, false, state.done());
    }

    private AdaptiveVerdictDto gradeNow(
            AssessmentAttempt attempt, AssessmentAttemptQuestion item,
            AssessmentAttemptAnswer answer, AdaptiveSessionState state) {

        Question source = loadQuestion(item.getSourceQuestionId());
        if (source == null) {
            answer.setIsCorrect(false);
            answer.setCredit(BigDecimal.ZERO);
            answer.setPendingManualEvaluation(false);
            attemptAnswerRepository.save(answer);
            return new AdaptiveVerdictDto(false, BigDecimal.ZERO, null, null, null, null,
                    "This question is no longer available and was not counted against you.", List.of());
        }
        Map<Long, Question> sources = Map.of(source.getQuestionId(), source);
        Map<Long, List<Question>> subs = contextOf(List.of(source)).subQuestionsByParentId();
        GradingBatch batch = attempts.prepareGradingBatch(
                List.of(item), Map.of(item.getAttemptQuestionId(), answer), sources, subs);
        attempts.scoreAnswer(item, answer, batch, sources, subs);
        attemptAnswerRepository.save(answer);

        /* The engine's view of the response: right or wrong. Partial credit
           counts as right above the same threshold the mastery service uses. */
        boolean correct = attempts.countsAsCorrect(answer);

        // --- IRT: ability -------------------------------------------------
        ItemParams params = itemParamsOf(attempt.getExam(), source);
        state.getResponses().add(new AdaptiveSessionState.ResponseRecord(
                source.getQuestionId(), item.getLessonId(), params, correct));
        double theta = IrtModel.step(state.getTheta(), params, correct, properties.getAbilityStep());
        double se = IrtModel.standardError(theta, state.irtResponses());
        state.setTheta(theta);
        state.setSe(se);
        item.setThetaAfter(theta);
        attemptQuestionRepository.save(item);
        attempt.setThetaCurrent(theta);
        attempt.setThetaSe(se);

        // --- BKT: knowledge of this lesson --------------------------------
        Long lessonId = item.getLessonId();
        if (lessonId != null) {
            BktModel.Params bkt = state.getParamsByLesson().getOrDefault(lessonId, defaultBkt());
            double p = state.getPKnownByLesson().getOrDefault(lessonId, bkt.prior());
            state.getPKnownByLesson().put(lessonId, BktModel.update(p, correct, bkt));
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
        return verdictOf(attempt, item, answer, source, source == null ? Map.of() : contextOf(List.of(source)).subQuestionsByParentId());
    }

    /**
     * The parts and rubric of these questions, read once per question. A
     * multiple-choice question has neither and is never asked.
     */
    private AssessmentAttemptService.SnapshotContext contextOf(List<Question> questions) {
        List<Question> missing = new ArrayList<>();
        Map<Long, List<Question>> subs = new LinkedHashMap<>();
        Map<Long, List<com.capstone.rebyu.assessment.entity.QuestionRubricCriterion>> rubric = new LinkedHashMap<>();
        for (Question q : questions) {
            if (AssessmentAttemptService.isMultipleChoice(q.getQuestionType())) continue;
            AssessmentAttemptService.SnapshotContext cached = contextCache.get(q.getQuestionId());
            if (cached == null) {
                missing.add(q);
            } else {
                subs.putAll(cached.subQuestionsByParentId());
                rubric.putAll(cached.rubricByQuestionId());
            }
        }
        if (!missing.isEmpty()) {
            AssessmentAttemptService.SnapshotContext loaded = attempts.buildSnapshotContext(missing);
            for (Question q : missing) {
                Long id = q.getQuestionId();
                Map<Long, List<Question>> ownSubs = loaded.subQuestionsByParentId().containsKey(id)
                        ? Map.of(id, loaded.subQuestionsByParentId().get(id)) : Map.of();
                Map<Long, List<com.capstone.rebyu.assessment.entity.QuestionRubricCriterion>> ownRubric =
                        loaded.rubricByQuestionId().containsKey(id) ? Map.of(id, loaded.rubricByQuestionId().get(id)) : Map.of();
                if (contextCache.size() >= QUESTION_CACHE_MAX) contextCache.clear();
                contextCache.put(id, new AssessmentAttemptService.SnapshotContext(ownSubs, ownRubric));
                subs.putAll(ownSubs);
                rubric.putAll(ownRubric);
            }
        }
        return new AssessmentAttemptService.SnapshotContext(subs, rubric);
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
                answer.getIsCorrect(), answer.getCredit(),
                correctChoiceId, correctChoiceText, acceptedAnswer, explanation, answer.getFeedback(), subReviews);
    }

    // ------------------------------------------------------------------
    // Selection
    // ------------------------------------------------------------------

    /**
     * Picks and snapshots the next item. Returns null when the pool for the
     * current stage is exhausted, which ends the session early.
     */
    /**
     * Picks and snapshots the next {@code count} items in one pass: every
     * choice is made in memory first (selection reads only the pool and the
     * session), then the chosen questions are loaded with one query and their
     * parts with another, and only then is each item written. Serving them one
     * at a time cost a load and a parts query per item, which at a database
     * in another region was most of what a learner waited for at the start.
     * Fewer than asked come back when the pool for a stage runs dry.
     */
    private List<LearnerAttemptQuestionDto> serveMany(AssessmentAttempt attempt, AdaptiveSessionState state, int count) {
        record Pick(Candidate candidate, Selection selection, boolean finalRound, int position) {
        }
        List<Pick> picks = new ArrayList<>();
        Map<Long, Candidate> pool = cachedPool(attempt.getExam()).candidates();
        for (int i = 0; i < count && state.getServedCount() < state.getTargetCount(); i++) {
            /* An item's round is its position on the paper: the last
               finalRoundCount slots are the final round. */
            boolean finalRound = state.getServedCount() + 1 > state.getMainCount();
            List<Candidate> candidates = pool.values().stream().filter(c -> c.workspace() == finalRound).toList();
            AdaptiveItemSelector.Settings settings = new AdaptiveItemSelector.Settings(
                    properties.getLessonExplorationWeight(), properties.getRandomesqueTopK(), !finalRound);
            Optional<Selection> selection = AdaptiveItemSelector.select(state, candidates, settings, ThreadLocalRandom.current());
            if (selection.isEmpty()) {
                log.warn("Adaptive attempt {}: no candidate left for stage {} after {} items",
                        attempt.getAssessmentAttemptId(), state.getStage(), state.getServedCount());
                break;
            }
            Candidate chosen = selection.get().candidate();
            state.setServedCount(state.getServedCount() + 1);
            state.getServedQuestionIds().add(chosen.questionId());
            state.getServedStems().add(QuestionStem.of(chosen.questionText()));
            if (!finalRound) {
                state.getServedCountByLesson().merge(chosen.lessonId(), 1, Integer::sum);
                state.getServedCountByType().merge(AdaptiveItemSelector.normaliseType(chosen.questionType()), 1, Integer::sum);
            }
            picks.add(new Pick(chosen, selection.get(), finalRound, state.getServedCount()));
        }
        if (picks.isEmpty()) return List.of();

        Map<Long, Question> questions = loadQuestions(picks.stream().map(p -> p.candidate().questionId()).toList());
        AssessmentAttemptService.SnapshotContext context = contextOf(new ArrayList<>(questions.values()));

        List<LearnerAttemptQuestionDto> served = new ArrayList<>(picks.size());
        for (Pick pick : picks) {
            Question question = questions.get(pick.candidate().questionId());
            if (question == null) continue;
            AssessmentAttemptQuestion item = AssessmentAttemptQuestion.builder()
                    .attempt(attempt)
                    .sourceQuestionId(question.getQuestionId())
                    .questionType(AssessmentAttemptService.normalizeQuestionType(question.getQuestionType()))
                    .questionTextSnapshot(question.getQuestionText())
                    .questionDataSnapshot(attempts.buildLearnerSafeSnapshot(question, context))
                    .displayOrder(pick.position())
                    .points(null)
                    .lessonId(question.getLesson().getLessonId())
                    .thetaBefore(state.getTheta())
                    .itemInformation(pick.selection().reason().information())
                    .selectionReason(toJson(pick.selection().reason()))
                    .servedAt(LocalDateTime.now())
                    .stage(pick.finalRound() ? AdaptiveSessionState.STAGE_FINAL : AdaptiveSessionState.STAGE_MAIN)
                    .build();
            item = attemptQuestionRepository.save(item);
            LearnerAttemptQuestionDto dto = withKey(attempt, item, attempts.toLearnerQuestion(item), question);
            remember(dto);
            served.add(dto);
        }
        return served;
    }

    /** These questions, whole, from the cache or one query for the rest. */
    private Map<Long, Question> loadQuestions(List<Long> ids) {
        Map<Long, Question> out = new LinkedHashMap<>();
        List<Long> missing = new ArrayList<>();
        for (Long id : ids) {
            Question cached = questionCache.get(id);
            if (cached != null) out.put(id, cached); else missing.add(id);
        }
        if (!missing.isEmpty()) {
            for (Question loaded : questionRepository.findForAttemptByIdIn(missing)) {
                if (questionCache.size() >= QUESTION_CACHE_MAX) questionCache.clear();
                questionCache.put(loaded.getQuestionId(), loaded);
                out.put(loaded.getQuestionId(), loaded);
            }
        }
        return out;
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

    private List<Candidate> toCandidates(List<QuestionSelectionView> views) {
        if (views.isEmpty()) return List.of();
        List<Candidate> out = new ArrayList<>(views.size());
        for (QuestionSelectionView view : views) {
            ItemParams params = IrtModel.defaultParams(view.getDifficultyLevel(),
                    AdaptivePolicy.isMultipleChoice(view.getQuestionType()), 4);
            out.add(new Candidate(view.getQuestionId(), view.getLessonId(), view.getQuestionType(),
                    view.getQuestionText(), params, AdaptivePolicy.isWorkspaceType(view.getQuestionType())));
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Item parameters: from the authored difficulty level alone
    // ------------------------------------------------------------------

    private ItemParams itemParamsOf(Exam exam, Question source) {
        Candidate cached = cachedPool(exam).candidates().get(source.getQuestionId());
        if (cached != null) return cached.params();
        return IrtModel.defaultParams(source.getDifficultyLevel(),
                AdaptivePolicy.isMultipleChoice(source.getQuestionType()),
                source.getChoices() == null ? 4 : source.getChoices().size());
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
