// TC-215: Arena stage settings
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { ARENAS } from "@/lib/arenas.js"

test("TC-215: Arena stage settings", () => {
  for (const id of ["codestrike", "blueprint"]) {
    const arena = ARENAS.find((row) => row.id === id)
    const field = (key) => arena.fields.find((row) => row.key === key)

    expect(field("passScore")).toMatchObject({ value: "70" })
    expect(field("timePerProblem").label).toBe("Default time per stage (min)")
    expect(field("pointsPerProblem").label).toBe("Default points per stage")
    // Stages follow the problems, so the old fixed node count and total
    // run limit are no longer configurable.
    expect(field("problems")).toBeUndefined()
    expect(field("timeLimit")).toBeUndefined()
    expect(arena.questionsPerNode).toBeNull()
  }
})
