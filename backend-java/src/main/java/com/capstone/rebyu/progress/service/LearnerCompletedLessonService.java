package com.capstone.rebyu.progress.service;

import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.enrollment.service.OrgEnrollmentProgressService;
import com.capstone.rebyu.gamification.RewardAmounts;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.gamification.service.StreakService;
import com.capstone.rebyu.progress.dto.LearnerCompletedLessonDto;
import com.capstone.rebyu.progress.mapper.LearnerCompletedLessonMapper;
import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.entity.LearnerCompletedLessonId;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LearnerCompletedLessonService {
    private static int lessonCompletionXp() { return RewardAmounts.getLessonCompletionXp(); }

    private final LearnerCompletedLessonRepository learnerCompletedLessonRepository;
    private final LearnerCompletedLessonMapper learnerCompletedLessonMapper;
    private final EntityManager entityManager;
    private final RewardService rewardService;
    private final StreakService streakService;
    private final AchievementAwardService achievementAwardService;
    private final OrgEnrollmentProgressService orgEnrollmentProgressService;
    private final LessonRepository lessonRepository;

    public List<LearnerCompletedLessonDto> getAll() {
        return learnerCompletedLessonRepository.findAll().stream().map(learnerCompletedLessonMapper::toDto).toList();
    }

    public LearnerCompletedLessonDto getById(Long learnerId, Long lessonId) {
        return learnerCompletedLessonMapper.toDto(findEntity(learnerId, lessonId));
    }

    public LearnerCompletedLessonDto create(LearnerCompletedLessonDto dto) {
        LearnerCompletedLesson entity = learnerCompletedLessonMapper.toEntity(dto);
        entity.setLearner(entityManager.getReference(Learner.class, dto.getLearnerId()));
        entity.setLesson(entityManager.getReference(Lesson.class, dto.getLessonId()));
        LearnerCompletedLessonDto saved = learnerCompletedLessonMapper.toDto(learnerCompletedLessonRepository.save(entity));

        rewardService.awardXp(dto.getLearnerId(), lessonCompletionXp(), "LESSON_COMPLETED",
                "lesson-completed:" + dto.getLessonId());
        streakService.recordActivity(dto.getLearnerId());
        achievementAwardService.evaluate(dto.getLearnerId());
        syncInstitutionProgress(dto.getLearnerId(), dto.getLessonId());

        return saved;
    }

    public LearnerCompletedLessonDto update(Long learnerId, Long lessonId, LearnerCompletedLessonDto dto) {
        findEntity(learnerId, lessonId);
        dto.setLearnerId(learnerId);
        dto.setLessonId(lessonId);
        LearnerCompletedLesson entity = learnerCompletedLessonMapper.toEntity(dto);
        entity.setLearner(entityManager.getReference(Learner.class, learnerId));
        entity.setLesson(entityManager.getReference(Lesson.class, lessonId));
        return learnerCompletedLessonMapper.toDto(learnerCompletedLessonRepository.save(entity));
    }

    public void delete(Long learnerId, Long lessonId) {
        learnerCompletedLessonRepository.delete(findEntity(learnerId, lessonId));
        syncInstitutionProgress(learnerId, lessonId);
    }

    private void syncInstitutionProgress(Long learnerId, Long lessonId) {
        learnerCompletedLessonRepository.flush();
        lessonRepository.findById(lessonId)
                .map(lesson -> lesson.getMiddleCategory() == null
                        || lesson.getMiddleCategory().getMajorCategory() == null
                        || lesson.getMiddleCategory().getMajorCategory().getCertification() == null
                        ? null
                        : lesson.getMiddleCategory().getMajorCategory().getCertification().getCertificationId())
                .ifPresent(certificationId -> orgEnrollmentProgressService.sync(learnerId, certificationId));
    }

    private LearnerCompletedLesson findEntity(Long learnerId, Long lessonId) {
        LearnerCompletedLessonId id = new LearnerCompletedLessonId();
        id.setLearnerId(learnerId);
        id.setLessonId(lessonId);
        return learnerCompletedLessonRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LearnerCompletedLesson not found: " + learnerId + "/" + lessonId));
    }
}
