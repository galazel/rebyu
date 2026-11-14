/** @vitest-environment node */
// TC-119: Explicit zero score
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-119: Explicit zero score", async (context) => {
  await pythonMath(
    "args=dict(mastery_before=.30,learn=.08,guess=.25,slip=.10)\na=m.update_mastery(is_correct=True,score=0,**args)\nb=m.update_mastery(is_correct=False,**args)\nassert a==b"
  )
}, 15000)
