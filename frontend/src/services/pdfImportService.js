import { base } from "./base"

export function tagQuestions(certificationId, questions, stems = []) {
    return base("ai/past-papers/tag", {
        method: "POST",
        data: { certificationId: Number(certificationId), questions, stems },
        timeout: 240000,
    })
}

export function readDocumentPage(page) {
    return base("ai/past-papers/read-page", {
        method: "POST",
        data: page,
        timeout: 180000,
    })
}

export function checkQuestions(questions) {
    return base("ai/past-papers/check", {
        method: "POST",
        data: { questions },
        timeout: 300000,
    })
}

export function readDocumentLayout(file) {
    const formData = new FormData()
    formData.append("file", file)
    return base("ai/past-papers/read-layout", {
        method: "POST",
        data: formData,
        timeout: 540000,
    })
}

export function findDuplicates(certificationId, stems) {
    return base("ai/past-papers/duplicates", {
        method: "POST",
        data: { certificationId: Number(certificationId), stems },
        timeout: 60000,
    })
}

export function startTagJob(certificationId, papers) {
    return base("ai/past-papers/tag-jobs", {
        method: "POST",
        data: { certificationId: Number(certificationId), papers },
        timeout: 120000,
    })
}

export function getTagJob(jobId) {
    return base(`ai/past-papers/tag-jobs/${jobId}`, { timeout: 30000 })
}

export function latestTagJob(certificationId) {
    return base(`ai/past-papers/tag-jobs/latest?certificationId=${Number(certificationId)}`, { timeout: 30000 })
}

export function cancelTagJob(jobId) {
    return base(`ai/past-papers/tag-jobs/${jobId}/cancel`, { method: "POST", data: {}, timeout: 30000 })
}

export async function asPdf(file) {
    if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") return file
    const formData = new FormData()
    formData.append("file", file)
    let blob
    try {
        blob = await base("ai/past-papers/to-pdf", {
            method: "POST",
            data: formData,
            responseType: "blob",
            timeout: 240000,
        })
    } catch (error) {
        const body = error?.response?.data
        let message = null
        if (body instanceof Blob) {
            try {
                const parsed = JSON.parse(await body.text())
                message = parsed.message || parsed.detail || null
            } catch {
                message = null
            }
        }
        throw new Error(message || `${file.name} could not be converted to PDF`)
    }
    const name = file.name.replace(/\.[^.]+$/, "") + ".pdf"
    return new File([blob], name, { type: "application/pdf" })
}

// ---- Import jobs: the server reads, checks and tags; the page only uploads ----

export function createImportJob(certificationId, owner, papers) {
    return base("ai/past-papers/import-jobs", {
        method: "POST",
        data: { certificationId: Number(certificationId), owner: String(owner), papers },
        timeout: 60000,
    })
}

export function uploadImportPage(jobId, page, signal) {
    return base(`ai/past-papers/import-jobs/${jobId}/pages`, {
        method: "POST",
        data: page,
        timeout: 120000,
        signal,
    })
}

export function startImportJob(jobId) {
    return base(`ai/past-papers/import-jobs/${jobId}/start`, { method: "POST", data: {}, timeout: 60000 })
}

export function getImportJob(jobId) {
    return base(`ai/past-papers/import-jobs/${jobId}`, { timeout: 30000 })
}

export function latestImportJob(owner) {
    return base(`ai/past-papers/import-jobs/latest?owner=${encodeURIComponent(owner)}`, { timeout: 30000 })
}

export function getImportJobResult(jobId, index) {
    return base(`ai/past-papers/import-jobs/${jobId}/results/${index}`, { timeout: 60000 })
}

export function cancelImportJob(jobId) {
    return base(`ai/past-papers/import-jobs/${jobId}/cancel`, { method: "POST", data: {}, timeout: 30000 })
}

export function discardImportJob(jobId) {
    return base(`ai/past-papers/import-jobs/${jobId}/discard`, { method: "POST", data: {}, timeout: 30000 })
}
