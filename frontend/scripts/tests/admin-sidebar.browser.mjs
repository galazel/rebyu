import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const mocks = ["@/context/auth-context.jsx", "@/hooks/use-portal-theme.js", "@/hooks/use-notifications.js", "@/hooks/use-avatar-url.js", "@/components/question-bank/tagging-job-watcher.jsx", "@/services/certificationService.js"]
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "admin-sidebar-fixture", enforce: "pre", resolveId(id) {
  if (mocks.some((mock) => id.replaceAll("\\", "/").endsWith(mock.replace("@/", "/src/")) || id === mock)) return fileURLToPath(new URL("./admin-sidebar-mocks.js", import.meta.url))
}, configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__admin_sidebar") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/admin-sidebar-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 960 })
  await page.goto(`${server.resolvedUrls.local[0]}__admin_sidebar`)
  await page.waitForSelector('nav[aria-label="Admin navigation"]')
  const links = await page.$$eval('nav[aria-label="Admin navigation"] a', (nodes) => nodes.map((node) => node.getAttribute("href")))
  for (const href of ["/admin/dashboard", "/admin", "/admin/challenges", "/admin/institutions", "/admin/partnership-requests", "/admin/subscriptions", "/admin/learners", "/admin/community", "/admin/reference-lists", "/admin/pricing", "/admin/rewards", "/admin/ai-settings"]) assert.ok(links.includes(href), `preserve ${href}`)
  const active = () => page.$$eval('nav [data-active="true"]', (nodes) => nodes.map((node) => node.textContent.trim()))
  assert.deepEqual(await active(), ["Dashboard"])
  assert.equal(await page.$$eval('[aria-label="admin toolbar"] [aria-label="Open notifications"]', (nodes) => nodes.length), 1, "notifications belong in the top bar")
  await page.focus('[aria-label="Search admin portal"]')
  assert.equal(await page.$('[aria-label="admin toolbar"] a'), null, "empty search must not repeat sidebar links")
  await page.type('[aria-label="Search admin portal"]', "Passport")
  await page.waitForSelector('[aria-label="admin toolbar"] a[href="/admin/certification/4"]')
  await page.screenshot({ path: "scripts/tests/admin-content-search.png" })
  for (const portal of ["admin-portal", "learner-portal"]) {
    for (const dark of [false, true]) {
      const colors = await page.evaluate(async ({ portal, dark }) => {
        document.documentElement.classList.toggle("dark", dark)
        const shell = document.querySelector(".netacad-portal")
        shell.classList.remove("admin-portal", "learner-portal")
        shell.classList.add(portal)
        await new Promise((resolve) => setTimeout(resolve, 250))
        const toolbar = document.querySelector('[data-slot="portal-topbar"]')
        const link = toolbar.querySelector("a")
        const panel = link.parentElement
        const icon = toolbar.querySelector('[aria-label="Open notifications"]')
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = 1
        const context = canvas.getContext("2d", { willReadFrequently: true })
        const luminance = (color) => {
          context.fillStyle = getComputedStyle(shell).backgroundColor
          context.fillRect(0, 0, 1, 1)
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4 })
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        }
        const contrast = (a, b) => { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
        return {
          foreground: getComputedStyle(icon).color,
          background: getComputedStyle(toolbar).backgroundColor,
          link: contrast(getComputedStyle(link).color, getComputedStyle(panel).backgroundColor),
          icon: contrast(getComputedStyle(icon).color, getComputedStyle(toolbar).backgroundColor),
          muted: contrast(getComputedStyle(panel.querySelector("p")).color, getComputedStyle(panel).backgroundColor),
        }
      }, { portal, dark })
      assert.ok(colors.link >= 4.5, `${portal} dark=${dark}: readable search results (${colors.link})`)
      assert.ok(colors.icon >= 3, `${portal} dark=${dark}: visible notification icon (${JSON.stringify(colors)})`)
      assert.ok(colors.muted >= 4.5, `${portal} dark=${dark}: readable secondary text (${colors.muted})`)
    }
  }
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark")
    document.querySelector(".netacad-portal").classList.replace("learner-portal", "admin-portal")
  })
  await page.click('[aria-label="admin toolbar"] a[href="/admin/certification/4"]')
  await page.waitForFunction(() => window.adminSidebarPath === "/admin/certification/4")
  assert.equal(await page.$eval('[aria-label="Search admin portal"]', (node) => node.value), "")
  await page.keyboard.down("Control")
  await page.keyboard.press("k")
  await page.keyboard.up("Control")
  await page.type('[aria-label="Search admin portal"]', "no-such-page")
  await page.waitForFunction(() => document.body.textContent.includes("No matching content."))
  await page.click('[aria-label="Clear search"]')
  await page.type('[aria-label="Search admin portal"]', "Passport")
  await page.keyboard.press("Enter")
  await page.waitForFunction(() => window.adminSidebarPath === "/admin/certification/4")
  const before = await page.$eval('[data-slot="sidebar-inset"]', (node) => node.getBoundingClientRect().left)
  await page.click('[aria-label="Collapse admin navigation"]')
  await page.waitForSelector('[data-state="collapsed"][data-slot="sidebar"]')
  await new Promise((resolve) => setTimeout(resolve, 250))
  const after = await page.$eval('[data-slot="sidebar-inset"]', (node) => node.getBoundingClientRect().left)
  assert.ok(after < before - 100, "collapsing must release content width")
  await page.click('[aria-label="Expand admin navigation"]')
  await page.click('nav a[href="/admin/ai-settings"]')
  await page.waitForFunction(() => window.adminSidebarPath === "/admin/ai-settings")
  assert.deepEqual(await active(), ["AI settings"])
  await page.evaluate(() => document.querySelector('nav a[href="/admin/subscriptions"]').click())
  await page.waitForFunction(() => window.adminSidebarPath === "/admin/subscriptions")
  assert.deepEqual(await active(), ["Payments"])
  await page.click('[aria-label="Open account menu"]')
  await page.waitForSelector('[role="menu"]')
  assert.ok(await page.$('[role="menuitem"]'))
  await page.keyboard.press("Escape")
  await new Promise((resolve) => setTimeout(resolve, 250))
  await page.screenshot({ path: "scripts/tests/admin-sidebar-desktop.png" })
  await page.setViewport({ width: 390, height: 844 })
  await page.waitForSelector('[aria-label="Open admin navigation"]', { visible: true })
  await page.click('[aria-label="Open admin navigation"]')
  await page.waitForSelector('[data-mobile="true"]', { visible: true })
  await page.screenshot({ path: "scripts/tests/admin-sidebar-mobile.png" })
  await page.click('nav a[href="/admin/dashboard"]')
  await page.waitForFunction(() => window.adminSidebarPath === "/admin/dashboard")
  await page.waitForSelector('[data-mobile="true"]', { hidden: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "no horizontal mobile overflow")
  await page.click('[aria-label="Open admin navigation"]')
  await page.click('[data-mobile="true"] [aria-label="Open account menu"]')
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.includes("Log out")).click())
  await page.waitForFunction(() => window.adminLogoutCalled && document.body.textContent.includes("Logged out"))
  console.log("PASS: real admin shell, all routes preserved, active states, collapse width, account/logout, mobile drawer closing and no overflow.")
} finally { await browser?.close(); await server.close() }
