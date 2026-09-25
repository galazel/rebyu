/**
 * Reads multiple-choice exam papers (Q1., Q2. ... with a) to d) choices) and
 * their answer keys out of PDFs, in the browser.
 *
 * Text comes from the PDF's own text layer. Figures -- diagrams, tables,
 * circuits, graphs -- are found by drawing each page onto a canvas, covering
 * every spot where text sits, and looking for the dark pixels left over: those
 * can only be lines, boxes and images. Close rows of leftover ink form one
 * figure, which is cropped from the page as a PNG so it is shown as drawn
 * rather than described.
 *
 * Scanned PDFs have no text layer and are reported as such rather than
 * guessed at.
 */

const SCALE = 2

/** A page footer such as "– 12 –". */
const FOOTER_RE = /^[–-]\s*\d+\s*[–-]$/

/** The start of a question: "Q12." near the left margin. */
const QUESTION_RE = /^Q\s?(\d{1,3})\s?[.:)]\s*/

/**
 * A section banner -- "Answer questions Q66 through Q100 concerning
 * strategy." It sits between two questions in a ruled box; unrecognised, the
 * box became the previous question's figure and its text that question's last
 * choice.
 */
const BANNER_RE = /^Answer (?:the )?questions? (?:Q?\d+|[A-Z]) through (?:Q?\d+|[A-Z])\b/i

/** The heading of a case study several questions share: "Question A". */
const CASE_RE = /^Question [A-Z]\b/

/** A choice marker on its own: "a)", "(b)", "c." */
const MARKER_RE = /^\(?([a-d])[).]$/

/** A line that is a choice WITH its text: "a) Divisional organization". */
const TEXT_CHOICE_RE = /^\(?[a-d][).]\s+\S/

/**
 * pdf.js 3.11, not the 6.x the document reader uses. The ITPEC papers set
 * their graph labels ("Amplitude", "Time", axis values) as small CCITT fax
 * images, and pdf.js 6 draws those white on white: every cropped figure came
 * out without its labels. 3.11 draws them.
 */
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

function isDark(data, index) {
    return data[index] + data[index + 1] + data[index + 2] < 500
}

/** Every page as a canvas, its text lines, and a per-row count of non-text ink. */
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
                // Set sideways -- an axis title such as "Cumulative bugs".
                // Its box runs up (or down) the page from the baseline point,
                // not across it.
                const up = t[1] < 0
                items.push({
                    str: item.str,
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
                str: item.str,
                x: t[4],
                y0: t[5] - h,
                y1: t[5] + h * 0.28,
                w: length,
                h,
            })
        }

        // Pieces at about the same height make one line, read left to right.
        items.sort((a, b) => a.y1 - b.y1 || a.x - b.x)
        const lines = []
        for (const item of items) {
            // A sideways label only ever sits inside a figure; joined to the
            // horizontal line at its midpoint it would stretch that line the
            // height of the graph.
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
        const body = lines.filter((l) => !FOOTER_RE.test(l.text))

        // Dark pixels NOT covered by text.
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
        if (onProgress) await onProgress(number, pdf.numPages)
    }
    return pages
}

