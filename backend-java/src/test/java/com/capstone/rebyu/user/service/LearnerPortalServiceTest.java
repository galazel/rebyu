package com.capstone.rebyu.user.service;

import com.capstone.rebyu.assessment.mapper.ExamResultMapper;
import com.capstone.rebyu.assessment.repository.ExamResultRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.mapper.LearnerCertificationMapper;
import com.capstone.rebyu.enrollment.mapper.InstitutionCertificationLearnerMapper;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.mapper.InstitutionCertificateMapper;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.progress.analytics.service.ProgressAnalyticsService;
import com.capstone.rebyu.progress.service.AchievementAwardService;
import com.capstone.rebyu.progress.mapper.LearnerCompletedLessonMapper;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.dto.LearnerPortalDto;
import com.capstone.rebyu.user.mapper.LearnerMapper;
import com.capstone.rebyu.user.mapper.UserMapper;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LearnerPortalServiceTest {

    private static final Long LEARNER_ID = 3L;
    private static final Long USER_ID = 9L;

    private LearnerRepository learnerRepository;
    private UserRepository userRepository;
    private LearnerCertificationRepository learnerCertRepository;
    private LearnerCompletedLessonRepository completedLessonRepository;
    private ExamResultRepository examResultRepository;
    private InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private InstitutionCertificateMapper institutionCertMapper;
    private RewardService rewardService;
    private LearnerPortalService service;

    @BeforeEach
    void setUp() {
        // LearnerPortalService caches portals in a STATIC map for 30s, so
        // without this each test answers from whatever the previous one cached
        // for the same (learner, user) and the suite passes or fails on order.
        LearnerPortalService.clearHotCacheForTests();

        learnerRepository = mock(LearnerRepository.class);
        userRepository = mock(UserRepository.class);
        learnerCertRepository = mock(LearnerCertificationRepository.class);
        completedLessonRepository = mock(LearnerCompletedLessonRepository.class);
        examResultRepository = mock(ExamResultRepository.class);
        institutionCertLearnerRepository = mock(InstitutionCertificationLearnerRepository.class);
        institutionCertMapper = mock(InstitutionCertificateMapper.class);

        rewardService = mock(RewardService.class);
        // The portal reports XP/coins/credits now; without a balance it NPEs
        // before it reaches anything these tests are actually asserting.
        when(rewardService.balance(LEARNER_ID)).thenReturn(new RewardService.Balance(0L, 0L, 0));

        service = new LearnerPortalService(learnerRepository, mock(LearnerMapper.class), userRepository,
                mock(UserMapper.class), learnerCertRepository, mock(LearnerCertificationMapper.class),
                completedLessonRepository, mock(LearnerCompletedLessonMapper.class),
                examResultRepository, mock(ExamResultMapper.class),
                institutionCertLearnerRepository, mock(InstitutionCertificationLearnerMapper.class), institutionCertMapper,
                rewardService, mock(AchievementAwardService.class),
                mock(ProgressAnalyticsService.class));

        when(learnerRepository.findById(LEARNER_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(learnerCertRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of());
        when(completedLessonRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of());
        when(examResultRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of());
        when(institutionCertMapper.toDto(any())).thenReturn(null);
    }

    private InstitutionCertificationLearner assignmentWithInstitutionCert(Long institutionCertId) {
        InstitutionCertificate institutionCert = new InstitutionCertificate();
        institutionCert.setInstitutionCertId(institutionCertId);
        InstitutionCertificationLearner row = new InstitutionCertificationLearner();
        row.setInstitutionCert(institutionCert);
        return row;
    }

    @Test
    void portal_usesScopedFinders_neverGlobalFindAll() {
        when(institutionCertLearnerRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of());

        service.portal(LEARNER_ID, USER_ID);

        verify(examResultRepository).findByLearner_LearnerId(LEARNER_ID);
        verify(examResultRepository, never()).findAll();
        verify(completedLessonRepository).findByLearner_LearnerId(LEARNER_ID);
        verify(completedLessonRepository, never()).findAll();
        verify(institutionCertLearnerRepository, never()).findAll();
    }

    @Test
    void portal_institutionCertificatesAreDedupedFromLearnersOwnAssignments() {
        when(institutionCertLearnerRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of(
                assignmentWithInstitutionCert(100L), assignmentWithInstitutionCert(200L), assignmentWithInstitutionCert(100L)));

        LearnerPortalDto result = service.portal(LEARNER_ID, USER_ID);

        // Two distinct org certs (100, 200) -- the duplicate 100 is collapsed, and only
        // the learner's own allocations are mapped (never a global org-cert fetch).
        assertEquals(2, result.institutionCertificates().size());
        verify(institutionCertMapper, org.mockito.Mockito.times(2)).toDto(any());
    }

    @Test
    void portal_noAssignments_returnsEmptyInstitutionCertificates() {
        when(institutionCertLearnerRepository.findByLearner_LearnerId(LEARNER_ID)).thenReturn(List.of());

        LearnerPortalDto result = service.portal(LEARNER_ID, USER_ID);

        assertEquals(0, result.institutionCertificates().size());
        assertEquals(0, result.institutionCertLearners().size());
    }
}
