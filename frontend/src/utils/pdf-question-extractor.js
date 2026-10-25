
const SCALE = 2

const FOOTER_RE = /^(?:[–—-]\s*)?(?:page\s*)?\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?(?:\s*[–—-])?$/i

function isPageNumber(line, pageHeight) {
    return FOOTER_RE.test(line.text) && (line.bottom < pageHeight * 0.12 || line.top > pageHeight * 0.88)
}

// Common numbering used by past papers, reviewers, worksheets and exported
// quizzes. The local layout reader has additional profiles; these patterns
// make the fast in-browser pass useful for more ordinary documents too.
const QUESTION_RE = /^(?:Q(?:uestion)?|Item|No\.?)\s?(\d{1,3})\s*[.:)]\s*/i

async function loadPdfJs() {
    const [module, worker] = await Promise.all([
        import("pdfjs-dist-v3/build/pdf.js"),
        import("pdfjs-dist-v3/build/pdf.worker.min.js?url"),
    ])
    const pdfjs = module.default ?? module
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
}

function makeCanvas(width, height) {
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(width))
    canvas.height = Math.max(1, Math.round(height))
    return canvas
}

function halfWidth(text) {
    return (text || "")
        .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
        .replace(/　/g, " ")
}

function isDark(data, index) {
    return data[index] + data[index + 1] + data[index + 2] < 500
}

async function readPages(pdf, pdfjs, onProgress) {
    const pages = []
    for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number)
        const viewport = page.getViewport({ scale: SCALE })
        const canvas = makeCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
        const context = canvas.getContext("2d", { willReadFrequently: true })
        context.fillStyle = "#fff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: context, viewport }).promise

        const content = await page.getTextContent()
        const items = []
        for (const item of content.items) {
            if (!item.str || !item.str.trim()) continue
            const t = pdfjs.Util.transform(viewport.transform, item.transform)
            const h = Math.hypot(t[2], t[3]) || Math.abs(item.height * SCALE) || 10
            const length = item.width * SCALE
            if (Math.abs(t[1]) > Math.abs(t[0])) {
                const up = t[1] < 0
                items.push({
                    str: halfWidth(item.str),
                    x: up ? t[4] - h : t[4] - h * 0.28,
                    y0: up ? t[5] - length : t[5],
                    y1: up ? t[5] : t[5] + length,
                    w: h * 1.28,
                    h,
                    sideways: true,
                })
                continue
            }
            items.push({
                str: halfWidth(item.str),
                x: t[4],
                y0: t[5] - h,
                y1: t[5] + h * 0.28,
                w: length,
                h,
            })
        }

        items.sort((a, b) => a.y1 - b.y1 || a.x - b.x)
        const lines = []
        for (const item of items) {
            if (item.sideways) continue
            const mid = (item.y0 + item.y1) / 2
            let line = lines.find((l) => Math.abs(l.mid - mid) < Math.max(4, item.h * 0.35))
            if (!line) {
                line = { mid, items: [] }
                lines.push(line)
            }
            line.items.push(item)
        }
        for (const line of lines) {
            line.items.sort((a, b) => a.x - b.x)
            let text = ""
            let end = -1e9
            for (const item of line.items) {
                if (text && item.x - end > item.h * 0.15 && !text.endsWith(" ") && !item.str.startsWith(" ")) {
                    text += " "
                }
                text += item.str
                end = item.x + item.w
            }
            line.text = text.replace(/\s+/g, " ").trim()
            line.x0 = line.items[0].x
            line.x1 = Math.max(...line.items.map((i) => i.x + i.w))
            line.top = Math.min(...line.items.map((i) => i.y0))
            line.bottom = Math.max(...line.items.map((i) => i.y1))
        }
        lines.sort((a, b) => a.top - b.top)
        const body = lines.filter((l) => !isPageNumber(l, canvas.height))

        const W = canvas.width
        const H = canvas.height
        const pixels = context.getImageData(0, 0, W, H).data
        const covered = new Uint8Array(W * H)
        for (const item of items) {
            const pad = 3
            const xa = Math.max(0, Math.floor(item.x - pad))
            const xb = Math.min(W, Math.ceil(item.x + item.w + pad))
            const ya = Math.max(0, Math.floor(item.y0 - pad))
            const yb = Math.min(H, Math.ceil(item.y1 + pad))
            for (let y = ya; y < yb; y++) covered.fill(1, y * W + xa, y * W + xb)
        }
        const rowInk = new Uint16Array(H)
        for (let y = 0; y < H; y++) {
            let count = 0
            for (let x = 0; x < W; x++) {
                const i = y * W + x
                if (!covered[i] && isDark(pixels, i * 4)) count++
            }
            rowInk[y] = count
        }

        const maxX = body.length ? Math.max(...body.map((l) => l.x1)) : W
        const minX = body.length ? Math.min(...body.map((l) => l.x0)) : 0
        const pageInfo = { num: number, canvas, lines: body, items, rowInk, W, H, minX, maxX }
        for (const line of body) {
            line.wraps = line.x1 > maxX - W * 0.07
            line.pg = pageInfo
        }
        pages.push(pageInfo)
        page.cleanup()
        if (onProgress) {
            await onProgress(number, pdf.numPages, "pages", {
                lines: body.length,
                preview: body.slice(0, 3).map((line) => line.text).join(" ").slice(0, 280),
            })
        }
    }
    return withoutRunningLines(pages)
}