/** Groups the lines into questions, each a list of lines and page segments. */
function locateQuestions(pages) {
    let questions = []
    let current = null
    let lastNumber = 0

    // A case study's passage -- the text and figure several questions share
    // ("Read the following ... then answer Q89 through Q92") -- goes with
    // every one of those questions, not with the question printed before it.
    let context = null
    const contexts = []

    for (const pg of pages) {
        pg.stops = []
        for (const line of pg.lines) {
            if (BANNER_RE.test(line.text)) {
                // The banner ends the question before it; its box is not that
                // question's figure.
                pg.stops.push(line.top - 12)
                current = null
                context = null
                continue
            }
            if (CASE_RE.test(line.text)) {
                pg.stops.push(line.top - 12)
                current = null
                context = { segs: [{ pg, top: line.top, bottom: line.bottom }] }
                contexts.push(context)
                continue
            }
            const match = line.text.match(QUESTION_RE)
            if (match && line.x0 < pg.minX + pg.W * 0.12) {
                const number = Number(match[1])
                // Numbering going backwards means the list restarts -- the
                // sample "Q1" printed on every paper's cover.
                if (number <= lastNumber) questions = []
                lastNumber = number
                line.stripped = line.text.replace(QUESTION_RE, "")
                line.isQuestion = true
                current = { num: number, lines: [line], segs: [{ pg, top: line.top, bottom: line.bottom }], context }
                questions.push(current)
            } else if (!current && context) {
                const seg = context.segs[context.segs.length - 1]
                if (seg.pg !== pg) context.segs.push({ pg, top: line.top, bottom: line.bottom })
                const last = context.segs[context.segs.length - 1]
                last.bottom = Math.max(last.bottom, line.bottom)
            } else if (current) {
                const seg = current.segs[current.segs.length - 1]
                if (seg.pg !== pg) current.segs.push({ pg, top: line.top, bottom: line.bottom })
                current.lines.push(line)
                const last = current.segs[current.segs.length - 1]
                last.bottom = Math.max(last.bottom, line.bottom)
            }
        }
    }

    // Each segment runs on to whatever starts next on its page -- a question,
    // a banner, a case study -- so a figure drawn below the last text line is
    // still inside it.
    const starts = questions.map((q) => ({ pg: q.segs[0].pg, top: q.segs[0].top }))
    const extend = (seg) => {
        let limit = seg.pg.H * 0.93
        for (const start of starts) {
            if (start.pg === seg.pg && start.top > seg.bottom && start.top - 6 < limit) limit = start.top - 6
        }
        for (const stop of seg.pg.stops) {
            if (stop > seg.bottom && stop < limit) limit = stop
        }
        let bottom = seg.bottom
        for (let y = Math.ceil(seg.bottom); y < limit; y++) {
            if (seg.pg.rowInk[y] > 2) bottom = y
        }
        seg.bottom = Math.min(limit, bottom + 4)
        seg.top = Math.max(0, seg.top - 8)
    }
    for (const question of questions) question.segs.forEach(extend)
    for (const shared of contexts) shared.segs.forEach(extend)
    return questions
}

function crop(source, x, y, width, height) {
    const canvas = makeCanvas(width, height)
    canvas.getContext("2d").drawImage(source, x, y, width, height, 0, 0, width, height)
    return canvas
}

/** The dark-pixel bounds inside a rectangle, with some rectangles blanked out. */
function inkBounds(pg, rect, exclude = []) {
    const x = Math.max(0, Math.floor(rect.x0))
    const y = Math.max(0, Math.floor(rect.y0))
    const w = Math.min(pg.W, Math.ceil(rect.x1)) - x
    const h = Math.min(pg.H, Math.ceil(rect.y1)) - y
    if (w <= 0 || h <= 0) return null
    const data = pg.canvas.getContext("2d", { willReadFrequently: true }).getImageData(x, y, w, h).data
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
            if (!isDark(data, (row * w + col) * 4)) continue
            const px = x + col
            const py = y + row
            if (exclude.some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) continue
            if (px < x0) x0 = px
            if (px > x1) x1 = px
            if (py < y0) y0 = py
            if (py > y1) y1 = py
        }
    }
    // Text counts as part of the picture too. Small labels are anti-aliased
    // to grey, lighter than the "dark" test, and were cropped off: graphs
    // came out without their axis titles.
    for (const item of pg.items) {
        const cx = item.x + item.w / 2
        const cy = (item.y0 + item.y1) / 2
        if (cx < rect.x0 || cx > rect.x1 || cy < rect.y0 || cy > rect.y1) continue
        if (exclude.some((r) => cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1)) continue
        x0 = Math.min(x0, item.x)
        x1 = Math.max(x1, item.x + item.w)
        y0 = Math.min(y0, item.y0)
        y1 = Math.max(y1, item.y1)
    }
    return x1 < x0 ? null : { x0, y0, x1, y1 }
}

function bandsOf(values, tolerance) {
    const starts = []
    for (const value of [...values].sort((a, b) => a - b)) {
        if (!starts.length || value - starts[starts.length - 1] > tolerance) starts.push(value)
    }
    return starts
}

/**
 * One crop per picture option, cut at the printed letters.
 *
 * The paper sets each option's letter at the top-left of its picture, so the
 * letters are the grid: an option runs from its letter to the next letter
 * along its row and down to the next row of letters. The letter itself is
 * left out -- choices are shuffled when a learner answers, so a picture
 * captioned "c)" on the button lettered A would contradict it.
 *
 * Returns null unless each of a) to d) is found exactly once.
 */
