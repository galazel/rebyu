/** @vitest-environment node */
// TC-146: Institution data isolation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Delegates to existing production-service JUnit assertions; execution is opt-in and is not a frontend mock test.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-146: Institution data isolation", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires the Java unit-test toolchain; enable with npm run test:native. Not executed by the frontend run."
    )
    return
  }
  await runJavaTests(
    "InstitutionPortalServiceTest#learnerExamResults_learnerNotInInstitution_throwsNotFoundWithoutReadingResults+overview_usesInstitutionScopedRepositoryQueries_notGlobalFindAll"
  )
}, 240000)
