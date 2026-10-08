export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const mm = String(minutes).padStart(2, "0")
  const ss = String(seconds).padStart(2, "0")
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export function describeCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const parts = []
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`)
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`)
  if (hours === 0 && (seconds > 0 || parts.length === 0)) {
    parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`)
  }
  return `${parts.join(" ")} remaining`
}