function cropOptions(question, keys) {
    // Letters anywhere in the question's own region, not only inside a
    // figure: a letter set well above its graph (2011A Q39) is not close
    // enough to be pulled into the figure as a label.
    const markers = []
    for (const line of question.lines) {
        if (line.isQuestion) continue
        const seg = question.segs.find((s) => s.pg === line.pg)
        if (!seg) continue
        for (const item of line.items) {
            const match = item.str.trim().match(MARKER_RE)
            if (!match || !keys.includes(match[1])) continue
            markers.push({ key: match[1], pg: line.pg, seg, item, x0: item.x, x1: item.x + item.w, y0: item.y0, y1: item.y1 })
        }
    }
    const byKey = {}
    for (const marker of markers) {
        if (byKey[marker.key]) return null
        byKey[marker.key] = marker
    }
    if (keys.some((key) => !byKey[key])) return null
    const pg = byKey[keys[0]].pg
    if (keys.some((key) => byKey[key].pg !== pg)) return null

    const found = keys.map((key) => byKey[key])
    const rows = bandsOf(found.map((m) => m.y0), 8)
    const columns = bandsOf(found.map((m) => m.x0), 12)
    const right = Math.min(pg.W, pg.maxX + 16)
    const bottom = Math.max(...found.map((m) => m.seg.bottom))
    const next = (starts, value, limit) => {
        const later = starts.filter((s) => s > value + 8)
        return later.length ? Math.min(...later) - 6 : limit
    }
    const cellOf = (marker) => ({
        x0: marker.x0 - 6,
        y0: marker.y0 - 6,
        x1: next(columns, marker.x0, right),
        y1: next(rows, marker.y0, bottom),
    })
    const top = Math.min(...found.map((m) => m.y0)) - 6

    // Rows of an answer table ("a) | A | C | B"), one line high each. The
    // letter sits inside the row's own ruling and cannot be cropped out, and
    // the row is text anyway: read it as text, cells joined with "|".
    const pitch = rows.length > 1 ? Math.min(...rows.slice(1).map((r, i) => r - rows[i])) : Infinity
    const lineHeight = Math.max(...found.map((m) => m.y1 - m.y0))
    if (columns.length === 1 && rows.length === keys.length && pitch < lineHeight * 3.5) {
        const texts = {}
        for (const marker of found) {
            const cell = cellOf(marker)
            const cells = pg.items
                .filter((item) => !item.sideways && item !== marker.item)
                .filter((item) => {
                    const cy = (item.y0 + item.y1) / 2
                    return item.x > marker.x1 && cy > cell.y0 && cy < cell.y1 && !MARKER_RE.test(item.str.trim())
                })
                .sort((a, b) => a.x - b.x)
            if (!cells.length) return null
            const parts = []
            let end = -Infinity
            for (const item of cells) {
                const text = item.str.trim()
                if (!text) continue
                if (parts.length && item.x - end < item.h * 0.6) parts[parts.length - 1] += ` ${text}`
                else parts.push(text)
                end = item.x + item.w
            }
            texts[marker.key] = parts.join(" | ")
        }
        return { texts, top, pg, table: true }
    }

    const crops = {}
    for (const marker of found) {
        const cell = cellOf(marker)
        const bounds = inkBounds(pg, cell, found.map((m) => ({ x0: m.x0 - 2, y0: m.y0 - 2, x1: m.x1 + 2, y1: m.y1 + 2 })))
        if (!bounds) return null
        const x = Math.max(0, bounds.x0 - 8)
        const y = Math.max(0, bounds.y0 - 8)
        crops[marker.key] = crop(pg.canvas, x, y, Math.min(pg.W, bounds.x1 + 8) - x, Math.min(pg.H, bounds.y1 + 8) - y)
    }
    return { crops, top, pg }
}

