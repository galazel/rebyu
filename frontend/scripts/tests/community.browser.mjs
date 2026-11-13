import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
import { ai, live, alternative } from "./admin-mobile-data.mjs"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const mocks = ["/src/context/auth-context.jsx", "/src/hooks/use-notifications.js", "/src/components/question-bank/tagging-job-watcher.jsx"]
globalThis.__dirname = root
const server = await createServer({ configLoader: "native", root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{
  name: "admin-mobile", enforce: "pre", resolveId(id) {
    const normalized = id.replaceAll("\\", "/").replace("@/", "/src/")
    if (mocks.some((mock) => normalized.endsWith(mock))) return fileURLToPath(new URL("./admin-sidebar-mocks.js", import.meta.url))
  }, configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/__admin_mobile")) return next()
      res.setHeader("Content-Type", "text/html")
      res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/community-fixture.jsx"></script></body></html>'))
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
  let posts=[{postId:1,authorName:"Alex Morgan",initials:"AM",authorLevel:5,ownedByMe:true,title:"Study strategies for information security",description:"How do you prepare for the security module?\nShare your approach here.",postType:"discussion",createdAt:"2026-11-14T01:00:00",reactions:0,saves:0,comments:0,liked:false,saved:false},{postId:2,authorName:"Jamie Lee",initials:"JL",authorLevel:4,title:"Network study group discussion",description:"Discuss network diagrams with our study circle.",postType:"discussion",circleId:1,community:"Security group",createdAt:"2026-11-14T00:00:00",reactions:0,saves:1,comments:0,saved:true,liked:false}]
  let circles=[{circleId:1,name:"Security group",initials:"SG",topic:"IT Passport Exam",description:"Prepare together",members:2,joined:true,owner:false}]
  let comments=[],likeCalls=0,saveCalls=0,commentCalls=0
  await page.setRequestInterception(true)
  page.on("request",async req=>{
    if(!req.url().includes("/api/"))return req.continue()
    const path=new URL(req.url()).pathname.split("/api/")[1],method=req.method(),body=JSON.parse(req.postData()||"{}")
    let data=[]
    if(path==="community/posts"&&method==="GET")data=posts
    else if(path==="community/circles"&&method==="GET")data=circles
    else if(path==="community/posts"&&method==="POST"){const post={...posts[0],...body,postId:3};posts=[post,...posts];data=post}
    else if(path==="community/circles"&&method==="POST"){const circle={...body,circleId:2,initials:"NC",owner:true,joined:true,members:1};circles=[circle,...circles];data=circle}
    else if(path==="community/posts/1/like"){likeCalls++;await new Promise(r=>setTimeout(r,150));posts[0].liked=!posts[0].liked;posts[0].reactions=posts[0].liked?1:0;data={active:posts[0].liked,reactions:posts[0].reactions}}
    else if(path==="community/posts/1/save"){saveCalls++;await new Promise(r=>setTimeout(r,150));const post=posts.find(p=>p.postId===1);post.saved=!post.saved;post.saves=post.saved?1:0;data={active:post.saved,saves:post.saves}}
    else if(path==="community/posts/1/comments"&&method==="GET")data=comments
    else if(path==="community/posts/1/comments"&&method==="POST"){commentCalls++;await new Promise(r=>setTimeout(r,150));data={commentId:1,authorName:"Alex Morgan",initials:"AM",body:body.body,ownedByMe:true};comments.push(data)}
    else if(path==="community/posts/1/comments/1"&&method==="DELETE"){comments=[];data={}}
    else if(path==="community/posts/3"&&method==="DELETE"){posts=posts.filter(p=>p.postId!==3);data={}}
    else if(path==="community/circles/1/membership"){circles[0].joined=!circles[0].joined;data={joined:circles[0].joined}}
    await req.respond({status:200,contentType:"application/json",body:JSON.stringify(data)})
  })
  await page.goto(server.resolvedUrls.local[0]+"__admin_mobile")
  await page.waitForSelector('#community-post-1')
  for(const width of [320,390,768,1280]){
    await page.setViewport({width,height:900})
    for(const dark of [false,true]){
      await page.evaluate(dark=>document.documentElement.classList.toggle("dark",dark),dark)
      const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=="absolute").map(el=>el.tagName+" "+el.className).slice(0,8))
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,"overflow "+width+JSON.stringify(overflow))
      assert.equal(await page.$eval('.community-post',el=>getComputedStyle(el).boxShadow),"none")
      assert.ok(Number(await page.$eval('.community-post h2',el=>getComputedStyle(el).fontWeight))<=500)
    }
  }
  await page.setViewport({width:1280,height:1000})
  await page.evaluate(()=>document.documentElement.classList.remove("dark"))
  await new Promise(r=>setTimeout(r,300))
  await page.screenshot({path:"scripts/tests/community-desktop.png",fullPage:true})
  const clickText=async(text,selector='button')=>page.evaluate((text,selector)=>[...document.querySelectorAll(selector)].find(el=>el.textContent.trim()===text)?.click(),text,selector)
  await page.evaluate(()=>{const b=document.querySelector('#community-post-1 button:has(.sr-only)');b.click();b.click()})
  await page.waitForFunction(()=>document.querySelector('#community-post-1 button').textContent!==null)
  await new Promise(r=>setTimeout(r,250));assert.equal(likeCalls,1)
  await page.evaluate(()=>{const b=[...document.querySelectorAll('#community-post-1 button')].find(el=>el.textContent.includes('saves'));b.click();b.click()})
  await new Promise(r=>setTimeout(r,250));assert.equal(saveCalls,1)
  await page.evaluate(()=>[...document.querySelectorAll('#community-post-1 button')].find(el=>el.textContent.includes('comments')).click())
  await page.waitForSelector('[aria-label="Comment on Study strategies for information security"]')
  await page.type('[aria-label="Comment on Study strategies for information security"]',"Helpful discussion")
  await page.evaluate(()=>{const b=document.querySelector('[aria-label="Post comment"]');b.click();b.click()})
  await page.waitForFunction(()=>document.body.textContent.includes("Helpful discussion"));assert.equal(commentCalls,1)
  await page.click('[aria-label="Delete comment by Alex Morgan"]')
  await page.waitForFunction(()=>!document.body.textContent.includes("Helpful discussion"))
  await page.type('[aria-label="Search community posts"]',"no-match")
  await page.waitForFunction(()=>document.body.textContent.includes("No community posts found"))
  await page.$eval('[aria-label="Search community posts"]',el=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(el,"");el.dispatchEvent(new Event("input",{bubbles:true}))})
  await clickText("Security group")
  await page.type('[aria-label="Search community posts"]',"no-match")
  await page.waitForFunction(()=>!document.querySelector('#community-post-2'))
  await page.$eval('[aria-label="Search community posts"]',el=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(el,"");el.dispatchEvent(new Event("input",{bubbles:true}))})
  await page.evaluate(()=>[...document.querySelectorAll('nav[aria-label="Community feed"] button')].find(el=>el.textContent.includes("Saved")).click())
  await page.waitForSelector('#community-post-1')
  await clickText("Leave page","a");await clickText("Return to community","a")
  await page.waitForSelector('#community-post-1')
  assert.equal(await page.$eval('#community-post-1',el=>[...el.querySelectorAll('button')].find(b=>b.textContent.includes('saves')).getAttribute('aria-pressed')),"true","saved state survives navigation")
  await page.click('[title="Start a discussion"]')
  await page.type('[aria-label="Post title"]',"New discussion")
  await page.type('[aria-label="Post description"]',"A discussion created in a browser test")
  await clickText("Post")
  await page.waitForSelector('#community-post-3')
  await page.click('#community-post-3 [aria-label="Post actions"]')
  await page.waitForSelector('[role="menuitem"]')
  await clickText("Delete post",'[role="menuitem"]')
  await page.waitForFunction(()=>!document.querySelector('#community-post-3'))
  await page.click('[aria-label="Create study circle"]')
  await page.waitForSelector('#circle-name')
  await page.type('#circle-name',"New circle")
  await page.type('#circle-description',"Study together")
  await clickText("Create study circle",'[role="dialog"] button')
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'))
  await page.waitForFunction(()=>document.body.textContent.includes("New circle"))
  await page.setViewport({width:390,height:844})
  await page.evaluate(()=>[...document.querySelectorAll('[role="tab"]')].find(el=>el.textContent.trim()==="Study circles").click())
  await page.waitForSelector('[aria-label="Study circle directory"]')
  await page.evaluate(()=>[...document.querySelectorAll('[aria-label="Study circle directory"] button')].find(el=>el.textContent.includes("Security group")).click())
  await page.waitForFunction(()=>document.body.textContent.includes("Back to feed"))
  await page.evaluate(()=>[...document.querySelectorAll('[role="tab"]')].find(el=>el.textContent.trim()==="For you").click())
  await new Promise(r=>setTimeout(r,300))
  await page.screenshot({path:"scripts/tests/community-mobile.png",fullPage:true})
  assert.deepEqual(errors,[])
  console.log("Community: mobile/dark layouts, no shadows, likes/saves/comments, search/circle/saved filters, navigation cache, post create/delete, circle create passed")
}finally{await browser?.close();await server.close()}
