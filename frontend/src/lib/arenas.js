import { Code2, Network, Trophy } from "@/components/icons"

/**
 * The IT Olympics arenas, in one place.
 *
 * Shared by the arena overview, each arena's own workspace, and the admin
 * challenges list. `questionTypes` is the arena's contract with the question
 * builder: an arena problem IS a question, so these are ids from
 * `QUESTION_TYPES` in `components/questions/question-editors` rather than a
 * parallel taxonomy that would drift from the bank's validation.
 *
 * `questionsPerNode` is the solo arenas' contract with the roadmap. A solo run
 * is the path of numbered circle buttons in `components/challenges/problem-grid`
 * — each node is a stage the learner clears by answering every question in it,
 * not a single question. World Cup carries no roadmap: a bracket round is a
 * mock-exam-style question set on one certification, so its problems are one
 * flat list.
 */
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
    // World Cup matchmaking is locked to a certification track; the solo runs
    // draw from every published bank, so they have nothing to select.
    tracked: false,
    questionsPerNode: 10,
    fields: [
      { key: "problems", label: "Roadmap nodes", value: "10", hint: "Circle buttons on the path" },
      { key: "timeLimit", label: "Run time limit (min)", value: "45", hint: "0 for untimed" },
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
      { key: "problems", label: "Roadmap nodes", value: "10", hint: "Circle buttons on the path" },
      { key: "timeLimit", label: "Run time limit (min)", value: "60" },
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
    name: "World Cup",
    icon: Trophy,
    tone: "bg-rb-bee-wash text-rb-bee-ink",
    format: "8-player tournament",
    blurb:
      "An eight-player bracket on one certification track — quarterfinals, semis, and a timed grand final.",
    questionTypes: ["MCQ", "SHORT_ANSWER", "DESCRIPTIVE"],
    // Every opponent is studying the same syllabus, so the set says which
    // certification it belongs to.
    tracked: true,
    // No roadmap. A round is a mock exam played against seven other people.
    questionsPerNode: null,
    // Weekly, and authored a week at a time: a tournament everyone sits at once
    // cannot reuse last week's questions, because the answers would already be
    // out in the world. So the admin publishes one edition per week rather than
    // maintaining a single standing set.
    weekly: true,
    // A bracket narrows 8 -> 4 -> 2 -> 1. Each stage is its own question set:
    // the same eight players meet three times in a night, so one shared set
    // would have them answering questions they had already seen.
    stages: [
      { id: "quarterfinal", name: "Quarterfinals", matches: 4, players: 8 },
      { id: "semifinal", name: "Semifinals", matches: 2, players: 4 },
      { id: "final", name: "Final", matches: 1, players: 2 },
    ],
    fields: [
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

/** Blade colours, cycled. Three tones for however many tracks a learner has. */
const TRACK_TONES = ["bee", "macaw", "beetle"]

/**
 * The World Cup tracks *this* learner can queue into.
 *
 * A track is a certification they are enrolled in, not the platform's whole
 * catalogue. The bracket puts eight people on one syllabus and scores them
 * against each other, so a track you have never studied is a guaranteed loss —
 * and the questions are drawn from that certification's bank, which an
 * unenrolled learner has no business seeing. Enrolled in TOPCIT only? TOPCIT is
 * the only blade on the screen.
 *
 * `disabledTrackIds` are the certifications an admin switched off on the IT
 * Olympics overview (the World Cup status carries them). A track too few
 * players queue into never fills a lobby, so it is left off the screen.
 */
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
