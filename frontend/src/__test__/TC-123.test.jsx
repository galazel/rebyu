/** @vitest-environment node */
// TC-123: Lesson-reading isolation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Tests read/completion bookkeeping at its actual service boundary. Cross-service absence of a mastery event needs a separate integration assertion.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-123: Lesson-reading isolation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the native Java test toolchain; run npm run test:native."
    )
    return
  }
  await runJavaTests("AiChatServiceTest#catalogCase", {
    source: "aigateway/service/AiChatServiceTest.java",
    append:
      "var completed = mock(com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository.class);\nvar mapper = mock(com.capstone.rebyu.progress.mapper.LearnerCompletedLessonMapper.class);\nvar em = mock(jakarta.persistence.EntityManager.class);\nvar rewards = mock(com.capstone.rebyu.gamification.RewardService.class);\nvar streak = mock(com.capstone.rebyu.gamification.service.StreakService.class);\nvar achievements = mock(com.capstone.rebyu.progress.service.AchievementAwardService.class);\nvar organizationProgress = mock(com.capstone.rebyu.enrollment.service.OrgEnrollmentProgressService.class);\nvar lessonRepository = mock(com.capstone.rebyu.certification.repository.LessonRepository.class);\nvar completion = new com.capstone.rebyu.progress.service.LearnerCompletedLessonService(completed,mapper,em,rewards,streak,achievements,organizationProgress,lessonRepository);\nvar dto = new com.capstone.rebyu.progress.dto.LearnerCompletedLessonDto(9L,7L,java.time.LocalDateTime.now());\nvar entity = new com.capstone.rebyu.progress.entity.LearnerCompletedLesson();\nwhen(mapper.toEntity(dto)).thenReturn(entity);when(completed.save(entity)).thenReturn(entity);when(mapper.toDto(entity)).thenReturn(dto);\nassertSame(dto,completion.create(dto));verify(completed).save(entity);verify(streak).recordActivity(9L);",
  })
}, 240000)
