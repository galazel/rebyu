import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, FlagIcon as Flag, Sparkles, Target, TrendingUp } from "@/components/icons";

/* Landing-page pictures of real REBYU screens (diagnostic result, adaptive quiz,
   study plan, progress), drawn in the app's own game-kit style with sample data. */

const TIERS = [
  { label: "Novice", from: 0 },
  { label: "Developing", from: 25 },
  { label: "Proficient", from: 50 },
  { label: "Advanced", from: 75 },
];

function tierOf(rating) {
  return [...TIERS].reverse().find((tier) => rating >= tier.from)?.label ?? "Novice";
}

function barTone(value) {
  if (value < 40) return "bg-rb-cardinal/80";
  if (value < 60) return "bg-amber-400";
  return "tg-solid-soft";
}

function MockWindow({ title, children, className = "" }) {
  return (
    <div className={`tg-cat-explain tg-frame ${className}`}>
      <div className="flex items-center gap-2 border-b border-[var(--tg-line)] bg-[var(--tg-softer)] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rb-cardinal/60" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-[var(--tg)]/70" />
        </span>
        <span className="ml-1 truncate text-xs font-bold text-muted-foreground">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Ring({ value, size = 112, label, tone = "var(--tg)" }) {
  const ring = 2 * Math.PI * 52;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--tg-soft)" strokeWidth="11" />
        <circle cx="60" cy="60" r="52" fill="none" stroke={tone} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={ring} strokeDashoffset={ring * (1 - value / 100)} />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-black leading-none tabular-nums text-foreground">{value}</p>
        {label ? <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  );
}

function TierScale({ rating }) {
  const active = tierOf(rating);
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {TIERS.map((tier, index) => (
        <li
          key={tier.label}
          className={`rounded-lg border px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide ${
            tier.label === active ? "border-[var(--tg)] bg-[var(--tg)] text-white" : "border-[var(--tg-line)] bg-card text-muted-foreground"
          }`}
        >
          {tier.label}
          <span className="block font-semibold normal-case tracking-normal opacity-80">
            {tier.from}–{(TIERS[index + 1]?.from ?? 101) - 1}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TopicRow({ topic }) {
  const flagged = topic.priorityTag === "CRITICAL_PRIORITY" || topic.priorityTag === "HIGH_PRIORITY";
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-bold text-foreground">
          {topic.name}
          <span className="ml-1.5 text-xs font-semibold text-muted-foreground">{topic.domain} · {topic.answers} answers</span>
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          {flagged ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rb-cardinal-wash px-2 py-0.5 text-[10px] font-bold text-rb-cardinal-lip">
              <Flag className="size-3" aria-hidden="true" />Review first
            </span>
          ) : topic.priorityTag === "NOT_ENOUGH_DATA" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Answer more</span>
          ) : null}
          <span className="w-9 text-right text-sm font-black tabular-nums text-foreground">{topic.mastery}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--tg-soft)]">
        <div className={`h-full rounded-full ${barTone(topic.mastery)}`} style={{ width: `${topic.mastery}%` }} />
      </div>
    </li>
  );
}

/** The diagnostic result: where you stand before studying anything. */
export function DiagnosticMock({ topics }) {
  return (
    <MockWindow title="Diagnostic result · IT Passport">
      <div className="flex items-center gap-5">
        <Ring value={31} label={tierOf(31)} tone="var(--color-rb-cardinal)" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="tg-kicker">Your starting point</p>
            <p className="mt-1 text-lg font-bold leading-snug text-foreground">Proficiency 31 out of 100</p>
            <p className="text-xs text-muted-foreground">One question per lesson, before you study anything.</p>
          </div>
          <TierScale rating={31} />
        </div>
      </div>
      <div className="mt-5 border-t border-[var(--tg-line)] pt-3">
        <p className="tg-kicker">Weakest lessons first</p>
        <ul className="divide-y divide-[var(--tg-line)]">
          {topics.slice(0, 3).map((topic) => <TopicRow key={topic.name} topic={topic} />)}
        </ul>
      </div>
    </MockWindow>
  );
}

