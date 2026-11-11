import { useMemo } from "react"
import { Database } from "@/components/icons"

/*
 * A SQL question gives the learner tables with their data, written as a script of
 * CREATE TABLE and INSERT statements. Nothing is run in the browser: the script is read
 * into { name, columns, rows } and shown as tables. Anything the reader does not
 * understand falls back to showing the script itself, so no data is ever hidden.
 */

function tokenize(sql) {
  const tokens = []
  let i = 0
  while (i < sql.length) {
    const c = sql[i]
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++
      continue
    }
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2)
      i = end < 0 ? sql.length : end + 2
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === "'") {
      let value = ""
      i++
      while (i < sql.length) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            value += "'"
            i += 2
            continue
          }
          i++
          break
        }
        value += sql[i++]
      }
      tokens.push({ type: "string", value })
      continue
    }
    if (c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c
      const end = sql.indexOf(close, i + 1)
      tokens.push({ type: "word", value: sql.slice(i + 1, end < 0 ? sql.length : end) })
      i = end < 0 ? sql.length : end + 1
      continue
    }
    if ("(),;".includes(c)) {
      tokens.push({ type: c })
      i++
      continue
    }
    let j = i
    while (j < sql.length && !/[\s(),;'"`[]/.test(sql[j])) j++
    if (j === i) j++
    tokens.push({ type: "word", value: sql.slice(i, j) })
    i = j
  }
  return tokens
}

const CONSTRAINT_WORDS = new Set(["PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "CONSTRAINT"])

/** Splits a parenthesised list at top-level commas; returns [items, indexAfterClose]. */
function readGroup(tokens, start) {
  const items = []
  let current = []
  let depth = 0
  let i = start + 1
  for (; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === "(") depth++
    if (t.type === ")") {
      if (depth === 0) break
      depth--
    }
    if (t.type === "," && depth === 0) {
      items.push(current)
      current = []
      continue
    }
    current.push(t)
  }
  items.push(current)
  return [items, i + 1]
}

function cellValue(item) {
  if (item.length === 0) return ""
  if (item.length === 1) {
    const t = item[0]
    if (t.type === "string") return t.value
    if (/^null$/i.test(t.value)) return null
    return t.value
  }
  // An expression like -5 or 1.5e3 split oddly: show it as written.
  return item.map((t) => (t.type === "string" ? `'${t.value}'` : t.value ?? t.type)).join(" ")
}

export function parseSqlTables(script) {
  const tokens = tokenize(script ?? "")
  const tables = new Map()
  let i = 0
  const word = (k) => tokens[k]?.type === "word" ? tokens[k].value.toUpperCase() : null

  while (i < tokens.length) {
    if (word(i) === "CREATE" && word(i + 1) === "TABLE") {
      i += 2
      if (word(i) === "IF") i += 3
      const name = tokens[i]?.value
      i++
      if (tokens[i]?.type !== "(") return null
      const [defs, next] = readGroup(tokens, i)
      i = next
      const columns = defs
        .filter((d) => d.length && d[0].type === "word" && !CONSTRAINT_WORDS.has(d[0].value.toUpperCase()))
        .map((d) => ({
          name: d[0].value,
          type: d.slice(1).filter((t) => t.type === "word").map((t) => t.value).join(" "),
        }))
      tables.set(name.toLowerCase(), { name, columns, rows: [] })
      continue
    }
    if (word(i) === "INSERT" && word(i + 1) === "INTO") {
      i += 2
      const name = tokens[i]?.value
      i++
      const table = tables.get(String(name).toLowerCase())
      if (!table) return null
      let order = table.columns.map((c) => c.name)
      if (tokens[i]?.type === "(") {
        const [cols, next] = readGroup(tokens, i)
        order = cols.map((c) => c[0]?.value)
        i = next
      }
      if (word(i) !== "VALUES") return null
      i++
      while (tokens[i]?.type === "(") {
        const [values, next] = readGroup(tokens, i)
        i = next
        const row = table.columns.map((column) => {
          const at = order.findIndex((n) => String(n).toLowerCase() === column.name.toLowerCase())
          return at < 0 ? null : cellValue(values[at] ?? [])
        })
        table.rows.push(row)
        if (tokens[i]?.type === ",") i++
      }
      continue
    }
    i++
  }
  return tables.size ? [...tables.values()] : null
}

export default function SqlTables({ script }) {
  const tables = useMemo(() => parseSqlTables(script), [script])

  if (!script?.trim()) return null

  if (!tables) {
    return (
      <pre className="max-h-96 overflow-auto rounded-xl border border-rb-swan bg-rb-polar/40 p-3 font-mono text-xs leading-5">
        {script}
      </pre>
    )
  }

  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <section key={table.name} className="overflow-hidden rounded-xl border border-rb-swan">
          <header className="flex items-center gap-2 border-b border-rb-swan bg-rb-polar/60 px-3 py-1.5">
            <Database className="size-3.5 text-rb-wolf" aria-hidden="true" />
            <span className="font-mono text-xs font-extrabold text-rb-eel">{table.name}</span>
            <span className="ml-auto text-[11px] font-semibold text-rb-hare">
              {table.rows.length} {table.rows.length === 1 ? "row" : "rows"}
            </span>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead className="sticky top-0 bg-white">
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column.name}
                      className="border-b border-rb-swan px-3 py-1.5 text-left font-extrabold text-rb-eel"
                      title={column.type}
                    >
                      {column.name}
                      {column.type ? (
                        <span className="ml-1 font-semibold text-rb-hare">{column.type.split(" ")[0].toLowerCase()}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={r} className="odd:bg-rb-polar/30">
                    {row.map((cell, c) => (
                      <td key={c} className="whitespace-nowrap px-3 py-1 text-rb-eel">
                        {cell === null ? <span className="italic text-rb-hare">NULL</span> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
