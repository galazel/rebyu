
const SCALE = 2

const GARBLED_RE = /[□�-]/

function isGarbledMathLine(text) {
    if (!GARBLED_RE.test(text)) return false
    const tokens = text.split(/\s+/).filter(Boolean)
    return tokens.length >= 3 && tokens.every((token) => token.length <= 2)
}

const FOOTER_RE = /^(?:[–—-]\s*)?(?:page\s*)?\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?(?:\s*[–—-])?$/i

function isPageNumber(line, pageHeight) {
    return FOOTER_RE.test(line.text) && (line.bottom < pageHeight * 0.12 || line.top > pageHeight * 0.88)
}

const QUESTION_RE = /^Q\s?(\d{1,3})\s?[.:)]\s*/
const BARE_QUESTION_RE = /^Q\s?(\d{1,3})(?=\s|$)\s*/

const BANNER_RE = /^Answer (?:the )?questions? (?:Q?\d+|[A-Z]) through (?:Q?\d+|[A-Z])\b/i

const CASE_RE = /^Question [A-Z]\b/

const MARKER_RE = /^\(?([a-h1-8])[).]$/

const TEXT_CHOICE_RE = /^\(?[a-h1-8][).]\s+\S/

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
        if (onProgress) await onProgress(number, pdf.numPages)
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

