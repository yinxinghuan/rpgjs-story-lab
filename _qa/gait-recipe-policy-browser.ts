import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {spriteGenerationDatabase} from '../src/sprite-generation'
import {GAME_ID} from '../src/game-id'
const origin='http://127.0.0.1:5358',evidence:any[]=[]
const bytes=readFileSync('doc/platform-art-candidates/20260911/actor-edit-03/candidate.png')
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:locale==='zh'?'zh-CN':'en-US'}),errors:string[]=[],blocked=new Set<string>()
 const old={version:1,id:crypto.randomUUID(),recipe:'ada-walk-v1',sessionId:GAME_ID,createdAt:1,state:'failed',retryable:true,nextAt:0,taskId:'synthetic-preserved-task',error:'SPRITE_DOWNLOAD'}
 let taskReads=0,submissions=0
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url())
  if(u.href==='https://game.aiwaves.tech/alteru-media/api/v1/tasks/'+old.taskId){taskReads++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({task_id:old.taskId,request_id:old.id,type:'image',status:'succeeded',media:{type:'image',url:'https://cdn.aiwaves.tech/synthetic-preserved.png',format:'png',width:960,height:1280}})})}
  if(u.href==='https://cdn.aiwaves.tech/synthetic-preserved.png')return r.fulfill({status:200,contentType:'image/png',body:bytes})
  if(u.pathname.endsWith('/images/generations'))submissions++
  if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.add(u.origin);return r.abort()}
  return r.continue()
 })
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b
 await page.addInitScript('window.__name = (fn) => fn')
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.goto(origin+'/creator.html?create_art=sprite')
  const region=page.getByRole('region',{name:t('在线生成素材','Generate art online'),exact:true}),select=page.locator('#sprite-recipe')
  await page.waitForFunction(()=>!(document.querySelector('#sprite-recipe') as HTMLSelectElement)?.disabled)
  assert.equal(await select.inputValue(),'starter-broken-v1');assert.equal(await select.locator('option[value="ada-walk-v1"]').isDisabled(),true)
  await region.getByRole('link',{name:t('使用已有素材继续制作','Continue with existing art')}).click();await page.waitForURL('**/creator.html?create_art=assembly');await page.goBack()
  const name=spriteGenerationDatabase(origin+'/creator.html')
  await page.evaluate(async({name,old})=>{await new Promise<void>((resolve,reject)=>{const request=indexedDB.open(name,1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('records','readwrite'),store=tx.objectStore('records');store.put(old,old.id);store.put(old,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}})},{name,old})
  await page.reload();const resume=region.getByRole('button',{name:t('继续同一生成任务','Resume the same task'),exact:true});await resume.waitFor();assert.equal(await select.inputValue(),'ada-walk-v1');await resume.click()
  const importButton=region.getByRole('button',{name:t('导入这张原图','Import this source'),exact:true});await importButton.waitFor();assert.equal(taskReads,1);assert.equal(submissions,0);assert.equal(await select.inputValue(),'starter-broken-v1')
  await importButton.click();await page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).waitFor()
  await page.reload();await importButton.waitFor();assert.equal(taskReads,1);assert.equal(await select.inputValue(),'starter-broken-v1')
  const record=await page.evaluate(async({name,id})=>new Promise<any>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readonly'),req=tx.objectStore('records').get(id);tx.oncomplete=()=>{db.close();resolve(req.result)}};r.onerror=()=>reject(r.error)}),{name,id:old.id})
  assert.equal(record.state,'ready');assert.equal(record.id,old.id);assert.equal(record.taskId,old.taskId);assert.equal(record.recipe,'ada-walk-v1');assert.ok(record.png?.sha256)
  await select.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/gait-recipe-policy-${width}-${locale}-platform-layout-local-qa.png`})
  for(const e of await region.locator('button,select,a').all()){const b=await e.boundingBox();assert.ok(b&&b.height>=44&&b.width>=44)}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
  evidence.push({width,height,locale,newWalkIntentUnavailable:true,defaultRecipe:'starter-broken-v1',existingArtLinkOpened:true,oldRequestPreserved:true,oldTaskRecovered:true,readySourceImported:true,refreshPreserved:true,taskReads,submissions,externalRequests:0,syntheticMediaResponses:true,noOverflow:true,pageErrors:errors,blockedOrigins:[...blocked],actualIPhone:false})
 }finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/gait-recipe-policy-browser.json',JSON.stringify(evidence,null,2)+'\n')}
console.log(JSON.stringify(evidence))
