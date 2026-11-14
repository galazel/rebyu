/** @vitest-environment node */
// TC-117: Incorrect-answer posterior
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-117: Incorrect-answer posterior", async (context) => {
  await pythonMath(
    "r=m.update_mastery(mastery_before=.75,is_correct=False,learn=.10,guess=.20,slip=.10,forget=0)\nassert r.mastery_posterior<.75\nassert 0<=r.mastery_after<=1"
  )
}, 15000)
