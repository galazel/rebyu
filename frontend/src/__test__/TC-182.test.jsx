/** @vitest-environment node */
// TC-182: Community sharing
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native service unit-test assertions; opt-in Java execution.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-182: Community sharing", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not a frontend pass."
    )
    return
  }
  await runJavaTests("CommunityServiceTest#catalogCase", {
    source: "community/CommunityServiceTest.java",
    append:
      'var item = com.capstone.rebyu.learningtools.entity.LearnerLibraryItem.builder().libraryItemId(5L).itemType("quiz").title("Shared quiz").build();\nwhen(libraryItemRepository.findByLibraryItemIdAndLearner_LearnerId(5L,LEARNER_ID)).thenReturn(Optional.of(item));\nstubReadBack(null);\nservice.shareStudyItem(LEARNER_ID,5L,null);\nverify(postRepository).save(org.mockito.ArgumentMatchers.argThat(post->post.getSharedLibraryItem()==item && post.getAuthor().getLearnerId().equals(LEARNER_ID)));',
  })
}, 240000)
