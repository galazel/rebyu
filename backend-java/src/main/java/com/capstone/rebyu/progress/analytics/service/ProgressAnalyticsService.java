package com.capstone.rebyu.progress.analytics.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.bkt.dto.LessonPriorityView;
import com.capstone.rebyu.bkt.dto.MasteryHistoryView;
import com.capstone.rebyu.bkt.service.BktEventFactory;
import com.capstone.rebyu.bkt.service.LearnerMasteryService;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.certification.repository.CurriculumLessonIdView;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.challenge.service.ChallengeArenaService;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.gamification.service.StreakService;
import com.capstone.rebyu.learningtools.service.GeneratedAssessmentService;
import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.progress.analytics.dto.CertificationProgressDto;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.CategoryMasteryRow;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.MasteryTrendPoint;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.PerformanceBucket;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.ProgressAnalyticsResponse;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.RecentActivityItem;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.RecommendationRow;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.ScoreTrendPoint;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.TopicRow;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProgressAnalyticsService {

    private static final double MASTERED_THRESHOLD = 0.85;
    private static final double WEAK_THRESHOLD = 0.70;
    private static final double HIGHEST_PRIORITY_THRESHOLD = 0.40;
    private static final int RECENT_ACTIVITY_LIMIT = 10;
    private static final int TOPIC_LIST_LIMIT = 6;
    private static final int RECOMMENDATION_LIMIT = 8;

    private final CertificationRepository certificationRepository;
    private final LearnerCertificationRepository learnerCertificationRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;
    private final AssessmentAttemptQuestionRepository attemptQuestionRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final StreakService streakService;
    private final LessonRepository lessonRepository;
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;
    private final LearnerCompletedLessonRepository learnerCompletedLessonRepository;
    private final LearnerMasteryService learnerMasteryService;
    private final BktEventFactory bktEventFactory;

    private final Executor bktExecutor;

    public ProgressAnalyticsService(
            CertificationRepository certificationRepository,
            LearnerCertificationRepository learnerCertificationRepository,
            AssessmentAttemptRepository assessmentAttemptRepository,
            AssessmentAttemptQuestionRepository attemptQuestionRepository,
            AssessmentAttemptAnswerRepository attemptAnswerRepository,
            QuestionRepository questionRepository,
            ExamRepository examRepository,
            StreakService streakService,
            LessonRepository lessonRepository,
            InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository,
            LearnerCompletedLessonRepository learnerCompletedLessonRepository,
            LearnerMasteryService learnerMasteryService,
            BktEventFactory bktEventFactory,
            @Qualifier("bktAnalyticsExecutor") Executor bktExecutor) {
        this.certificationRepository = certificationRepository;
        this.learnerCertificationRepository = learnerCertificationRepository;
        this.assessmentAttemptRepository = assessmentAttemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
        this.streakService = streakService;
        this.lessonRepository = lessonRepository;
        this.institutionCertificationLearnerRepository = institutionCertificationLearnerRepository;
        this.learnerCompletedLessonRepository = learnerCompletedLessonRepository;
        this.learnerMasteryService = learnerMasteryService;
        this.bktEventFactory = bktEventFactory;
        this.bktExecutor = bktExecutor;
    }

    private <T> CompletableFuture<T> bktAsync(Supplier<T> read) {
        return CompletableFuture.supplyAsync(read, bktExecutor);
    }

    /**
     * {@link #progressFor} for several certifications at once, with the same rules: four
     * queries in all, instead of four per certification.
     */
    @Transactional(readOnly = true)
    public List<CertificationProgressDto> progressForAll(Long learnerId, java.util.Collection<Long> certificationIds) {
        if (certificationIds == null || certificationIds.isEmpty()) return List.of();

        Map<Long, List<LessonRepository.OfficialLessonIdsView>> lessonsByCertification = lessonRepository
                .findOfficialLessonIdsByCertificationIds(certificationIds).stream()
                .collect(Collectors.groupingBy(LessonRepository.OfficialLessonIdsView::getCertificationId));
        Map<Long, Long> completedByCertification = learnerCompletedLessonRepository
                .countCompletedPerCertification(learnerId, certificationIds).stream()
                .collect(Collectors.toMap(
                        LearnerCompletedLessonRepository.CompletedPerCertification::getCertificationId,
                        LearnerCompletedLessonRepository.CompletedPerCertification::getCompleted));
        Map<Long, List<Exam>> examsByCertification = examRepository
                .findWithTypeByCertificationIds(certificationIds).stream()
                .filter(exam -> exam.getCertification() != null)
                .collect(Collectors.groupingBy(exam -> exam.getCertification().getCertificationId()));
        Set<Long> passedExamIds = new java.util.HashSet<>(assessmentAttemptRepository
                .findPassedExamIds(learnerId, AssessmentAttempt.Status.SUBMITTED, certificationIds));

        List<CertificationProgressDto> rows = new ArrayList<>();
        for (Long certificationId : certificationIds) {
            List<LessonRepository.OfficialLessonIdsView> certLessons =
                    lessonsByCertification.getOrDefault(certificationId, List.of());
            Set<Long> officialLessonIds = certLessons.stream()
                    .map(CurriculumLessonIdView::getLessonId).filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> officialMiddleIds = certLessons.stream()
                    .map(CurriculumLessonIdView::getMiddleCategoryId).filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> officialMajorIds = certLessons.stream()
                    .map(CurriculumLessonIdView::getMajorCategoryId).filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<Exam> certExams = examsByCertification.getOrDefault(certificationId, List.of()).stream()
                    .filter(exam -> assessmentExclusionReason(
                            exam, officialLessonIds, officialMiddleIds, officialMajorIds) == null)
                    .toList();
            int passed = (int) certExams.stream().filter(exam -> passedExamIds.contains(exam.getExamId())).count();

            rows.add(new CertificationProgressDto(
                    certificationId,
                    completedByCertification.getOrDefault(certificationId, 0L).intValue(),
                    certLessons.size(),
                    passed,
                    certExams.size()));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public CertificationProgressDto progressFor(Long learnerId, Long certificationId) {
        List<CurriculumLessonIdView> certLessons =
                lessonRepository.findOfficialLessonIdsByCertificationId(certificationId);
        int totalLessonCount = certLessons.size();
        int completedLessonCount = (int) learnerCompletedLessonRepository
                .countByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        learnerId, certificationId);

        Set<Long> officialLessonIds = certLessons.stream()
                .map(CurriculumLessonIdView::getLessonId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> officialMiddleIds = certLessons.stream()
                .map(CurriculumLessonIdView::getMiddleCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> officialMajorIds = certLessons.stream()
                .map(CurriculumLessonIdView::getMajorCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Exam> certExams = examRepository.findByCertification_CertificationId(certificationId).stream()
                .filter(exam -> assessmentExclusionReason(
                        exam, officialLessonIds, officialMiddleIds, officialMajorIds) == null)
                .toList();

        Set<Long> passedExamIds = assessmentAttemptRepository
                .findByLearnerIdAndExam_Certification_CertificationIdAndStatus(
                        learnerId, certificationId, AssessmentAttempt.Status.SUBMITTED)
                .stream()
                .filter(attempt -> Boolean.TRUE.equals(attempt.getPassed()))
                .map(attempt -> attempt.getExam() == null ? null : attempt.getExam().getExamId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        int passedAssessmentCount = (int) certExams.stream()
                .filter(exam -> passedExamIds.contains(exam.getExamId()))
                .count();

        return new CertificationProgressDto(
                certificationId,
                completedLessonCount,
                totalLessonCount,
                passedAssessmentCount,
                certExams.size());
    }

    @Transactional(readOnly = true)
    public ProgressAnalyticsResponse getProgressAnalytics(Long learnerId, Long certificationId) {
        com.capstone.rebyu.common.PhaseTimer timer = com.capstone.rebyu.common.PhaseTimer.start(
                "progressAnalytics learner=" + learnerId + " cert=" + certificationId, log);
        Certification certification = certificationRepository.findById(certificationId)
                .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));

        boolean selfEnrolled = learnerCertificationRepository
                .existsByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
                        learnerId, certificationId, LearnerCertification.Status.active);
        boolean institutionSponsored = !selfEnrolled && institutionCertificationLearnerRepository
                .existsByLearner_LearnerIdAndInstitutionCert_Certification_CertificationIdAndStatus(
                        learnerId, certificationId, InstitutionCertificationLearner.Status.active);
        if (!selfEnrolled && !institutionSponsored) {
            throw new EntityNotFoundException("No active enrollment in this certification");
        }


        com.capstone.rebyu.common.PhaseTimer.mark(timer, "enrollment");
        CompletableFuture<LearnerMasteryService.LessonPrioritiesResult> prioritiesFuture =
                bktAsync(() -> learnerMasteryService.getLessonPrioritiesForAnalytics(learnerId, certificationId));
        CompletableFuture<LearnerMasteryService.ConfidenceResult> confidenceFuture =
                bktAsync(() -> learnerMasteryService.getConfidenceForAnalytics(learnerId, certificationId));
        CompletableFuture<LearnerMasteryService.MasteryHistoryResult> historyFuture =
                bktAsync(() -> learnerMasteryService.getMasteryHistoryForAnalytics(learnerId, certificationId));

        List<AssessmentAttempt> attempts = assessmentAttemptRepository
                .findWithExamByLearnerAndCertification(
                        learnerId, certificationId, AssessmentAttempt.Status.SUBMITTED);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "attempts");

        // Readiness is the one mastery-service call that needs our data first, so
        // gather that data now and send it off before the accuracy breakdown, not after.
        List<Lesson> certLessons = officialLessonOutlines(certificationId);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "lessons");
        int totalLessonCount = certLessons.size();
        Map<Long, Lesson> lessonById = certLessons.stream()
                .collect(Collectors.toMap(Lesson::getLessonId, l -> l));

        List<LearnerCompletedLesson> completedLessons = learnerCompletedLessonRepository
                .findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        learnerId, certificationId);
        int completedLessonCount = completedLessons.size();
        Double completionPercentage = totalLessonCount == 0 ? null
                : (completedLessonCount * 100.0 / totalLessonCount);

        Map<String, Object> readinessRequest = buildReadinessRequest(
                learnerId, certLessons, attempts, totalLessonCount, completedLessonCount);
        CompletableFuture<Map<String, Object>> readinessFuture = readinessRequest == null
                ? CompletableFuture.completedFuture(null)
                : bktAsync(() -> learnerMasteryService.getReadiness(readinessRequest));
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "completed lessons");
        Map<Long, AssessmentAttempt> attemptById = attempts.stream()
                .collect(Collectors.toMap(AssessmentAttempt::getAssessmentAttemptId, a -> a));
        List<Long> attemptIds = new ArrayList<>(attemptById.keySet());

        // Only the columns the accuracy figures use -- not the question snapshots.
        List<AssessmentAttemptAnswerRepository.AnsweredItemView> items = attemptIds.isEmpty()
                ? List.of() : attemptAnswerRepository.findAnsweredItemsByAttemptIds(attemptIds);
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "attempt questions+answers");

        Set<Long> sourceQuestionIds = items.stream()
                .map(AssessmentAttemptAnswerRepository.AnsweredItemView::getSourceQuestionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> difficultyByQuestionId = sourceQuestionIds.isEmpty()
                ? Map.of()
                : questionRepository.findSelectionViewsByIdIn(sourceQuestionIds).stream()
                        .collect(Collectors.toMap(
                                QuestionSelectionView::getQuestionId,
                                QuestionSelectionView::getDifficultyLevel));

        com.capstone.rebyu.common.PhaseTimer.mark(timer, "difficulties");
        Map<String, int[]> byDifficulty = new LinkedHashMap<>();
        Map<String, int[]> byQuestionType = new LinkedHashMap<>();
        Map<String, int[]> byAssessmentType = new LinkedHashMap<>();
        int totalCorrect = 0;
        int totalIncorrect = 0;

        for (AssessmentAttemptAnswerRepository.AnsweredItemView item : items) {
            AssessmentAttempt attempt = attemptById.get(item.getAttemptId());
            if (attempt != null && !isCertificationAssessment(attempt.getExam())) {
                continue;
            }
            if (item.getPending() || item.getIsCorrect() == null) {
                continue;
            }
            boolean correct = Boolean.TRUE.equals(item.getIsCorrect());
            if (correct) {
                totalCorrect++;
            } else {
                totalIncorrect++;
            }

            String difficulty = bktEventFactory.normalizeDifficulty(
                    difficultyByQuestionId.get(item.getSourceQuestionId()));
            String assessmentType = (attempt != null && attempt.getExam() != null && attempt.getExam().getExamType() != null)
                    ? attempt.getExam().getExamType().getExamTypeText() : "UNKNOWN";

            bump(byDifficulty, difficulty, correct);
            bump(byQuestionType, item.getQuestionType(), correct);
            bump(byAssessmentType, assessmentType, correct);
        }

        int totalAssessmentAttempts = attempts.size();
        List<AssessmentAttempt> curriculumAttempts = attempts.stream()
                .filter(a -> isCertificationAssessment(a.getExam()))
                .toList();

        Double averageAssessmentScore = average(curriculumAttempts.stream()
                .map(AssessmentAttempt::getPercentage)
                .filter(Objects::nonNull)
                .map(BigDecimal::doubleValue)
                .toList());

        List<ScoreTrendPoint> scoreTrend = curriculumAttempts.stream()
                .filter(a -> a.getSubmittedAt() != null)
                .sorted(Comparator.comparing(AssessmentAttempt::getSubmittedAt))
                .map(a -> new ScoreTrendPoint(
                        a.getAssessmentAttemptId(),
                        a.getExam() != null ? a.getExam().getExamId() : null,
                        a.getAttemptNumber(),
                        a.getSubmittedAt(),
                        a.getExam() != null ? a.getExam().getTitle() : null,
                        (a.getExam() != null && a.getExam().getExamType() != null)
                                ? a.getExam().getExamType().getExamTypeText() : null,
                        a.getPercentage(),
                        a.getPassed(),
                        a.getCorrectCount(),
                        a.getItemCount()))
                .toList();

        List<AssessmentAttempt> finishedChallenges = attempts.stream()
                .filter(ProgressAnalyticsService::isChallengeRun)
                .toList();
        int totalChallengeAttempts = finishedChallenges.size();
        Double averageChallengeScore = average(finishedChallenges.stream()
                .map(AssessmentAttempt::getPercentage)
                .filter(Objects::nonNull)
                .map(BigDecimal::doubleValue)
                .toList());
        boolean hasChallengeActivity = !finishedChallenges.isEmpty();

        LearnerMasteryService.LessonPrioritiesResult bktResult = prioritiesFuture.join();
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "wait bkt priorities");
        boolean bktAvailable = bktResult.available();
        List<LessonPriorityView> lessonPriorities = bktResult.lessons();
        Map<Long, LessonPriorityView> priorityByLessonId = lessonPriorities.stream()
                .filter(l -> l.lessonId() != null)
                .collect(Collectors.toMap(LessonPriorityView::lessonId, l -> l, (a, b) -> a));

        Set<Long> assessedLessonIds = priorityByLessonId.keySet();
        int unassessedTopicCount = (int) certLessons.stream()
                .map(Lesson::getLessonId)
                .filter(id -> !assessedLessonIds.contains(id))
                .count();

        List<Double> assessedMasteries = lessonPriorities.stream()
                .map(LessonPriorityView::masteryProbability)
                .filter(Objects::nonNull)
                .toList();
        Double averageMastery = average(assessedMasteries);
        Double overallMasteryPercentage = averageMastery == null ? null : averageMastery * 100.0;
        int masteredTopicCount = (int) assessedMasteries.stream().filter(m -> m >= MASTERED_THRESHOLD).count();
        int weakTopicCount = (int) assessedMasteries.stream().filter(m -> m < WEAK_THRESHOLD).count();
        int highestPriorityTopicCount = (int) assessedMasteries.stream().filter(m -> m < HIGHEST_PRIORITY_THRESHOLD).count();

        LearnerMasteryService.ConfidenceResult confidenceResult = confidenceFuture.join();
        com.capstone.rebyu.common.PhaseTimer.mark(timer, "wait bkt confidence");
        Double confidencePercentage = (confidenceResult.available() && confidenceResult.confidence() != null)
                ? confidenceResult.confidence().confidenceScore() : null;





        Set<Long> officialLessonIds = certLessons.stream()
                .map(Lesson::getLessonId)
                .collect(Collectors.toSet());
        Set<Long> officialMiddleIds = certLessons.stream()
                .map(Lesson::getMiddleCategory)
                .filter(Objects::nonNull)
                .map(MiddleCategory::getMiddleCategoryId)
                .collect(Collectors.toSet());
        Set<Long> officialMajorIds = certLessons.stream()
                .map(Lesson::getMiddleCategory)
                .filter(Objects::nonNull)
                .map(MiddleCategory::getMajorCategory)
                .filter(Objects::nonNull)
                .map(MajorCategory::getMajorCategoryId)
                .collect(Collectors.toSet());

        List<Exam> allCertExams = examRepository.findWithTypeByCertificationIds(List.of(certificationId));
        List<Exam> certExams = new ArrayList<>();
        List<String> exclusions = new ArrayList<>();
        for (Exam exam : allCertExams) {
            String reason = assessmentExclusionReason(
                    exam, officialLessonIds, officialMiddleIds, officialMajorIds);
            if (reason == null) {
                certExams.add(exam);
            } else {
                exclusions.add("#" + exam.getExamId() + " '" + exam.getTitle() + "' (" + reason + ")");
            }
        }
        int totalAssessmentCount = certExams.size();

        if (!exclusions.isEmpty()) {
            log.debug("Certification {}: {} of {} exam(s) excluded from the assessment total -- {}",
                    certificationId, exclusions.size(), allCertExams.size(),
                    String.join(", ", exclusions));
        }
        if (certExams.isEmpty() && !allCertExams.isEmpty()) {
            log.warn("Certification {} has {} exam(s) but none count toward its assessment total, "
                            + "so the learner is told it has no assessments. Excluded: {}",
                    certificationId, allCertExams.size(), String.join(", ", exclusions));
        }

        Set<Long> passedExamIds = attempts.stream()
                .filter(attempt -> Boolean.TRUE.equals(attempt.getPassed()))
                .map(attempt -> attempt.getExam() == null ? null : attempt.getExam().getExamId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        int passedAssessmentCount = (int) certExams.stream()
                .filter(exam -> passedExamIds.contains(exam.getExamId()))
                .count();

        com.capstone.rebyu.common.PhaseTimer.mark(timer, "exams+passes");
        Double readinessPercentage = readinessScore(readinessFuture.join());

        List<CategoryMasteryRow> categoryMastery = buildCategoryMastery(certLessons, priorityByLessonId, completedLessons);

        List<TopicRow> weakestTopics = lessonPriorities.stream()
                .filter(l -> l.masteryProbability() != null)
                .sorted(Comparator
                        .<LessonPriorityView>comparingInt(l -> switch (String.valueOf(l.priorityTag())) {
                            case "CRITICAL_PRIORITY" -> 0;
                            case "HIGH_PRIORITY" -> 1;
                            default -> 2;
                        })
                        .thenComparing(LessonPriorityView::masteryProbability))
                .limit(TOPIC_LIST_LIMIT)
                .map(l -> toTopicRow(l, lessonById))
                .toList();

        if (weakestTopics.isEmpty()) {
            weakestTopics = weakestTopicsFromMarks(learnerId, certificationId, lessonById);
        }

        List<TopicRow> strongestTopics = lessonPriorities.stream()
                .filter(l -> l.masteryProbability() != null && l.evidenceCount() != null && l.evidenceCount() > 0)
                .sorted(Comparator.comparing(LessonPriorityView::masteryProbability).reversed())
                .limit(TOPIC_LIST_LIMIT)
                .map(l -> toTopicRow(l, lessonById))
                .toList();

        LearnerMasteryService.MasteryHistoryResult historyResult = historyFuture.join();
        List<MasteryTrendPoint> masteryTrend = historyResult.history().stream()
                .map(h -> new MasteryTrendPoint(
                        parseDateTime(h.createdAt()),
                        h.lessonId(),
                        lessonById.containsKey(h.lessonId()) ? lessonById.get(h.lessonId()).getName() : null,
                        h.previousMastery(),
                        h.finalMastery(),
                        h.newMasteryLevel(),
                        h.assessmentType()))
                .toList();

        List<RecentActivityItem> recentActivity = buildRecentActivity(attempts);

        List<RecommendationRow> recommendations = buildRecommendations(
                lessonPriorities, historyResult.history(), certLessons, lessonById);

        com.capstone.rebyu.common.PhaseTimer.mark(timer, "readiness+history+rest");
        com.capstone.rebyu.common.PhaseTimer.finish(timer);
        return new ProgressAnalyticsResponse(
                learnerId,
                certificationId,
                certification.getTitle(),
                LocalDateTime.now(),
                bktAvailable,
                !attempts.isEmpty(),
                hasChallengeActivity,
                overallMasteryPercentage,
                confidencePercentage,
                readinessPercentage,
                masteredTopicCount,
                weakTopicCount,
                unassessedTopicCount,
                highestPriorityTopicCount,
                totalLessonCount,
                completedLessonCount,
                completionPercentage,
                totalAssessmentCount,
                passedAssessmentCount,
                totalAssessmentAttempts,
                totalChallengeAttempts,
                true,
                averageAssessmentScore,
                averageChallengeScore,
                totalCorrect,
                totalIncorrect,
                false,
                recentActivity,
                masteryTrend,
                scoreTrend,
                toBuckets(byDifficulty),
                toBuckets(byQuestionType),
                toBuckets(byAssessmentType),
                categoryMastery,
                weakestTopics,
                strongestTopics,
                recommendations,
                lessonPriorities.stream()
                        .map(l -> toTopicRow(l, lessonById))
                        .toList()
        );
    }

    private void bump(Map<String, int[]> map, String key, boolean correct) {
        String bucketKey = key == null ? "UNKNOWN" : key;
        int[] counts = map.computeIfAbsent(bucketKey, k -> new int[2]);
        if (correct) {
            counts[0]++;
        } else {
            counts[1]++;
        }
    }

    private List<PerformanceBucket> toBuckets(Map<String, int[]> map) {
        List<PerformanceBucket> buckets = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : map.entrySet()) {
            int correct = entry.getValue()[0];
            int incorrect = entry.getValue()[1];
            int total = correct + incorrect;
            Double accuracy = total == 0 ? null : (correct * 100.0 / total);
            buckets.add(new PerformanceBucket(entry.getKey(), total, correct, incorrect, accuracy));
        }
        return buckets;
    }

    private Double average(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        double sum = 0;
        for (double value : values) {
            sum += value;
        }
        return sum / values.size();
    }

    private static final int STREAK_TARGET_DAYS = 14;

    private String tutorPracticeMarker(Exam exam) {
        if (exam.getLearner() != null) {
            return "belongs to a single learner";
        }
        if (GeneratedAssessmentService.GENERATED_TARGET_SCOPE.equals(exam.getTargetScope())) {
            return "target scope " + exam.getTargetScope();
        }
        String typeText = exam.getExamType() == null ? null : exam.getExamType().getExamTypeText();
        if (GeneratedAssessmentService.QUIZ_EXAM_TYPE.equals(typeText)
                || GeneratedAssessmentService.FLASHCARD_EXAM_TYPE.equals(typeText)) {
            return "type " + typeText;
        }
        return null;
    }

    /** Curriculum assessment types, with the older names some exams were saved under. */
    private static final Map<String, String> CURRICULUM_ASSESSMENT_TYPES = Map.ofEntries(
            Map.entry("LESSON_QUIZ", "LESSON_QUIZ"),
            Map.entry("QUIZ", "LESSON_QUIZ"),
            Map.entry("MIDDLE_EXAM", "MIDDLE_EXAM"),
            Map.entry("MODULE_EXAM", "MIDDLE_EXAM"),
            Map.entry("MIDDLE_CATEGORY_QUIZ", "MIDDLE_EXAM"),
            Map.entry("MAJOR_EXAM", "MAJOR_EXAM"),
            Map.entry("MAJOR_CATEGORY_QUIZ", "MAJOR_EXAM"),
            Map.entry("MAJOR_CATEGORY_EXAM", "MAJOR_EXAM"),
            Map.entry("MOCK_EXAM", "MOCK_EXAM"),
            Map.entry("MOCK", "MOCK_EXAM"));

    /**
     * The certification's official lessons as lightweight, unmanaged objects carrying only
     * id, name, and their module and major category (id and title).
     *
     * Analytics reads nothing else from a lesson, and loading the entities read every
     * lesson's content -- about a megabyte for one certification -- on every visit.
     * They are never saved or lazily navigated beyond these fields.
     */
    private List<Lesson> officialLessonOutlines(Long certificationId) {
        Map<Long, MajorCategory> majors = new HashMap<>();
        Map<Long, MiddleCategory> middles = new HashMap<>();
        List<Lesson> lessons = new ArrayList<>();
        for (LessonRepository.LessonPlacementView row
                : lessonRepository.findOfficialPlacementsByCertificationId(certificationId)) {
            MajorCategory major = majors.computeIfAbsent(row.getMajorCategoryId(), id -> {
                MajorCategory m = new MajorCategory();
                m.setMajorCategoryId(id);
                m.setTitle(row.getMajorTitle());
                return m;
            });
            MiddleCategory middle = middles.computeIfAbsent(row.getMiddleCategoryId(), id -> {
                MiddleCategory m = new MiddleCategory();
                m.setMiddleCategoryId(id);
                m.setTitle(row.getMiddleTitle());
                m.setMajorCategory(major);
                return m;
            });
            Lesson lesson = new Lesson();
            lesson.setLessonId(row.getLessonId());
            lesson.setName(row.getName());
            lesson.setMiddleCategory(middle);
            lessons.add(lesson);
        }
        return lessons;
    }

    /**
     * An assessment of the certification itself: its curriculum (lesson quizzes, unit and
     * major exams, the mock) or its diagnostic. Not arenas, knowledge checks or practice,
     * which would otherwise skew the average score, the insights and answer accuracy.
     */
    boolean isCertificationAssessment(Exam exam) {
        if (exam == null) return true;
        if (tutorPracticeMarker(exam) != null) return false;
        if (exam.getOwnerDepartment() != null) return false;
        String typeText = exam.getExamType() == null ? null : exam.getExamType().getExamTypeText();
        String normalized = typeText == null ? null : typeText.trim().toUpperCase();
        return typeText == null
                || curriculumType(typeText) != null
                || "DIAGNOSTIC".equals(normalized) || "DIAGNOSTIC_EXAM".equals(normalized);
    }

    /** The curriculum type of an exam type name, or null when it is not part of the curriculum. */
    static String curriculumType(String examTypeText) {
        if (examTypeText == null) return null;
        return CURRICULUM_ASSESSMENT_TYPES.get(examTypeText.trim().toUpperCase().replace('-', '_').replace(' ', '_'));
    }

    String assessmentExclusionReason(
            Exam exam,
            Set<Long> officialLessonIds,
            Set<Long> officialMiddleIds,
            Set<Long> officialMajorIds) {

        if (exam.effectiveStatus() != Exam.Status.PUBLISHED) {
            return "not published, effective status " + exam.effectiveStatus()
                    + (exam.getStatus() == null ? " because its status column is null" : "");
        }
        String practice = tutorPracticeMarker(exam);
        if (practice != null) {
            return "tutor practice (" + practice + ")";
        }
        // A department's own paper is class work for its members, not the certification's
        // curriculum: counting it would hold back every learner of the certification.
        if (exam.getOwnerDepartment() != null) {
            return "set by department " + exam.getOwnerDepartment().getDepartmentId();
        }
        if (exam.getExamType() != null
                && "DIAGNOSTIC".equals(bktEventFactory.normalizeAssessmentType(
                        exam.getExamType().getExamTypeText()))) {
            return "diagnostic, type " + exam.getExamType().getExamTypeText();
        }
        // Only the certification's curriculum counts toward progress: lesson quizzes, unit
        // (middle) and major exams, and the mock. Arenas (World Cup, Blueprint Arena),
        // knowledge checks and practice are optional and must not hold back completion.
        // Not the BKT normalizer: that one folds CHALLENGE into LESSON_QUIZ for mastery.
        // An untyped (legacy) exam is still judged by its curriculum target below.
        String typeText = exam.getExamType() == null ? null : exam.getExamType().getExamTypeText();
        if (typeText != null && curriculumType(typeText) == null) {
            return "type " + typeText + " is not part of the certification curriculum";
        }
        if (exam.getLesson() != null) {
            Long lessonId = exam.getLesson().getLessonId();
            return officialLessonIds.contains(lessonId) ? null
                    : "targets lesson " + lessonId + ", which is not in the official curriculum "
                            + officialLessonIds;
        }
        if (exam.getMiddleCategory() != null) {
            Long middleId = exam.getMiddleCategory().getMiddleCategoryId();
            return officialMiddleIds.contains(middleId) ? null
                    : "targets middle category " + middleId
                            + ", which is not in the official curriculum " + officialMiddleIds;
        }
        if (exam.getMajorCategory() != null) {
            Long majorId = exam.getMajorCategory().getMajorCategoryId();
            return officialMajorIds.contains(majorId) ? null
                    : "targets major category " + majorId
                            + ", which is not in the official curriculum " + officialMajorIds;
        }
        return null;
    }

    private Map<String, Object> buildReadinessRequest(
            Long learnerId,
            List<Lesson> certLessons,
            List<AssessmentAttempt> attempts,
            int totalLessonCount,
            int completedLessonCount) {
        if (certLessons.isEmpty()) {
            return null;
        }
        Map<String, List<Double>> scoresByNormalizedType = new HashMap<>();
        for (AssessmentAttempt attempt : attempts) {
            if (attempt.getPercentage() == null || attempt.getExam() == null || attempt.getExam().getExamType() == null) {
                continue;
            }
            String normalized = normalizeReadinessType(attempt.getExam().getExamType().getExamTypeText());
            scoresByNormalizedType.computeIfAbsent(normalized, k -> new ArrayList<>())
                    .add(attempt.getPercentage().doubleValue());
        }

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("learner_id", learnerId);
        request.put("lesson_ids", certLessons.stream().map(Lesson::getLessonId).toList());
        putIfPresent(request, "diagnostic_score", average(scoresByNormalizedType.get("DIAGNOSTIC")));
        putIfPresent(request, "lesson_quiz_score", average(scoresByNormalizedType.get("LESSON_QUIZ")));
        putIfPresent(request, "middle_exam_score", average(scoresByNormalizedType.get("MIDDLE_EXAM")));
        putIfPresent(request, "major_exam_score", average(scoresByNormalizedType.get("MAJOR_EXAM")));
        putIfPresent(request, "mock_exam_score", average(scoresByNormalizedType.get("MOCK_EXAM")));


        if (totalLessonCount > 0) {
            double progress = Math.min(100.0,
                    (double) completedLessonCount / totalLessonCount * 100.0);
            request.put("lesson_progress_score", progress);
        }

        int streakDays = streakService.getStreak(learnerId).currentStreak();
        double streakScore = Math.min(100.0,
                (double) streakDays / STREAK_TARGET_DAYS * 100.0);
        request.put("streak_score", streakScore);

        return request;
    }

    private Double readinessScore(Map<String, Object> response) {
        if (response == null || "TEMPORARILY_UNAVAILABLE".equals(response.get("status"))) {
            return null;
        }
        Object score = response.get("readiness_score");
        return score instanceof Number number ? number.doubleValue() : null;
    }

    private String normalizeReadinessType(String rawExamType) {
        if (rawExamType != null) {
            String value = rawExamType.trim().toUpperCase().replace("-", "_").replace(" ", "_");
            if ("MAJOR_EXAM".equals(value) || "MAJOR_CATEGORY_QUIZ".equals(value)) {
                return "MAJOR_EXAM";
            }
        }
        String bktClass = bktEventFactory.normalizeAssessmentType(rawExamType);
        if ("KNOWLEDGE_CHECK".equals(bktClass) || "GENERATED_QUIZ".equals(bktClass)) {
            return "LESSON_QUIZ";
        }
        return bktClass;
    }

    private void putIfPresent(Map<String, Object> request, String key, Double value) {
        if (value != null) {
            request.put(key, value);
        }
    }

    private List<CategoryMasteryRow> buildCategoryMastery(
            List<Lesson> certLessons,
            Map<Long, LessonPriorityView> priorityByLessonId,
            List<LearnerCompletedLesson> completedLessons) {

        Set<Long> completedLessonIds = completedLessons.stream()
                .map(c -> c.getLesson().getLessonId())
                .collect(Collectors.toSet());

        Map<Long, MiddleCategory> middleCategoryById = new LinkedHashMap<>();
        Map<Long, List<Lesson>> lessonsByMiddleCategory = new LinkedHashMap<>();
        for (Lesson lesson : certLessons) {
            MiddleCategory middleCategory = lesson.getMiddleCategory();
            if (middleCategory == null) {
                continue;
            }
            middleCategoryById.putIfAbsent(middleCategory.getMiddleCategoryId(), middleCategory);
            lessonsByMiddleCategory.computeIfAbsent(middleCategory.getMiddleCategoryId(), k -> new ArrayList<>()).add(lesson);
        }

        Map<Long, MajorCategory> majorCategoryById = new LinkedHashMap<>();
        Map<Long, List<Long>> middleIdsByMajor = new LinkedHashMap<>();
        for (MiddleCategory middleCategory : middleCategoryById.values()) {
            MajorCategory major = middleCategory.getMajorCategory();
            if (major == null) {
                continue;
            }
            majorCategoryById.putIfAbsent(major.getMajorCategoryId(), major);
            middleIdsByMajor.computeIfAbsent(major.getMajorCategoryId(), k -> new ArrayList<>())
                    .add(middleCategory.getMiddleCategoryId());
        }

        Map<Long, CategoryMasteryRow> middleRows = new LinkedHashMap<>();
        for (Map.Entry<Long, List<Lesson>> entry : lessonsByMiddleCategory.entrySet()) {
            MiddleCategory middleCategory = middleCategoryById.get(entry.getKey());
            middleRows.put(entry.getKey(), buildCategoryRow(
                    middleCategory.getMiddleCategoryId(), middleCategory.getTitle(), "MIDDLE",
                    entry.getValue(), priorityByLessonId, completedLessonIds, List.of()));
        }

        List<CategoryMasteryRow> majorRows = new ArrayList<>();
        for (Map.Entry<Long, List<Long>> entry : middleIdsByMajor.entrySet()) {
            MajorCategory major = majorCategoryById.get(entry.getKey());
            List<CategoryMasteryRow> children = entry.getValue().stream()
                    .map(middleRows::get)
                    .filter(Objects::nonNull)
                    .toList();
            List<Lesson> allLessonsUnderMajor = entry.getValue().stream()
                    .flatMap(middleId -> lessonsByMiddleCategory.getOrDefault(middleId, List.of()).stream())
                    .toList();
            majorRows.add(buildCategoryRow(
                    major.getMajorCategoryId(), major.getTitle(), "MAJOR",
                    allLessonsUnderMajor, priorityByLessonId, completedLessonIds, children));
        }
        return majorRows;
    }

    private CategoryMasteryRow buildCategoryRow(
            Long categoryId, String title, String level,
            List<Lesson> lessons,
            Map<Long, LessonPriorityView> priorityByLessonId,
            Set<Long> completedLessonIds,
            List<CategoryMasteryRow> children) {

        int total = lessons.size();
        int completed = 0;
        int assessed = 0;
        int weak = 0;
        int highestPriority = 0;
        List<Double> masteries = new ArrayList<>();
        for (Lesson lesson : lessons) {
            if (completedLessonIds.contains(lesson.getLessonId())) {
                completed++;
            }
            LessonPriorityView priority = priorityByLessonId.get(lesson.getLessonId());
            if (priority != null && priority.masteryProbability() != null) {
                assessed++;
                double mastery = priority.masteryProbability();
                masteries.add(mastery);
                if (mastery < WEAK_THRESHOLD) {
                    weak++;
                }
                if (mastery < HIGHEST_PRIORITY_THRESHOLD) {
                    highestPriority++;
                }
            }
        }
        Double avgMastery = average(masteries);
        Double masteryPercentage = avgMastery == null ? null : avgMastery * 100.0;
        String masteryLevel = classifyMasteryLevel(avgMastery);
        String priorityCode = highestPriority > 0 ? "HIGHEST_PRIORITY"
                : weak > 0 ? "WEAK" : assessed > 0 ? "ON_TRACK" : "UNASSESSED";

        return new CategoryMasteryRow(categoryId, title, level, masteryPercentage, masteryLevel, priorityCode,
                assessed, total, completed, weak, highestPriority, children);
    }

    private String classifyMasteryLevel(Double avgMastery) {
        if (avgMastery == null) {
            return "UNASSESSED";
        }
        if (avgMastery >= MASTERED_THRESHOLD) {
            return "MASTERED";
        }
        if (avgMastery >= WEAK_THRESHOLD) {
            return "GOOD";
        }
        if (avgMastery >= HIGHEST_PRIORITY_THRESHOLD) {
            return "DEVELOPING";
        }
        return "WEAK";
    }

    private List<TopicRow> weakestTopicsFromMarks(
            Long learnerId, Long certificationId, Map<Long, Lesson> lessonById) {
        return attemptAnswerRepository.lessonAccuracy(learnerId, certificationId).stream()
                .filter(row -> row.getLessonId() != null && row.getAnswered() > 0)
                .sorted(Comparator.comparingDouble(row -> (double) row.getCorrect() / row.getAnswered()))
                .limit(TOPIC_LIST_LIMIT)
                .map(row -> {
                    Lesson lesson = lessonById.get(row.getLessonId());
                    if (lesson == null) return null;
                    return new TopicRow(
                            row.getLessonId(),
                            lesson.getName(),
                            lesson.getMiddleCategory() == null ? null
                                    : lesson.getMiddleCategory().getMiddleCategoryId(),
                            lesson.getMiddleCategory() == null ? null
                                    : lesson.getMiddleCategory().getTitle(),
                            100.0 * row.getCorrect() / row.getAnswered(),
                            null,
                            (int) row.getAnswered(),
                            null);
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private TopicRow toTopicRow(LessonPriorityView priority, Map<Long, Lesson> lessonById) {
        Lesson lesson = lessonById.get(priority.lessonId());
        Long categoryId = (lesson != null && lesson.getMiddleCategory() != null)
                ? lesson.getMiddleCategory().getMiddleCategoryId() : null;
        String categoryTitle = (lesson != null && lesson.getMiddleCategory() != null)
                ? lesson.getMiddleCategory().getTitle() : null;


        String title = lesson != null ? lesson.getName() : priority.lessonTitle();
        Double masteryPercentage = priority.masteryProbability() == null ? null : priority.masteryProbability() * 100.0;
        return new TopicRow(priority.lessonId(), title, categoryId, categoryTitle, masteryPercentage,
                priority.priorityTag(), priority.evidenceCount(), priority.lastAssessedAt());
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            try {
                return OffsetDateTime.parse(value).toLocalDateTime();
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }

    private static boolean isChallengeRun(AssessmentAttempt attempt) {
        return attempt.getExam() != null && attempt.getExam().getExamType() != null
                && ChallengeArenaService.CHALLENGE_EXAM_TYPE.equals(attempt.getExam().getExamType().getExamTypeText());
    }

    private List<RecentActivityItem> buildRecentActivity(List<AssessmentAttempt> attempts) {
        List<RecentActivityItem> items = new ArrayList<>();
        for (AssessmentAttempt attempt : attempts) {
            if (attempt.getSubmittedAt() == null) {
                continue;
            }
            boolean challenge = isChallengeRun(attempt);
            String title = attempt.getExam() != null ? attempt.getExam().getTitle() : (challenge ? "Challenge" : "Assessment");
            items.add(new RecentActivityItem(challenge ? "CHALLENGE" : "ASSESSMENT", title, attempt.getSubmittedAt(),
                    attempt.getPercentage() == null ? null : attempt.getPercentage().doubleValue(),
                    attempt.getPassed()));
        }
        return items.stream()
                .sorted(Comparator.comparing(RecentActivityItem::occurredAt).reversed())
                .limit(RECENT_ACTIVITY_LIMIT)
                .toList();
    }

    private List<RecommendationRow> buildRecommendations(
            List<LessonPriorityView> lessonPriorities,
            List<MasteryHistoryView> history,
            List<Lesson> certLessons,
            Map<Long, Lesson> lessonById) {

        List<RecommendationRow> recommendations = new ArrayList<>();
        Set<Long> added = new HashSet<>();

        lessonPriorities.stream()
                .filter(l -> l.masteryProbability() != null && l.masteryProbability() < HIGHEST_PRIORITY_THRESHOLD)
                .sorted(Comparator.comparing(LessonPriorityView::masteryProbability))
                .forEach(l -> {
                    if (recommendations.size() >= RECOMMENDATION_LIMIT || !added.add(l.lessonId())) {
                        return;
                    }
                    recommendations.add(new RecommendationRow(l.lessonId(), resolveTitle(l, lessonById),
                            String.format("Mastery is at %.0f%% -- this is one of your most urgent topics.",
                                    l.masteryProbability() * 100.0),
                            l.recommendedAction(), "HIGHEST_PRIORITY"));
                });

        addByTag(recommendations, added, lessonPriorities, lessonById, "HIGH_PRIORITY");
        addByTag(recommendations, added, lessonPriorities, lessonById, "MEDIUM_PRIORITY");

        Map<Long, Long> recentMissCounts = history.stream()
                .filter(h -> !h.observedCorrect())
                .collect(Collectors.groupingBy(MasteryHistoryView::lessonId, Collectors.counting()));
        recentMissCounts.entrySet().stream()
                .filter(e -> e.getValue() >= 2)
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .forEach(e -> {
                    if (recommendations.size() >= RECOMMENDATION_LIMIT || !added.add(e.getKey())) {
                        return;
                    }
                    Lesson lesson = lessonById.get(e.getKey());
                    String title = lesson != null ? lesson.getName() : ("Lesson " + e.getKey());
                    recommendations.add(new RecommendationRow(e.getKey(), title,
                            "Missed " + e.getValue() + " of the recent questions on this topic.",
                            "Review recent mistakes", "REPEATED_MISTAKE"));
                });

        Map<Long, LessonPriorityView> priorityByLessonId = lessonPriorities.stream()
                .collect(Collectors.toMap(LessonPriorityView::lessonId, l -> l, (a, b) -> a));
        List<RecommendationRow> currentSnapshot = new ArrayList<>(recommendations);
        for (RecommendationRow rec : currentSnapshot) {
            if (recommendations.size() >= RECOMMENDATION_LIMIT) {
                break;
            }
            Lesson strugglingLesson = lessonById.get(rec.lessonId());
            if (strugglingLesson == null || strugglingLesson.getMiddleCategory() == null) {
                continue;
            }
            List<Lesson> siblings = certLessons.stream()
                    .filter(l -> l.getMiddleCategory() != null
                            && l.getMiddleCategory().getMiddleCategoryId()
                                    .equals(strugglingLesson.getMiddleCategory().getMiddleCategoryId())
                            && l.getLessonId() < strugglingLesson.getLessonId())
                    .sorted(Comparator.comparing(Lesson::getLessonId))
                    .toList();
            for (Lesson sibling : siblings) {
                if (recommendations.size() >= RECOMMENDATION_LIMIT) {
                    break;
                }
                if (added.contains(sibling.getLessonId())) {
                    continue;
                }
                LessonPriorityView siblingPriority = priorityByLessonId.get(sibling.getLessonId());
                boolean weakOrUnassessed = siblingPriority == null
                        || siblingPriority.masteryProbability() == null
                        || siblingPriority.masteryProbability() < WEAK_THRESHOLD;
                if (weakOrUnassessed) {
                    added.add(sibling.getLessonId());
                    recommendations.add(new RecommendationRow(sibling.getLessonId(), sibling.getName(),
                            "Comes before '" + strugglingLesson.getName()
                                    + "' in this module -- reviewing it first may help close the gap.",
                            "Review prerequisite lesson",
                            siblingPriority != null ? siblingPriority.priorityTag() : "UNASSESSED"));
                }
            }
        }

        return recommendations;
    }

    private void addByTag(
            List<RecommendationRow> recommendations, Set<Long> added,
            List<LessonPriorityView> lessonPriorities, Map<Long, Lesson> lessonById, String tag) {
        lessonPriorities.stream()
                .filter(l -> tag.equals(l.priorityTag()))
                .forEach(l -> {
                    if (recommendations.size() >= RECOMMENDATION_LIMIT || !added.add(l.lessonId())) {
                        return;
                    }
                    String reason = l.primaryReason() != null ? l.primaryReason() : ("Flagged as " + l.priorityLabel());
                    recommendations.add(new RecommendationRow(l.lessonId(), resolveTitle(l, lessonById),
                            reason, l.recommendedAction(), tag));
                });
    }

    private String resolveTitle(LessonPriorityView priority, Map<Long, Lesson> lessonById) {
        Lesson lesson = lessonById.get(priority.lessonId());
        if (lesson != null) {
            return lesson.getName();
        }
        return priority.lessonTitle() != null
                ? priority.lessonTitle()
                : ("Lesson " + priority.lessonId());
    }
}
