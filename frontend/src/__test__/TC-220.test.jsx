// TC-220: Arena lobby stage time
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import { renderLobby } from "./support/arena-lobby.jsx"

test("TC-220: Arena lobby stage time", async () => {
  // Every stage uses the default, so the lobby states one shared time.
  const same = await renderLobby({ arena: { stageMinutes: [] } })
  expect(await screen.findByText("10 min each")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /about/i }))
  expect(await screen.findByText(/10 minutes per stage/)).toBeInTheDocument()
  same.unmount()

  // Stages with their own times make the lobby say so instead of one number.
  await renderLobby({ arena: { stageMinutes: [5, 15, null] } })
  expect(await screen.findByText("timed stages")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /about/i }))
  expect(
    await screen.findByText(/Each stage has its own time limit/)
  ).toBeInTheDocument()
  expect(screen.queryByText("10 min each")).not.toBeInTheDocument()
})
