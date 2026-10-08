import { base } from "./base"

export function getBoardLayout(board) {
  return base(`dashboard-layout?board=${encodeURIComponent(board)}`)
}

export function saveBoardLayout(board, tiles) {
  return base(`dashboard-layout?board=${encodeURIComponent(board)}`, {
    method: "PUT",
    data: { tiles },
  })
}
