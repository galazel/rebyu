import assert from "node:assert/strict"
import { crossword, slidingStart, wordSearch, seededShuffle } from "../../src/lib/learning-games.js"
const words = [{ word: 'COST', clue: 'Expense' }, { word: 'INCOME', clue: 'Earnings' }, { word: 'CAPITAL', clue: 'Resources' }]
const cross = crossword(words)
assert.equal(cross.placed.length, words.length)
for (const entry of cross.placed) assert.equal(entry.cells.map((key) => cross.cells[key].letter).join(''), entry.word)
assert.ok(Object.values(cross.cells).some((cell) => cell.directions.length === 2), 'crossword contains an actual crossing')
const search = wordSearch(words)
for (const entry of search.placements) assert.equal(entry.cells.map((key) => { const [r,c] = key.split(':').map(Number); return search.grid[r][c] }).join(''), entry.word)
const tiles = slidingStart(), numbered = tiles.filter((tile) => tile !== 8)
const inversions = numbered.reduce((count, tile, i) => count + numbered.slice(i + 1).filter((other) => other < tile).length, 0)
assert.equal(inversions % 2, 0, 'sliding puzzle is solvable')
assert.deepEqual([...tiles].sort((a,b) => a-b), [0,1,2,3,4,5,6,7,8])
assert.notDeepEqual(tiles, [0,1,2,3,4,5,6,7,8])
assert.notDeepEqual(seededShuffle([0,1,2]), [0,1,2])
console.log('PASS: crossword crossings, word-search solutions, solvable sliding board and nontrivial shuffles.')
