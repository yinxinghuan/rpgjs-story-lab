import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalCharacterPresent} from '../src/original-character-presence'
import {environmentStoryRoute} from './environment-story-route'
const origin='http://127.0.0.1:5349',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang,travel]of [[320,568,'zh',true],[390,844,'en',false]]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any;const errors:string[]=[],assets=new Set<string>(),checks:any[]=[]
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{const u=new URL(r.url());if(/\/(lin|mako)-standing-v1\.png$/.test(u.pathname)&&r.ok())assets.add(u.pathname);if(r.url().includes('/api/original/sessions')&&r.ok()){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
 const ready=async(v:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function approach(id:string){const e=originalGameEntities(head).find(e=>e.person?.id===id)!;assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person!.name,exact:true}).click();await close()}
 async function action(id:string,v:number){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(v);await close()}
 async function inspect(action:string){
  const visible:string[]=[]
  for(const id of ['ren-medic','lin-scout','mara-raider']){
   const expected=originalCharacterPresent(head.save,id),marker=page.locator('[data-entity="'+head.sceneId+'-'+id+'"]')
   assert.equal(await marker.count(),expected?1:0,action+':'+id)
   if(expected){assert.ok((await marker.getAttribute('class'))?.includes('og-person'));assert.equal(await marker.locator('svg').count(),0);visible.push(id)}
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  checks.push({action,scene:head.sceneId,visible})
 }

 try{
  await page.goto(origin+'/');await ready(0);await close();const journey=head.id,bindings=structuredClone(head.assets);await inspect('opening')
  const steps=environmentStoryRoute.map(a=>travel?a:({'pine-invite':'pine-stay','yard-invite':'yard-stay','pass-lin-watch':'pass-player-watch','pass-mako-duty':'pass-crew-duty'} as Record<string,string>)[a]??a)
  for(const [i,a]of steps.entries()){
   await action(a,i+1);assert.equal(head.id,journey);assert.deepEqual(head.assets,bindings);await inspect(a)

   if(['pine-invite','pine-stay','yard-invite','yard-stay','pass-debrief','bridge-arrange','junction-review'].includes(a)){
    const person=originalGameEntities(head).find(e=>e.person)?.person;if(person)await approach(person.id)
    await page.waitForTimeout(2300);await page.screenshot({path:`_qa/ui/production-${a}-${width}-${lang}-local-qa.png`});await page.reload();await ready(i+1);await page.waitForTimeout(500);await inspect(a+'-restored');assert.deepEqual(head.assets,bindings)
   }
   console.log(JSON.stringify({width,travel,action:a,version:head.version,scene:head.sceneId}))
  }
  assert.equal(head.save.finale.status,'ready');await page.getByRole('button',{name:t('展开结局','Continue to the ending'),exact:true}).click();await ready(steps.length+1);assert.equal(head.save.finale.status,'complete')
  assert.deepEqual(new Set(head.save.finale.ending.characterEpilogues.map((e:any)=>e.characterId)),new Set(['ada-mechanic','lin-scout','mara-raider']))
  assert.equal(head.save.partyMemberIds.includes('lin-scout'),travel);assert.equal(head.save.partyMemberIds.includes('mara-raider'),travel)
  const ending=structuredClone(head.save.finale.ending);await page.screenshot({path:`_qa/ui/production-ending-${width}-${lang}-local-qa.png`});await page.reload();await ready(steps.length+1);assert.deepEqual(head.save.finale.ending,ending);assert.deepEqual(head.assets,bindings)
  await close();await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.getByRole('button',{name:t('查看与继续旧旅程','View and continue saved journeys'),exact:true}).click();await page.getByRole('button',{name:t('继续之前的车厢旅程','Continue the earlier carriage journey'),exact:true}).click();
  await page.waitForSelector('.cl-app');await page.waitForFunction(()=>!document.querySelector('.cl-loading')&&!document.querySelector('.cl-error'));
  await page.getByRole('button',{name:t('旅程菜单','Journey menu'),exact:true}).click();await page.getByRole('button',{name:t('完整单人旅程','Full single-player journey'),exact:true}).click();await ready(steps.length+1);assert.equal(head.id,journey);assert.deepEqual(head.save.finale.ending,ending);
  assert.equal(assets.size,2);assert.deepEqual(errors,[]);evidence.push({width,height,lang,travel,actions:steps.length,finalVersion:head.version,checks,assets:[...assets],endingRetained:true,errors,externalConnections:0})
 }catch(e){await page.screenshot({path:`_qa/ui/production-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());console.error(head?{version:head.version,scene:head.sceneId}:{});throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/production-browser-report.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
