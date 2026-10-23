// Content identity excludes library links, which may be enriched only on live replies.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).filter((key) => key !== "library").sort().map((key) => [key, canonical(value[key])]))
  return value
}
export function widgetProgressKey(scope, widget, index = 0) {
  if (!scope) return null
  const text = JSON.stringify(canonical(widget))
  let first = 2166136261, second = 5381
  for (let i = 0; i < text.length; i++) {
    first = Math.imul(first ^ text.charCodeAt(i), 16777619)
    second = Math.imul(second, 33) ^ text.charCodeAt(i)
  }
  return `rebyu:tutor-progress:v1:${scope}:${index}:${first >>> 0}-${second >>> 0}`
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
    localStorage.setItem(key, JSON.stringify({ ...previous, [field]: value }))
  } catch { /* Storage may be disabled/full; keep the activity usable in memory. */ }
}
