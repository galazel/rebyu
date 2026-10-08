package com.capstone.rebyu.progress.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.gamification.repository.NotificationPreferenceRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.progress.dto.LearnerAchievementViewDto;
import com.capstone.rebyu.progress.entity.Achievement;
import com.capstone.rebyu.progress.entity.LearnerAchievement;
import com.capstone.rebyu.progress.entity.LearnerAchievementId;
import com.capstone.rebyu.progress.repository.AchievementRepository;
import com.capstone.rebyu.progress.repository.LearnerAchievementRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AchievementAwardService {

    private static final int KNOWLEDGE_SEEKER_ENROLLMENTS = 2;
    private static final int TOP_ACHIEVER_MAX_RANK = 10;
    private static final long TOP_ACHIEVER_MIN_XP = 1_000L;
    private static final BigDecimal PERFECT_PERCENTAGE = BigDecimal.valueOf(100);
    private static final String MOCK_EXAM_TYPE = "MOCK_EXAM";

    private final AchievementRepository achievementRepository;
    private final LearnerAchievementRepository learnerAchievementRepository;
    private final LearnerCompletedLessonRepository completedLessonRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final LearnerCertificationRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final LearnerRepository learnerRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final NotificationService notificationService;
    private final RewardService rewardService;
    private final EntityManager entityManager;

    public List<LearnerAchievementViewDto> evaluate(Long learnerId) {
        if (learnerId == null) {
            return List.of();
        }

        Set<AchievementCatalog> earned = earnedCatalogEntries(learnerId);
        Progress progress = collectProgress(learnerId);
        List<LearnerAchievementViewDto> awarded = new ArrayList<>();

        for (AchievementCatalog entry : AchievementCatalog.values()) {
            if (entry == AchievementCatalog.REBYU_LEGEND || earned.contains(entry)) {
                continue;
            }
            if (!isEarned(entry, progress)) {
                continue;
            }
            award(learnerId, entry).ifPresent(view -> {
                earned.add(entry);
                awarded.add(view);
            });
        }

        boolean allOthers = EnumSet.complementOf(EnumSet.of(AchievementCatalog.REBYU_LEGEND))
                .stream().allMatch(earned::contains);
        if (allOthers && !earned.contains(AchievementCatalog.REBYU_LEGEND)) {
            award(learnerId, AchievementCatalog.REBYU_LEGEND).ifPresent(awarded::add);
        }

        if (!awarded.isEmpty()) {
            log.info("Learner {} earned achievement(s): {}", learnerId,
                    awarded.stream().map(LearnerAchievementViewDto::code).toList());
        }
        return awarded;
    }

    @Transactional(readOnly = true)
    public List<LearnerAchievementViewDto> catalogFor(Long learnerId) {
        Map<AchievementCatalog, LocalDateTime> earnedAt = new EnumMap<>(AchievementCatalog.class);
        if (learnerId != null) {
            for (LearnerAchievement row : learnerAchievementRepository.findById_LearnerIdOrderByEarnedAtDesc(learnerId)) {
                AchievementCatalog entry = row.getAchievement() == null ? null
                        : AchievementCatalog.byTitle(row.getAchievement().getTitle()).orElse(null);
                if (entry != null) {
                    earnedAt.put(entry, row.getEarnedAt());
                }
            }
        }

        Map<String, Long> idsByTitle = achievementRepository.findAll().stream()
                .collect(Collectors.toMap(
                        achievement -> achievement.getTitle().toLowerCase(),
                        Achievement::getAchievementId,
                        (first, second) -> first));

        List<LearnerAchievementViewDto> catalog = new ArrayList<>();
        for (AchievementCatalog entry : AchievementCatalog.values()) {
            catalog.add(new LearnerAchievementViewDto(
                    idsByTitle.get(entry.title().toLowerCase()),
                    entry.name(),
                    entry.slug(),
                    entry.title(),
                    entry.description(),
                    earnedAt.containsKey(entry),
                    earnedAt.get(entry)));
        }
        return catalog;
    }


    private record Progress(
            int completedLessons,
            int activeEnrollments,
            boolean submittedAnyAttempt,
            boolean scoredPerfect,
            boolean passedMockExam,
            boolean finishedACertification,
            boolean rankedAmongTopLearners) {
    }

    private boolean isEarned(AchievementCatalog entry, Progress progress) {
        return switch (entry) {
            case FIRST_STEP -> progress.completedLessons() >= 1;
            case FIRST_QUIZ -> progress.submittedAnyAttempt();
            case FIRST_PERFECT_SCORE -> progress.scoredPerfect();
            case EXAM_READY -> progress.passedMockExam();
            case KNOWLEDGE_SEEKER -> progress.activeEnrollments() >= KNOWLEDGE_SEEKER_ENROLLMENTS;
            case FINISHER -> progress.finishedACertification();
            case TOP_ACHIEVER -> progress.rankedAmongTopLearners();
            case REBYU_LEGEND -> false;
        };
    }

    private Progress collectProgress(Long learnerId) {
        Set<Long> completedLessonIds = completedLessonRepository.findByLearner_LearnerId(learnerId).stream()
                .map(completed -> completed.getId() == null ? null : completed.getId().getLessonId())
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<AssessmentAttempt> submitted = attemptRepository.findByLearnerIdOrderByStartedAtDesc(learnerId).stream()
                .filter(attempt -> attempt.getStatus() == AssessmentAttempt.Status.SUBMITTED)
                .toList();

        boolean scoredPerfect = submitted.stream().anyMatch(attempt ->
                attempt.getPercentage() != null
                        && attempt.getPercentage().compareTo(PERFECT_PERCENTAGE) >= 0);

        boolean passedMockExam = submitted.stream().anyMatch(attempt ->
                Boolean.TRUE.equals(attempt.getPassed()) && isMockExam(attempt));

        List<Long> enrolledCertificationIds = enrollmentRepository.findByLearner_LearnerId(learnerId).stream()
                .filter(enrollment -> enrollment.getStatus() == LearnerCertification.Status.active)
                .map(enrollment -> enrollment.getCertification() == null ? null
                        : enrollment.getCertification().getCertificationId())
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        return new Progress(
                completedLessonIds.size(),
                enrolledCertificationIds.size(),
                !submitted.isEmpty(),
                scoredPerfect,
                passedMockExam,
                finishedACertification(enrolledCertificationIds, completedLessonIds),
                rankedAmongTopLearners(learnerId));
    }

    private boolean isMockExam(AssessmentAttempt attempt) {
        return attempt.getExam() != null
                && attempt.getExam().getExamType() != null
                && MOCK_EXAM_TYPE.equalsIgnoreCase(attempt.getExam().getExamType().getExamTypeText());
    }

    private boolean finishedACertification(List<Long> certificationIds, Set<Long> completedLessonIds) {
        if (completedLessonIds.isEmpty()) {
            return false;
        }
        for (Long certificationId : certificationIds) {
            List<Lesson> lessons = lessonRepository
                    .findByMiddleCategory_MajorCategory_Certification_CertificationIdAndMiddleCategory_MajorCategory_OwnerDepartmentIsNull(
                            certificationId);
            if (lessons.isEmpty()) {
                continue;
            }
            boolean all = lessons.stream().allMatch(lesson -> completedLessonIds.contains(lesson.getLessonId()));
            if (all) {
                return true;
            }
        }
        return false;
    }

    private boolean rankedAmongTopLearners(Long learnerId) {
        return rewardService.leaderboard(learnerId, "overall", "all").stream()
                .filter(RewardService.LeaderboardEntry::currentLearner)
                .anyMatch(entry -> entry.rank() <= TOP_ACHIEVER_MAX_RANK
                        && entry.xp() >= TOP_ACHIEVER_MIN_XP);
    }


    private Set<AchievementCatalog> earnedCatalogEntries(Long learnerId) {
        Set<AchievementCatalog> earned = EnumSet.noneOf(AchievementCatalog.class);
        for (LearnerAchievement row : learnerAchievementRepository.findById_LearnerIdOrderByEarnedAtDesc(learnerId)) {
            if (row.getAchievement() != null) {
                AchievementCatalog.byTitle(row.getAchievement().getTitle()).ifPresent(earned::add);
            }
        }
        return earned;
    }

    private Optional<LearnerAchievementViewDto> award(Long learnerId, AchievementCatalog entry) {
        Achievement achievement = achievementRepository.findByTitleIgnoreCase(entry.title()).orElse(null);
        if (achievement == null) {
            log.warn("Achievement '{}' is missing from the catalog -- not awarding it", entry.title());
            return Optional.empty();
        }

        LearnerAchievementId id = new LearnerAchievementId();
        id.setLearnerId(learnerId);
        id.setAchievementId(achievement.getAchievementId());
        if (learnerAchievementRepository.existsById(id)) {
            return Optional.empty();
        }

        LocalDateTime earnedAt = LocalDateTime.now();
        LearnerAchievement row = new LearnerAchievement();
        row.setId(id);
        row.setLearner(entityManager.getReference(Learner.class, learnerId));
        row.setAchievement(achievement);
        row.setEarnedAt(earnedAt);
        learnerAchievementRepository.save(row);

        notifyLearner(learnerId, entry);

        return Optional.of(new LearnerAchievementViewDto(
                achievement.getAchievementId(), entry.name(), entry.slug(),
                entry.title(), entry.description(), true, earnedAt));
    }

    private void notifyLearner(Long learnerId, AchievementCatalog entry) {
        boolean wanted = notificationPreferenceRepository.findByLearner_LearnerId(learnerId)
                .map(preference -> !Boolean.FALSE.equals(preference.getAchievementNotifications()))
                .orElse(true);
        if (!wanted) {
            return;
        }
        learnerRepository.findById(learnerId)
                .map(Learner::getUser)
                .ifPresent(user -> notificationService.notify(
                        user,
                        "Achievement unlocked: " + entry.title(),
                        entry.description(),
                        "/learner/account"));
    }
}
