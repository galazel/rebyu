export function applySimulationChoice(resources, values, choice) {
  const next = { ...values }
  for (const effect of choice.effects || []) {
    if (!Object.hasOwn(next, effect.resource) || !Number.isFinite(effect.delta)) return null
    next[effect.resource] = Math.round((next[effect.resource] + effect.delta) * 1e6) / 1e6
  }
  return resources.every((resource) => Number.isFinite(next[resource.name]) && next[resource.name] >= resource.minimum) ? next : null
}

export function simulationState(data, decisions) {
  let values = Object.fromEntries(data.resources.map((resource) => [resource.name, resource.initial]))
  const valid = []
  let feedback = ''
  for (const decision of decisions.slice(0, data.rounds.length)) {
    const choice = data.rounds[valid.length]?.choices[decision]
    if (!choice || !Number.isInteger(decision)) break
    const next = applySimulationChoice(data.resources, values, choice)
    if (!next) break
    valid.push(decision); values = next; feedback = choice.feedback
  }
  return { values, decisions: valid, feedback }
}

export function storyState(data, decisions) {
  let node = data.nodes.find((entry) => entry.id === data.startId)
  const valid = [], visited = new Set()
  let feedback = ''
  for (const decision of decisions.slice(0, data.nodes.length)) {
    if (!node || visited.has(node.id) || !Number.isInteger(decision)) break
    visited.add(node.id)
    const choice = node.choices[decision]
    const next = choice && data.nodes.find((entry) => entry.id === choice.nextId)
    if (!next) break
    valid.push(decision); node = next; feedback = choice.feedback
  }
  return { node, decisions: valid, feedback }
}
