import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
import { ai, live, alternative } from "./admin-mobile-data.mjs"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const mocks = ["/src/context/auth-context.jsx", "/src/hooks/use-notifications.js", "/src/hooks/use-avatar-url.js", "/src/components/question-bank/tagging-job-watcher.jsx"]
globalThis.__dirname = root
const server = await createServer({ configLoader: "native", root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{
  name: "admin-mobile", enforce: "pre", resolveId(id) {
    const normalized = id.replaceAll("\\", "/").replace("@/", "/src/")
    if (mocks.some((mock) => normalized.endsWith(mock))) return fileURLToPath(new URL("./admin-sidebar-mocks.js", import.meta.url))
  }, configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/__admin_mobile")) return next()
      res.setHeader("Content-Type", "text/html")
      res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/learner-review-fixture.jsx"></script></body></html>'))
    })
  },
}] })

let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setRequestInterception(true)
  let failReviewSave = true
  page.on("request", (req) => {
    if (req.url().includes("/__fixture.svg")) return req.respond({status:200,contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><rect width="1200" height="500" fill="white"/><circle cx="600" cy="250" r="150" stroke="black" fill="green"/></svg>'})
    if (req.url().includes("/api/files/view-url")) return req.respond({status:200,contentType:"application/json",body:JSON.stringify({url:new URL("/__fixture.svg",req.url()).href})})
    if (req.url().includes("/mistakes/") && req.method() === "PUT" && failReviewSave) { failReviewSave = false; return req.respond({status:500,contentType:"application/json",body:'{"message":"Temporary save failure"}'}) }
    if (!req.url().includes("/api/")) return req.continue()
    return req.respond({ status: 200, contentType: "application/json", body: "[]" })
  })
  const goto = async (route) => {
    await page.goto(server.resolvedUrls.local[0] + "__admin_mobile?page=" + encodeURIComponent(route))
    await page.waitForSelector("h1")
  }
  const fits = async (label) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll('main input, main textarea, main button, main [role="combobox"], [role="dialog"] button, [role="dialog"] input')].filter((el) => {
      if (!el.getClientRects().length) return false
      const tableRegion = el.closest('[data-slot="table-container"]')
      if (tableRegion && tableRegion.scrollWidth > tableRegion.clientWidth) return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1)
    }).map((el) => el.tagName + ": " + el.textContent.slice(0, 50)))
    assert.deepEqual(bad, [], label)
  }
  for(const route of ["mistakes","certifications/4/certificate","certifications/4"]){
    await goto(route)
    for(const width of [320,390,768,1280]){
      await page.setViewport({width,height:900})
      for(const dark of [false,true]){
        await page.evaluate(dark=>document.documentElement.classList.toggle("dark",dark),dark)
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,route+" overflow at "+width)
      }
    }
    await page.setViewport({width:1280,height:1000})
    await page.evaluate(()=>document.documentElement.classList.remove("dark"))
    await page.screenshot({path:"scripts/tests/"+(route==="certifications/4"?"certification-details":route==="mistakes"?"mistake-bank-desktop":"certificate-desktop")+".png",fullPage:true})
    await page.setViewport({width:390,height:844})
    await page.screenshot({path:"scripts/tests/"+(route==="certifications/4"?"certification-details":route==="mistakes"?"mistake-bank-mobile":"certificate-mobile")+".png",fullPage:true})
    if(route==="mistakes"){
      await page.type('[aria-label="Search your mistakes"]',"no-match")
      await page.waitForFunction(()=>document.body.textContent.includes("Nothing matches"))
      await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent==="Clear all filters").click())
      await page.waitForSelector('ol li button')
      await page.click('ol li button')
      await page.waitForFunction(()=>document.body.textContent.includes("Correct answer"))
      await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent.includes("Start a review")).click())
      await page.waitForSelector('[aria-label="Review your mistakes"]')
      await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent.includes("Show the answer")).click())
      await page.waitForFunction(()=>document.body.textContent.includes("Mark as learned"))
      await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="Review your mistakes"] img')].filter(img=>img.naturalWidth>0).length>=5)
      await page.screenshot({path:"scripts/tests/mistake-review-mobile.png",fullPage:true})
      await page.evaluate(()=>[...document.querySelectorAll('[aria-label="Review your mistakes"] button')].find(el=>el.textContent.trim()==="Mark as learned").click())
      await page.waitForFunction(()=>!document.body.textContent.includes("Saving…"))
      assert.equal(await page.evaluate(()=>document.body.textContent.includes("Correct answer")),true,"failed save stays on the same question")
      await page.evaluate(()=>[...document.querySelectorAll('[aria-label="Review your mistakes"] button')].find(el=>el.textContent.trim()==="Mark as learned").click())
      await page.waitForFunction(()=>!document.body.textContent.includes("Correct answer"))
      await page.click('[aria-label="Close the review"]')
    }else if(route==="certifications/4"){
      await page.click('[data-slot="accordion-trigger"]')
      await page.waitForFunction(()=>document.body.textContent.includes("Understanding Roles, Responsibilities"))
      await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent.includes("Continue Learning")).click())
      await page.waitForFunction(()=>document.body.textContent.includes("Learning destination"))
    }else{
      assert.equal(await page.$eval('#rb-certificate',el=>el.textContent.includes('Overall Mastery')),false)
      await page.emulateMediaType('print')
      assert.equal(await page.$eval('#rb-certificate',el=>getComputedStyle(el).visibility),"visible")
      await page.emulateMediaType('screen')
    }
  }
  await goto("certifications")
  await page.waitForSelector('.rb-bubble-card')
  assert.equal(await page.$$eval('.rb-bubble-card span[aria-hidden="true"]',nodes=>nodes.some(node=>node.textContent.includes("IT Passport Exam"))),false,"certification cap has no title watermark")
  assert.equal(await page.$eval('.rb-bubble-card',node=>node.textContent.includes("IT Passport Exam")),true,"normal title remains")
  await goto("recall-media")
  await page.setViewport({width:320,height:900})
  await page.waitForFunction(()=>[...document.images].filter(img=>img.naturalWidth>0).length>=4)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,"recall images fit mobile")
  await page.click('[aria-label="Enlarge figure"]')
  await page.waitForSelector('[aria-label="Close figure"]')
  await page.keyboard.press("Escape")
  await page.waitForSelector('[aria-label="Close figure"]',{hidden:true})
  console.log("Recall media: private stem/choice/sub-question/workspace images load, fit mobile, enlarge")
  assert.deepEqual(errors,[])
  console.log("Learner review pages: mobile/desktop light/dark, filtering, reveal/review, certificate print passed")
}finally{await browser?.close();await server.close()}