function buildQuestion(question) {
    const snaps = []
    const bands = []
    for (const seg of question.segs) {
        const pg = seg.pg
        const x0 = Math.max(0, Math.floor(pg.minX - 16))
        const x1 = Math.min(pg.W, Math.ceil(pg.maxX + 16))
        const y0 = Math.floor(seg.top)
        const y1 = Math.ceil(seg.bottom)
        if (y1 - y0 < 4) continue
        snaps.push(crop(pg.canvas, x0, y0, x1 - x0, y1 - y0))

        const clusters = []
        let cluster = null
        let gap = 0
        for (let y = y0; y < y1; y++) {
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

        for (const c of clusters) {
            if (c.ink < 40) continue
            let a = c.a
            let b = c.b
            let changed = true
            // Pull in the text lines touching the figure -- its labels.
            while (changed) {
                changed = false
                for (const line of question.lines) {
                    if (line.pg !== pg || line.isQuestion) continue
                    if (!(line.bottom > a - 22 && line.top < b + 22 && (line.top < a || line.bottom > b))) continue
                    const inside = line.top >= c.a - 4 && line.bottom <= c.b + 4
                    const index = question.lines.indexOf(line)
                    const previous = question.lines[index - 1]
                    const prose =
                        line.wraps ||
                        /[?:]$/.test(line.text) ||
                        (previous && previous.wraps && previous.pg === line.pg && line.top < c.a)
                    // A written choice under a chart ("a) Divisional
                    // organization") is text, not a label: swallowed, it was
                    // lost from the choice and printed inside the picture.
                    if (!inside && (prose || TEXT_CHOICE_RE.test(line.text))) continue
                    a = Math.min(a, line.top)
                    b = Math.max(b, line.bottom)
                    changed = true
                }
            }
            bands.push({ pg, a: Math.max(y0, a - 10), b: Math.min(y1, b + 10), x0, x1 })
        }
    }
    const inBand = (line) =>
        bands.some((band) => band.pg === line.pg && (line.top + line.bottom) / 2 > band.a && (line.top + line.bottom) / 2 < band.b)

    // Text: the stem runs up to the first line starting "a)".
    const texts = question.lines.map((line, index) => ({
        t: index === 0 ? line.stripped : line.text,
        line,
        fig: index > 0 && inBand(line),
    }))
    const optionStart = texts.findIndex((entry) => /^\(?a[).](\s|$)/.test(entry.t))
    const stemPart = optionStart === -1 ? texts : texts.slice(0, optionStart)
    const optionPart = optionStart === -1 ? [] : texts.slice(optionStart)

    let stem = ""
    let previous = null
    for (const entry of stemPart) {
        if (entry.fig || !entry.t) {
            previous = null
            continue
        }
        stem += stem ? (previous && previous.line.wraps ? " " : "\n") + entry.t : entry.t
        previous = entry
    }

    // Inside a figure only the choice letters count; the rest is the drawing.
    const optionText = optionPart
        .map((entry) => (entry.fig ? (entry.t.match(/\(?[a-d][).]/g) || []).join(" ") : entry.t))
        .join("\n")
    const markerRe = /(?:^|\s)\(?([a-d])[).](?=\s|$)/g
    const marks = []
    let match
    while ((match = markerRe.exec(optionText))) {
        marks.push({ key: match[1], at: match.index + match[0].length, start: match.index })
    }
    const sequence = []
    let want = "a"
    for (const mark of marks) {
        if (mark.key === want) {
            sequence.push(mark)
            want = String.fromCharCode(want.charCodeAt(0) + 1)
        }
    }
    const options = sequence.map((mark, index) => ({
        key: mark.key,
        text: optionText
            .slice(mark.at, index + 1 < sequence.length ? sequence[index + 1].start : optionText.length)
            .replace(/\s+/g, " ")
            .trim(),
        image: null,
    }))
    const visualOptions = options.length > 0 && options.some((option) => !option.text)

    // Picture options: one crop each, and the stem's figure ends above them.
    let optionCut = null
    if (visualOptions) {
        optionCut = cropOptions(question, options.map((option) => option.key))
        if (optionCut?.table) {
            for (const option of options) {
                option.text = optionCut.texts[option.key]
                option.fromTable = true
            }
        } else if (optionCut) {
            for (const option of options) option.image = optionCut.crops[option.key]
        }
    }

    // The shared case study, as printed: its passage and figure together.
    const figures = []
    if (question.context) {
        question.context.snaps ??= question.context.segs
            .filter((seg) => seg.bottom - seg.top > 4)
            .map((seg) => {
                const x0 = Math.max(0, Math.floor(seg.pg.minX - 16))
                const x1 = Math.min(seg.pg.W, Math.ceil(seg.pg.maxX + 16))
                return crop(seg.pg.canvas, x0, Math.floor(seg.top), x1 - x0, Math.ceil(seg.bottom - seg.top))
            })
        figures.push(...question.context.snaps)
    }
    // Figures are kept whole, exactly as printed -- an answer table or a grid
    // of pictured choices included. The choices still get their own text or
    // crop above; the figure is never trimmed to make room for them.
    for (const band of bands) {
        figures.push(crop(band.pg.canvas, band.x0, band.a, band.x1 - band.x0, band.b - band.a))
    }

    // Unreliable text and nothing to show for it: the whole question region
    // is the honest fallback, flagged so the reviewer checks it.
    const unclear = options.length === 0 || (visualOptions && !optionCut)
    if (unclear && figures.length === 0) figures.push(...snaps)

    return {
        num: question.num,
        stem: stem.trim(),
        options,
        visualOptions,
        unclear,
        figures,
        snaps,
        pages: [...new Set(question.segs.map((seg) => seg.pg.num))],
    }
}

/** Text of every page, rebuilt into rows so "1 c 41 b" stays together. */
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

/**
 * Year, month and session read from a paper's file name and first page. The
 * file name wins: "2011S_IP_Questions" and "2011S_IP_Answers" name the same
 * exam, while the first page's prose ("marks", "you may") only looks like a
 * month. A month in the text counts only beside a year ("April 2011").
 */
export function examInfo(text, fileName) {
    const name = (fileName || "").replace(/\.pdf$/i, "").replace(/[_\-.]+/g, " ")
    const lower = name.toLowerCase()
    const body = (text || "").slice(0, 1500)
    const info = {}

    const year = name.match(/(?:19|20)\d{2}/) || body.match(/\b(?:19|20)\d{2}\b/)
    if (year) info.year = Number(year[0])

    // "2012Oct", "2015May" -- a month glued to the year in the file name.
    const nameMonth =
        lower.match(new RegExp(`(?:19|20)\\d{2}\\s*${MONTH_RE}(?![a-z])`)) || lower.match(new RegExp(`\\b${MONTH_RE}\\b`))
    // ITPEC file names: 2023A is the autumn (October) exam, 2023S spring (April).
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

/**
 * What a question paper and its answer key share in their file names:
 * "2011S_IP_Questions.pdf" and "2011S_IP_Answers.pdf" are both "2011s ip".
 */
export function paperStem(fileName) {
    return (fileName || "")
        .toLowerCase()
        .replace(/\.pdf$/, "")
        .replace(/[_\-.\s]+/g, " ")
        .replace(/\b(questions?|answers?|answer ?keys?|keys?|solutions?|am|pm|morning|afternoon)\b/g, " ")
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

/**
 * 0 when the details conflict; higher is a better match. The same file name
 * stem ("2011S_IP_Questions" / "2011S_IP_Answers") outranks any date.
 */
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

/**
 * The paper's source line, as the ITPEC licence asks for it:
 * (YearSeason, Category, Question number). Null when the paper cannot be
 * identified -- a citation that guesses is worse than none.
 */
export function citationFor(info, number) {
    if (!info?.year || !info?.month) return null
    const season = info.month === 10 ? "A" : info.month === 4 ? "S" : null
    const when = season ? `${info.year}${season}` : `${MONTH_NAMES[info.month - 1]} ${info.year}`
    return `(${[when, info.category, `Q${number}`].filter(Boolean).join(", ")})`
}

/**
 * An afternoon (PM) key: one row per blank -- "1 1 A g" (question 1,
 * subquestion 1, blank A, answer g), "B h" (next blank), "2 D a" (subquestion
 * 2), "4 A a" (question 4, no subquestions), "2 a" (subquestion 2 answered
 * directly). Ids are the ones the page reader gives the paper's blanks:
 * "1-1-A", "4-A", "3-2".
 *
 * A number before a blank is a new question when the blank is A -- blank
 * letters run on through a question's subquestions and restart only with the
 * next question -- and a subquestion otherwise. "b/f" (either accepted)
 * keeps its first letter.
 */
function pmAnswersFrom(texts) {
    const all = texts.join("\n")
    if (!/subquestion/i.test(all)) return null
    const answers = {}
    let question = null
    let sub = null
    for (const row of all.split("\n")) {
        const tokens = row.trim().split(/\s+/)
        const numbers = []
        while (tokens.length && /^\d{1,2}$/.test(tokens[0])) numbers.push(Number(tokens.shift()))
        const [first, second] = tokens
        const answerOf = (token) => (token && /^[a-z](\/[a-z])?$/.test(token) ? token[0] : null)

        if (first && /^[A-Z]$/.test(first) && answerOf(second)) {
            if (numbers.length >= 2) {
                ;[question, sub] = numbers
            } else if (numbers.length === 1) {
                if (first === "A" || question === null) {
                    question = numbers[0]
                    sub = null
                } else {
                    sub = numbers[0]
                }
            }
            if (question === null) continue
            answers[sub === null ? `${question}-${first}` : `${question}-${sub}-${first}`] = answerOf(second)
        } else if (numbers.length && answerOf(first)) {
            // A subquestion answered directly, with no blank.
            if (numbers.length >= 2) {
                ;[question, sub] = numbers
            } else if (question !== null) {
                sub = numbers[0]
            } else {
                continue
            }
            answers[`${question}-${sub}`] = answerOf(first)
        }
    }
    const count = Object.keys(answers).length
    return count >= 10 ? { answers, count } : null
}

function answersFrom(texts, fileName) {
    const pm = pmAnswersFrom(texts)
    if (pm) return pm
    const all = texts.join("\n")
    // What a question paper has and a key file does not: numbered questions
    // with words after the number (in any style -- "Q1.", "Question 1", "1.")
    // and lettered choices with words after the letter. A paper that ends in
    // an answer-key section has a key's number-letter pairs too, so the pairs
    // alone do not make a key.
    const questionLines =
        (all.match(/^\s*(?:Q\s?\d{1,3}\s?[.:)]|(?:Question|Item)\s+\d{1,3}\b|\d{1,3}\s?[.)]\s+[A-Za-z]{3,})/gim) || [])
            .length +
        (all.match(/^\s*\(?[a-hA-H][.)]\s+[A-Za-z]{3,}/gm) || []).length / 4
    const answers = {}
    const re = /(?:^|\s)(\d{1,3})\s*[.):-]?\s+\(?([a-dA-D])\)?(?=\s|$)/g
    let match
    while ((match = re.exec(all))) {
        const number = Number(match[1])
        if (number > 0 && number <= 200 && !answers[number]) answers[number] = match[2].toLowerCase()
    }
    const count = Object.keys(answers).length
    const looksLikeKey = /answer/i.test(all + " " + (fileName || "")) || count >= 20
    if (count < 10 || questionLines > count / 4 || !looksLikeKey) return null
    return { answers, count }
}

