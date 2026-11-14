import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"

const execute = promisify(execFile)
const source = fileURLToPath(
  new URL(
    "../../../../python-backend/app/services/bkt_math.py",
    import.meta.url
  )
)
export async function pythonMath(assertions) {
  // Load the actual production module without importing app startup or writing pyc.
  const code = `import importlib.util, sys\nspec = importlib.util.spec_from_file_location('rebyu_bkt_under_test', sys.argv[1])\nm = importlib.util.module_from_spec(spec)\nsys.modules[spec.name] = m\nspec.loader.exec_module(m)\n${assertions}`
  await execute(
    process.env.REBYU_PYTHON || "python",
    ["-B", "-c", code, source],
    {
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      timeout: 15000,
    }
  )
}
