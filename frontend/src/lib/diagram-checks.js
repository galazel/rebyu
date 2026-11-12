/*
 * The rules a diagram answer is held to, as the grader records them on each required part
 * (backend DiagramGradingService.CHECK_*). A part lists only the rules that apply to it:
 * a relationship has a type and a direction, an unlabelled start node has no name.
 */
export const DIAGRAM_CHECK_LABELS = {
  drawn: "Parts drawn",
  name: "Names and labels",
  shape: "Shapes and notation",
  kind: "Relationship types",
  direction: "Arrow directions",
  multiplicity: "Multiplicities",
  order: "Message order",
  placement: "Inside / outside the system boundary",
  key: "Keys (PK / FK)",
}

/** One rule's short failure note, shown on a part that broke it. */
export const DIAGRAM_CHECK_MISSES = {
  name: "name or label",
  shape: "shape / notation",
  kind: "relationship type",
  direction: "direction",
  multiplicity: "multiplicity",
  order: "order",
  placement: "boundary placement",
  key: "key marker",
}

/**
 * [{ key, label, met, total }] over every required part, in the order above. A
 * connector's label counts with names. Optional parts (no points) and answers graded
 * before checks were recorded contribute nothing.
 */
export function summarizeDiagramChecks(elements = []) {
  const tally = Object.fromEntries(Object.keys(DIAGRAM_CHECK_LABELS).map((key) => [key, [0, 0]]))
  for (const element of elements) {
    if (!element?.checks || !(Number(element.maxPoints) > 0)) continue
    for (const [rawKey, met] of Object.entries(element.checks)) {
      const counts = tally[rawKey === "label" ? "name" : rawKey]
      if (!counts) continue
      counts[1] += 1
      if (met) counts[0] += 1
    }
  }
  return Object.entries(tally)
    .filter(([, [, total]]) => total > 0)
    .map(([key, [met, total]]) => ({ key, label: DIAGRAM_CHECK_LABELS[key], met, total }))
}

/** The rules a part broke, as short notes ("relationship type", "direction"). */
export function failedChecks(element) {
  if (!element?.checks || !element.matched) return []
  return Object.entries(element.checks)
    .filter(([key, met]) => !met && key !== "drawn")
    .map(([key]) => DIAGRAM_CHECK_MISSES[key === "label" ? "name" : key] ?? key)
    .filter((note, index, all) => all.indexOf(note) === index)
}

/** A required part's group name: the diagram type's own term, else its generic kind. */
export function diagramPartLabel(element) {
  if (element?.category) return element.category
  return element?.kind === "EDGE" ? "Relationship" : element?.kind === "ATTRIBUTE" ? "Attribute" : "Node"
}