/**
 * Reads one PDF: an answer key or a question paper, whichever it is.
 *
 * Resolves to `{ kind: "key", name, info, answers, count }` or
 * `{ kind: "paper", name, info, questions }`. Throws with a readable message
 * when the file is neither.
 */
/**
 * The figures on a whole page: clusters of non-text ink, grown over the short
 * label lines that touch them, each spanning the page's text width. What a
 * page reader is shown and picks from -- it says which question a figure
 * belongs to, and the crop is taken here, exactly.
 *
 * A page with no text layer (a scan) has no text to mask, so every line of
 * print would count as ink: no candidates are offered for it.
 */
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

/** A page as a JPEG, about 1100px wide, base64 without its data: prefix. */
function pageJpeg(pg) {
    const scale = Math.min(1, 1100 / pg.W)
    const canvas = makeCanvas(pg.W * scale, pg.H * scale)
    canvas.getContext("2d").drawImage(pg.canvas, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.82).split(",")[1]
}

/** Where on the page question `label`'s heading ("Q1.") is printed, if it is. */
function headingTop(pg, label) {
    const line = pg.lines.find((l) => {
        const match = l.text.match(QUESTION_RE)
        return match && match[1] === String(label)
    })
    return line ? line.top : null
}

/**
 * Reads a document page by page with the vision page reader (`readPage`, a
 * call to the backend), for documents the fixed-layout reader does not know.
 *
 * Questions split across a page break are joined. Blanks of one passage
 * question ("1-2-C") share their passage: each carries the pages from the
 * question's heading to its last blank, as printed, as its figure -- the
 * passage, its figures and the answer group all read in place.
 */
