import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Code2, Network, Settings, Trophy } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"

import {
  CHALLENGE_ARENAS_KEY,
  getChallengeArenas,
} from "@/services/challengeService.js"

import { Skeleton } from "@/components/ui/skeleton"
import { InstitutionErrorState } from "@/components/institution/institution-ui.jsx"
import { Button } from "@/components/ui/button"
import { BubbleCard } from "@/components/commons/bubble-card.jsx"




const INITIAL_CHALLENGES = [
  {
    challengeId: 1,
    arenaId: "codestrike",
    title: "CodeStrike",
    description:
        "Ten coding problems back to back, judged against real unit tests and scored on time complexity as well as correctness.",
    icon: Code2,
    tone: "feather",
    role: "Coding Skills",
    tag: "Solo",
    format: "solo · 10 problems",
  },
  {
    challengeId: 2,
    arenaId: "blueprint",
    title: "Blueprint Arena",
    description:
        "Ten UML and system design problems on a drag-and-drop canvas, checked against structural rules rather than opinion.",
    icon: Network,
    tone: "feather",
    role: "Design Skills",
    tag: "Solo",
    format: "solo · 10 problems",
  },
  {
    challengeId: 3,
    arenaId: "worldcup",
    title: "Champions Cup",
    description:
        "An eight-player bracket on one certification track — quarterfinals, semis, and a timed grand final.",
    icon: Trophy,
    tone: "feather",
    role: "Exam Readiness",
    tag: "Tournament",
    format: "8 players · live bracket",
  },
]

export default function Challenges({ initialChallenges = INITIAL_CHALLENGES }) {
  const [challenges, setChallenges] = useState(initialChallenges)

  const arenasQuery = useQuery({
    queryKey: [CHALLENGE_ARENAS_KEY],
    queryFn: getChallengeArenas,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!arenasQuery.data) return
    const byArena = new Map(arenasQuery.data.map((arena) => [arena.arenaId, arena]))
    setChallenges((current) =>
      current.map((challenge) => {
        const arena = byArena.get(challenge.arenaId)
        return arena
          ? {
              ...challenge,
              problemCount: arena.problemCount,
              configured: arena.configured,
            }
          : challenge
      }),
    )
  }, [arenasQuery.data])

  return (
      <section className="space-y-6">
        <div className="rebyu-page-header">
          <div>
            <h1 className="font-rb-display text-2xl font-extrabold lowercase">
              challenges
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage each arena&rsquo;s problems.
            </p>
          </div>
        </div>

        {arenasQuery.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading arenas">
            {challenges.map((challenge) => (
              <Skeleton key={challenge.challengeId} className="h-72 rounded-rb-card" />
            ))}
          </div>
        ) : arenasQuery.isError ? (
          <InstitutionErrorState
            title="Unable to load the arenas"
            description="The arena settings could not be read. The three arenas themselves are unaffected."
            onRetry={arenasQuery.refetch}
          />
        ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
                <BubbleCard
                    key={challenge.challengeId}
                    tone={challenge.tone}
                    cap="flat"
                    body="card"
                    icon={challenge.icon}
                    eyebrow={challenge.role}
                    title={
                      <Link
                          to={`/admin/arenas/${challenge.arenaId}`}
                          className="rounded-sm hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
                      >
                        {challenge.title}
                      </Link>
                    }
                    chips={[
                      { label: challenge.tag },
                      { label: challenge.format, side: "right" },
                    ]}
                    footer={
                      <Button
                          asChild
                          size="sm"
                          className="rounded-full"
                      >
                        <Link to={`/admin/arenas/${challenge.arenaId}`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage problems
                        </Link>
                      </Button>
                    }
                >
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {challenge.description}
                  </p>
                </BubbleCard>
          ))}
        </div>
        )}
      </section>
  )
}
