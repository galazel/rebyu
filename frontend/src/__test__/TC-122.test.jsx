/** @vitest-environment node */
// TC-122: Mastery threshold boundaries
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { pythonMath } from "./support/python.js"

test("TC-122: Mastery threshold boundaries", async (context) => {
  await pythonMath(
    "args=dict(developing_threshold=.40,good_threshold=.70,mastered_threshold=.85)\nfor p,label in [(.40,'developing'),(.70,'good'),(.85,'mastered'),(.40-1e-10,'weak'),(.70-1e-10,'developing'),(.85-1e-10,'good')]:\n assert m.mastery_level(p,**args)==label"
  )
}, 15000)
