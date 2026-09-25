/**
 * Which background tagging jobs this browser started and has not heard the
 * end of, and which papers of each it has already applied.
 *
 * Kept in localStorage: small, per browser, and read by both the import page
 * (to pick a job back up after a refresh) and the admin area's watcher (to say
 * when it finishes). Every access tolerates storage being unavailable.
 */

const ACTIVE = "rebyu-tag-jobs"
const applied = (jobId) => `rebyu-tag-job-applied:${jobId}`

function read(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key)
        return raw ? JSON.parse(raw) : fallback
    } catch {
        return fallback
    }
}

function write(key, value) {
    try {
        if (value === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Storage unavailable: the job still runs; it is just not followed.
    }
}

/** `[{ id, certificationId, title }]` */
export function activeJobs() {
    return read(ACTIVE, [])
}

export function addActiveJob(job) {
    write(ACTIVE, [...activeJobs().filter((item) => String(item.certificationId) !== String(job.certificationId)), job])
}

export function removeActiveJob(jobId) {
    write(ACTIVE, activeJobs().filter((item) => item.id !== jobId))
}

export function activeJobFor(certificationId) {
    return activeJobs().find((item) => String(item.certificationId) === String(certificationId)) ?? null
}

/** Paper ids of `jobId` whose tags are already on the page. */
export function appliedPapers(jobId) {
    return new Set(read(applied(jobId), []))
}

export function markApplied(jobId, paperIds) {
    write(applied(jobId), [...new Set([...appliedPapers(jobId), ...paperIds])])
}

export function forgetJob(jobId) {
    removeActiveJob(jobId)
    write(applied(jobId), null)
}

/** A browser notification, when the admin allowed them. */
export function notify(title, body) {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(title, { body })
        }
    } catch {
        // Notifications unavailable; the in-page message still shows.
    }
}

/** Asks once, from the click that starts a job (browsers require a gesture). */
export function askForNotifications() {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {})
        }
    } catch {
        // Not supported.
    }
}
