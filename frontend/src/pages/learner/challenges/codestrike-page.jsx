import { Code2 } from "@/components/icons"

import ArenaLobby from "@/components/challenges/arena-lobby.jsx"

export default function CodeStrikePage() {
  return (
    <ArenaLobby
      arenaId="codestrike"
      name="CodeStrike"
      icon={Code2}
      tone={{ face: "bg-rb-feather" }}
      blurb="Coding problems back to back, judged against real unit tests."
    />
  )
}
