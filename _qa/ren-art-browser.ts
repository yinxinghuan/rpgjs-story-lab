import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
import {originalCharacterBodies} from '../src/original-character-space'
const origin='http://127.0.0.1:5339',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any;const errors:string[]=[],assets:string[]=[]
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(new URL(r.url()).pathname.endsWith('/ren-standing-v1.png')&&r.ok())assets.push(r.url());if(r.url().includes('/api/original/sessions')&&r.ok()){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
 const ready=async(v:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error')&&((window as any).__environmentQa?.motion()?.scene===(window as any).__environmentQa?.motion()?.renderedScene),v)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function action(id:string,v:number){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(v);await close()}
 try{
  await page.goto(origin+'/?story=original');await ready(0);await close()
  const id=head.id,bindings=structuredClone(head.assets);assert.equal(bindings.standingCast['ren-medic'],'ren-standing-v1')
  for(const [i,a]of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual'].entries()){
   await action(a,i+1)
   if(i<3)assert.equal(await page.locator('[data-entity$="-ren-medic"]').count(),0)
  }
  const ren=originalGameEntities(head).find(e=>e.person?.id==='ren-medic')!;assert.ok(ren)
  const marker=page.locator('[data-entity="'+ren.id+'"]');assert.ok((await marker.getAttribute('class'))?.includes('og-person'));assert.equal(await marker.locator('svg').count(),0)
  // Approach through the normal interaction, close, then walk into the actual body.
  await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:ren.person!.name,exact:true}).click();await close()
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(650);await page.keyboard.up('ArrowUp');await page.waitForTimeout(250)
  const motion=await page.evaluate(()=>(window as any).__environmentQa.motion()),body=originalCharacterBodies(head).find(b=>b.id==='ren-medic')!;assert.ok(motion.position.y>=body.y+body.h-.01&&motion.position.y<=body.y+body.h+2,JSON.stringify({motion,body}))
  await page.screenshot({path:`_qa/ui/ren-${width}-${lang}-river-collision-local-qa.png`})
  await action('river-treat',5);await page.waitForTimeout(600);await page.screenshot({path:`_qa/ui/ren-${width}-${lang}-river-local-qa.png`})
  await action('river-depart',6);assert.equal(head.sceneId,'train-at-tunnel');await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:ren.person!.name,exact:true}).click();await close();await page.waitForTimeout(2300)
  await page.screenshot({path:`_qa/ui/ren-${width}-${lang}-tunnel-local-qa.png`})
  await page.reload();await ready(6);await page.waitForTimeout(700);assert.equal(head.id,id);assert.deepEqual(head.assets,bindings)
  assert.equal(await page.locator('[data-entity$="-ren-medic"].og-person').count(),1)
  assert.ok(assets.length>=2);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.screenshot({path:`_qa/ui/ren-${width}-${lang}-tunnel-restored-local-qa.png`})
  evidence.push({width,height,lang,journeyPreserved:true,assets:bindings.standingCast,hiddenBeforeRescue:true,riverAndTunnel:true,bodyStop:motion.position,refresh:true,errors,externalConnections:0})
 }catch(e){await page.screenshot({path:`_qa/ui/ren-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/ren-browser-report.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
