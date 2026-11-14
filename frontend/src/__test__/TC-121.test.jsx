/** @vitest-environment node */
// TC-121: Mastery labels
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-121: Mastery labels", async (context) => {
  await pythonMath(
    "args=dict(developing_threshold=.40,good_threshold=.70,mastered_threshold=.85)\nassert [m.mastery_level(p,**args) for p in [.20,.50,.75,.90]]==['weak','developing','good','mastered']"
  )
}, 15000)
