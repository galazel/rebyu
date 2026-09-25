/**
 * The PDF import page's work in progress, kept in the browser so a refresh
 * does not throw it away.
 *
 * IndexedDB rather than localStorage: a folder of past papers is thousands of
 * questions with their figures as data URLs -- hundreds of megabytes, where
 * localStorage stops at about five. Each paper is its own record, written only
 * when it changed, so marking one answer does not rewrite every paper.
 *
 * Every call swallows its own failure (private window, storage full, blocked
 * site data): the page works without it, it just forgets on refresh.
 */

const DB_NAME = "rebyu-pdf-import"
const PAPERS = "papers"
const META = "meta"

let opening = null

function open() {
    if (!opening) {
        opening = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains(PAPERS)) db.createObjectStore(PAPERS)
                if (!db.objectStoreNames.contains(META)) db.createObjectStore(META)
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        }).catch((error) => {
            opening = null
            throw error
        })
    }
    return opening
}

function run(storeNames, mode, work) {
    return open().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(storeNames, mode)
                const result = work(tx)
                tx.oncomplete = () => resolve(result?.result ?? result)
                tx.onerror = () => reject(tx.error)
                tx.onabort = () => reject(tx.error)
            }),
    )
}

const paperKey = (certificationId, paperId) => `${certificationId}::${paperId}`

/** `{ papers, keys, lessons }` saved for this certification, or null. */
export async function loadDraft(certificationId) {
    try {
        const meta = await run([META], "readonly", (tx) => tx.objectStore(META).get(String(certificationId)))
        if (!meta?.order?.length) return null
        const papers = await run([PAPERS], "readonly", (tx) => {
            const store = tx.objectStore(PAPERS)
            const out = []
            for (const id of meta.order) {
                const request = store.get(paperKey(certificationId, id))
                request.onsuccess = () => request.result && out.push(request.result)
            }
            return out
        })
        const byId = new Map(papers.map((paper) => [paper.id, paper]))
        return {
            papers: meta.order.map((id) => byId.get(id)).filter(Boolean),
            keys: meta.keys ?? [],
            lessons: meta.lessons ?? [],
        }
    } catch {
        return null
    }
}

/**
 * Writes what changed since the last save: `changed` papers are written,
 * `removed` paper ids deleted, and the order, keys and lessons replaced.
 */
export async function saveDraft(certificationId, { changed, removed, order, keys, lessons }) {
    try {
        await run([PAPERS, META], "readwrite", (tx) => {
            const store = tx.objectStore(PAPERS)
            for (const paper of changed) store.put(paper, paperKey(certificationId, paper.id))
            for (const id of removed) store.delete(paperKey(certificationId, id))
            tx.objectStore(META).put({ order, keys, lessons, savedAt: Date.now() }, String(certificationId))
        })
        return true
    } catch (error) {
        console.warn("The import could not be kept for after a refresh:", error)
        return false
    }
}

/** Forgets this certification's import. */
export async function clearDraft(certificationId) {
    try {
        const meta = await run([META], "readonly", (tx) => tx.objectStore(META).get(String(certificationId)))
        await run([PAPERS, META], "readwrite", (tx) => {
            for (const id of meta?.order ?? []) tx.objectStore(PAPERS).delete(paperKey(certificationId, id))
            tx.objectStore(META).delete(String(certificationId))
        })
    } catch {
        // Nothing to forget, or storage is unavailable.
    }
}