const QUIZ_CHOICES = [
  { letter: "A", text: "Every non-key column depends on the whole key", correct: true },
  { letter: "B", text: "Every table has exactly one candidate key" },
  { letter: "C", text: "No column holds repeating groups" },
];

/** An adaptive quiz question being marked, and today's plan built from the result. */
export function StudyLoopMock() {
  return (
    <div className="space-y-4">
      <MockWindow title="Adaptive quiz · Normalization">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tg-chip">Multiple choice</span>
          <span className="tg-chip">Question 4 of 10</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--tg)] px-2.5 py-1 text-[10px] font-bold text-white">
            <TrendingUp className="size-3" aria-hidden="true" />Harder one next
          </span>
        </div>
        <p className="mt-3 text-base font-bold leading-snug text-foreground">What does second normal form (2NF) require?</p>
        <div className="mt-3 space-y-2">
          {QUIZ_CHOICES.map((choice) => (
            <div
              key={choice.letter}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm font-medium ${
                choice.correct ? "border-[var(--tg)] bg-[var(--tg-softer)] text-foreground" : "border-[var(--tg-line)] bg-card text-muted-foreground"
              }`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${choice.correct ? "tg-solid-soft" : "bg-[var(--tg-soft)] text-[var(--tg-ink)]"}`}>
                {choice.correct ? <CheckCircle2 className="size-4" aria-hidden="true" /> : choice.letter}
              </span>
              {choice.text}
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--tg-ink)]">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />Correct! Proficiency 44 → 49
        </p>
      </MockWindow>

      <MockWindow title="Study calendar · today">
        <div className="flex items-center gap-3">
          <span className="tg-badge-icon !size-10"><CalendarDays className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="tg-kicker">Today&apos;s plan</p>
            <p className="truncate text-sm font-bold text-foreground">Normalization · weakest topic first</p>
            <p className="text-xs text-muted-foreground">Two 25-minute focus blocks · 7:00 PM</p>
          </div>
          <span className="tg-btn tg-btn-primary !rounded-full !px-3 !py-1.5 !text-xs">
            <Clock className="size-3.5" aria-hidden="true" />Start pomodoro
          </span>
        </div>
      </MockWindow>
    </div>
  );
}

/** The Progress dashboard: readiness, mastery by topic, and what to study next. */
export function ProgressMock({ topics, notAssessed = 0, readiness = 68 }) {
  return (
    <MockWindow title="Progress · IT Passport">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="tg-badge-icon !size-8 tg-cat-insight"><Target className="size-4" aria-hidden="true" /></span>
            <div>
              <p className="tg-kicker">Topic breakdown</p>
              <p className="text-sm font-bold text-foreground">Mastery by topic — weakest first</p>
            </div>
          </div>
          <ul className="mt-2 divide-y divide-[var(--tg-line)]">
            {topics.map((topic) => <TopicRow key={topic.name} topic={topic} />)}
          </ul>
          {notAssessed > 0 ? (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">+ {notAssessed} topics not assessed yet</p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[1rem] border border-[var(--tg-line)] bg-[var(--tg-softer)] p-4 text-center">
            <p className="tg-kicker">Exam readiness</p>
            <div className="mt-3 flex justify-center"><Ring value={readiness} label="Ready" /></div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your estimated chance of passing, from mastery across what the exam weighs.
            </p>
          </div>

          <div className="rounded-[1rem] border border-[var(--tg-line)] bg-card p-4">
            <div className="flex items-center gap-2.5">
              <span className="tg-badge-icon !size-8 tg-cat-recall"><BookOpen className="size-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="tg-kicker">Study next</p>
                <p className="truncate text-sm font-bold text-foreground">{topics[0]?.name}</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tg-soft)]">
              <div className="tg-solid-soft h-full rounded-full" style={{ width: "35%" }} />
            </div>
            <span className="tg-btn tg-btn-primary mt-3 w-full !py-2 !text-sm">
              <Sparkles className="size-4" aria-hidden="true" />Study now
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}
