/** @vitest-environment node */
// TC-116: Correct-answer mastery
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-116: Correct-answer mastery", async (context) => {
  await pythonMath(
    "r=m.update_mastery(mastery_before=.30,is_correct=True,learn=.20,guess=.25,slip=.10,forget=0)\nassert abs(r.predicted_correct_probability-.445)<1e-12\nassert r.mastery_after>.30\nassert 0<=r.mastery_posterior<=1"
  )
}, 15000)
