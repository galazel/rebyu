import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const definitions = JSON.parse(
  readFileSync(new URL("./native-cases.json", import.meta.url), "utf8")
)
const requested = process.argv.slice(2)
const files = definitions
  .filter(
    (item) => item.native && (!requested.length || requested.includes(item.id))
  )
  .map((item) => `src/__test__/${item.id}.test.jsx`)
if (!files.length)
  throw new Error("No matching native test cases. Use an exact TC identifier.")
const frontend = fileURLToPath(new URL("../../../", import.meta.url))
const runner = fileURLToPath(
  new URL("../../../node_modules/vitest/vitest.mjs", import.meta.url)
)
const result = spawnSync(
  process.execPath,
  [runner, "run", "--config", "vitest.config.js", "--maxWorkers=1", ...files],
  {
    cwd: frontend,
    stdio: "inherit",
    env: { ...process.env, REBYU_NATIVE_TESTS: "1" },
  }
)
if (result.error) throw result.error
process.exit(result.status ?? 1)
