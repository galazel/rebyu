import { Network } from "@/components/icons"

import ArenaLobby from "@/components/challenges/arena-lobby.jsx"

export default function BlueprintArenaPage() {
  return (
    <ArenaLobby
      arenaId="blueprint"
      name="Blueprint Arena"
      icon={Network}
      tone={{ face: "bg-rb-macaw" }}
      blurb="UML and system design problems on a canvas, checked against structural rules."
    />
  )
}
