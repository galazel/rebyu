/** @vitest-environment node */
// TC-127: Distinct assessment count
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-127: Distinct assessment count", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the native Java test toolchain; run npm run test:native."
    )
    return
  }
  await runJavaTests("ProgressAnalyticsServiceTest#catalogCase", {
    source: "progress/analytics/service/ProgressAnalyticsServiceTest.java",
    append:
      'Exam paper=exam("Mock","MOCK_EXAM");paper.setExamId(7L);paper.setStatus(Exam.Status.PUBLISHED);\nwhen(examRepository.findWithTypeByCertificationIds(List.of(CERT_ID))).thenReturn(List.of(paper));\nwhen(assessmentAttemptRepository.findWithExamByLearnerAndCertification(eq(LEARNER_ID),eq(CERT_ID),eq(AssessmentAttempt.Status.SUBMITTED))).thenReturn(List.of(attempt(1L,paper,new BigDecimal("80"),true,LocalDateTime.now().minusDays(1)),attempt(2L,paper,new BigDecimal("60"),false,LocalDateTime.now())));\nvar response=service.getProgressAnalytics(LEARNER_ID,CERT_ID);\nassertEquals(1,response.totalAssessmentCount());assertEquals(2,response.totalAssessmentAttempts());',
  })
}, 240000)
