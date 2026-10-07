import { base } from "./base"

/**
 * A lesson and a difficulty for each question text, from the tagging model
 * (Grok on OpenRouter, free models as fallbacks). Resolves to
 * `{ tags: [{ lessonId, lessonName, difficulty, source, score }],
 *    lessons: [{ lessonId, name, category }] }`, tags in question order.
 * Nothing is written.
 */
export function tagQuestions(certificationId, questions, stems = []) {
    return base("ai/past-papers/tag", {
        method: "POST",
        data: { certificationId: Number(certificationId), questions, stems },
        timeout: 240000,
    })
}

/**
 * The questions on one page of a document whose layout the browser's reader
 * does not know, read by a vision model. `page` is `{ image, text, figures,
 * previousId }`. Resolves to `{ pageKind, questions, answers, model }`.
 */
export function readDocumentPage(page) {
    return base("ai/past-papers/read-page", {
        method: "POST",
        data: page,
        timeout: 180000,
    })
}

/**
 * Every question in a PDF of any layout, read by layout analysis and question
 * profiles on the server -- no generative model. Resolves to `{ profile,
 * questions, answers, pages, ocr, total, complete }`; figure and question
 * positions are fractions of the page, for cropping from the browser's render.
 */
export function readDocumentLayout(file) {
    const formData = new FormData()
    formData.append("file", file)
    return base("ai/past-papers/read-layout", {
        method: "POST",
        data: formData,
        // About two seconds a page on the server's CPU, plus loading the model.
        timeout: 540000,
    })
}

/**
 * For each stem, "bank" when the certification's question bank already holds
 * it, "paper" when an earlier stem of the same list repeats it, else null.
 */
export function findDuplicates(certificationId, stems) {
    return base("ai/past-papers/duplicates", {
        method: "POST",
        data: { certificationId: Number(certificationId), stems },
        timeout: 60000,
    })
}

/**
 * Starts tagging every paper in the background: `papers` is
 * `[{ paperId, name, nums, questions, stems }]`. Resolves to the job at once;
 * the server keeps working if the page is left or refreshed.
 */
export function startTagJob(certificationId, papers) {
    return base("ai/past-papers/tag-jobs", {
        method: "POST",
        data: { certificationId: Number(certificationId), papers },
        timeout: 120000,
    })
}

/** A tagging job: `{ id, status, total, tagged, lessons, papers: [{ paperId, nums, status, tags }] }`. */
export function getTagJob(jobId) {
    return base(`ai/past-papers/tag-jobs/${jobId}`, { timeout: 30000 })
}

/** The certification's most recent tagging job, as `{ job }` (null when none). */
export function latestTagJob(certificationId) {
    return base(`ai/past-papers/tag-jobs/latest?certificationId=${Number(certificationId)}`, { timeout: 30000 })
}

export function cancelTagJob(jobId) {
    return base(`ai/past-papers/tag-jobs/${jobId}/cancel`, { method: "POST", data: {}, timeout: 30000 })
}

/**
 * The file as a PDF. A PDF is returned as it is; a Word (.docx, .doc),
 * OpenDocument or RTF reviewer is converted on the server (LibreOffice) and
 * comes back renamed to ".pdf", so every reader after this -- the browser's
 * rules, the layout reader, figure crops, key pairing by name -- treats it
 * exactly as a PDF.
 */
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
            // LibreOffice starts per document: a few seconds, more for a long one.
            timeout: 240000,
        })
    } catch (error) {
        // A blob response hides the server's JSON explanation; read it back.
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
