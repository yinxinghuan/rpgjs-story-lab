import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {originalGameEntities} from '../src/original-game-projection'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const origin='http://127.0.0.1:5343',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang,running]of [[320,568,'zh',true],[390,844,'en',false]]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any;const errors:string[]=[],assets=new Set<string>()
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{const u=new URL(r.url());if(/\/fan-(housing|rotor)-v1\.png$/.test(u.pathname)&&r.ok())assets.add(u.pathname);if(r.url().includes('/api/original/sessions')&&r.ok()){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
 const ready=async(v:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error')&&((window as any).__environmentQa?.motion()?.scene===(window as any).__environmentQa?.motion()?.renderedScene),v)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function action(id:string,v:number){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(v);await close()}
 const device=()=>page.evaluate(()=>(window as any).__fanQa())
 async function ground(x:number,y:number){const point=await page.locator('.og-map').evaluate((el,p)=>{const r=el.getBoundingClientRect();return{x:r.x+(p.x+4.5)/384*r.width,y:r.y+(p.y+15)/576*r.height}},{x,y});await page.mouse.click(point.x,point.y);await page.waitForFunction(p=>{const m=(window as any).__environmentQa.motion();return Math.hypot(m.position.x-p.x,m.position.y-p.y)<2},{x,y})}
 async function observe(){
  if(!running){const ada=originalGameEntities(head).find(e=>e.person?.id==='ada-mechanic')!;await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:ada.person!.name,exact:true}).click();await close();await ground(112,240);await ground(112,184)}
  const clip=await page.locator('.og-map').evaluate(el=>{const b=el.getBoundingClientRect(),s=b.width/384;return{x:Math.round(b.x+94*s),y:Math.round(b.y+124*s),width:Math.round(32*s),height:Math.round(38*s)}})
  const samples:any[]=[],frames:any[]=[]
  for(let i=0;i<4;i++){await page.waitForTimeout(110);samples.push(await device());frames.push(PNG.sync.read(await page.screenshot({clip})))}
  const poses=samples.map(s=>s['art-fan-rotor'].animation);assert.ok(samples.every(s=>s['art-fan-housing'].animation==='stand'));assert.equal(new Set(poses).size>1,running)
  if(!running)assert.ok(poses.every(p=>p==='stopped'))
  let changed=0,roofChanged=0;const roofRows=Math.floor(frames[0].height*9/38)
  for(let k=1;k<frames.length;k++)for(let i=0;i<frames[0].data.length;i++)if(frames[0].data[i]!==frames[k].data[i]){changed++;if(i<roofRows*frames[0].width*4)roofChanged++}
  assert.equal(changed>0,running,'Actual pixels must rotate only on the fuel branch');assert.equal(roofChanged,0,'The housing roof must stay pixel-identical')
  return {poses,changed,roofChanged}
 }
 try{
  await page.goto(origin+'/?story=original');await ready(0);await close();const id=head.id,bindings=structuredClone(head.assets)
  for(const [i,a]of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect'].entries())await action(a,i+1)
  assert.equal((await device())['art-fan-rotor'].animation,'stopped')
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');await page.waitForTimeout(150);const stop=await page.evaluate(()=>(window as any).__environmentQa.motion().position);assert.ok(stop.y>=163-.01&&stop.y<=165,JSON.stringify(stop))
  await page.screenshot({path:`_qa/ui/fan-${width}-${lang}-stopped-collision-local-qa.png`})
  await action('tunnel-doctor-led',8);const fuel=head.save.stats.fuel;await action(running?'tunnel-ventilate':'tunnel-discard',9);assert.equal(head.save.stats.fuel,fuel-(running?8:0));const observed=await observe()
  await page.screenshot({path:`_qa/ui/fan-${width}-${lang}-${running?'running':'discarded'}-local-qa.png`})
  await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.waitForTimeout(100);const paused=await device();await page.waitForTimeout(300);assert.deepEqual(await device(),paused);await close()
  const saved=structuredClone(head);await page.waitForTimeout(2300);await page.reload();await ready(9);assert.equal(head.id,id);assert.deepEqual(head.assets,bindings);assert.equal(head.save.stats.fuel,saved.save.stats.fuel);assert.equal(head.save.facts['tunnel-cargo-policy'],running?'retained':'abandoned')
  const restored=await observe();await action('tunnel-depart',10);assert.equal(head.sceneId,'train-at-graystone-yard');assert.equal(head.id,id)
  assert.equal(assets.size,2);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  evidence.push({width,height,lang,running,observed,restored,collisionStop:stop,menuPaused:true,refreshWithoutRecharging:true,departed:true,errors,externalConnections:0})
 }catch(e){await page.screenshot({path:`_qa/ui/fan-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());console.error(await device());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/fan-browser-report.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
