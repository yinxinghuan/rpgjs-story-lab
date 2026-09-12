import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {ORIGINAL_RUNTIME_HEADER} from '../src/original-runtime-contract'
const origin='http://127.0.0.1:5360',report:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true})
 let mode='initial',head:any,actionBodies:any[]=[],posts=0,positions=0,documents=0
 const errors:string[]=[],observations:any[]=[]
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url())
  if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return route.abort()
  if(req.isNavigationRequest())documents++
  if(req.method()==='POST')posts++
  if(u.pathname.endsWith('/position'))positions++
  if(u.pathname.endsWith('/actions'))actionBodies.push(req.postDataJSON())
  if(mode==='initial'&&u.pathname.endsWith('/api/original/health')){
   const response=await route.fetch(),body=await response.json();body.runtimeContract='synthetic-next-version';return route.fulfill({response,json:body})
  }
  if(mode==='action'&&u.pathname.endsWith('/actions')){
   mode='idle';const response=await route.fetch();assert.equal(response.status(),200)
   return route.fulfill({response,headers:{...response.headers(),[ORIGINAL_RUNTIME_HEADER.toLowerCase()]:'synthetic-next-version'}})
  }
  if((mode==='directory'&&u.pathname.endsWith('/api/original/sessions')&&req.method()==='GET')||(['selection','checkpoint'].includes(mode)&&u.pathname.endsWith('/position'))){
   mode='idle';return route.fulfill({status:409,contentType:'application/json',json:{error:'RUNTIME_VERSION_MISMATCH'}})
  }
  return route.continue()
 })
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message))
 page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok())try{const body=await r.json(),h=body.head??body;if(h.id&&h.save)head=h}catch{}})
 const ready=(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-error')&&!document.querySelector('.og-loading'),v)
 const close=async()=>{const button=page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true});if(await button.count())await button.click()}
 const pending=()=>page.evaluate(()=>{const s=(window as any).alteruLocalStorage;return Array.from({length:s.length},(_,i)=>s.key(i)).filter((k:any)=>k?.includes('original-story-1-pending-v2:')).map((k:any)=>s.getItem(k)).filter(Boolean)})
 const directory=async()=>{await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.getByRole('button',{name:t('查看与继续旧旅程','View and continue saved journeys'),exact:true}).click()}
 async function recover(stage:string,v:number){
  await page.getByRole('alertdialog').waitFor();const alert=await page.getByRole('alertdialog').innerText()
  assert.match(alert,/RUNTIME_VERSION_MISMATCH/);assert.ok(alert.includes(t('游戏已更新','The game was updated')))
  assert.equal(await page.getByRole('button',{name:t('重新连接并恢复','Reconnect and recover'),exact:true}).count(),0)
  const oldDocuments=documents,p=positions;await page.waitForTimeout(2200);assert.equal(positions,p,'checkpoint must stop after mismatch')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.screenshot({path:`_qa/ui/version-recovery-${stage}-${width}-${locale}-platform-layout-local-qa.png`})
  mode='idle';await page.getByRole('button',{name:t('重新载入游戏并恢复','Reload game and recover'),exact:true}).click();await ready(v);assert.ok(documents>oldDocuments,'must reload document, not only reconnect');await close()
  observations.push({stage,reloadedDocument:true,version:v,checkpointPaused:true})
 }
 try{
  await page.goto(origin);await page.getByRole('alertdialog').waitFor();assert.equal(posts,0,'incompatible initial handshake must not enroll');await recover('initial',0)
  const journey=head.id,assets=structuredClone(head.assets),initial=structuredClone(head.save)
  mode='action';await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();const label=t('和阿达检修启动机','Repair the starter with Ada');await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click()
  await page.getByRole('alertdialog').waitFor();assert.equal((await pending()).length,1);await recover('action',1)
  assert.equal(head.id,journey);assert.deepEqual(head.assets,assets);assert.equal(head.save.stats.condition,initial.stats.condition+5);assert.equal(actionBodies.length,2);assert.deepEqual(actionBodies[0],actionBodies[1]);assert.equal((await pending()).length,0)
  const saved=structuredClone(head.save)
  mode='directory';await directory();await recover('directory',1)
  await directory();mode='selection';await page.getByRole('button',{name:t('保留旧旅程，重新出发','Keep old journeys and start again'),exact:true}).click();await recover('selection',1)
  mode='checkpoint';await recover('checkpoint',1)
  assert.equal(head.id,journey);assert.deepEqual(head.save,saved);assert.deepEqual(head.assets,assets);assert.deepEqual(errors,[])
  report.push({width,height,locale,observations,oneJourneyPreserved:true,actionPosts:actionBodies.length,identicalPendingReplay:true,consequenceAppliedOnce:true,errors,externalConnections:0,realIPhone:false})
 }catch(e){console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-version-recovery-browser.json',JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report))
