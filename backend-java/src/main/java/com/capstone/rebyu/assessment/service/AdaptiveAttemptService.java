package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Candidate;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Selection;
import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.entity.LearnerBankCycle;
import com.capstone.rebyu.adaptive.engine.IrtModel.ItemParams;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.adaptive.service.BankReplenishmentService;
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
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

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
    private final BankReplenishmentService replenishment;
    private final com.capstone.rebyu.adaptive.repository.LearnerBankCycleRepository bankCycles;
    private final QuestionRepository questionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final ObjectMapper objectMapper;

    private record CachedPool(List<QuestionSelectionView> views, Map<Long, Candidate> candidates,
                              java.time.Instant at) {
    }

    private final Map<Long, Question> questionCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int QUESTION_CACHE_MAX = 4000;

    private final Map<Long, AssessmentAttemptService.SnapshotContext> contextCache = new java.util.concurrent.ConcurrentHashMap<>();

    private final Map<Long, LearnerAttemptQuestionDto> servedCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int SERVED_CACHE_MAX = 20000;

    private static final java.time.Duration POOL_TTL = java.time.Duration.ofMinutes(5);
    private final Map<Long, CachedPool> poolCache = new java.util.concurrent.ConcurrentHashMap<>();


    @Transactional
    private record Session(com.capstone.rebyu.common.PhaseTimer timer, AdaptiveSessionState state,
                           QuestionBankSizeService.BankSize size, LearnerAbilityService.Seed seed,
                           int target, int finalRound) {}

    private Session prepareSession(Exam exam, Long learnerId) {
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
        int finalRound = Math.min(policy.finalRoundCount(examType), size.workspace());
        int mainTarget = Math.max(1, target - finalRound);
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
        if (AdaptivePolicy.isCategoryExam(examType)) {
            java.util.Set<Long> weak = new LinkedHashSet<>();
            state.setTargetShareByLesson(AdaptiveItemSelector.focusPlan(
                    poolCountByLesson, state.getPKnownByLesson(),
                    properties.getWeakLessonShare(), properties.getWeakMasteryThreshold(), weak));
            state.setWeakLessonIds(weak);
        }

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
        LearnerBankCycle cycle = bankCycles.findByLearnerIdAndCertificationId(learnerId, certificationId)
                .orElseGet(() -> LearnerBankCycle.builder()
                        .learnerId(learnerId).certificationId(certificationId)
                        .cycleNo(1).startedAt(LocalDateTime.of(2000, 1, 1, 0, 0)).build());
        Set<Long> cycleSeen = new LinkedHashSet<>();
        if (!poolIds.isEmpty()) {
            for (var row : attemptQuestionRepository.findExposure(learnerId, poolIds)) {
                seen.add(row.getSourceQuestionId());
                if (row.getLastSeenAt() != null && !row.getLastSeenAt().isBefore(cycle.getStartedAt())) {
                    cycleSeen.add(row.getSourceQuestionId());
                }
            }
            long freshMain = pool.stream()
                    .filter(v -> !AdaptivePolicy.isWorkspaceType(v.getQuestionType()))
                    .filter(v -> !cycleSeen.contains(v.getQuestionId()))
                    .count();
            if (!cycleSeen.isEmpty() && freshMain < mainTarget) {
                cycle.setCycleNo(cycle.getCycleNo() + 1);
                cycle.setStartedAt(LocalDateTime.now());
                log.info("Learner {} has used up pass {} over the bank of certification {} ({} fresh of {} needed): starting pass {}",
                        learnerId, cycle.getCycleNo() - 1, certificationId, freshMain, mainTarget, cycle.getCycleNo());
                cycleSeen.clear();
            }
            if (cycle.getLearnerBankCycleId() == null || cycleSeen.isEmpty()) {
                cycle = bankCycles.save(cycle);
            }
            if (lastAttemptId != null) {
                for (AssessmentAttemptQuestion q : attemptQuestionRepository
                        .findByAttempt_AssessmentAttemptIdOrderByDisplayOrderAsc(lastAttemptId)) {
                    lastAttemptIds.add(q.getSourceQuestionId());
                }
            }
        }
        state.setSeenQuestionIds(seen);
        state.setCycleSeenQuestionIds(cycleSeen);
        state.setBankCycle(cycle.getCycleNo());
        state.setLastAttemptQuestionIds(lastAttemptIds);
        state.setThisExamQuestionIds(new LinkedHashSet<>(
                attemptQuestionRepository.findSourceQuestionIdsServedOnExam(learnerId, exam.getExamId())));
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "seed + exposure");
        return new Session(timer, state, size, seed, target, finalRound);
    }



    public AssessmentAttempt start(Exam exam, Long learnerId, int attemptNumber, String idempotencyKey) {
        Session session = prepareSession(exam, learnerId);
        com.capstone.rebyu.common.PhaseTimer timer = session.timer();
        AdaptiveSessionState state = session.state();
        QuestionBankSizeService.BankSize size = session.size();
        LearnerAbilityService.Seed seed = session.seed();
        int target = session.target();
        int finalRound = session.finalRound();

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
                .bankCycle(state.getBankCycle())
                .phase(AdaptiveSessionState.STAGE_MAIN)
                .build();
        attempt = attemptRepository.save(attempt);

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

    public AssessmentAttempt startAssembledPaper(Exam exam, Long learnerId, int attemptNumber, String idempotencyKey) {
        Session session = prepareSession(exam, learnerId);
        AdaptiveSessionState state = session.state();

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
                .adaptive(false)
                .thetaStart(session.seed().mu0())
                .thetaCurrent(session.seed().mu0())
                .thetaSe(session.seed().sigma0())
                .targetQuestionCount(session.target())
                .finalRoundCount(session.finalRound())
                .bankCycle(state.getBankCycle())
                .build();
        attempt = attemptRepository.save(attempt);

        List<LearnerAttemptQuestionDto> served = serveMany(attempt, state, session.target());
        if (served.isEmpty()) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException(
                    bankSize.shortfallMessage(exam, session.size()));
        }
        state.setStage(AdaptiveSessionState.STAGE_MAIN);
        saveState(attempt, state);
        com.capstone.rebyu.common.PhaseTimer.mark(session.timer(), "assemble " + served.size() + " items");
        com.capstone.rebyu.common.PhaseTimer.finish(session.timer());
        return attempt;
    }

    @Transactional
    public void onAssembledPaperSubmitted(AssessmentAttempt attempt,
                                          List<AssessmentAttemptQuestion> items,
                                          Map<Long, AssessmentAttemptAnswer> answersByQuestion) {
        AdaptiveSessionState state = loadState(attempt);
        if (state.done()) return;
        for (AssessmentAttemptQuestion item : items) {
            AssessmentAttemptAnswer answer = answersByQuestion.get(item.getAttemptQuestionId());
            double score = answer == null ? 0.0 : attempts.scoreOf(item, answer);
            boolean correct = answer != null && attempts.countsAsCorrect(answer);

            ItemParams params = itemParamsOf(attempt.getExam(), item.getSourceQuestionId());
            state.getResponses().add(new AdaptiveSessionState.ResponseRecord(
                    item.getSourceQuestionId(), item.getLessonId(), params, correct, score));
            IrtModel.Estimate estimate = IrtModel.update(state.getTheta(), state.getSe(), params, score);
            double theta = estimate.theta();
            state.setTheta(theta);
            state.setSe(estimate.standardError());
            item.setThetaAfter(theta);
            attemptQuestionRepository.save(item);

            Long lessonId = item.getLessonId();
            if (lessonId != null) {
                BktModel.Params bkt = state.getParamsByLesson().getOrDefault(lessonId, defaultBkt());
                double p = state.getPKnownByLesson().getOrDefault(lessonId, bkt.prior());
                state.getPKnownByLesson().put(lessonId, BktModel.update(p, correct, bkt));
            }
            state.setAnsweredCount(state.getAnsweredCount() + 1);
        }
        attempt.setThetaCurrent(state.getTheta());
        attempt.setThetaSe(state.getSe());
        state.setStage(AdaptiveSessionState.STAGE_DONE);
        attempt.setPhase(AdaptiveSessionState.STAGE_DONE);
        persistLearner(attempt, state);
        saveState(attempt, state);
    }

    private ItemParams itemParamsOf(Exam exam, Long questionId) {
        Candidate cached = cachedPool(exam).candidates().get(questionId);
        if (cached != null) return cached.params();
        Question source = loadQuestion(questionId);
        return source == null ? IrtModel.defaultParams(null) : IrtModel.defaultParams(source.getDifficultyLevel());
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
        warmPool(exam.getExamId(), new ArrayList<>(candidates.keySet()));
        return fresh;
    }

    private final java.util.concurrent.ExecutorService warmer = java.util.concurrent.Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "adaptive-pool-warmer");
        t.setDaemon(true);
        return t;
    });
    private static final int WARM_CHUNK = 200;

    private void warmPool(Long examId, List<Long> questionIds) {
        List<Long> cold = questionIds.stream().filter(id -> !questionCache.containsKey(id)).toList();
        if (cold.isEmpty()) return;
        warmer.execute(() -> {
            long started = System.currentTimeMillis();
            try {
                for (int from = 0; from < cold.size(); from += WARM_CHUNK) {
                    List<Long> chunk = cold.subList(from, Math.min(cold.size(), from + WARM_CHUNK));
                    Map<Long, Question> loaded = loadQuestions(chunk);
                    contextOf(new ArrayList<>(loaded.values()));
                }
                log.debug("[perf] adaptive pool exam={} warmed {} question(s) in {}ms",
                        examId, cold.size(), System.currentTimeMillis() - started);
            } catch (Exception e) {
                log.warn("Adaptive pool exam={} warm-up stopped: {}", examId, e.getMessage());
            }
        });
    }


    @Transactional
    public AdaptiveAnswerResponseDto answer(Long attemptId, Long learnerId, AttemptAnswerDraftDto draft) {
        if (draft == null || draft.attemptQuestionId() == null) {
            throw new BusinessRuleException.InvalidAssessmentSubmissionException("No answer was sent.");
        }
        AdaptiveAnswersResponseDto batch = answerAll(attemptId, learnerId, List.of(draft));
        return new AdaptiveAnswerResponseDto(batch.verdicts().get(draft.attemptQuestionId()), batch.progress(),
                batch.next(), batch.queued(), batch.enteringFinalRound(), batch.completed());
    }

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

            verdicts.put(item.getAttemptQuestionId(), gradeNow(attempt, item, answer, state));
            state.setAnsweredCount(state.getAnsweredCount() + 1);

            next = null;
            if (!state.getQueuedAttemptQuestionIds().isEmpty()) {
                next = servedDto(attempt, state.getQueuedAttemptQuestionIds().remove(0));
            } else if (state.getServedCount() < state.getTargetCount()) {
                List<LearnerAttemptQuestionDto> fresh = serveMany(attempt, state, 1);
                next = fresh.isEmpty() ? null : fresh.get(0);
            }
            if (next != null) {
                attempt.setCurrentQuestionId(next.attemptQuestionId());
                boolean nowFinal = AdaptiveSessionState.STAGE_FINAL.equals(next.stage());
                if (nowFinal && !state.inFinalRound()) {
                    state.setStage(AdaptiveSessionState.STAGE_FINAL);
                    attempt.setPhase(AdaptiveSessionState.STAGE_FINAL);
                    enteringFinal = true;
                }
            } else {
                attempt.setCurrentQuestionId(null);
            }
        }
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "save + mark");

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

    private List<LearnerAttemptQuestionDto> topUpReserve(AssessmentAttempt attempt, AdaptiveSessionState state) {
        int wanted = AdaptiveSessionState.RESERVE_DEPTH - state.getQueuedAttemptQuestionIds().size();
        if (wanted <= 0 || state.getServedCount() >= state.getTargetCount()) return List.of();
        List<LearnerAttemptQuestionDto> served = serveMany(attempt, state, wanted);
        for (LearnerAttemptQuestionDto dto : served) {
            state.getQueuedAttemptQuestionIds().add(dto.attemptQuestionId());
        }
        return served;
    }

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

        double score = attempts.scoreOf(item, answer);
        boolean correct = attempts.countsAsCorrect(answer);

        ItemParams params = itemParamsOf(attempt.getExam(), source);
        state.getResponses().add(new AdaptiveSessionState.ResponseRecord(
                source.getQuestionId(), item.getLessonId(), params, correct, score));
        IrtModel.Estimate estimate = IrtModel.update(state.getTheta(), state.getSe(), params, score);
        double theta = estimate.theta();
        double se = estimate.standardError();
        state.setTheta(theta);
        state.setSe(se);
        item.setThetaAfter(theta);
        attemptQuestionRepository.save(item);
        attempt.setThetaCurrent(theta);
        attempt.setThetaSe(se);

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


    private List<LearnerAttemptQuestionDto> serveMany(AssessmentAttempt attempt, AdaptiveSessionState state, int count) {
        record Pick(Candidate candidate, Selection selection, boolean finalRound, int position) {
        }
        List<Pick> picks = new ArrayList<>();
        Map<Long, Candidate> pool = cachedPool(attempt.getExam()).candidates();
        for (int i = 0; i < count && state.getServedCount() < state.getTargetCount(); i++) {
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
            if (log.isDebugEnabled()) {
                AdaptiveItemSelector.Reason why = selection.get().reason();
                log.debug("[pick] attempt={} cycle={} #{} theta={} -> b={} ({}) tier={} lesson={} {} of {} lesson(s), {} candidate(s), open levels {}",
                        attempt.getAssessmentAttemptId(), state.getBankCycle(), state.getServedCount() + 1,
                        String.format("%.2f", state.getTheta()), chosen.params().b(),
                        finalRound ? "final" : "main", why.tier(), why.lessonId(), why.focus(),
                        why.lessonsConsidered(), why.candidatesConsidered(),
                        candidates.stream().filter(c -> !state.getServedQuestionIds().contains(c.questionId()))
                                .collect(java.util.stream.Collectors.groupingBy(c -> c.params().b(), java.util.TreeMap::new, java.util.stream.Collectors.counting())));
            }
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

        // On a retake the choices are reshuffled too, so a question the selector serves
        // again does not have its answer in the same place as last time.
        java.util.Random shuffle = attempt.getAttemptNumber() != null && attempt.getAttemptNumber() > 1
                ? ThreadLocalRandom.current() : null;

        List<LearnerAttemptQuestionDto> served = new ArrayList<>(picks.size());
        for (Pick pick : picks) {
            Question question = questions.get(pick.candidate().questionId());
            if (question == null) continue;
            AssessmentAttemptQuestion item = AssessmentAttemptQuestion.builder()
                    .attempt(attempt)
                    .sourceQuestionId(question.getQuestionId())
                    .questionType(AssessmentAttemptService.normalizeQuestionType(question.getQuestionType()))
                    .questionTextSnapshot(question.getQuestionText())
                    .questionDataSnapshot(attempts.buildLearnerSafeSnapshot(question, context, shuffle))
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
            ItemParams params = IrtModel.defaultParams(view.getDifficultyLevel());
            out.add(new Candidate(view.getQuestionId(), view.getLessonId(), view.getQuestionType(),
                    view.getQuestionText(), params, AdaptivePolicy.isWorkspaceType(view.getQuestionType())));
        }
        return out;
    }


    private ItemParams itemParamsOf(Exam exam, Question source) {
        Candidate cached = cachedPool(exam).candidates().get(source.getQuestionId());
        if (cached != null) return cached.params();
        return IrtModel.defaultParams(source.getDifficultyLevel());
    }

    private BktModel.Params defaultBkt() {
        return new BktModel.Params(properties.getDefaultPrior(), properties.getDefaultLearn(),
                properties.getDefaultGuess(), properties.getDefaultSlip());
    }

    private void finish(AssessmentAttempt attempt, AdaptiveSessionState state) {
        state.setStage(AdaptiveSessionState.STAGE_DONE);
        state.setTargetCount(state.getServedCount());
        attempt.setPhase(AdaptiveSessionState.STAGE_DONE);
        attempt.setTargetQuestionCount(state.getServedCount());
        attempt.setCurrentQuestionId(null);
        persistLearner(attempt, state);
    }

    private void persistLearner(AssessmentAttempt attempt, AdaptiveSessionState state) {
        abilities.persistSkillStates(attempt.getLearnerId(), state);
    }

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
        scheduleReplenishment(attempt, state);
    }

    private void scheduleReplenishment(AssessmentAttempt attempt, AdaptiveSessionState state) {
        try {
            Exam exam = attempt.getExam();
            if (exam == null || exam.getCertification() == null) return;
            Long certificationId = exam.getCertification().getCertificationId();
            String title = exam.getCertification().getTitle();
            Set<Long> seen = new HashSet<>(state.getSeenQuestionIds());
            seen.addAll(state.getServedQuestionIds());
            int paperLength = Math.max(1, state.getMainCount());
            Map<String, BankReplenishmentService.LevelUse> usage = BankReplenishmentService.usage(
                    cachedPool(exam).candidates().values(), seen, paperLength);
            warmer.execute(() -> replenishment.replenishIfDepleted(certificationId, title, usage));
        } catch (Exception e) {
            log.debug("Replenishment check skipped for attempt {}: {}", attempt.getAssessmentAttemptId(), e.getMessage());
        }
    }

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
