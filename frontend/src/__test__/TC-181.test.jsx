/** @vitest-environment node */
// TC-181: Community ownership
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native service unit-test assertions; opt-in Java execution.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-181: Community ownership", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not a frontend pass."
    )
    return
  }
  await runJavaTests("CommunityServiceTest#catalogCase", {
    source: "community/CommunityServiceTest.java",
    append:
      "when(postRepository.findById(POST_ID)).thenReturn(Optional.of(visiblePost()));\nassertThrows(IllegalArgumentException.class,()->service.updatePost(OTHER_LEARNER_ID,POST_ID,reviewerRequest(List.of())));\nverify(postRepository,never()).save(any());",
  })
}, 240000)
