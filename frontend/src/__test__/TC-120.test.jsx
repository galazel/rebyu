/** @vitest-environment node */
// TC-120: Explicit full score
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-120: Explicit full score", async (context) => {
  await pythonMath(
    "args=dict(mastery_before=.30,learn=.08,guess=.25,slip=.10)\na=m.update_mastery(is_correct=False,score=1,**args)\nb=m.update_mastery(is_correct=True,**args)\nassert a==b"
  )
}, 15000)
