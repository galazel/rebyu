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

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, hmr: false },
  plugins: [
    {
      name: "formula-block-fixture",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/__formula_block")) return next()
          res.setHeader("Content-Type", "text/html")
          res.end(
            await vite.transformIndexHtml(
              req.url,
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/formula-block-fixture.jsx"></script></body></html>'
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

  await page.goto(`${server.resolvedUrls.local[0]}__formula_block`, { timeout: 120000 })
  await page.waitForSelector(".katex-display")

  const counts = await page.evaluate(() => {
    // KaTeX keeps the TeX source in a MathML annotation beside the typeset
    // output, so body text is read in two parts: what KaTeX drew, and the prose
    // with every equation removed.
    const drawn = [...document.querySelectorAll(".katex-html")].map((node) => node.innerText).join("\n")
    const withoutMath = document.body.cloneNode(true)
    withoutMath.querySelectorAll(".katex").forEach((node) => node.remove())
    const prose = withoutMath.textContent
    return {
      display: document.querySelectorAll(".katex-display").length,
      inline: document.querySelectorAll(".rb-math .katex:not(.katex-display .katex)").length,
      errors: document.querySelectorAll(".katex-error").length,
      figures: document.querySelectorAll("figure").length,
      symbols: document.querySelectorAll("dt").length,
      fallback: [...document.querySelectorAll("span, p")].filter((node) =>
        node.textContent.startsWith("Cost = Power (kW) x Time (h)")
      ).length,
      // mhchem renders the subscripts; if it were missing, the raw macro would
      // either throw or be printed as written.
      chemistry: (() => {
        const flat = drawn.replace(/[\s​⁣X]/g, "")
        return flat.includes("2H2+O2") && flat.includes("2H2O") && flat.includes("H2SO4") && flat.includes("9.81m/s")
      })(),
      steps: [...document.querySelectorAll("figcaption")].filter((node) =>
        /^\d/.test(node.innerText.trim())
      ).length,
      // A worked example keeps its parts apart: the figures it starts from in
      // a definition list, the working as numbered steps, the conclusion in
      // its own panel -- all of which a code box flattened.
      examples: document.querySelectorAll("ol > li > div").length,
      exampleGivens: [...document.querySelectorAll("dt")].filter((node) =>
        /Sample size|Lot size|Design|Servers/.test(node.innerText)
      ).length,
      exampleResults: [...document.querySelectorAll("p")].filter((node) =>
        /^(Decision|Project duration|Output metrics|Diagnosis|Outcome)$/i.test(node.innerText.trim())
      ).length,
      // The block has to carry walkthroughs with no arithmetic in them: a
      // set-up line that is one plain fact, and a result that is a verdict.
      bareFacts: [...document.querySelectorAll("dd")].filter((node) =>
        /rebooted overnight|Nothing in the application code|requirement must be testable/.test(node.innerText)
      ).length,
      emptyHalves: [...document.querySelectorAll("dl dd")].filter(
        (node) => !node.innerText.trim()
      ).length,
      verdicts: /A missing bind address, not a code regression\./.test(document.body.innerText),
      // A price is not an equation and must survive untouched.
      priceIntact: prose.includes("$0.12/kWh") && prose.includes("$48 a shift"),
      rawDelimiters: prose.includes("\\(") || prose.includes("\\ce{"),
    }
  })

  // 17 real expressions from the lesson, the bare one, and five from the
  // chemistry block; the non-LaTeX one must fall back to the author's own text
  // rather than a red KaTeX error.
  assert.equal(counts.display, 23, `every valid expression is typeset (${counts.display})`)
  assert.ok(counts.inline >= 6, `inline maths is typeset in prose, lists and cells (${counts.inline})`)
  assert.equal(counts.errors, 0, "nothing renders as a KaTeX error")
  assert.equal(counts.fallback, 1, "the non-LaTeX expression still reads as a formula")
  assert.equal(counts.figures, 24, `one figure per formula (${counts.figures})`)
  assert.ok(counts.symbols >= 17, `symbols are explained (${counts.symbols} entries)`)
  assert.equal(counts.chemistry, true, "mhchem typesets chemical equations")
  assert.equal(counts.steps, 5, `a numbered set reads as a derivation (${counts.steps} steps)`)
  assert.equal(counts.priceIntact, true, "prices are left alone, not read as maths")
  assert.equal(counts.rawDelimiters, false, "no delimiter is left showing")
  assert.ok(counts.examples >= 10, `worked examples render their steps (${counts.examples})`)
  assert.ok(counts.exampleGivens >= 4, `worked examples list their figures (${counts.exampleGivens})`)
  assert.equal(counts.exampleResults, 5, `each worked example states its conclusion (${counts.exampleResults})`)
  assert.equal(counts.bareFacts, 3, `a set-up line can be one plain fact (${counts.bareFacts})`)
  assert.equal(counts.emptyHalves, 0, "no set-up line leaves an empty column beside it")
  assert.equal(counts.verdicts, true, "a result can be a verdict rather than a quantity")

  // The expression is text: selectable, searchable, and it scales with the reader.
  const selectable = await page.evaluate(() => {
    const math = document.querySelector(".katex-display")
    return math.innerText.replace(/\s+/g, "").length > 0
  })
  assert.equal(selectable, true, "the formula is real text, not a picture")

  for (const dark of [false, true]) {
    await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark)
    for (const width of [375, 1280]) {
      await page.setViewport({ width, height: 900 })
      const layout = await page.evaluate(() => ({
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        wide: [...document.querySelectorAll("figure")].filter(
          (node) => node.getBoundingClientRect().right > innerWidth + 1
        ).length,
      }))
      assert.equal(layout.pageOverflow, false, `dark=${dark}, ${width}px: the page must not scroll sideways`)
      assert.equal(layout.wide, 0, `dark=${dark}, ${width}px: every formula card fits`)
    }
    await page.setViewport({ width: 390, height: 1600 })
    await page.screenshot({
      path: `scripts/tests/formula-block-${dark ? "dark" : "light"}.png`,
      fullPage: true,
    })
  }

  assert.deepEqual(errors, [])
  console.log(
    "PASS: 5 worked examples, two of them with no arithmetic at all, with their set-up, steps and conclusions, 23 display + inline expressions typeset (chemistry and units included), 0 KaTeX errors, prices untouched, loose text falls back readably, numbered steps, everything fits at 375/1280px in light and dark."
  )
} finally {
  await browser?.close()
  await server.close()
}
