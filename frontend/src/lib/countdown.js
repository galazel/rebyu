/**
 * The exam clock.
 *
 * One function, in one place, because there were two of it -- the adaptive
 * runner's and the assessment page's -- and both counted only minutes. A
 * 70-minute paper therefore opened at "70:00" and read 68:42 an hour in, which
 * is a number no clock has ever shown: a learner glancing at it sees 68
 * minutes when 8 minutes are left, and the difference decides whether they
 * hurry.
 *
 * So an hour is an hour once there is one, and minutes stay two digits under
 * it -- "1:08:42", "08:42" -- which is how every timer the learner has ever
 * used behaves. Below an hour nothing changes, which is most papers.
 */
export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const mm = String(minutes).padStart(2, "0")
  const ss = String(seconds).padStart(2, "0")
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * The same time said out loud, for the timer's accessible name. "08:42" is
 * read as a ratio or a date by most screen readers; a learner who cannot see
 * the pill needs to hear minutes and seconds.
 */
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
