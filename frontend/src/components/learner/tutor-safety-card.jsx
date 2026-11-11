import { LockIcon, PhoneIcon, ShieldAlert } from "@/components/icons"

/*
 * The one safety card every AI tutor surface shows (chat, streamed chat, Guided Dialogue).
 * The server starts such a reply with [[rebyu-safety:<kind>]] (python app/ai/tutor_guard.py);
 * saved conversations keep the marker, so a reloaded thread shows the same card. The wording
 * lives here and only here, so chat and Dialogue can never drift apart.
 */
const MARKER = /^\s*\[\[rebyu-safety:([a-z_]+)\]\]/

/** { kind, partial } when a tutor reply is a safety reply; null otherwise. */
export function parseSafetyReply(text) {
  const value = String(text ?? "")
  const match = value.match(MARKER)
  if (match) return { kind: match[1], partial: false }
  // While a reply streams in, the marker may be incomplete: hold it rather than flash it.
  if (/^\s*\[\[rebyu-safety/.test(value)) return { kind: null, partial: true }
  return null
}

const CALL = ({ number, label }) => (
  <a
    href={`tel:${number}`}
    className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-extrabold hover:bg-white dark:bg-white/10"
  >
    <PhoneIcon className="size-3" aria-hidden="true" />
    {label}
  </a>
)

const CARDS = {
  self_harm: {
    tone: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100",
    icon: ShieldAlert,
    title: "You don't have to go through this alone",
    body: "I'm really sorry you're feeling this way, and I'm glad you said something. Please talk to someone you trust right now: a parent, a teacher or your guidance counselor.",
    calls: [{ number: "1553", label: "NCMH Crisis Hotline 1553 (free, 24/7)" }, { number: "911", label: "Emergency 911" }],
    staff: "A staff member has been alerted so someone can check on you.",
  },
  abuse: {
    tone: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100",
    icon: ShieldAlert,
    title: "It is not your fault",
    body: "I'm sorry that happened to you. Please tell an adult you trust, like a parent, a teacher or your guidance counselor.",
    calls: [{ number: "163", label: "Bantay Bata 163 (under 18)" }, { number: "911", label: "Emergency 911" }],
    staff: "A staff member has been alerted so someone can help.",
  },
  threat: {
    tone: "border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
    icon: ShieldAlert,
    title: "This message was flagged",
    body: "Threats to hurt anyone are taken seriously. If you're angry or something is going on, talk to a trusted adult or your guidance counselor today.",
    calls: [{ number: "911", label: "If anyone is in danger: 911" }],
    staff: "This message has been reported to staff for review.",
  },
  data_probe: {
    tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
    icon: LockIcon,
    title: "Request blocked",
    body: "The tutor can't look up or share anyone's accounts, passwords or personal information.",
    calls: [],
    staff: "This attempt has been recorded and reported to staff.",
  },
}

export function TutorSafetyCard({ kind }) {
  const card = CARDS[kind] ?? CARDS.threat
  const Icon = card.icon
  return (
    <div role="alert" className={`w-full rounded-2xl border-2 p-4 ${card.tone}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-white/10">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold leading-snug">{card.title}</p>
          <p className="mt-1 text-sm leading-6">{card.body}</p>
          {card.calls.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {card.calls.map((call) => <CALL key={call.number} {...call} />)}
            </div>
          ) : null}
          <p className="mt-3 text-xs font-semibold opacity-80">{card.staff}</p>
        </div>
      </div>
    </div>
  )
}

export default TutorSafetyCard
