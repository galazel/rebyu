import { Code2, Network, Trophy } from "@/components/icons"

export const ARENAS = [
  {
    id: "codestrike",
    name: "CodeStrike",
    icon: Code2,
    tone: "bg-rb-macaw-wash text-rb-macaw-lip",
    format: "Solo",
    blurb:
      "Ten coding problems back to back, judged against real unit tests and scored on time complexity as well as correctness.",
    questionTypes: ["PROGRAMMING"],
    tracked: false,
    questionsPerNode: 10,
    fields: [
      {
        key: "entryXp",
        label: "XP needed to enter",
        value: "0",
        hint: "0 lets anyone in; otherwise the learner must already hold this much XP",
      },
      { key: "problems", label: "Roadmap nodes", value: "10", hint: "Circle buttons on the path" },
      { key: "timeLimit", label: "Run time limit (min)", value: "45", hint: "0 for untimed" },
      {
        key: "timePerProblem",
        label: "Time per problem (min)",
        value: "10",
        hint: "Countdown timer shown on each problem card",
      },
      {
        key: "pointsPerProblem",
        label: "Points per problem",
        value: "10",
        hint: "Points awarded for each correctly solved problem",
      },
      { key: "weightCorrect", label: "Weight — correctness (%)", value: "60", hint: "Tests passed" },
      {
        key: "weightSpeed",
        label: "Weight — speed (%)",
        value: "20",
        hint: "Full marks for finishing in half the time limit",
      },
      {
        key: "weightBigO",
        label: "Weight — efficiency (%)",
        value: "20",
        hint: "Slowest test runtime: full under 250 ms, zero at 5 s",
      },
    ],
  },
  {
    id: "blueprint",
    name: "Blueprint Arena",
    icon: Network,
    tone: "bg-rb-beetle-wash text-rb-beetle-lip",
    format: "Solo",
    blurb:
      "Ten UML and system design problems on a drag-and-drop canvas, checked against structural rules rather than opinion.",
    questionTypes: ["DIAGRAM"],
    tracked: false,
    questionsPerNode: 10,
    fields: [
      {
        key: "entryXp",
        label: "XP needed to enter",
        value: "0",
        hint: "0 lets anyone in; otherwise the learner must already hold this much XP",
      },
      { key: "problems", label: "Roadmap nodes", value: "10", hint: "Circle buttons on the path" },
      { key: "timeLimit", label: "Run time limit (min)", value: "60" },
      {
        key: "timePerProblem",
        label: "Time per problem (min)",
        value: "10",
        hint: "Countdown timer shown on each problem card",
      },
      {
        key: "pointsPerProblem",
        label: "Points per problem",
        value: "10",
        hint: "Points awarded for each correctly solved problem",
      },
      {
        key: "passRules",
        label: "Rules to pass a problem (%)",
        value: "80",
        hint: "Structural checks satisfied",
      },
      {
        key: "components",
        label: "Palette components",
        value: "8",
        hint: "Load balancer, database, …",
      },
    ],
  },
  {
    id: "worldcup",
    name: "Champions Cup",
    icon: Trophy,
    tone: "bg-rb-bee-wash text-rb-bee-ink",
    format: "8-player tournament",
    blurb:
      "An eight-player bracket on one certification track — quarterfinals, semis, and a timed grand final.",
    questionTypes: ["MCQ", "SHORT_ANSWER", "DESCRIPTIVE"],
    tracked: true,
    questionsPerNode: null,
    weekly: true,
    stages: [
      { id: "quarterfinal", name: "Quarterfinals", matches: 4, players: 8 },
      { id: "semifinal", name: "Semifinals", matches: 2, players: 4 },
      { id: "final", name: "Final", matches: 1, players: 2 },
    ],
    fields: [
      {
        key: "entryXp",
        label: "XP needed to enter",
        value: "0",
        hint: "0 lets anyone in; otherwise the learner must already hold this much XP",
      },
      { key: "lobbySize", label: "Lobby size", value: "8", hint: "Bracket requires a power of two" },
      { key: "roundSeconds", label: "Seconds per round", value: "180" },
      { key: "countdown", label: "Lock-in countdown (s)", value: "3" },
      {
        key: "queueTimeout",
        label: "Queue timeout (s)",
        value: "120",
        hint: "Before offering a bot lobby",
      },
    ],
  },
]

export function getArena(arenaId) {
  return ARENAS.find((arena) => arena.id === arenaId) ?? null
}

const TRACK_TONES = ["bee", "macaw", "beetle"]

export function getWorldCupTracks(enrolledCertifications = [], disabledTrackIds = []) {
  const disabled = new Set((disabledTrackIds ?? []).map(String))
  return enrolledCertifications
    .filter((certification) => !disabled.has(String(certification.certificationId ?? certification.id)))
    .map((certification, index) => ({
    id: String(certification.certificationId ?? certification.id),
    name: certification.title ?? "Certification",
    short: String(certification.title ?? "certification").toLowerCase(),
    tone: TRACK_TONES[index % TRACK_TONES.length],
    blurb:
      certification.description ??
      "Questions drawn from this certification's own question bank.",
  }))
}
