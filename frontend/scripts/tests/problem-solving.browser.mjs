import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync)

/** Sets the working box through React's own value setter. */
async function setWorking(page, text) {
  await page.evaluate((value) => {
    const field = document.querySelector("textarea")
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
    setter.call(field, value)
    field.dispatchEvent(new Event("input", { bubbles: true }))
  }, text)
}

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, hmr: false },
  plugins: [
    {
      name: "problem-solving-fixture",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/__problem_solving")) return next()
          res.setHeader("Content-Type", "text/html")
          res.end(
            await vite.transformIndexHtml(
              req.url,
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/problem-solving-fixture.jsx"></script></body></html>'
            )
          )
        })
      },
    },
  ],
})

let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto(`${server.resolvedUrls.local[0]}__problem_solving`, { timeout: 120000 })
  await page.waitForSelector("textarea")

  // A submitted answer reads back as working plus a separate final answer,
  // both typeset.
  const submitted = await page.evaluate(() => {
    const section = document.querySelector("[data-submitted]")
    return {
      typeset: section.querySelectorAll(".katex").length,
      finalAnswer: /Final answer:/.test(section.innerText),
      raw: section.innerText.includes("\\pu{"),
    }
  })
  assert.ok(submitted.typeset >= 3, `a submitted answer is typeset (${submitted.typeset})`)
  assert.equal(submitted.finalAnswer, true, "the final answer is shown apart from the working")
  assert.equal(submitted.raw, false, "no LaTeX source is left showing")

  // Typing working: the preview typesets it live, so a learner sees what the
  // examiner will read before they submit.
  await page.click("textarea")
  await page.type("textarea", "\\(E = mc^2\\)")
  await page.waitForFunction(
    () => document.querySelector('[aria-label="How your working will be read"] .katex') != null
  )

  // The symbol palette inserts at the caret and puts the cursor inside the braces.
  await page.evaluate(() => {
    const field = document.querySelector("textarea")
    field.focus()
    field.selectionStart = field.selectionEnd = field.value.length
  })
  const sqrtButton = await page.$('button[aria-label="Square root"]')
  assert.ok(sqrtButton, "the palette offers a square root")
  await sqrtButton.click()
  const afterInsert = await page.evaluate(() => {
    const field = document.querySelector("textarea")
    return { value: field.value, caret: field.selectionStart }
  })
  // The caret was outside \( ... \), so the snippet brought its own delimiters
  // rather than landing as five literal characters.
  assert.ok(
    afterInsert.value.endsWith("\\(\\sqrt{}\\)"),
    `the snippet is inserted as maths (${afterInsert.value})`
  )
  assert.equal(afterInsert.caret, afterInsert.value.length - 3, "the caret lands inside the braces")

  // Inside an equation it does not double up.
  await setWorking(page, "\\(a = \\)")
  await page.evaluate(() => {
    const field = document.querySelector("textarea")
    field.focus()
    field.selectionStart = field.selectionEnd = 6
  })
  await (await page.$('button[aria-label="Square root"]')).click()
  const inside = await page.evaluate(() => document.querySelector("textarea").value)
  assert.equal(inside, "\\(a = \\sqrt{}\\)", `no doubled delimiters inside an equation (${inside})`)

  await setWorking(page, "\\(E = mc^2\\)")

  // The final answer is its own field but travels in the one stored string.
  await page.type('input[id]', "\\(\\pu{12 V}\\)")
  const stored = await page.evaluate(() => window.__answer)
  assert.ok(stored.includes("E = mc^2"), `the working is stored, spaces and all (${stored})`)
  assert.ok(stored.includes("Final answer: \\(\\pu{12 V}\\)"), `the final answer is stored (${stored})`)

  // And the final-answer preview typesets too.
  const finalTypeset = await page.evaluate(
    () => document.querySelectorAll('[aria-label="How your final answer will be read"] .katex').length
  )
  assert.ok(finalTypeset >= 1, "the final answer is typeset as it is typed")

  for (const dark of [false, true]) {
    await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark)
    for (const width of [375, 1280]) {
      await page.setViewport({ width, height: 900 })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      assert.equal(overflow, false, `dark=${dark}, ${width}px: the page must not scroll sideways`)
    }
    await page.setViewport({ width: 390, height: 1400 })
    await page.screenshot({
      path: `scripts/tests/problem-solving-${dark ? "dark" : "light"}.png`,
      fullPage: true,
    })
  }

  assert.deepEqual(errors, [])
  console.log(
    "PASS: working and final answer typeset live, the palette inserts at the caret, both encode into one learnerAnswer, and a submitted answer reads back typeset at 375/1280px in light and dark."
  )
} finally {
  await browser?.close()
  await server.close()
}
