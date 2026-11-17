// TC-221: Arena stage unlock wording
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderLobby } from "./support/arena-lobby.jsx"

test("TC-221: Arena stage unlock wording", async () => {
  await renderLobby({ arena: {}, completedStages: [] })

  // Stage 1 is open; later stages ask the learner to PASS the one before.
  expect((await screen.findAllByText("Pass stage 1 to unlock")).length).toBeGreaterThan(0)
  expect(screen.queryByText(/Finish stage/)).not.toBeInTheDocument()
})
