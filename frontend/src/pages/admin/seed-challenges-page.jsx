import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Loader2, Play, Trophy, Code2, Network } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCertifications } from "@/services/certificationService.js"
import { base } from "@/services/base.js"
import {
  saveArenaProblems,
  createWorldCupEdition,
  saveWorldCupEditionStages,
  publishWorldCupEdition,
} from "@/services/challengeService.js"

const NODES = 10
const QUESTIONS_PER_NODE = 10

const PROGRAMMING_TEMPLATES = [
  { q: "Write a function that returns the sum of two integers a and b.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "2 3", o: "5" }, { i: "0 0", o: "0" }, { i: "-1 5", o: "4" }] },
  { q: "Write a function that returns the product of two integers a and b.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "3 4", o: "12" }, { i: "0 7", o: "0" }, { i: "-2 5", o: "-10" }] },
  { q: "Write a function that returns the absolute value of an integer n.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "-5", o: "5" }, { i: "3", o: "3" }, { i: "0", o: "0" }] },
  { q: "Write a function that returns the maximum of two integers a and b.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "3 7", o: "7" }, { i: "10 2", o: "10" }, { i: "5 5", o: "5" }] },
  { q: "Write a function that returns the minimum of two integers a and b.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "3 7", o: "3" }, { i: "10 2", o: "2" }, { i: "-1 -5", o: "-5" }] },
  { q: "Write a function that returns true if n is even, false otherwise.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "4", o: "true" }, { i: "7", o: "false" }, { i: "0", o: "true" }] },
  { q: "Write a function that returns the square of an integer n.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "3", o: "9" }, { i: "-4", o: "16" }, { i: "0", o: "0" }] },
  { q: "Write a function that returns the factorial of n (n >= 0).", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "5", o: "120" }, { i: "0", o: "1" }, { i: "3", o: "6" }] },
  { q: "Write a function that returns the string reversed.", starter: "function solve(s) {\n  // your code here\n}", cases: [{ i: "hello", o: "olleh" }, { i: "abc", o: "cba" }, { i: "a", o: "a" }] },
  { q: "Write a function that returns the length of a string s.", starter: "function solve(s) {\n  // your code here\n}", cases: [{ i: "hello", o: "5" }, { i: "", o: "0" }, { i: "ab", o: "2" }] },
  { q: "Write a function that checks if a number is positive.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "5", o: "true" }, { i: "-3", o: "false" }, { i: "0", o: "false" }] },
  { q: "Write a function that returns the remainder of a divided by b.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "10 3", o: "1" }, { i: "8 4", o: "0" }, { i: "7 2", o: "1" }] },
  { q: "Write a function that returns the cube of an integer n.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "2", o: "8" }, { i: "3", o: "27" }, { i: "-1", o: "-1" }] },
  { q: "Write a function that returns the average of two numbers.", starter: "function solve(a, b) {\n  // your code here\n}", cases: [{ i: "4 6", o: "5" }, { i: "3 7", o: "5" }, { i: "0 10", o: "5" }] },
  { q: "Write a function that doubles a given number.", starter: "function solve(n) {\n  // your code here\n}", cases: [{ i: "5", o: "10" }, { i: "0", o: "0" }, { i: "-3", o: "-6" }] },
  { q: "Write a function that returns true if a string is a palindrome.", starter: "function solve(s) {\n  // your code here\n}", cases: [{ i: "racecar", o: "true" }, { i: "hello", o: "false" }, { i: "aba", o: "true" }] },
  { q: "Write a function that counts vowels in a string.", starter: "function solve(s) {\n  // your code here\n}", cases: [{ i: "hello", o: "2" }, { i: "aeiou", o: "5" }, { i: "xyz", o: "0" }] },
  { q: "Write a function that converts Celsius to Fahrenheit.", starter: "function solve(c) {\n  // your code here\n}", cases: [{ i: "0", o: "32" }, { i: "100", o: "212" }, { i: "37", o: "98.6" }] },
  { q: "Write a function that returns the power of base to exponent.", starter: "function solve(b, e) {\n  // your code here\n}", cases: [{ i: "2 3", o: "8" }, { i: "5 0", o: "1" }, { i: "3 2", o: "9" }] },
  { q: "Write a function that returns the first character of a string.", starter: "function solve(s) {\n  // your code here\n}", cases: [{ i: "hello", o: "h" }, { i: "world", o: "w" }, { i: "a", o: "a" }] },
]

const DIAGRAM_SCENARIOS = [
  "a student enrollment system with Student, Course, and Enrollment entities",
  "a library management system with Book, Member, and Loan entities",
  "an e-commerce platform with Customer, Order, and Product entities",
  "a hospital management system with Patient, Doctor, and Appointment entities",
  "a restaurant ordering system with Menu, Order, and Customer entities",
  "a hotel reservation system with Guest, Room, and Reservation entities",
  "a social media platform with User, Post, and Comment entities",
  "a banking system with Account, Customer, and Transaction entities",
  "a movie rental system with Movie, Customer, and Rental entities",
  "a school management system with Teacher, Subject, and Classroom entities",
  "a car rental system with Vehicle, Customer, and Booking entities",
  "an airline booking system with Flight, Passenger, and Ticket entities",
  "a gym membership system with Member, Trainer, and Session entities",
  "an inventory system with Warehouse, Product, and Shipment entities",
  "a blog platform with Author, Article, and Tag entities",
  "a music streaming service with Artist, Song, and Playlist entities",
  "a pet clinic system with Pet, Owner, and Visit entities",
  "a real estate system with Property, Agent, and Client entities",
  "a ticket booking system with Event, Venue, and Ticket entities",
  "a food delivery app with Restaurant, Driver, and Order entities",
]

const MCQ_QUESTIONS = [
  { q: "Which protocol is used for secure web browsing?", choices: ["HTTPS", "FTP", "SMTP", "Telnet"], correct: 0 },
  { q: "What does CPU stand for?", choices: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correct: 0 },
  { q: "Which of the following is a NoSQL database?", choices: ["MongoDB", "MySQL", "PostgreSQL", "Oracle"], correct: 0 },
  { q: "What is the primary function of an operating system?", choices: ["Manage hardware resources", "Create documents", "Browse the internet", "Send emails"], correct: 0 },
  { q: "Which layer of the OSI model handles routing?", choices: ["Network", "Transport", "Data Link", "Session"], correct: 0 },
  { q: "What does HTML stand for?", choices: ["HyperText Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct: 0 },
  { q: "Which data structure uses FIFO?", choices: ["Queue", "Stack", "Tree", "Graph"], correct: 0 },
  { q: "What is the time complexity of binary search?", choices: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correct: 0 },
  { q: "Which sorting algorithm has the best average-case performance?", choices: ["Merge Sort", "Bubble Sort", "Selection Sort", "Insertion Sort"], correct: 0 },
  { q: "What does SQL stand for?", choices: ["Structured Query Language", "Simple Query Language", "Standard Query Logic", "System Query Language"], correct: 0 },
  { q: "Which of the following is a version control system?", choices: ["Git", "Docker", "Kubernetes", "Jenkins"], correct: 0 },
  { q: "What is the purpose of a firewall?", choices: ["Filter network traffic", "Speed up internet", "Store data", "Compress files"], correct: 0 },
  { q: "Which programming paradigm does Java primarily support?", choices: ["Object-Oriented", "Functional", "Logic", "Procedural"], correct: 0 },
  { q: "What does API stand for?", choices: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Interface", "Application Process Integration"], correct: 0 },
  { q: "Which of the following is NOT a valid HTTP method?", choices: ["FETCH", "GET", "POST", "PUT"], correct: 0 },
  { q: "What is the default port for HTTP?", choices: ["80", "443", "8080", "3000"], correct: 0 },
  { q: "Which of the following is a cloud computing service model?", choices: ["IaaS", "HTTP", "TCP", "DNS"], correct: 0 },
  { q: "What does RAM stand for?", choices: ["Random Access Memory", "Read Access Memory", "Rapid Application Memory", "Remote Access Module"], correct: 0 },
  { q: "Which of the following is a relational database?", choices: ["PostgreSQL", "MongoDB", "Redis", "Cassandra"], correct: 0 },
  { q: "What is the primary purpose of DNS?", choices: ["Resolve domain names to IP addresses", "Encrypt data", "Filter spam", "Compress files"], correct: 0 },
  { q: "Which of the following is a container orchestration tool?", choices: ["Kubernetes", "Git", "Webpack", "ESLint"], correct: 0 },
  { q: "What does CSS stand for?", choices: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System", "Central Style Sheets"], correct: 0 },
  { q: "Which protocol is used for email sending?", choices: ["SMTP", "HTTP", "FTP", "SSH"], correct: 0 },
  { q: "What is the purpose of an index in a database?", choices: ["Speed up queries", "Encrypt data", "Backup data", "Compress tables"], correct: 0 },
  { q: "Which of the following is a JavaScript framework?", choices: ["React", "Django", "Flask", "Laravel"], correct: 0 },
  { q: "What does JSON stand for?", choices: ["JavaScript Object Notation", "Java Standard Object Notation", "JavaScript Online Network", "Java Serialized Object Notation"], correct: 0 },
  { q: "Which of the following uses a key-value store?", choices: ["Redis", "MySQL", "PostgreSQL", "SQLite"], correct: 0 },
  { q: "What is the purpose of a load balancer?", choices: ["Distribute traffic across servers", "Store backups", "Encrypt connections", "Monitor logs"], correct: 0 },
  { q: "Which of the following is an agile methodology?", choices: ["Scrum", "Waterfall", "V-Model", "Spiral"], correct: 0 },
  { q: "What does TCP stand for?", choices: ["Transmission Control Protocol", "Transfer Communication Protocol", "Technical Control Process", "Transport Connection Protocol"], correct: 0 },
]

async function createQuestion(text, type, lessonId, certificationId) {
  return base("questions", {
    method: "POST",
    data: {
      questionType: type,
      difficultyLevel: "average",
      questionText: text,
      lessonId,
      certificationId,
    },
  })
}

async function createProgrammingConfig(questionId, starter, testCases) {
  return base("programming-question-configs", {
    method: "POST",
    data: {
      questionId,
      starterCode: starter,
      testCases: testCases.map((tc) => ({
        inputData: tc.i,
        expectedOutput: tc.o,
      })),
    },
  })
}

async function createDiagramConfig(questionId) {
  return base("diagram-question-configs", {
    method: "POST",
    data: {
      questionId,
      diagramType: "ERD",
      instructions: "Create the entities and their relationships as described.",
      referenceDiagramXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Entity A" style="shape=table;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="160" height="80" as="geometry"/></mxCell><mxCell id="3" value="Entity B" style="shape=table;" vertex="1" parent="1"><mxGeometry x="300" y="100" width="160" height="80" as="geometry"/></mxCell></root></mxGraphModel>',
      referenceDiagramJson: JSON.stringify({
        nodes: [
          { id: "n1", type: "entity", label: "Entity A", x: 100, y: 100 },
          { id: "n2", type: "entity", label: "Entity B", x: 300, y: 100 },
        ],
        edges: [{ id: "e1", source: "n1", target: "n2", label: "relates to" }],
      }),
    },
  })
}

async function createChoices(questionId, choices, correctIndex) {
  for (let i = 0; i < choices.length; i++) {
    await base("choices", {
      method: "POST",
      data: {
        questionId,
        choiceText: choices[i],
        correct: i === correctIndex,
        explanation: i === correctIndex ? "This is the correct answer." : "",
      },
    })
  }
}

export default function SeedChallengesPage() {
  const [certificationId, setCertificationId] = useState("")
  const [seeding, setSeeding] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" })

  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: () => getAllCertifications(),
    staleTime: 60_000,
  })

  const lessons = useMemo(() => {
    const cert = certifications.find(
      (c) => String(c.certificationId) === String(certificationId),
    )
    return (cert?.majorCategory ?? []).flatMap((major) =>
      (major.middleCategory ?? []).flatMap((middle) => middle.lessons ?? []),
    )
  }, [certifications, certificationId])

  const lessonId = lessons[0]?.lessonId ?? null

  const seedCodeStrike = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("codestrike")
    const total = NODES * QUESTIONS_PER_NODE
    setProgress({ done: 0, total, label: "Creating programming questions..." })
    const batch = Date.now()

    try {
      const problems = []
      for (let node = 1; node <= NODES; node++) {
        for (let i = 0; i < QUESTIONS_PER_NODE; i++) {
          const qi = ((node - 1) * QUESTIONS_PER_NODE + i) % PROGRAMMING_TEMPLATES.length
          const template = PROGRAMMING_TEMPLATES[qi]
          const text = `[CS-${batch}-N${node}-P${i + 1}] ${template.q}`

          const saved = await createQuestion(text, "CRITICAL_THINKING", lessonId, Number(certificationId))
          await createProgrammingConfig(saved.questionId, template.starter, template.cases)

          problems.push({
            questionId: saved.questionId,
            nodeIndex: node,
            points: 10,
          })
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }

      setProgress((p) => ({ ...p, label: "Saving arena..." }))
      await saveArenaProblems("codestrike", {
        certificationId: Number(certificationId),
        problems,
      })
      toast.success(`CodeStrike seeded with ${total} problems`)
    } catch (err) {
      toast.error("CodeStrike seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedBlueprint = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("blueprint")
    const total = NODES * QUESTIONS_PER_NODE
    setProgress({ done: 0, total, label: "Creating diagram questions..." })
    const batch = Date.now()

    try {
      const problems = []
      for (let node = 1; node <= NODES; node++) {
        for (let i = 0; i < QUESTIONS_PER_NODE; i++) {
          const si = ((node - 1) * QUESTIONS_PER_NODE + i) % DIAGRAM_SCENARIOS.length
          const text = `[BP-${batch}-N${node}-P${i + 1}] Draw an ERD for ${DIAGRAM_SCENARIOS[si]}.`

          const saved = await createQuestion(text, "CRITICAL_THINKING", lessonId, Number(certificationId))
          await createDiagramConfig(saved.questionId)

          problems.push({
            questionId: saved.questionId,
            nodeIndex: node,
            points: 10,
          })
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }

      setProgress((p) => ({ ...p, label: "Saving arena..." }))
      await saveArenaProblems("blueprint", {
        certificationId: Number(certificationId),
        problems,
      })
      toast.success(`Blueprint Arena seeded with ${total} problems`)
    } catch (err) {
      toast.error("Blueprint seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedChampionsCup = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("worldcup")
    const questionsPerStage = 10
    const stageCount = 3
    const total = questionsPerStage * stageCount
    setProgress({ done: 0, total, label: "Creating MCQ questions..." })
    const batch = Date.now()

    try {
      const allIds = []
      for (let i = 0; i < total; i++) {
        const template = MCQ_QUESTIONS[i % MCQ_QUESTIONS.length]
        const text = `[CC-${batch}-Q${i + 1}] ${template.q}`

        const saved = await createQuestion(text, "MCQ", lessonId, Number(certificationId))
        await createChoices(saved.questionId, template.choices, template.correct)
        allIds.push(saved.questionId)
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }

      setProgress((p) => ({ ...p, label: "Creating weekly edition..." }))
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      const weekStart = monday.toISOString().split("T")[0]

      const edition = await createWorldCupEdition({
        weekStart,
        certificationId: Number(certificationId),
        lessonId,
      })

      setProgress((p) => ({ ...p, label: "Assigning stages..." }))
      await saveWorldCupEditionStages(edition.editionId ?? edition.id, {
        quarterfinal: allIds.slice(0, questionsPerStage),
        semifinal: allIds.slice(questionsPerStage, questionsPerStage * 2),
        final: allIds.slice(questionsPerStage * 2, questionsPerStage * 3),
      })

      setProgress((p) => ({ ...p, label: "Publishing edition..." }))
      await publishWorldCupEdition(edition.editionId ?? edition.id)

      toast.success(`Champions Cup seeded with ${total} MCQ questions and published`)
    } catch (err) {
      toast.error("Champions Cup seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedAll = useCallback(async () => {
    await seedCodeStrike()
    await seedBlueprint()
    await seedChampionsCup()
  }, [seedCodeStrike, seedBlueprint, seedChampionsCup])

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto pb-10">
      <div className="border-b border-border pb-4">
        <h1 className="font-rb-display text-2xl font-extrabold lowercase">
          seed challenges
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generate test questions for all three arenas. Pick a certification, then seed.
        </p>
      </div>

      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Certification</label>
          <Select value={certificationId} onValueChange={setCertificationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a certification" />
            </SelectTrigger>
            <SelectContent>
              {certifications.map((cert) => (
                <SelectItem
                  key={cert.certificationId}
                  value={String(cert.certificationId)}
                >
                  {cert.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {certificationId && lessonId ? (
          <p className="text-sm text-muted-foreground">
            Using lesson: <span className="font-medium">{lessons[0]?.name}</span> (id: {lessonId})
          </p>
        ) : certificationId ? (
          <p className="text-sm text-destructive">
            This certification has no lessons. Pick another.
          </p>
        ) : null}
      </div>

      {seeding ? (
        <div className="max-w-md space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" />
            {progress.label}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress.done} / {progress.total} ({pct}%)
          </p>
        </div>
      ) : null}

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <button
          onClick={seedCodeStrike}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-macaw-wash text-rb-macaw-lip">
            <Code2 className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed CodeStrike</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {NODES * QUESTIONS_PER_NODE} programming problems across {NODES} nodes
            </div>
          </div>
        </button>

        <button
          onClick={seedBlueprint}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-beetle-wash text-rb-beetle-lip">
            <Network className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed Blueprint Arena</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {NODES * QUESTIONS_PER_NODE} diagram problems across {NODES} nodes
            </div>
          </div>
        </button>

        <button
          onClick={seedChampionsCup}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-bee-wash text-rb-bee-ink">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed Champions Cup</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              30 MCQ questions (10 per stage), create and publish this week&rsquo;s edition
            </div>
          </div>
        </button>

        <button
          onClick={seedAll}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Play className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed All Arenas</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Run all three in sequence — {NODES * QUESTIONS_PER_NODE * 2 + 30} questions total
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
