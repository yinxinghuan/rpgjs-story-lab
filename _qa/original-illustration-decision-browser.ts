import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5357',evidence:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:locale==='zh'?'zh-CN':'en-US'}),errors:string[]=[],blocked=new Set<string>(),jobs:any[]=[]
 let firstFile=true,loseDecision=true,generations=0,decisions=0
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url())
  if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.add(u.origin);return route.abort()}
  if(u.pathname.includes('/illustrations')){
   if(u.pathname.endsWith('/file')&&firstFile){firstFile=false;return route.abort()}
   if(u.pathname.endsWith('/illustrations')&&req.method()==='POST')generations++
   if(u.pathname.endsWith('/decision')&&req.method()==='POST'){
    decisions++;const response=await route.fetch();assert.equal(response.status(),200);jobs.push(...(await response.json()).illustrations)
    if(loseDecision){loseDecision=false;return route.abort()}
    return route.fulfill({response})
   }
   const response=await route.fetch();if(response.ok()&&!u.pathname.endsWith('/file'))jobs.push(...((await response.json()).illustrations??[]));return route.fulfill({response})
  }
  return route.continue()
 })
 const page=await context.newPage(),t=(zh:string,en:string)=>locale==='zh'?zh:en
 page.on('pageerror',e=>errors.push(e.message))
 const button=(zh:string,en:string)=>page.getByRole('button',{name:t(zh,en),exact:true})
 const close=async()=>{const b=button('关闭面板','Close panel');if(await b.count())await b.click()}
 const ready=()=>page.waitForFunction(()=>Boolean(document.querySelector('.og-game[data-version]'))&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'))
 const pictures=async()=>{await button('记录','Journal').click();await button('查看旅途画页','View journey illustrations').click()}
 const north=async()=>{await page.locator('#og-illustration-scene option[value="train-at-dead-station"]').waitFor({state:'attached'});await page.locator('#og-illustration-scene').selectOption('train-at-dead-station')}
 const decoded=async()=>{const img=page.locator('.og-illustrations img');await img.waitFor();await img.evaluate((i:HTMLImageElement)=>i.decode())}
 const keep=()=>button('保留这张画页','Keep this illustration'),discard=()=>button('不保留这张候选','Do not keep this candidate')
 async function action(zh:string,en:string){await button('附近','Nearby').click();const b=page.getByRole('dialog').getByRole('button',{name:t(zh,en),exact:true});await b.click();await b.waitFor();await b.click();await ready();await close()}
 try{
  await page.goto(origin+'/');await ready();await close();await pictures();await button('制作当前地点的画页','Create illustration of this place').click()
  await button('重新读取图片','Reload image').waitFor();assert.equal(await keep().isEnabled(),false);assert.equal(await discard().isEnabled(),true);assert.equal(decisions,0)
  await button('重新读取图片','Reload image').click();await decoded();assert.equal(await keep().isEnabled(),true)
  await close();await page.reload();await ready();await close();await pictures();await decoded();assert.equal(decisions,0);assert.equal(jobs.at(-1).state,'candidate')
  await discard().click();await button('重新读取画页记录','Reload illustration records').waitFor();assert.equal(jobs.at(-1).state,'discarded')
  await button('重新读取画页记录','Reload illustration records').click();await button('继续阅读旅程记录','Continue reading the journal').waitFor();assert.equal(await page.locator('.og-illustrations img').count(),0)
  await button('继续阅读旅程记录','Continue reading the journal').click();await button('查看旅途画页','View journey illustrations').waitFor();await close()
  await action('和阿达检修启动机','Repair the starter with Ada');await action('走河谷支线','take the river valley branch')
  assert.equal(await page.locator('.og-game').getAttribute('data-scene'),'train-at-river-valley');assert.equal(await page.locator('.og-game').getAttribute('data-version'),'2')
  await pictures();await north();await button('重新制作（最后一次）','Try again (last attempt)').click();await decoded();assert.equal(jobs.at(-1).attempt,2);assert.equal(jobs.at(-1).sourceVersion,0);assert.equal(jobs.at(-1).scene,'train-at-dead-station')
  assert.equal(jobs.at(-1).asset.sha256,'8734c7e1e1b25bce694f5a0387b20ea523f5ef299aabef67a6ba851ca2f71933')
  await discard().scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/illustration-decision-candidate-${width}-${locale}-platform-layout-local-qa.png`})
  // Keep in one synthetic journey and reject both in the other. These clicks
  // verify persistence, not aesthetic approval of either retained test image.
  loseDecision=true;await (locale==='zh'?keep():discard()).click();await button('重新读取画页记录','Reload illustration records').waitFor()
  await close();await page.reload();await ready();await close();await pictures();await north()
  if(locale==='zh'){
   await decoded();await page.getByText('已保留为这段旅程的环境回忆。',{exact:true}).waitFor();assert.equal(await keep().count(),0);assert.equal(await discard().count(),0)
  }else{
   await page.getByText('Both attempts for this place have been used. Your written journal remains available.',{exact:true}).waitFor();assert.equal(await page.locator('.og-illustrations img').count(),0);assert.equal(await button('重新制作（最后一次）','Try again (last attempt)').count(),0)
  }
  for(const control of await page.locator('.og-illustrations button,.og-illustrations select').all()){const box=await control.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44)}
  await page.screenshot({path:`_qa/ui/illustration-decision-final-${width}-${locale}-platform-layout-local-qa.png`})
  assert.equal(generations,2);assert.equal(decisions,2);assert.equal(await page.locator('.og-game').getAttribute('data-version'),'2');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
  evidence.push({width,height,locale,generations,decisions,finalState:jobs.at(-1).state,candidateSurvivesUnreviewedRefresh:true,undecodedKeepDisabled:true,discardLostReplyRecovered:true,secondDecisionLostReplyRecovered:true,oldSceneRetryFromValley:true,sourceVersion:0,storyVersion:2,originalScene:'train-at-river-valley',writtenJournalFallback:true,noOverflow:true,pageErrors:errors,blockedOrigins:[...blocked],realMediaRequests:0,artAccepted:false,realIPhone:false})
 }catch(e){await page.screenshot({path:`_qa/ui/illustration-decision-failure-${width}-${locale}-platform-layout-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/illustration-decision-browser.json',JSON.stringify(evidence,null,2)+'\n')}
console.log(JSON.stringify(evidence))
