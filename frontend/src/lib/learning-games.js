export function seededShuffle(values, seed = 17) {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  if (copy.length > 1 && copy.every((value, i) => value === values[i])) [copy[0], copy[1]] = [copy[1], copy[0]]
  return copy
}

export function slidingStart() {
  const tiles = Array.from({ length: 9 }, (_, i) => i)
  let blank = 8, last = -1
  for (let i = 0; i < 65; i++) {
    const neighbors = [blank - 3, blank + 3, ...(blank % 3 ? [blank - 1] : []), ...(blank % 3 < 2 ? [blank + 1] : [])].filter((value) => value >= 0 && value < 9 && value !== last)
    const next = neighbors[(i * 7 + 3) % neighbors.length]
    ;[tiles[blank], tiles[next]] = [tiles[next], tiles[blank]]
    last = blank; blank = next
  }
  return tiles
}

export function wordSearch(words) {
  const size = Math.max(10, words.length, ...words.map(({ word }) => word.length))
  const grid = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => String.fromCharCode(65 + ((row * 13 + col * 7 + 9) % 26))))
  const placements = words.map(({ word }, index) => {
    const row = index, start = index % (size - word.length + 1), reverse = index % 2 === 1
    const cells = [...word].map((letter, i) => {
      const col = start + (reverse ? word.length - 1 - i : i)
      grid[row][col] = letter
      return `${row}:${col}`
    })
    return { word, cells }
  })
  return { size, grid, placements }
}

export function crossword(words) {
  const cells = {}, placed = []
  const at = (row, col) => cells[`${row}:${col}`]
  for (const { word, clue } of [...words].sort((a, b) => b.word.length - a.word.length)) {
    let choice
    for (const other of placed) {
      for (let a = 0; a < word.length && !choice; a++) for (let b = 0; b < other.word.length && !choice; b++) {
        if (word[a] !== other.word[b]) continue
        const direction = other.direction === "across" ? "down" : "across"
        const row = other.row + (other.direction === "down" ? b : 0) - (direction === "down" ? a : 0)
        const col = other.col + (other.direction === "across" ? b : 0) - (direction === "across" ? a : 0)
        const dr = direction === "down" ? 1 : 0, dc = 1 - dr
        if (at(row - dr, col - dc) || at(row + dr * word.length, col + dc * word.length)) continue
        const valid = [...word].every((letter, i) => {
          const r = row + dr * i, c = col + dc * i, existing = at(r, c)
          return existing ? existing.letter === letter && !existing.directions.includes(direction) : !at(r + dc, c + dr) && !at(r - dc, c - dr)
        })
        if (valid) choice = { row, col, direction }
      }
      if (choice) break
    }
    if (!choice) choice = { row: placed.length ? Math.max(...Object.values(cells).map((cell) => cell.row)) + 3 : 0, col: 0, direction: "across" }
    const entry = { ...choice, word, clue, number: placed.length + 1, cells: [] }
    ;[...word].forEach((letter, i) => {
      const row = choice.row + (choice.direction === "down" ? i : 0), col = choice.col + (choice.direction === "across" ? i : 0), key = `${row}:${col}`
      cells[key] ||= { row, col, letter, directions: [] }
      cells[key].directions.push(choice.direction)
      if (i === 0) cells[key].number = entry.number
      entry.cells.push(key)
    })
    placed.push(entry)
  }
  const all = Object.values(cells)
  return { cells, placed, minRow: Math.min(...all.map((cell) => cell.row)), maxRow: Math.max(...all.map((cell) => cell.row)), minCol: Math.min(...all.map((cell) => cell.col)), maxCol: Math.max(...all.map((cell) => cell.col)) }
}