async function readWithAi(pages, readPage, onProgress) {
    const questions = []
    const answers = {}
    const byId = new Map()
    let previousId = null

    for (const pg of pages) {
        const figures = pageFigures(pg)
        const openIds = questions.filter((q) => !q.options.length).slice(-30).map((q) => q.num)
        // Said before the call, not after: a page with the AI takes seconds
        // to a minute, and "Opening ... page 1 of 1" read as stuck.
        if (onProgress) await onProgress(pg.num, pages.length, "ai")
        const result = await readPage({
            image: pageJpeg(pg),
            text: pg.lines.map((line) => line.text).join("\n"),
            figures: figures.map((f) => ({ id: f.id, top: f.a / pg.H, bottom: f.b / pg.H })),
            previousId,
            openIds,
        })
        Object.assign(answers, result.answers || {})

        const figureCanvas = (id) => {
            const figure = figures.find((f) => f.id === id)
            return figure ? crop(pg.canvas, figure.x0, figure.a, figure.x1 - figure.x0, figure.b - figure.a) : null
        }
        for (const item of result.questions || []) {
            const options = item.options.map((option) => ({
                key: option.key,
                text: option.text,
                image: option.figureId ? figureCanvas(option.figureId) : null,
                fromTable: false,
            }))
            const own = item.figureIds.map(figureCanvas).filter(Boolean)
            // Joined by id, not only across one page break: a passage's
            // blanks are often printed a page before their answer group.
            const earlier = byId.get(item.id)
            if (earlier && (item.continuesFromPreviousPage || !earlier.options.length)) {
                if (item.stem && !earlier.stem.includes(item.stem)) {
                    earlier.stem = [earlier.stem, item.stem].filter(Boolean).join("\n")
                }
                if (!earlier.options.length && options.length) {
                    earlier.options = options
                    earlier.visualOptions = options.some((o) => !o.text)
                }
                earlier.figures.push(...own)
                if (!earlier.pages.includes(pg.num)) earlier.pages.push(pg.num)
                earlier.unclear = (earlier.unclear || item.unclear) && !earlier.options.length
                if (item.answer) earlier.answer = item.answer
                continue
            }
            const entry = {
                num: item.id,
                parent: item.id.includes("-") ? item.id.split("-")[0] : null,
                stem: item.stem,
                options,
                figures: own,
                snaps: [],
                pages: [pg.num],
                answer: item.answer,
                unclear: item.unclear || (!pg.items.length && own.length === 0),
                visualOptions: options.some((o) => !o.text),
                aiRead: true,
            }
            byId.set(item.id, entry)
            questions.push(entry)
        }
        if (questions.length) previousId = questions[questions.length - 1].num
        if (onProgress) await onProgress(pg.num, pages.length, "ai")
    }

    // Each blank's passage: from its question's heading to its last blank.
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
            blank.figures = context
            blank.snaps = context
            blank.contextPages = [firstPage, lastPage]
        }
    }
    for (const question of questions) {
        // A plain question's "original" is its page.
        if (!question.snaps.length) question.snaps = question.pages.map((n) => pages[n - 1].canvas)
        if (!question.answer && answers[question.num]) question.answer = answers[question.num]
    }
    return { questions, answers }
}

