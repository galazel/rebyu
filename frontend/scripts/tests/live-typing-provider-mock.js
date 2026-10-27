export const Conversation = {
  async startSession(options) {
    const state = window.liveTypingMock = { activity: 0, context: [], messages: [], options }
    const conversation = {
      sendUserActivity: () => { state.activity += 1 },
      sendContextualUpdate: (text) => state.context.push(text),
      sendUserMessage: (text) => state.messages.push(text),
      getInputVolume: () => 0, getOutputVolume: () => 0,
      getInputByteFrequencyData: () => new Uint8Array(), getOutputByteFrequencyData: () => new Uint8Array(),
      setVolume: () => {}, setMicMuted: () => {},
      endSession: async () => options.onDisconnect(),
    }
    options.onConnect()
    setTimeout(() => {
      options.onMessage({ role: "agent", message: "Contribution covers fixed costs.", event_id: "opening" })
      options.onModeChange({ mode: "speaking" }); options.onModeChange({ mode: "listening" })
    }, 50)
    return conversation
  },
}
