import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
const origin='http://127.0.0.1:5364',report:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale,aid,ending]of [[320,568,'zh',false,'bridge-basic'],[390,844,'en',true,'the-last-bridge']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true})
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b,errors:string[]=[],steps:any[]=[];let head:any
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok())try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}})
 const ready=async(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 const route=['repair-starter','commit-quarry-route','yard-meet','yard-force-pump','yard-first-exit','tunnel-inspect','tunnel-captain-led','tunnel-ventilate','tunnel-depart','yard-route-brief','yard-stay','yard-depart','pass-inspect','pass-player-watch','pass-crew-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect',aid?'town-grid-aid':'town-keep-reserve','town-public-rules','town-refuel','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-anchor-crossing','junction-review','junction-'+ending]
 try{
  await page.goto(origin);await ready(0);await close();const id=head.id,bindings=structuredClone(head.assets)
  for(const [i,action]of route.entries()){
   const entity=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===action));assert.ok(entity,action)
   const before=structuredClone(head.save.stats)
   if(action==='junction-the-last-bridge')assert.ok(entity.actions.find(a=>a.id===action)!.label.includes('maintain the foot crossing'))
   await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click()
   await page.getByRole('dialog').getByRole('button',{name:entity.person?.name??entity.actions[0].label,exact:true}).click()
   await page.getByRole('dialog').getByRole('button',{name:entity.actions.find(a=>a.id===action)!.label,exact:true}).click();await ready(i+1);await close()
   assert.equal(head.id,id);assert.deepEqual(head.assets,bindings)
   if(action==='yard-force-pump'){assert.equal(head.save.stats.fuel,before.fuel+20);assert.equal(head.save.stats.condition,before.condition-12);assert.equal(head.save.stats.morale,before.morale-8);assert.equal(head.save.facts['yard-agreement'],'forced')}
   if(action==='yard-stay'){assert.ok(!head.save.partyMemberIds.includes('mara-raider'));assert.ok(!head.save.facts['aid-network-known'])}
   if(action==='bridge-anchor-crossing'){
    assert.equal(head.save.facts['bridge-train-fate'],'anchored');assert.equal(head.sceneId,'train-at-dawn-junction')
    await page.screenshot({path:`_qa/ui/original-forced-bridge-arrival-${width}-${locale}-platform-layout-local-qa.png`})
   }
   if(['yard-force-pump','bridge-anchor-crossing'].includes(action)){const save=structuredClone(head.save);await page.reload();await ready(i+1);assert.deepEqual(head.save,save);assert.deepEqual(head.assets,bindings)}
   steps.push({action,scene:head.sceneId,stats:head.save.stats});console.log(JSON.stringify({width,action,version:head.version}))
  }
  assert.equal(head.save.finale.status,'ready');await page.getByRole('button',{name:t('展开结局','Continue to the ending'),exact:true}).click();await ready(route.length+1)
  const final=structuredClone(head.save.finale);assert.equal(final.ending.anchorFamily,ending);assert.ok(!final.ending.capabilitiesUsed.includes('keep-moving'));assert.ok(!head.save.partyMemberIds.includes('mara-raider'))
  assert.match(final.ending.characterEpilogues.find((p:any)=>p.characterId==='mara-raider').text,locale==='zh'?/强取/:/seizure/)
  assert.ok(!head.save.characters.some((p:any)=>['ren-medic','lin-scout'].includes(p.id)))
  assert.equal(Boolean(head.save.facts['aid-network-known']),aid);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  if(aid){assert.ok(final.ending.irreversibleCosts.some((c:string)=>/maintain the foot crossing/.test(c)));assert.ok(!final.ending.irreversibleCosts.some((c:string)=>/reserve carriage space/.test(c)))}
  await page.screenshot({path:`_qa/ui/original-forced-bridge-ending-${width}-${locale}-platform-layout-local-qa.png`});await page.reload();await ready(route.length+1);assert.deepEqual(head.save.finale,final)
  assert.deepEqual(errors,[]);report.push({width,height,locale,aid,ending,steps,endingRetained:true,forcedCostsRetained:true,castCorrect:true,externalConnections:0,errors,visualReview:'required'})
 }catch(e){await page.screenshot({path:`_qa/ui/original-forced-bridge-failure-${width}-${locale}-platform-layout-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-forced-bridge-browser.json',JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report.map(({steps,...r})=>({...r,actions:steps.length}))))
