import { toast } from "sonner"

/**
 * Toasts that belong to the page you are about to land on ("Welcome back",
 * "Assessment created") and so must not play out behind its loading screen.
 *
 * `toastWhenReady.success(...)` takes the same arguments as `toast.success`. The
 * toast waits until the loading overlay has finished; if no loading screen comes
 * up shortly after (the next page was already cached), it shows anyway.
 */

// No loading screen within this long after queueing means the page is already showing.
const NO_LOADING_GRACE_MS = 1200

let queue = []
let loadingVisible = false
let graceTimer = null

function flush() {
  clearTimeout(graceTimer)
  graceTimer = null
  const pending = queue
  queue = []
  pending.forEach((show) => show())
}

function enqueue(show) {
  queue.push(show)
  clearTimeout(graceTimer)
  graceTimer = setTimeout(() => {
    if (!loadingVisible) flush()
  }, NO_LOADING_GRACE_MS)
}

/** Called by the loading overlay whenever it appears or finishes. */
export function setLoadingScreenVisible(visible) {
  loadingVisible = visible
  if (!visible && queue.length) flush()
}

export const toastWhenReady = {
  success: (...args) => enqueue(() => toast.success(...args)),
  error: (...args) => enqueue(() => toast.error(...args)),
  info: (...args) => enqueue(() => toast.info(...args)),
  message: (...args) => enqueue(() => toast(...args)),
}
