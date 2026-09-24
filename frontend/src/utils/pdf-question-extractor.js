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

/** Year, month and session read from a paper's first page and file name. */
export function examInfo(text, fileName) {
    const source = (fileName || "").replace(/[_\-.]+/g, " ") + " " + (text || "").slice(0, 1500)
    const info = {}
    const year = source.match(/\b(?:19|20)\d{2}/)
    if (year) info.year = Number(year[0])
    const month = source.toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/)
    if (month) {
        info.month = MONTHS.indexOf(month[1]) + 1
    } else {
        // ITPEC file names: 2023A is the autumn (October) exam, 2023S spring (April).
        const season = source.match(/\b(?:19|20)\d{2}([AS])\b/)
        if (season) info.month = season[1] === "A" ? 10 : 4
    }
    if (/\bAM\b|morning/i.test(source)) info.session = "am"
    else if (/\bPM\b|afternoon/i.test(source)) info.session = "pm"
    if (/\bFE\b|fundamental/i.test(source)) info.category = "FE"
    else if (/\bIP\b|IT Passport/i.test(source)) info.category = "IP"
    return info
}

export function describeExam(info) {
    const parts = []
    if (info?.month) parts.push(MONTH_NAMES[info.month - 1])
    if (info?.year) parts.push(info.year)
    if (info?.session) parts.push(info.session === "am" ? "morning" : "afternoon")
    return parts.join(" ")
}

/** 0 when the details conflict; higher is a better match. */
export function matchScore(a, b) {
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

function answersFrom(texts, fileName) {
    const all = texts.join("\n")
    const questionLines = (all.match(/^\s*Q\s?\d{1,3}\s?[.:)]/gm) || []).length
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
export async function readExamPdf(file, onProgress) {
    const pdfjs = await loadPdfJs()
    const data = new Uint8Array(await file.arrayBuffer())
    const task = pdfjs.getDocument({ data, isEvalSupported: false })
    const pdf = await task.promise
    try {
        const texts = await pageTexts(pdf)
        const info = examInfo(texts[0] || "", file.name)
        const key = answersFrom(texts, file.name)
        if (key) return { kind: "key", name: file.name, info, ...key }

        if (info.session === "pm") {
            // FE afternoon papers are a different shape: a handful of long
            // questions, each with sub-questions and answer groups of up to
            // ten options. Read as a-d questions they come out wrong.
            throw new Error("it is an afternoon (PM) paper. Only multiple-choice morning papers can be imported")
        }
        if (!texts.join("").trim()) {
            throw new Error("it has no text layer (a scanned paper), so its questions cannot be read")
        }
        const pages = await readPages(pdf, pdfjs, onProgress)
        const questions = locateQuestions(pages).map(buildQuestion)
        if (!questions.length) {
            throw new Error("no questions were found. The reader looks for lines that start with Q1., Q2. and so on")
        }
        return { kind: "paper", name: file.name, info, questions }
    } finally {
        task.destroy()
    }
}

/** A cropped canvas as a PNG File, ready for the builder's image fields. */
export function canvasToFile(canvas, name) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], name, { type: "image/png" }))
            else reject(new Error("The figure could not be saved as an image."))
        }, "image/png")
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