/**
 * The layout reader's questions with their figures cropped from this
 * browser's own page render -- pdf.js 3.11 draws the papers' fax-encoded
 * labels, which a server-side crop would not guarantee.
 */
function fromLayout(layout, pages) {
    const cropBox = (ref, pad = 6) => {
        const pg = pages[ref.page - 1]
        if (!pg) return null
        const [left, top, right, bottom] = ref.box
        const x0 = Math.max(0, Math.floor(left * pg.W) - pad)
        const y0 = Math.max(0, Math.floor(top * pg.H) - pad)
        const x1 = Math.min(pg.W, Math.ceil(right * pg.W) + pad)
        const y1 = Math.min(pg.H, Math.ceil(bottom * pg.H) + pad)
        return x1 - x0 < 4 || y1 - y0 < 4 ? null : crop(pg.canvas, x0, y0, x1 - x0, y1 - y0)
    }
    const region = (area) => {
        const pg = pages[area.page - 1]
        if (!pg) return null
        const x0 = Math.max(0, Math.floor(pg.minX - 16))
        const x1 = Math.min(pg.W, Math.ceil(pg.maxX + 16))
        const y0 = Math.max(0, Math.floor(area.top * pg.H) - 10)
        const y1 = Math.min(pg.H, Math.ceil(area.bottom * pg.H) + 10)
        return y1 - y0 < 4 ? null : crop(pg.canvas, x0, y0, x1 - x0, y1 - y0)
    }
    return (layout.questions || []).map((question) => {
        const options = question.options.map((option) => ({
            key: option.key,
            text: option.text,
            image: option.figure ? cropBox(option.figure) : null,
            fromTable: false,
        }))
        return {
            num: question.num,
            stem: question.stem,
            options,
            figures: question.figures.map((ref) => cropBox(ref)).filter(Boolean),
            snaps: (question.regions || []).map(region).filter(Boolean),
            pages: question.pages,
            answer: question.answer,
            unclear: question.issues.length > 0,
            issues: question.issues,
            visualOptions: options.some((o) => !o.text),
        }
    })
}

