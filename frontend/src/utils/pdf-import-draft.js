
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

export async function clearDraft(certificationId) {
    try {
        const meta = await run([META], "readonly", (tx) => tx.objectStore(META).get(String(certificationId)))
        await run([PAPERS, META], "readwrite", (tx) => {
            for (const id of meta?.order ?? []) tx.objectStore(PAPERS).delete(paperKey(certificationId, id))
            tx.objectStore(META).delete(String(certificationId))
        })
    } catch {
    }
}

// The PDFs of a server import job, kept so the browser can cut figures from
// them once the server has read the pages -- even after a refresh, a logout
// or the tab being closed.
const fileKey = (jobId, index, role) => `file::${jobId}::${index}::${role}`

export async function saveJobFile(jobId, index, role, file) {
    try {
        await run([META], "readwrite", (tx) => {
            tx.objectStore(META).put({ name: file.name, type: file.type, blob: file }, fileKey(jobId, index, role))
        })
        return true
    } catch {
        return false
    }
}

export async function loadJobFile(jobId, index, role) {
    try {
        const entry = await run([META], "readonly", (tx) => tx.objectStore(META).get(fileKey(jobId, index, role)))
        return entry ? new File([entry.blob], entry.name, { type: entry.type || "application/pdf" }) : null
    } catch {
        return null
    }
}

export async function clearJobFiles(jobId) {
    try {
        await run([META], "readwrite", (tx) => {
            tx.objectStore(META).delete(IDBKeyRange.bound(`file::${jobId}::`, `file::${jobId}::￿`))
        })
    } catch {
        // Best effort: stale blobs are harmless.
    }
}