function withoutRunningLines(pages) {
    if (pages.length < 2) return pages
    const inMargin = (line, pg) => line.bottom < pg.H * 0.12 || line.top > pg.H * 0.88
    const keyOf = (line) => line.text.toLowerCase().replace(/\d+/g, "#").trim()
    const pagesWith = new Map()
    for (const pg of pages) {
        for (const line of pg.lines) {
            if (!inMargin(line, pg)) continue
            const key = keyOf(line)
            if (!pagesWith.has(key)) pagesWith.set(key, new Set())
            pagesWith.get(key).add(pg.num)
        }
    }
    const needed = Math.max(2, Math.floor(pages.length / 2))
    for (const pg of pages) {
        pg.lines = pg.lines.filter((line) => !(inMargin(line, pg) && pagesWith.get(keyOf(line))?.size >= needed))
    }
    return pages
}


function crop(source, x, y, width, height) {
    const canvas = makeCanvas(width, height)
    canvas.getContext("2d").drawImage(source, x, y, width, height, 0, 0, width, height)
    return canvas
}


async function pageTexts(pdf) {
    const out = []
    for (let number = 1; number <= pdf.numPages; number++) {
        const content = await (await pdf.getPage(number)).getTextContent()
        const items = content.items.filter((item) => item.str.trim()).sort((a, b) => b.transform[5] - a.transform[5])
        const rows = []
        for (const item of items) {
            const y = item.transform[5]
            const tolerance = Math.max(2.5, Math.abs(item.transform[3]) * 0.4)
            let row = rows.find((r) => Math.abs(r.y - y) < tolerance)
            if (!row) {
                row = { y, items: [] }
                rows.push(row)
            }
            row.items.push(item)
        }
        out.push(
            rows
                .map((row) => row.items.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(" "))
                .join("\n"),
        )
    }
    return out
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*"

export function examInfo(text, fileName) {
    const name = (fileName || "").replace(/\.pdf$/i, "").replace(/[_\-.]+/g, " ")
    const lower = name.toLowerCase()
    const body = (text || "").slice(0, 1500)
    const info = {}

    const year = name.match(/(?:19|20)\d{2}/) || body.match(/\b(?:19|20)\d{2}\b/)
    if (year) info.year = Number(year[0])

    const nameMonth =
        lower.match(new RegExp(`(?:19|20)\\d{2}\\s*${MONTH_RE}(?![a-z])`)) || lower.match(new RegExp(`\\b${MONTH_RE}\\b`))
    const season = name.match(/(?:19|20)\d{2}([AS])(?![a-z])/i)
    const textMonth = body
        .toLowerCase()
        .match(new RegExp(`\\b${MONTH_RE}\\.?,?\\s+(?:\\d{1,2},?\\s+)?(?:19|20)\\d{2}\\b`))
    if (nameMonth) info.month = MONTHS.indexOf(nameMonth[1]) + 1
    else if (season) info.month = season[1].toUpperCase() === "A" ? 10 : 4
    else if (textMonth) info.month = MONTHS.indexOf(textMonth[1]) + 1

    const source = `${name} ${body}`
    if (/\bAM\b|morning/i.test(name)) info.session = "am"
    else if (/\bPM\b|afternoon/i.test(name)) info.session = "pm"
    else if (/morning/i.test(body)) info.session = "am"
    else if (/afternoon/i.test(body)) info.session = "pm"
    if (/\bFE\b|fundamental/i.test(source)) info.category = "FE"
    else if (/\bIP\b|IT Passport/i.test(source)) info.category = "IP"
    info.stem = paperStem(fileName)
    return info
}

export function paperStem(fileName) {
    return (fileName || "")
        .toLowerCase()
        .replace(/\.pdf$/, "")
        .replace(/[_\-.\s]+/g, " ")
        .replace(/\b(questions?|answers?|ans|answer ?keys?|keys?|solutions?|am|pm|morning|afternoon)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

export function describeExam(info) {
    const parts = []
    if (info?.month) parts.push(MONTH_NAMES[info.month - 1])
    if (info?.year) parts.push(info.year)
    if (info?.session) parts.push(info.session === "am" ? "morning" : "afternoon")
    return parts.join(" ")
}

export function matchScore(a, b) {
    if (a?.stem && a.stem === b?.stem && (!a.session || !b.session || a.session === b.session)) return 20
    let score = 1
    for (const key of ["year", "month", "session"]) {
        if (a?.[key] && b?.[key]) {
            if (a[key] !== b[key]) return 0
            score += key === "year" ? 3 : 1
        }
    }
    return score
}

export function citationFor(info, number) {
    if (!info?.year || !info?.month) return null
    const season = info.month === 10 ? "A" : info.month === 4 ? "S" : null
    const when = season ? `${info.year}${season}` : `${MONTH_NAMES[info.month - 1]} ${info.year}`
    return `(${[when, info.category, `Q${number}`].filter(Boolean).join(", ")})`
}


function pageFigures(pg) {
    if (!pg.items.length) return []
    const x0 = Math.max(0, Math.floor(pg.minX - 16))
    const x1 = Math.min(pg.W, Math.ceil(pg.maxX + 16))
    const clusters = []
    let cluster = null
    let gap = 0
    for (let y = 0; y < pg.H; y++) {
        if (pg.rowInk[y] > 1) {
            if (!cluster || gap > 44) {
                cluster = { a: y, b: y, ink: 0 }
                clusters.push(cluster)
            }
            cluster.b = y
            cluster.ink += pg.rowInk[y]
            gap = 0
        } else {
            gap++
        }
    }
    const figures = []
    for (const c of clusters) {
        if (c.ink < 40) continue
        let a = c.a
        let b = c.b
        let changed = true
        while (changed) {
            changed = false
            for (const line of pg.lines) {
                if (!(line.bottom > a - 22 && line.top < b + 22 && (line.top < a || line.bottom > b))) continue
                const inside = line.top >= c.a - 4 && line.bottom <= c.b + 4
                if (!inside && (line.wraps || /[?:]$/.test(line.text) || QUESTION_RE.test(line.text))) continue
                a = Math.min(a, line.top)
                b = Math.max(b, line.bottom)
                changed = true
            }
        }
        a = Math.max(0, a - 10)
        b = Math.min(pg.H, b + 10)
        figures.push({ id: `p${pg.num}f${figures.length + 1}`, a, b, x0, x1 })
    }
    return figures
}

function pageJpeg(pg) {
    const scale = Math.min(1, 1100 / pg.W)
    const canvas = makeCanvas(pg.W * scale, pg.H * scale)
    canvas.getContext("2d").drawImage(pg.canvas, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.82).split(",")[1]
}

function headingTop(pg, label) {
    const line = pg.lines.find((l) => {
        const match = l.text.match(QUESTION_RE)
        return match && match[1] === String(label)
    })
    return line ? line.top : null
}

async function readWithAi(pages, readPage, onProgress) {
    const questions = []
    const answers = {}
    const answerTexts = {}
    const byId = new Map()
    let previousId = null

    for (const pg of pages) {
        const figures = pageFigures(pg)
        const openIds = questions.filter((q) => !q.options.length).slice(-30).map((q) => q.num)
        if (onProgress) await onProgress(pg.num, pages.length, "ai")
        const result = await readPage({
            image: pageJpeg(pg),
            text: pg.lines.map((line) => line.text).join("\n"),
            figures: figures.map((f) => ({ id: f.id, top: f.a / pg.H, bottom: f.b / pg.H })),
            previousId,
            openIds,
        })
        Object.assign(answers, result.answers || {})
        Object.assign(answerTexts, result.answerTexts || {})

        const figureCanvas = (id) => {
            const figure = figures.find((f) => f.id === id)
            return figure ? crop(pg.canvas, figure.x0, figure.a, figure.x1 - figure.x0, figure.b - figure.a) : null
        }
        for (const item of result.questions || []) {
            const id = String(item?.id || "").trim()
            if (!id) continue
            // Pictures the AI located on the page: scanned pages have no
            // separate figure objects, so the box is the only way to cut them.
            const boxCanvas = (box) => {
                const pad = 0.008
                const x0 = Math.max(0, (box.left - pad) * pg.W)
                const y0 = Math.max(0, (box.top - pad) * pg.H)
                const x1 = Math.min(pg.W, (box.right + pad) * pg.W)
                const y1 = Math.min(pg.H, (box.bottom + pad) * pg.H)
                return crop(pg.canvas, x0, y0, x1 - x0, y1 - y0)
            }
            const options = (item.options || []).map((option) => ({
                key: option.key,
                text: option.text,
                image: option.figureId
                    ? figureCanvas(option.figureId)
                    : !option.text && option.imageBox ? boxCanvas(option.imageBox) : null,
                fromTable: false,
            }))
            const own = (item.figureIds || []).map(figureCanvas).filter(Boolean)
            if (!own.length) own.push(...(item.imageBoxes || []).map(boxCanvas))
            const earlier = byId.get(id)
            if (earlier && (item.continuesFromPreviousPage || !earlier.options.length)) {
                if (item.stem && !String(earlier.stem || "").includes(item.stem)) {
                    earlier.stem = [earlier.stem, item.stem].filter(Boolean).join("\n")
                }
                if (!earlier.options.length && options.length) {
                    earlier.options = options
                    earlier.type = "mcq"
                    earlier.visualOptions = options.some((o) => !o.text)
                }
                earlier.figures.push(...own)
                if (!earlier.pages.includes(pg.num)) earlier.pages.push(pg.num)
                earlier.unclear = (earlier.unclear || item.unclear) && !earlier.options.length
                if (item.answer) earlier.answer = item.answer
                if (item.answerText) earlier.answerText = item.answerText
                if (item.hasImage) earlier.hasImage = true
                if (item.context && !earlier.context) earlier.context = item.context
                continue
            }
            const entry = {
                num: id,
                parent: item.parentId || (id.includes("-") ? id.split("-")[0] : null),
                type: item.type || (options.length ? "mcq" : "short_answer"),
                context: item.context || null,
                hasImage: Boolean(item.hasImage || own.length),
                answerText: item.answerText || null,
                stem: String(item.stem || "").trim(),
                options,
                figures: own,
                snaps: [],
                pages: [pg.num],
                answer: item.answer,
                unclear: Boolean(item.unclear),
                visualOptions: options.some((o) => !o.text),
                aiRead: true,
            }
            byId.set(id, entry)
            questions.push(entry)
        }
        if (questions.length) previousId = questions[questions.length - 1].num
        if (onProgress) await onProgress(pg.num, pages.length, "ai")
    }

    const byParent = new Map()
    for (const question of questions) {
        if (!question.parent) continue
        if (!byParent.has(question.parent)) byParent.set(question.parent, [])
        byParent.get(question.parent).push(question)
    }
    for (const [parent, blanks] of byParent) {
        const lastPage = Math.max(...blanks.flatMap((q) => q.pages))
        let firstPage = Math.min(...blanks.flatMap((q) => q.pages))
        let top = 0
        for (let n = firstPage; n >= Math.max(1, firstPage - 4); n--) {
            const found = headingTop(pages[n - 1], parent)
            if (found !== null) {
                firstPage = n
                top = Math.max(0, found - 12)
                break
            }
        }
        const context = []
        for (let n = firstPage; n <= lastPage; n++) {
            const pg = pages[n - 1]
            const x0 = Math.max(0, Math.floor(pg.minX - 16))
            const x1 = Math.min(pg.W, Math.ceil(pg.maxX + 16))
            const y0 = n === firstPage ? top : 0
            context.push(crop(pg.canvas, x0, y0, x1 - x0, pg.H * 0.95 - y0))
        }
        for (const blank of blanks) {
            // The shared scenario is kept as text when the AI read it; the
            // cropped region becomes a figure only when the part needs a picture.
            if (!blank.context || blank.hasImage) blank.figures = blank.figures.length ? blank.figures : context
            blank.snaps = context
            blank.contextPages = [firstPage, lastPage]
        }
    }
    for (const question of questions) {
        if (!question.snaps.length) question.snaps = question.pages.map((n) => pages[n - 1].canvas)
        if (!question.answer && answers[question.num]) question.answer = answers[question.num]
        if (!question.answerText && answerTexts[question.num]) question.answerText = answerTexts[question.num]
    }
    // A main question whose parts were returned separately is only their
    // heading; its text already travels with each part as the shared context.
    const parents = new Set(questions.filter((q) => q.parent && q.parent !== q.num).map((q) => q.parent))
    const heading = (q) => parents.has(q.num) && !q.options.length && !q.answer && !q.answerText
    for (const part of questions) {
        const main = part.parent && questions.find((q) => q.num === part.parent && heading(q))
        if (main && !part.context && main.stem) part.context = main.stem
    }
    // The stem points at a picture the reader did not return: flag it for review.
    const POINTS_AT_PICTURE = /\b(shown|given|as follows|table|figure|diagram|chart|graph|circuit|tree)\b[^.?]*\bbelow\b|\bbelow\b[^.?]*\b(table|figure|diagram|chart|graph|circuit|tree)\b/i
    for (const q of questions) {
        const pictured = q.figures.length || q.options.some((o) => o.image)
        if (!pictured && !q.context && POINTS_AT_PICTURE.test(q.stem)) {
            q.unclear = true
            q.missingImage = true
        }
    }
    const kept = questions.filter((q) => !heading(q))
    return { questions: kept, answers, answerTexts }
}





// Every file is read by AI vision (OpenRouter) from the rendered page image.
// Papers come in too many layouts for rule-based parsing to be trusted, so a
// failed read is reported instead of silently falling back to a local guess.
export async function readExamPdf(file, onProgress, readLayout, readPage) {
    if (!readPage) throw new Error("AI page reading is required to import papers")
    const pdfjs = await loadPdfJs()
    const data = new Uint8Array(await file.arrayBuffer())
    const task = pdfjs.getDocument({ data, isEvalSupported: false })
    const pdf = await task.promise
    try {
        const texts = await pageTexts(pdf)
        const info = examInfo(texts[0] || "", file.name)
        const pages = await readPages(pdf, pdfjs, onProgress)
        if (onProgress) {
            await onProgress(0, pages.length, "ai", { reason: "Reading the original pages with AI vision" })
        }
        let ai
        try {
            ai = await readWithAi(pages, readPage, onProgress)
        } catch (error) {
            throw new Error(`AI could not read ${file.name}: ${error?.response?.data?.message || error?.message || "unknown error"}`)
        }
        const complete = ai.questions.filter((question) => question.stem && (question.options.length >= 2 || question.type !== "mcq")).length
        const answerCount = Object.keys(ai.answers || {}).length + Object.keys(ai.answerTexts || {}).length
        if (complete >= 1) {
            return { kind: "paper", name: file.name, info, questions: ai.questions, readBy: "ai", partial: complete < ai.questions.length }
        }
        if (answerCount >= 1) {
            return { kind: "key", name: file.name, info, answers: ai.answers, answerTexts: ai.answerTexts, count: answerCount, readBy: "ai" }
        }
        throw new Error(`AI found no questions or answers in ${file.name}`)
    } finally {
        task.destroy()
    }
}

export function canvasToFile(canvas, name) {
    const type = canvas.height > 2500 ? "image/jpeg" : "image/png"
    const fileName = type === "image/jpeg" ? name.replace(/\.png$/i, ".jpg") : name
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(new File([blob], fileName, { type }))
                else reject(new Error("The figure could not be saved as an image."))
            },
            type,
            0.85,
        )
    })
}

export function stackCanvases(canvases) {
    if (canvases.length === 1) return canvases[0]
    const gap = 24
    const width = Math.max(...canvases.map((c) => c.width))
    const height = canvases.reduce((sum, c) => sum + c.height, 0) + gap * (canvases.length - 1)
    const out = makeCanvas(width, height)
    const context = out.getContext("2d")
    context.fillStyle = "#fff"
    context.fillRect(0, 0, width, height)
    let y = 0
    for (const canvas of canvases) {
        context.drawImage(canvas, Math.round((width - canvas.width) / 2), y)
        y += canvas.height + gap
    }
    return out
}
