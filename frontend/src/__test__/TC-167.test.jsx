/** @vitest-environment node */
// TC-167: Payment simulation boundary
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit test; all generated fixture overlays are written under frontend/.native-test-output.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-167: Payment simulation boundary", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies. Run npm run test:native to execute; not a frontend pass."
    )
    return
  }
  await runJavaTests("EnrollmentTransactionServiceTest#catalogCase", {
    source: "enrollment/service/EnrollmentTransactionServiceTest.java",
    append:
      'DevSimulatedPaymentVerifier verifier = new DevSimulatedPaymentVerifier();\nLearnerOrder order = LearnerOrder.builder().orderNumber("ORDER-TEST").build();\nassertFalse(verifier.verify(order, "SIM-ORDER-TEST"));\norg.springframework.test.util.ReflectionTestUtils.setField(verifier, "enabled", true);\nassertTrue(verifier.verify(order, "SIM-ORDER-TEST"));\nassertFalse(verifier.verify(order, "WRONG"));\nassertEquals("DEV_SIMULATED", verifier.providerName());',
  })
}, 240000)
