import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'
import { createServer } from 'vite'
const root=fileURLToPath(new URL('../../',import.meta.url))
const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync)
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'composer-fixture',enforce:'pre',resolveId(id){if(['/src/hooks/use-learner-entitlements.js','/src/components/learner/ai-usage.jsx'].some((suffix)=>id.replaceAll('\\','/').endsWith(suffix)))return fileURLToPath(new URL('./tutor-composer-mocks.js',import.meta.url))},configureServer(vite){vite.middlewares.use(async(req,res,next)=>{if(req.url!=='/__composer_test')return next();res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml(req.url,'<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/tutor-composer-fixture.jsx"></script></body></html>'))})}}]})
let browser
try{
 await server.listen();browser=await puppeteer.launch({executablePath,headless:true});const page=await browser.newPage();await page.setViewport({width:1000,height:850})
 const sent=[]
 await page.evaluateOnNewDocument(()=>{const originalFetch=window.fetch;window.tutorAborted=false;window.fetch=(url,options)=>{if(String(url).includes('/api/ai/tutor/stream'))return new Promise((resolve,reject)=>{window.tutorSent=JSON.parse(options.body).message;options.signal.addEventListener('abort',()=>{window.tutorAborted=true;reject(new DOMException('Aborted','AbortError'))})});return originalFetch(url,options)}})
 await page.setRequestInterception(true)
 page.on('request',async(request)=>{
  if(request.url().includes('/api/ai/tutor/conversation'))return request.respond({status:200,contentType:'application/json',body:JSON.stringify({messages:[]})})
  if(request.url().endsWith('/api/ai/tutor/stream')){sent.push(JSON.parse(request.postData()).message);await new Promise(resolve=>setTimeout(resolve,1800));return request.respond({status:200,contentType:'text/event-stream',body:'event: delta\ndata: {"type":"delta","text":"Let’s work through this together."}\n\nevent: done\ndata: {"type":"done"}\n\n'}).catch(()=>{})}
  return request.continue()
 })
 await page.goto(`${server.resolvedUrls.local[0]}__composer_test`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('[aria-label="Message your tutor"]')
 const layout=await page.$eval('[data-tutor-composer]',(node)=>{const input=node.querySelector('textarea'),send=node.querySelector('[aria-label="Send message"]'),tools=node.querySelector('[aria-label="Create study aid"]');return {inputBottom:input.getBoundingClientRect().bottom,buttonTop:send.getBoundingClientRect().top,inputHeight:input.getBoundingClientRect().height,sendRadius:getComputedStyle(send).borderRadius,toolsRadius:getComputedStyle(tools).borderRadius,sendDisabled:send.disabled}})
 assert.ok(layout.inputBottom<=layout.buttonTop,'text area sits above the toolbar');assert.ok(layout.inputHeight>=56);assert.equal(layout.sendRadius,layout.toolsRadius);assert.equal(layout.sendDisabled,true)
 await page.type('[aria-label="Message your tutor"]','Explain costs');await page.keyboard.down('Shift');await page.keyboard.press('Enter');await page.keyboard.up('Shift');await page.type('[aria-label="Message your tutor"]','please')
 assert.equal(sent.length,0,'Shift+Enter must not send');assert.equal(await page.$eval('textarea',(node)=>node.value),'Explain costs\nplease')
 await page.screenshot({path:'scripts/tests/tutor-composer-desktop.png'})
 await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('textarea').value==='');assert.equal(await page.evaluate(()=>window.tutorSent),'Explain costs\nplease')
 await page.waitForSelector('[aria-label="Stop tutor reply"]')
 assert.equal(await page.$('[aria-label="Send message"]'),null,'Stop replaces Send while responding')
 assert.equal(await page.$eval('[aria-label="Stop tutor reply"]',node=>node.disabled),false)
 assert.equal(await page.$eval('[aria-label="Stop tutor reply"]',node=>getComputedStyle(node).borderRadius),layout.sendRadius)
 await page.screenshot({path:'scripts/tests/tutor-composer-stop.png'})
 await page.type('[aria-label="Message your tutor"]','Keep this draft')
 assert.equal(await page.$eval('[aria-label="Message your tutor"]',node=>node.value),'Keep this draft')
 await page.click('[aria-label="Stop tutor reply"]')
 await page.waitForFunction(()=>window.tutorAborted===true)
 await page.waitForSelector('[aria-label="Stop tutor reply"]',{hidden:true})
 assert.equal(await page.$eval('textarea',node=>node.value),'Keep this draft','Stopping preserves the next draft')
 assert.equal(await page.$eval('[aria-label="Send message"]',node=>node.disabled),false)
 await page.$eval('textarea',node=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(node,'');node.dispatchEvent(new Event('input',{bubbles:true}))})
 await page.click('[aria-label="Create study aid"]');await page.waitForSelector('[role="menuitem"]');await page.keyboard.press('Escape');await page.waitForSelector('[role="menu"]',{hidden:true})
 await page.setViewport({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
 await page.type('textarea','Can you give me an example?');await page.screenshot({path:'scripts/tests/tutor-composer-mobile.png'})
 await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.screenshot({path:'scripts/tests/tutor-composer-dark.png'})
 console.log('PASS: composer layout, multiline submission, rounded square Stop replacing Send, request cancellation, draft preservation, tools menu and responsive layout.')
}finally{await browser?.close();await server.close()}
