
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
    }
}

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

export function notify(title, body) {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(title, { body })
        }
    } catch {
    }
}

export function askForNotifications() {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {})
        }
    } catch {
    }
}