function locateQuestions(pages) {
    let questions = []
    let current = null
    let lastNumber = 0

    let context = null
    const contexts = []

    for (const pg of pages) {
        pg.stops = []
        for (const line of pg.lines) {
            if (BANNER_RE.test(line.text)) {
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
            let match = line.text.match(QUESTION_RE)
            let pattern = QUESTION_RE
            const bare = !match && line.text.match(BARE_QUESTION_RE)
            const range = bare && /^(through|to|and|or|[–~-]|Q\s?\d)/i.test(line.text.slice(bare[0].length))
            if (bare && !range && Number(bare[1]) === lastNumber + 1) {
                match = bare
                pattern = BARE_QUESTION_RE
            }
            if (match && line.x0 < pg.minX + pg.W * 0.12) {
                const number = Number(match[1])
                if (number <= lastNumber) questions = []
                lastNumber = number
                line.stripped = line.text.replace(pattern, "")
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

const HIDDEN_INK_MIN = 30

function hiddenInk(pg, x0, y0, x1, y1) {
    const x = Math.max(0, Math.floor(x0))
    const y = Math.max(0, Math.floor(y0))
    const w = Math.min(pg.W, Math.ceil(x1)) - x
    const h = Math.min(pg.H, Math.ceil(y1)) - y
    if (w <= 0 || h <= 0) return 0
    const data = pg.canvas.getContext("2d", { willReadFrequently: true }).getImageData(x, y, w, h).data
    const covered = new Uint8Array(w * h)
    const pad = 3
    for (const item of pg.items) {
        if (!item.str.trim() || GARBLED_RE.test(item.str)) continue
        const xa = Math.max(0, Math.floor(item.x - pad - x))
        const xb = Math.min(w, Math.ceil(item.x + item.w + pad - x))
        const ya = Math.max(0, Math.floor(item.y0 - pad - y))
        const yb = Math.min(h, Math.ceil(item.y1 + pad - y))
        for (let row = ya; row < yb; row++) covered.fill(1, row * w + xa, row * w + xb)
    }
    let count = 0
    for (let i = 0; i < w * h; i++) {
        if (!covered[i] && isDark(data, i * 4)) count++
    }
    return count
}

function formulaLines(lines) {
    const flagged = new Set()
    lines.forEach((line, index) => {
        const pg = line.pg
        if (GARBLED_RE.test(line.text) || hiddenInk(pg, line.x0 - 2, line.top, line.x1 + 2, line.bottom) >= HIDDEN_INK_MIN) {
            flagged.add(line)
        }
        const below = lines[index + 1]
        const height = line.bottom - line.top
        if (below && below.pg === pg && below.top - line.bottom < height * 1.2 && below.top > line.bottom) {
            const x0 = Math.min(line.x0, below.x0) - 2
            const x1 = Math.max(line.x1, below.x1) + 2
            if (hiddenInk(pg, x0, line.bottom, x1, below.top) >= HIDDEN_INK_MIN) {
                flagged.add(line)
                flagged.add(below)
            }
        }
    })
    return flagged
}

function formulaCrops(lines, flagged) {
    const crops = []
    let run = []
    const flush = () => {
        if (!run.length) return
        const pg = run[0].pg
        const x0 = Math.max(0, Math.floor(pg.minX - 8))
        const x1 = Math.min(pg.W, Math.ceil(pg.maxX + 8))
        const y0 = Math.max(0, Math.floor(Math.min(...run.map((l) => l.top)) - 8))
        const y1 = Math.min(pg.H, Math.ceil(Math.max(...run.map((l) => l.bottom)) + 8))
        if (y1 - y0 > 4) crops.push(crop(pg.canvas, x0, y0, x1 - x0, y1 - y0))
        run = []
    }
    for (const line of lines) {
        if (flagged.has(line) && (!run.length || run[run.length - 1].pg === line.pg)) run.push(line)
        else {
            flush()
            if (flagged.has(line)) run.push(line)
        }
    }
    flush()
    return crops
}

function readableText(text) {
    return (text || "").replace(/[�-]/g, " ").replace(/[ \t]{2,}/g, " ").trim()
}

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

function cropOptions(question, keys) {
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
    const occupied = (y) =>
        pg.rowInk[Math.round(y)] > 1 || pg.items.some((item) => !item.sideways && item.y0 <= y && item.y1 >= y)
    const rowEnd = (marker) => {
        const later = rows.filter((start) => start > marker.y0 + 8)
        if (!later.length) return bottom
        const nextStart = Math.min(...later)
        let best = null
        let run = null
        for (let y = Math.ceil(marker.y1); y < nextStart; y++) {
            if (occupied(y)) {
                run = null
                continue
            }
            run = run ? { a: run.a, b: y } : { a: y, b: y }
            if (!best || run.b - run.a > best.b - best.a) best = { ...run }
        }
        return best && best.b - best.a >= 2 ? Math.round((best.a + best.b) / 2) : nextStart - 6
    }
    const cellOf = (marker) => ({
        x0: marker.x0 - 6,
        y0: marker.y0 - 6,
        x1: next(columns, marker.x0, right),
        y1: rowEnd(marker),
    })
    const top = Math.min(...found.map((m) => m.y0)) - 6

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

    const texts = question.lines.map((line, index) => ({
        t: index === 0 ? line.stripped : line.text,
        line,
        fig: index > 0 && inBand(line),
    }))
    const optionStart = texts.findIndex((entry) => /^\(?(?:a|1)[).](\s|$)/.test(entry.t))
    const stemPart = optionStart === -1 ? texts : texts.slice(0, optionStart)
    const optionPart = optionStart === -1 ? [] : texts.slice(optionStart)

    const stemLines = stemPart.filter((entry) => !entry.fig && entry.t).map((entry) => entry.line)
    while (optionStart > 0 && stemLines.length && isGarbledMathLine(stemLines[stemLines.length - 1].text)) stemLines.pop()
    const stemFormulas = formulaCrops(stemLines, formulaLines(stemLines))
    const optionLines = optionPart.filter((entry) => !entry.fig && entry.t).map((entry) => entry.line)
    const drawnOptions = formulaLines(optionLines).size > 0

    let stem = ""
    let previous = null
    for (const entry of stemPart) {
        if (entry.fig || !entry.t || isGarbledMathLine(entry.t)) {
            previous = null
            continue
        }
        stem += stem ? (previous && previous.line.wraps ? " " : "\n") + entry.t : entry.t
        previous = entry
    }

    const optionText = optionPart
        .map((entry) => (entry.fig ? (entry.t.match(/\(?[a-h1-8][).]/g) || []).join(" ") : entry.t))
        .join("\n")
    const markerRe = /(?:^|\s)\(?([a-h1-8])[).](?=\s|$)/g
    const marks = []
    let match
    while ((match = markerRe.exec(optionText))) {
        marks.push({ key: match[1], at: match.index + match[0].length, start: match.index })
    }
    const buildSequence = (first, nextFn) => {
        const seq = []
        let want = first
        for (const mark of marks) {
            if (mark.key === want) {
                seq.push(mark)
                want = nextFn(want)
            }
        }
        return seq
    }
    let sequence = buildSequence("a", (ch) => String.fromCharCode(ch.charCodeAt(0) + 1))
    if (sequence.length < 2) {
        const numSeq = buildSequence("1", (n) => String(Number(n) + 1))
        if (numSeq.length > sequence.length) sequence = numSeq
    }
    const options = sequence.map((mark, index) => ({
        key: mark.key,
        text: optionText
            .slice(mark.at, index + 1 < sequence.length ? sequence[index + 1].start : optionText.length)
            .replace(/\s+/g, " ")
            .trim(),
        image: null,
    }))
    const garbled = options.some((option) => GARBLED_RE.test(option.text))
    const visualOptions = options.length > 0 && (garbled || drawnOptions || options.some((option) => !option.text))

    let optionCut = null
    if (visualOptions) {
        optionCut = cropOptions(question, options.map((option) => option.key))
        if (optionCut?.table && !garbled) {
            for (const option of options) {
                option.text = optionCut.texts[option.key]
                option.fromTable = true
            }
        } else if (optionCut?.crops) {
            for (const option of options) {
                option.image = optionCut.crops[option.key]
                if (option.image) option.text = ""
            }
        }
    }

    for (const option of options) if (!option.image) option.text = readableText(option.text)

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
    for (const band of bands) {
        let bottom = band.b
        if (optionCut && optionCut.pg === band.pg && band.a >= optionCut.top - 30) continue
        if (optionCut && optionCut.pg === band.pg && optionCut.top > band.a && optionCut.top < band.b) {
            bottom = Math.max(band.a, Math.floor(optionCut.top))
            if (bottom - band.a < 24) continue
        }
        figures.push(crop(band.pg.canvas, band.x0, band.a, band.x1 - band.x0, bottom - band.a))
    }
    figures.push(...stemFormulas)

    const unclear = options.length === 0 || (visualOptions && !optionCut)
    if (unclear && figures.length === 0) figures.push(...snaps)

    return {
        num: question.num,
        stem: readableText(stem),
        options,
        visualOptions,
        unclear,
        figures,
        snaps,
        pages: [...new Set(question.segs.map((seg) => seg.pg.num))],
    }
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
    texts = texts.map((text) => text.normalize("NFKC"))
    const pm = pmAnswersFrom(texts)
    if (pm) return pm
    const all = texts.join("\n")
    const questionLines =
        (all.match(/^\s*(?:Q\s?\d{1,3}\s?[.:)]|(?:Question|Item)\s+\d{1,3}\b|\d{1,3}\s?[.)]\s+[A-Za-z]{3,})/gim) || [])
            .length +
        (all.match(/^\s*\(?[a-hA-H][.)]\s+[A-Za-z]{3,}/gm) || []).length / 4
    const answers = {}
    const re = /(?:^|\s)(?:[A-Z]{1,2}(?=\d))?0*(\d{1,3})\s*[.):-]?\s+\(?([a-hA-H1-8])\)?(?=\s|$)/g
    let match
    while ((match = re.exec(all))) {
        const number = Number(match[1])
        const raw = match[2]
        if (number > 0 && number <= 200 && !answers[number]) answers[number] = /\d/.test(raw) ? raw : raw.toLowerCase()
    }
    const count = Object.keys(answers).length
    const looksLikeKey = /answer/i.test(all + " " + (fileName || "")) || count >= 20
    if (count < 10 || questionLines > count / 4 || !looksLikeKey) return null
    return { answers, count }
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
        if (!question.snaps.length) question.snaps = question.pages.map((n) => pages[n - 1].canvas)
        if (!question.answer && answers[question.num]) question.answer = answers[question.num]
    }
    return { questions, answers }
}

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
