/** @vitest-environment node */
// TC-098: Activity progress ownership
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-098: Activity progress ownership", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests("ActivityProgressServiceTest#catalogCase", {
    source: "learningtools/service/ActivityProgressServiceTest.java",
    append:
      'when(repository.findByLearnerIdAndProgressKeyStartingWith(10L, KEY)).thenReturn(List.of());\nassertEquals(Map.of(), service.list(10L, KEY));\nverify(repository).findByLearnerIdAndProgressKeyStartingWith(10L, KEY);\nservice.save(10L, KEY, json.readTree("{}"));\nverify(repository).save(argThat(row -> row.getLearnerId().equals(10L)));',
  })
}, 240000)
