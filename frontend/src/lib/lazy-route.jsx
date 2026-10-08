import { Component, lazy } from "react"


const RELOAD_COOLDOWN_MS = 30_000
const RELOAD_MARKER = "rebyu-chunk-reload-at"

function lastReloadWasRecent() {
  try {
    const at = Number(window.sessionStorage.getItem(RELOAD_MARKER))
    return Number.isFinite(at) && Date.now() - at < RELOAD_COOLDOWN_MS
  } catch {
    return true
  }
}

function markReload() {
  try {
    window.sessionStorage.setItem(RELOAD_MARKER, String(Date.now()))
  } catch {
  }
}

export function lazyRoute(factory) {
  return lazy(() =>
    factory().catch(() =>
      factory().catch((error) => {
        if (lastReloadWasRecent()) {
          throw error
        }

        markReload()
        window.location.reload()

        return new Promise(() => {})
      })
    )
  )
}

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const isLoadFailure = /dynamically imported module|Importing a module script|Failed to fetch/i.test(
      String(error?.message ?? "")
    )

    return (
      <div
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: "#3c3c3c",
          background: "#f7f7f7",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>
            {isLoadFailure ? "A new version is ready" : "Something went wrong"}
          </p>
          <p style={{ marginTop: "0.5rem", lineHeight: 1.6, color: "#777" }}>
            {isLoadFailure
              ? "This page was updated while you had it open. Reload to pick up the new version."
              : "This page could not be displayed. Reloading usually clears it."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.25rem",
              minHeight: "44px",
              padding: "0 1.5rem",
              border: 0,
              borderRadius: "12px",
              background: "#2f6b4f",
              boxShadow: "0 4px 0 0 #245440",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
