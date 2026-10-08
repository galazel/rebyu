
const CODESTRIKE_TITLES = [
  "Two Sum",
  "Valid Parentheses",
  "Merge Intervals",
  "LRU Cache",
  "Binary Tree Paths",
  "Course Schedule",
  "Word Ladder",
  "Median of Two Arrays",
  "Trapping Rain Water",
  "Longest Substring",
]

const CODESTRIKE_PROMPTS = {
  "Two Sum":
    "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Each input has exactly one solution, and the same element may not be used twice.",
  "Valid Parentheses":
    "Given a string containing only '(', ')', '{', '}', '[' and ']', decide whether the brackets are closed in the correct order.",
  "Merge Intervals":
    "Given a collection of intervals, merge every set of overlapping intervals and return the result sorted by start.",
  "LRU Cache":
    "Design a cache with a fixed capacity that evicts the least recently used entry once full. Both get and put must run in constant time.",
  "Binary Tree Paths":
    "Given the root of a binary tree, return every root-to-leaf path as a string.",
  "Course Schedule":
    "Given a number of courses and their prerequisite pairs, decide whether every course can be finished.",
  "Word Ladder":
    "Given two words and a dictionary, return the length of the shortest transformation sequence changing one letter at a time.",
  "Median of Two Arrays":
    "Given two sorted arrays, return the median of the combined set in logarithmic time.",
  "Trapping Rain Water":
    "Given an elevation map, compute how much water it can trap after raining.",
  "Longest Substring":
    "Return the length of the longest substring without repeating characters.",
}

const DIFFICULTIES = ["easy", "easy", "easy", "average", "average", "average", "average", "hard", "hard", "hard"]

export const CODESTRIKE_PROBLEMS = CODESTRIKE_TITLES.map((title, index) => ({
  attemptQuestionId: `cs-${index + 1}`,
  questionType: "CRITICAL_THINKING",
  criticalThinkingType: "PROGRAMMING",
  title,
  question: CODESTRIKE_PROMPTS[title],
  instructions:
    "Your solution is judged on correctness first, then on how close it lands to the target time complexity.",
  difficultyLevel: DIFFICULTIES[index],
  points: 10,
  starterCode: "public class Solution {\n    // your code here\n}\n",
  testCases: [
    { index: 0, label: "Sample case 1", sample: true, input: "[2, 7, 11, 15], target 9", status: "NOT_RUN" },
    { index: 1, label: "Sample case 2", sample: true, input: "[3, 2, 4], target 6", status: "NOT_RUN" },
    { index: 2, label: "Hidden case 1", sample: false, input: null, status: "NOT_RUN" },
    { index: 3, label: "Hidden case 2 — edge", sample: false, input: null, status: "NOT_RUN" },
  ],
  subQuestions: [],
}))

const BLUEPRINT_PROBLEMS_RAW = [
  ["Scalable order processing", "UML_COMPONENT", "Design a system that accepts client orders, authenticates each request, and persists them. Traffic must be distributed, and reads should not hit the database directly."],
  ["Class diagram — library system", "UML_CLASS", "Model the classes behind a library: members, titles, copies, and loans, with the relationships and multiplicities between them."],
  ["Sequence diagram — checkout", "SEQUENCE_DIAGRAM", "Show the message order for a checkout: cart validation, payment authorisation, stock reservation, and confirmation."],
  ["Read-heavy news feed", "UML_COMPONENT", "Design the components behind a feed read far more often than it is written. Show where caching and fan-out sit."],
  ["ER model — school registry", "ERD", "Model students, sections, subjects, and enrolments, with keys and the cardinality of each relationship."],
  ["Use case — ATM withdrawal", "USE_CASE", "Capture the actors and use cases for an ATM withdrawal, including the bank's authorisation as a supporting actor."],
  ["Chat message delivery", "SEQUENCE_DIAGRAM", "Show how a message travels from sender to recipient, including the acknowledgement and the offline path."],
  ["Rate-limited public API", "UML_COMPONENT", "Design an API edge that enforces per-client rate limits without the limiter becoming the bottleneck."],
  ["Order status flow", "ACTIVITY_DIAGRAM", "Model the states an order moves through from placed to delivered, including cancellation and refund."],
  ["Event-driven inventory", "ACTIVITY_DIAGRAM", "Design stock updates as events rather than synchronous writes, and show where consistency is reconciled."],
]

export const BLUEPRINT_PROBLEMS = BLUEPRINT_PROBLEMS_RAW.map(
  ([title, diagramType, question], index) => ({
    attemptQuestionId: `bp-${index + 1}`,
    questionType: "CRITICAL_THINKING",
    criticalThinkingType: "DIAGRAM",
    title,
    question,
    instructions:
      "Marking is structural: each rule is a fact about the diagram, not a matter of taste.",
    diagramType,
    difficultyLevel: DIFFICULTIES[index],
    points: 10,
    rubric: [],
    subQuestions: [],
  }),
)

export function makeProgrammingRunner(problem) {
  const executions = []

  const replay = (mode) => async (code, language) => {
    const submitted = String(code ?? "").trim().length > 0

    const tests = (problem.testCases ?? []).map((testCase, index) => ({
      ...testCase,
      status: !submitted ? "NOT_RUN" : index < 3 ? "PASSED" : "FAILED",
    }))

    executions.unshift({
      executionId: `${problem.attemptQuestionId}-${executions.length + 1}`,
      mode: mode === "run" ? "Run" : "Check",
      language,
      status: submitted ? "COMPLETED" : "UNAVAILABLE",
      passedTests: submitted ? 3 : 0,
      totalTests: tests.length,
      createdAt: new Date().toISOString(),
    })

    return {
      tests,
      message: submitted
        ? "Demo run — no judge is wired up yet, so these results are scripted."
        : "Write some code first: there is nothing to run.",
    }
  }

  return {
    run: replay("run"),
    check: replay("check"),
    listExecutions: () => executions,
  }
}

export const CODESTRIKE_RUNNERS = Object.fromEntries(
  CODESTRIKE_PROBLEMS.map((problem) => [
    problem.attemptQuestionId,
    makeProgrammingRunner(problem),
  ]),
)

const BLUEPRINT_RULES = [
  "Client reaches the load balancer",
  "API gateway sits behind the load balancer",
  "Auth service guards the gateway",
  "Services connect to a database",
  "Cache sits between service and database",
]

export async function checkBlueprintDiagram(submission) {
  const drawn = String(submission ?? "").trim().length > 0

  return {
    rubric: BLUEPRINT_RULES.map((name, index) => ({
      name,
      maxPoints: 2,
      awardedPoints: drawn ? (index < 4 ? 2 : 0) : null,
      feedback: drawn
        ? index < 4
          ? "Satisfied"
          : "Not satisfied — no cache between the service and the database."
        : null,
      status: drawn ? "SCORED" : "PENDING",
    })),
    message: drawn
      ? "Demo check — structural marking is not wired up yet, so these results are scripted."
      : "Draw something on the canvas, then check it.",
  }
}
