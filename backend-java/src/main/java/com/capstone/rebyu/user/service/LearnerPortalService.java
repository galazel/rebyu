package com.capstone.rebyu.user.service;

import com.capstone.rebyu.assessment.mapper.ExamResultMapper;
import com.capstone.rebyu.assessment.repository.ExamResultRepository;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.mapper.LearnerCertificationMapper;
import com.capstone.rebyu.enrollment.mapper.InstitutionCertificationLearnerMapper;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.mapper.InstitutionCertificateMapper;
import com.capstone.rebyu.progress.analytics.dto.CertificationProgressDto;
import com.capstone.rebyu.progress.analytics.service.ProgressAnalyticsService;
import com.capstone.rebyu.progress.mapper.LearnerCompletedLessonMapper;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.progress.service.AchievementAwardService;
import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.dto.LearnerPortalDto;
import com.capstone.rebyu.user.mapper.LearnerMapper;
import com.capstone.rebyu.user.mapper.UserMapper;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LearnerPortalService {

    private static final long HOT_CACHE_TTL_MILLIS = 30_000L;
    private static final Map<String, CachedPortal> HOT_CACHE = new ConcurrentHashMap<>();

    private final LearnerRepository learnerRepository;
    private final LearnerMapper learnerMapper;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final LearnerCertificationRepository learnerCertificationRepository;
    private final LearnerCertificationMapper learnerCertificationMapper;
    private final LearnerCompletedLessonRepository completedLessonRepository;
    private final LearnerCompletedLessonMapper completedLessonMapper;
    private final ExamResultRepository examResultRepository;
    private final ExamResultMapper examResultMapper;
    private final InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private final InstitutionCertificationLearnerMapper institutionCertLearnerMapper;
    private final InstitutionCertificateMapper institutionCertMapper;
    private final RewardService rewardService;
    private final AchievementAwardService achievementAwardService;
    private final ProgressAnalyticsService progressAnalyticsService;

    public LearnerDto currentLearner(Long learnerId) {
        return learnerRepository.findById(learnerId).map(learnerMapper::toDto).orElse(null);
    }

    @Transactional
    public LearnerPortalDto portal(Long learnerId, Long userId) {
        return portal(learnerId, userId, true);
    }

    @Transactional
    public List<CertificationProgressDto> certificationProgress(Long learnerId, Long userId) {
        return portal(learnerId, userId, true).certificationProgress();
    }

    @Transactional
    public LearnerPortalDto portal(Long learnerId, Long userId, boolean includeProgress) {
        String cacheKey = learnerId + ":" + userId + ":" + includeProgress;
        CachedPortal cached = HOT_CACHE.get(cacheKey);
        if (cached != null && cached.expiresAt() > System.currentTimeMillis()) {
            return cached.value();
        }

        List<InstitutionCertificationLearner> institutionCertLearnerEntities =
                institutionCertLearnerRepository.findByLearner_LearnerId(learnerId);

        Map<Long, InstitutionCertificate> institutionCertsById = new LinkedHashMap<>();
        for (InstitutionCertificationLearner row : institutionCertLearnerEntities) {
            InstitutionCertificate institutionCert = row.getInstitutionCert();
            if (institutionCert != null) {
                institutionCertsById.putIfAbsent(institutionCert.getInstitutionCertId(), institutionCert);
            }
        }
        List<InstitutionCertificateDto> institutionCertificates = institutionCertsById.values().stream()
                .map(institutionCertMapper::toDto).toList();

        RewardService.Balance rewardBalance = rewardService.balance(learnerId);
        Long totalXp = rewardBalance.xp();
        java.math.BigDecimal coinBalance = java.math.BigDecimal.valueOf(rewardBalance.coins());
        Long aiCreditsRemaining = (long) rewardBalance.aiCredits();

        List<LearnerCertification> learnerCertifications =
                learnerCertificationRepository.findByLearner_LearnerId(learnerId);
        List<com.capstone.rebyu.progress.entity.LearnerCompletedLesson> completedLessons =
                completedLessonRepository.findByLearner_LearnerId(learnerId);

        Map<Long, Integer> masteryByCertification = new java.util.HashMap<>();

        Set<Long> enrolledCertificationIds = new LinkedHashSet<>();
        for (LearnerCertification enrollment : learnerCertifications) {
            if (enrollment.getStatus() == LearnerCertification.Status.active
                    && enrollment.getCertification() != null) {
                enrolledCertificationIds.add(enrollment.getCertification().getCertificationId());
            }
        }
        for (InstitutionCertificationLearner row : institutionCertLearnerEntities) {
            if (row.getStatus() == InstitutionCertificationLearner.Status.active
                    && row.getInstitutionCert() != null
                    && row.getInstitutionCert().getCertification() != null) {
                enrolledCertificationIds.add(row.getInstitutionCert().getCertification().getCertificationId());
            }
        }

        List<CertificationProgressDto> certificationProgress = includeProgress
                ? enrolledCertificationIds.stream()
                        .map(certificationId -> progressAnalyticsService.progressFor(learnerId, certificationId))
                        .toList()
                : List.of();

        LearnerPortalDto result = new LearnerPortalDto(
                learnerRepository.findById(learnerId).map(learnerMapper::toDto).orElse(null),
                userRepository.findById(userId).map(userMapper::toDto).orElse(null),
                learnerCertifications.stream()
                        .map(learnerCertificationMapper::toDto).toList(),
                completedLessons.stream()
                        .map(completedLessonMapper::toDto).toList(),
                examResultRepository.findByLearner_LearnerId(learnerId).stream()
                        .map(examResultMapper::toDto).toList(),
                institutionCertLearnerEntities.stream().map(institutionCertLearnerMapper::toDto).toList(),
                institutionCertificates,
                achievementAwardService.catalogFor(learnerId),
                totalXp,
                coinBalance,
                aiCreditsRemaining,
                masteryByCertification,
                certificationProgress);
        HOT_CACHE.put(cacheKey, new CachedPortal(result, System.currentTimeMillis() + HOT_CACHE_TTL_MILLIS));
        return result;
    }

    private record CachedPortal(LearnerPortalDto value, long expiresAt) {}

    static void clearHotCacheForTests() {
        HOT_CACHE.clear();
    }
}
