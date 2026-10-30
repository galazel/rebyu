import { base } from "@/services/base"

// Content identity excludes library links, which may be enriched only on live replies.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).filter((key) => key !== "library").sort().map((key) => [key, canonical(value[key])]))
  return value
}
// Games and tools keep one saved copy each, wherever they are opened (the tutor
// chat or the Library page): the key comes from the game's own content.
const GAME_TYPES = new Set(["quiz", "flashcards", "mindmap", "matching", "ordering", "fill_blank", "true_false",
  "sorting", "word_game", "puzzle", "visual_game", "speed_flashcards", "branching_story", "simulation", "two_truths_lie"])

function contentHash(widget) {
  const text = JSON.stringify(canonical(widget))
  let first = 2166136261, second = 5381
  for (let i = 0; i < text.length; i++) {
    first = Math.imul(first ^ text.charCodeAt(i), 16777619)
    second = Math.imul(second, 33) ^ text.charCodeAt(i)
  }
  return `${first >>> 0}-${second >>> 0}`
}

/** Where this widget used to be saved, per page, before games got one shared key. */
export function legacyProgressKey(scope, widget, index = 0) {
  if (!scope) return null
  return `rebyu:tutor-progress:v1:${scope}:${index}:${contentHash(widget)}`
}

export function widgetProgressKey(scope, widget, index = 0) {
  if (!scope) return null
  if (GAME_TYPES.has(widget?.type)) return `rebyu:tutor-progress:v1:item:${contentHash(widget)}`
  return legacyProgressKey(scope, widget, index)
}
export function tutorActivityScope(sessionId, messages, index) {
  // History may include extra empty/tool messages and regenerates message IDs.
  const ordinal = messages.slice(0, index).filter((message) => message.widgets?.length).length
  return `${sessionId}:activity-message:${ordinal}`
}
export function readWidgetField(key, field, fallback) {
  try {
    if (!key) return fallback
    const value = JSON.parse(localStorage.getItem(key) ?? "null")?.[field]
    if (value == null || Array.isArray(value) !== Array.isArray(fallback) || typeof value !== typeof fallback) return fallback
    return value
  } catch { return fallback }
}
export function writeWidgetField(key, field, value) {
  try {
    if (!key) return
    let stored
    try { stored = JSON.parse(localStorage.getItem(key) ?? "null") } catch { stored = null }
    const previous = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {}
    localStorage.setItem(key, JSON.stringify({ ...previous, [field]: value, _savedAt: Date.now() }))
    scheduleSync(key)
  } catch { /* Storage may be disabled/full; keep the activity usable in memory. */ }
}

// ---- account sync ----
// localStorage answers instantly; the learner's account keeps the same progress
// so it is there on another browser or device, or after site data is cleared.

const pendingSyncs = new Map()

function scheduleSync(key) {
  clearTimeout(pendingSyncs.get(key))
  pendingSyncs.set(key, setTimeout(() => { pendingSyncs.delete(key); pushProgress(key) }, 700))
}

function pushProgress(key) {
  let state
  try { state = JSON.parse(localStorage.getItem(key) ?? "null") } catch { return undefined }
  if (!state || typeof state !== "object" || Array.isArray(state)) return undefined
  return base("learner-tools/activity-progress", { method: "PUT", data: { key, state } }).catch(() => {})
}

// Leaving the page should not lose the last few moves still waiting to sync.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return
    for (const [key, timer] of pendingSyncs) { clearTimeout(timer); pendingSyncs.delete(key); pushProgress(key) }
  })
}

/** Every game in one Library item, or every game in one tutor chat. */
export function progressPrefix(scope) {
  const root = String(scope).includes(":activity-message:") ? String(scope).split(":activity-message:")[0] : scope
  return `rebyu:tutor-progress:v1:${root}:`
}

async function hydratePrefix(prefix) {
  let server = {}
  try { server = (await base(`learner-tools/activity-progress?prefix=${encodeURIComponent(prefix)}`)) ?? {} } catch { return false }
  const onServer = new Set(Object.keys(server))
  for (const [key, state] of Object.entries(server)) {
    let local = null
    try { local = JSON.parse(localStorage.getItem(key) ?? "null") } catch { local = null }
    if (!local || (state?._savedAt ?? 0) >= (local._savedAt ?? 0)) {
      try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* storage full */ }
    } else {
      pushProgress(key)
    }
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix) && !onServer.has(key)) pushProgress(key)
    }
  } catch { /* storage unavailable */ }
  return true
}

/** Loads the account's saved progress for these widgets into localStorage before
 *  they render; whichever copy was saved last wins, progress that exists only in
 *  this browser is uploaded, and progress saved under the old per-page keys is
 *  moved to the game's shared key. */
export async function hydrateProgress(scope, widgets = []) {
  const games = widgets.map((widget, index) => ({ widget, key: widgetProgressKey(scope, widget, index), legacy: legacyProgressKey(scope, widget, index) }))
  const prefixes = new Set([progressPrefix(scope), ...games.filter((game) => game.key !== game.legacy).map((game) => game.key)])
  const results = await Promise.all([...prefixes].map(hydratePrefix))
  for (const { widget, key, legacy } of games) {
    if (key === legacy) continue
    try {
      if (!localStorage.getItem(key) && localStorage.getItem(legacy)) {
        localStorage.setItem(key, localStorage.getItem(legacy))
        scheduleSync(key)
      }
    } catch { /* storage unavailable */ }
    // Remember which Library item this game is, so the Library can show its score.
    if (widget?.library?.id != null) writeWidgetField(key, "_libraryItemId", Number(widget.library.id))
  }
  return results.some(Boolean)
}
