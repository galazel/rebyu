import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const execute = promisify(execFile)
const repository = fileURLToPath(new URL("../../../../", import.meta.url))
const output = path.join(repository, "frontend/.native-test-output")
export const nativeEnabled = process.env.REBYU_NATIVE_TESTS === "1"

export async function runPythonTests(selectors) {
  await mkdir(output, { recursive: true })
  const args = [
    "-B",
    "-m",
    "pytest",
    "-p",
    "no:cacheprovider",
    "-o",
    "addopts=",
    "--import-mode=importlib",
    "--basetemp",
    path.join(output, "pytest-temp-" + process.pid),
    ...selectors,
  ]
  // Selected existing tests mock AI/retrieval. No live_turns or live-provider tests.
  await execute(process.env.REBYU_PYTHON || "python", args, {
    cwd: path.join(repository, "python-backend"),
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  })
}

export async function runJavaTests(selector, overlay = null) {
  const project = path.join(output, "java-" + selector.split("#")[0])
  await mkdir(project, { recursive: true })
  const backend = path.join(repository, "backend-java").replaceAll("\\", "/")
  const directory = project.replaceAll("\\", "/")
  let pom = await readFile(
    path.join(repository, "backend-java/pom.xml"),
    "utf8"
  )
  // Use the original dependency versions; all generated and compiled files stay in frontend.
  let testsDirectory = backend + "/src/test/java"
  if (overlay) {
    testsDirectory = directory + "/tests"
    await mkdir(testsDirectory, { recursive: true })
    let code = await readFile(
      path.join(
        repository,
        "backend-java/src/test/java/com/capstone/rebyu",
        overlay.source
      ),
      "utf8"
    )
    for (const [before, after] of overlay.replace || []) {
      if (!code.includes(before))
        throw new Error("Native fixture changed; review replacement: " + before)
      code = code.replaceAll(before, after)
    }
    if (overlay.append)
      code =
        code.slice(0, code.lastIndexOf("}")) +
        "\n@org.junit.jupiter.api.Test\nvoid catalogCase() throws Exception {\n" +
        overlay.append +
        "\n}\n}\n"
    await writeFile(
      path.join(testsDirectory, path.basename(overlay.source)),
      code
    )
  }
  pom = pom.replace(
    "<build>",
    `<build>
    <directory>${directory}/target</directory>
    <sourceDirectory>${backend}/src/main/java</sourceDirectory>
    <testSourceDirectory>${testsDirectory}</testSourceDirectory>
    <resources><resource><directory>${backend}/src/main/resources</directory></resource></resources>
    <testResources><testResource><directory>${backend}/src/test/resources</directory></testResource></testResources>`
  )
  const pomPath = path.join(project, "pom.xml")
  await writeFile(pomPath, pom)
  const args = [
    "-f",
    pomPath,
    "-Dmaven.repo.local=" + path.join(output, "m2"),
    "-Dtest=" + selector,
    "test",
    "-q",
  ]
  const executable =
    process.env.REBYU_MAVEN ||
    path.join(
      repository,
      "backend-java",
      process.platform === "win32" ? "mvnw.cmd" : "mvnw"
    )
  // Windows batch files require cmd; only fixed executable and generated paths are used.
  if (process.platform === "win32") {
    await execute(
      "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        `""${executable}" ${args.map((arg) => '"' + arg + '"').join(" ")}"`,
      ],
      {
        cwd: project,
        timeout: 180000,
        maxBuffer: 8 * 1024 * 1024,
        env: {
          ...process.env,
          MAVEN_USER_HOME: path.join(output, "maven-home"),
        },
      }
    )
  } else {
    await execute(executable, args, {
      cwd: project,
      timeout: 180000,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, MAVEN_USER_HOME: path.join(output, "maven-home") },
    })
  }
}
