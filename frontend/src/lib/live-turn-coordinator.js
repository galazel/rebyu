// Ordered, durable LangGraph events. Only submitted messages may contain text.
export class LiveTurnCoordinator {
  constructor({ sessionId, request, connectionId = crypto.randomUUID() }) {
    Object.assign(this, { sessionId, request, connectionId })
    this.sequence = 0
    this.queue = Promise.resolve()
  }
  event(action, data = {}) {
    if (!["open", "typing", "submit", "continue", "agent_message", "pause", "resume", "close"].includes(action)) throw new Error("Invalid turn event")
    if (data.message !== undefined && !["submit", "agent_message"].includes(action)) throw new Error("Unsent drafts must remain private")
    const payload = { ...data, action, connectionId: this.connectionId, sequence: ++this.sequence }
    const result = this.queue.catch(() => {}).then(() => this.request(payload))
    this.queue = result
    return result
  }
}