/**
 * Reads one PDF: an answer key or a question paper, whichever it is, in
 * whatever layout it is printed.
 *
 * Three readers, cheapest first:
 *   1. the built-in ITPEC reader (Q1. ... a) to d)) -- instant, exact;
 *   2. `readLayout`, the server's layout reader -- any numbering and choice
 *      style, two columns, inline answers or an answer-key section, scans --
 *      no generative model;
 *   3. `readPage`, the vision AI page reader, only when both fall short.
 *
 * Resolves to `{ kind: "key", name, info, answers, count }` or
 * `{ kind: "paper", name, info, questions, readBy, profile? }`.
 */
export async function readExamPdf(file, onProgress, readPage, readLayout) {
    const pdfjs = await loadPdfJs()
    const data = new Uint8Array(await file.arrayBuffer())
    const task = pdfjs.getDocument({ data, isEvalSupported: false })
    const pdf = await task.promise
    try {
        const texts = await pageTexts(pdf)
        const info = examInfo(texts[0] || "", file.name)
        const key = answersFrom(texts, file.name)
        if (key) return { kind: "key", name: file.name, info, ...key }

        const pages = await readPages(pdf, pdfjs, onProgress)
        const ruled = info.session === "pm" ? [] : locateQuestions(pages).map(buildQuestion)
        const fourChoice = ruled.filter((q) => q.options.length === 4).length
        if (ruled.length >= 5 && fourChoice >= ruled.length * 0.8) {
            return { kind: "paper", name: file.name, info, questions: ruled, readBy: "rules" }
        }

        let layoutProblem = null
        if (readLayout && info.session !== "pm") {
            if (onProgress) await onProgress(0, pages.length, "layout")
            try {
                const layout = await readLayout(file)
                if (layout.total >= 3 && layout.complete >= layout.total * 0.6) {
                    return {
                        kind: "paper",
                        name: file.name,
                        info,
                        questions: fromLayout(layout, pages),
                        readBy: "layout",
                        profile: layout.profile,
                    }
                }
                if (!layout.total && Object.keys(layout.answers || {}).length >= 10) {
                    const answers = layout.answers
                    return { kind: "key", name: file.name, info, answers, count: Object.keys(answers).length }
                }
                layoutProblem = layout.total
                    ? `the layout reader read only ${layout.complete} of ${layout.total} questions completely`
                    : "the layout reader found no questions"
            } catch (error) {
                layoutProblem = error?.response?.data?.message || error?.message || "the layout reader failed"
            }
        }

        if (!readPage) {
            throw new Error(layoutProblem || "its layout is not one the built-in reader knows")
        }
        const read = await readWithAi(pages, readPage, onProgress)
        const answerCount = Object.keys(read.answers).length
        if (!read.questions.length && answerCount) {
            return { kind: "key", name: file.name, info, answers: read.answers, count: answerCount }
        }
        if (!read.questions.length) throw new Error(layoutProblem ? `${layoutProblem}, and the AI found none either` : "no questions were found in it")
        return { kind: "paper", name: file.name, info, questions: read.questions, readBy: "ai" }
    } finally {
        task.destroy()
    }
}

/**
 * A cropped canvas as an image File. PNG keeps small figures sharp; a tall
 * stack of whole pages (a passage question's context) goes as JPEG, or it
 * would not fit the 5 MB image limit.
 */
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

/** Several crops stacked into one image -- a question stores a single figure. */
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
