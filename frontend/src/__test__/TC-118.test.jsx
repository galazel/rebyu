/** @vitest-environment node */
// TC-118: Partial-credit posterior
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-118: Partial-credit posterior", async (context) => {
  await pythonMath(
    "args=dict(mastery_before=.30,learn=.08,guess=.25,slip=.10,forget=.03)\na=m.update_mastery(is_correct=True,**args)\nb=m.update_mastery(is_correct=False,**args)\nc=m.update_mastery(is_correct=False,score=.5,**args)\nassert b.mastery_posterior<c.mastery_posterior<a.mastery_posterior\nassert abs(c.mastery_posterior-(a.mastery_posterior+b.mastery_posterior)/2)<1e-12"
  )
}, 15000)
