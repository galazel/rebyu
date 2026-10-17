// The AI tutor's mind map, drawn as a radial SVG: the topic in the middle,
// branches around it on curved coloured links, ideas fanned out beyond each
// branch. Hover a branch to focus it, click it to fold, click an idea for its
// note, and open it full screen like a lesson figure.
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Brain, Maximize, X } from "@/components/icons"

const PALETTE = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0d9488", "#ea580c"]
const FONT = 13
const CHAR = 7.1
const LINE = 17

function wrap(label, max) {
  const words = String(label).split(/\s+/)
  const lines = []
  let line = ""
  for (const word of words) {
    if (line && (line + " " + word).length > max) { lines.push(line); line = word } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function box(label, max, padX, padY) {
  const lines = wrap(label, max)
  const width = Math.max(...lines.map((l) => l.length)) * CHAR + padX * 2
  return { lines, width, height: lines.length * LINE + padY * 2 }
}

/** Fixed positions for every node; folding only hides ideas, so nothing jumps.
 *  Branches stack on the right (and, with `sides` 2, alternately on the left);
 *  each branch's ideas are listed beside it, so nothing can overlap. */
function layout(data, sides) {
  const center = { x: 0, y: 0, ...box(data.center, 14, 18, 12) }
  const GAP_BRANCH = 70
  const GAP_CHILD = 46
  const ROW = 10
  const BLOCK = 22
  const columns = [[], []]
  const branches = data.branches.map((branch, i) => {
    const color = PALETTE[i % PALETTE.length]
    const side = sides === 2 && i % 2 === 1 ? -1 : 1
    const node = { ...branch, color, side, ...box(branch.label, 16, 14, 9) }
    node.children = branch.children.map((child) => ({ ...child, color, ...box(child.label, 24, 11, 6) }))
    const kids = node.children.reduce((sum, c) => sum + c.height, 0) + Math.max(0, node.children.length - 1) * ROW
    node.block = Math.max(node.height, kids)
    columns[side === 1 ? 0 : 1].push(node)
    return node
  })
  for (const column of columns) {
    const total = column.reduce((sum, b) => sum + b.block, 0) + Math.max(0, column.length - 1) * BLOCK
    let top = -total / 2
    for (const b of column) {
      b.y = top + b.block / 2
      b.x = b.side * (center.width / 2 + GAP_BRANCH + b.width / 2)
      const edge = b.x + b.side * (b.width / 2 + GAP_CHILD)
      const kids = b.children.reduce((sum, c) => sum + c.height, 0) + Math.max(0, b.children.length - 1) * ROW
      let y = b.y - kids / 2
      for (const c of b.children) {
        c.y = y + c.height / 2
        c.x = edge + b.side * (c.width / 2)
        y += c.height + ROW
      }
      top += b.block + BLOCK
    }
  }
  const all = [center, ...branches, ...branches.flatMap((b) => b.children)]
  const pad = 14
  const minX = Math.min(...all.map((d) => d.x - d.width / 2)) - pad
  const maxX = Math.max(...all.map((d) => d.x + d.width / 2)) + pad
  const minY = Math.min(...all.map((d) => d.y - d.height / 2)) - pad
  const maxY = Math.max(...all.map((d) => d.y + d.height / 2)) + pad
  return { center, branches, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` }
}

/** A link leaves the side of one box and enters the side of the next. */
function link(from, to) {
  const dir = Math.sign(to.x - from.x) || 1
  return curve({ x: from.x + dir * from.width / 2, y: from.y }, { x: to.x - dir * to.width / 2, y: to.y })
}

function curve(from, to) {
  const mx = (from.x + to.x) / 2
  return `M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`
}

function Label({ node, color, weight = 700 }) {
  const top = node.y - ((node.lines.length - 1) * LINE) / 2
  return (
      <text textAnchor="middle" fontSize={FONT} fontWeight={weight} fill={color} style={{ pointerEvents: "none" }}>
        {node.lines.map((line, i) => <tspan key={i} x={node.x} y={top + i * LINE} dominantBaseline="central">{line}</tspan>)}
      </text>
  )
}

function MindMapSvg({ map, folded, onFold, focus, onFocus, selected, onSelect, className }) {
  const pick = (key, node) => node.note && onSelect(selected?.key === key ? null : { key, ...node })
  const press = (handler) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler() } }
  return (
      <svg viewBox={map.viewBox} className={className} role="img" aria-label={`Mind map of ${map.center.lines.join(" ")}`}
           style={{ fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif" }}>
        <defs>
          <filter id="rb-mm-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
        </defs>

        {map.branches.map((b, i) => {
          const dim = focus != null && focus !== i
          return (
              <g key={`links-${i}`} style={{ opacity: dim ? 0.15 : 1, transition: "opacity .25s" }}>
                <path d={link(map.center, b)} fill="none" stroke={b.color} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />
                {!folded.has(i) && b.children.map((c, j) => (
                    <path key={j} d={link(b, c)} fill="none" stroke={b.color} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
                ))}
              </g>
          )
        })}

        {map.branches.map((b, i) => {
          const dim = focus != null && focus !== i
          const isFolded = folded.has(i)
          return (
              <g key={`nodes-${i}`} style={{ opacity: dim ? 0.2 : 1, transition: "opacity .25s" }}
                 onMouseEnter={() => onFocus(i)} onMouseLeave={() => onFocus(null)}>
                {!isFolded && b.children.map((c, j) => {
                  const key = `${i}-${j}`
                  const active = selected?.key === key
                  return (
                      <g key={j} role="button" tabIndex={0} aria-label={c.label + (c.note ? " (has a note)" : "")}
                         onClick={() => pick(key, c)} onKeyDown={press(() => pick(key, c))}
                         style={{ cursor: c.note ? "pointer" : "default", outline: "none" }}>
                        <rect x={c.x - c.width / 2} y={c.y - c.height / 2} width={c.width} height={c.height} rx={c.height / 2}
                              fill={active ? b.color : "#ffffff"} stroke={b.color} strokeWidth={1.6} filter="url(#rb-mm-shadow)" />
                        <Label node={c} color={active ? "#ffffff" : "#1f2937"} weight={600} />
                        {c.note ? <circle cx={c.x + c.width / 2 - 2} cy={c.y - c.height / 2 + 2} r={3.5} fill={b.color} /> : null}
                      </g>
                  )
                })}
                <g role="button" tabIndex={0} aria-expanded={!isFolded}
                   aria-label={`${b.label}: ${isFolded ? "show" : "hide"} ${b.children.length} ideas`}
                   onClick={() => { onFold(i); pick(`b${i}`, b) }} onKeyDown={press(() => onFold(i))}
                   style={{ cursor: "pointer", outline: "none" }}>
                  <rect x={b.x - b.width / 2} y={b.y - b.height / 2} width={b.width} height={b.height} rx={12}
                        fill={b.color} filter="url(#rb-mm-shadow)" />
                  <Label node={b} color="#ffffff" weight={800} />
                  {isFolded && b.children.length ? (
                      <g>
                        <circle cx={b.x + b.width / 2} cy={b.y - b.height / 2} r={10} fill="#ffffff" stroke={b.color} strokeWidth={2} />
                        <text x={b.x + b.width / 2} y={b.y - b.height / 2} textAnchor="middle" dominantBaseline="central"
                              fontSize={10} fontWeight={800} fill={b.color}>+{b.children.length}</text>
                      </g>
                  ) : null}
                </g>
              </g>
          )
        })}

        <g>
          <rect x={map.center.x - map.center.width / 2} y={map.center.y - map.center.height / 2}
                width={map.center.width} height={map.center.height} rx={16} fill="#1f2937" filter="url(#rb-mm-shadow)" />
          <Label node={map.center} color="#ffffff" weight={800} />
        </g>
      </svg>
  )
}

function useWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])
  return [setNode, width]
}

export function MindMap({ data, header }) {
  const [measure, width] = useWidth()
  const safe = useMemo(() => ({ ...data, branches: data.branches ?? [] }), [data])
  const map = useMemo(() => layout(safe, width >= 640 ? 2 : 1), [safe, width])
  const wide = useMemo(() => layout(safe, 2), [safe])
  const [folded, setFolded] = useState(() => new Set())
  const [focus, setFocus] = useState(null)
  const [selected, setSelected] = useState(null)
  const [full, setFull] = useState(false)
  const fold = (i) => setFolded((s) => { const next = new Set(s); next.has(i) ? next.delete(i) : next.add(i); return next })

  useEffect(() => {
    if (!full) return
    const onKey = (e) => e.key === "Escape" && setFull(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [full])

  const svgProps = { map, folded, onFold: fold, focus, onFocus: setFocus, selected, onSelect: setSelected }
  const toolbar = (
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setFolded(new Set())} className="rounded-lg px-2 py-1 text-xs font-bold text-rb-hare hover:bg-rb-polar">Expand all</button>
        <button type="button" onClick={() => setFolded(new Set(map.branches.map((_, i) => i)))} className="rounded-lg px-2 py-1 text-xs font-bold text-rb-hare hover:bg-rb-polar">Collapse all</button>
      </div>
  )
  const note = selected ? (
      <div className="mt-2 flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm" style={{ borderColor: selected.color }}>
        <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: selected.color }} />
        <p className="min-w-0 flex-1 text-rb-eel"><strong>{selected.label}.</strong> {selected.note}</p>
        <button type="button" aria-label="Close note" onClick={() => setSelected(null)} className="text-rb-hare"><X className="size-3.5" /></button>
      </div>
  ) : null

  return (
      <section className="my-3 w-full overflow-hidden rounded-2xl border-2 border-rb-swan bg-white">
        <header className="flex items-center gap-2 border-b-2 border-rb-swan bg-rb-polar/60 px-4 py-2.5">
          <Brain className="size-4 text-rb-feather" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-rb-feather-lip">Mind map</span>
          <span className="ml-auto flex items-center gap-2">
            {header}
            <button type="button" onClick={() => setFull(true)} aria-label="Open full screen"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold text-rb-hare hover:bg-white">
              <Maximize className="size-3" /> Expand
            </button>
          </span>
        </header>
        <div className="p-3" ref={measure}>
          <button type="button" onClick={() => setFull(true)} className="sr-only">Open the mind map full screen</button>
          <MindMapSvg {...svgProps} className="h-auto w-full" />
          {note}
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-rb-hare">Click a branch to fold it · click an idea with a dot for its note</p>
            {toolbar}
          </div>
        </div>

        {full ? createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setFull(false)}>
              <div className="flex max-h-full w-full max-w-6xl flex-col rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 flex items-center gap-3">
                  <p className="text-lg font-extrabold text-rb-eel">{data.center}</p>
                  <span className="ml-auto">{toolbar}</span>
                  <button type="button" onClick={() => setFull(false)} className="rounded-full bg-rb-polar px-3 py-1 text-sm font-extrabold text-rb-eel">close</button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <MindMapSvg {...svgProps} map={wide} className="mx-auto h-[75vh] w-full" />
                </div>
                {note}
              </div>
            </div>,
            document.body,
        ) : null}
      </section>
  )
}
