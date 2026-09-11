import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
const origin=process.argv[2]??'http://127.0.0.1:5350',report:any[]=[]
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('LOCAL_QA_ONLY')
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any,lastPosition:any,positionCount=0,loaded=false
 const errors:string[]=[],t=(a:string,b:string)=>locale==='zh'?a:b
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{try{const u=new URL(r.url());if(u.pathname.endsWith('/brake-parts-v1.png')&&r.ok())loaded=true;if(r.ok()&&u.pathname.includes('/api/original/sessions/')){const b=await r.json(),h=b.head??b;if(h.id&&h.save)head=h;if(u.pathname.endsWith('/position')){lastPosition=b.position;positionCount++}}else if(r.ok()&&u.pathname.endsWith('/api/original/sessions')){const b=await r.json();if(b.save)head=b}}catch{}})
 const ready=async(v:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function open(id:string){const e=originalGameEntities(head).find(e=>e.id===id)!;assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0]?.label??e.label,exact:true}).click();await page.getByRole('dialog').locator('h2').waitFor()}
 async function action(id:string,v:number){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id))!;await open(e.id);await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(v);await close()}
 try{
  await page.goto(origin+'/');await ready(0);await close();assert.equal(loaded,true);const journey=head.id,initial=structuredClone(head)
  await open('brakes');await page.locator('.og-brake-detail[data-state="cracked"]').waitFor();await page.screenshot({path:`_qa/ui/brake-${width}-${locale}-cracked-local-qa.png`});await close()
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(650);await page.keyboard.up('ArrowUp');const seen=positionCount;await page.waitForTimeout(2300);assert.ok(positionCount>seen);assert.ok(lastPosition.y>=172&&lastPosition.y<174,JSON.stringify(lastPosition));const blockedPosition={...lastPosition};await page.screenshot({path:`_qa/ui/brake-${width}-${locale}-collision-local-qa.png`})
  await action('inspect-brakes',1);assert.equal(head.save.facts['brake-hose-warning'],true)
  await action('replace-brake-hose',2);assert.equal(head.save.stats.condition,initial.save.stats.condition+10);assert.equal(head.save.inventory.find((i:any)=>i.id==='spare-hose')?.count??0,0)
  await open('brakes');await page.locator('.og-brake-detail[data-state="replaced"]').waitFor();assert.equal(await page.locator('.og-sheet form').count(),0);assert.equal(await page.getByRole('button',{name:t('开启在线行动理解','Turn on online action understanding'),exact:true}).count(),0);await page.screenshot({path:`_qa/ui/brake-${width}-${locale}-replaced-local-qa.png`});await close()
  await page.reload();await ready(2);assert.equal(head.id,journey);await open('brakes');await page.locator('.og-brake-detail[data-state="replaced"]').waitFor();await close()
  await action('repair-starter',3);await action('commit-valley-route',4);await page.reload();await ready(4);assert.equal(head.id,journey);assert.equal(head.save.facts['brake-hose-replaced'],true);assert.equal(head.save.stats.condition,initial.save.stats.condition+15);assert.equal(head.save.inventory.find((i:any)=>i.id==='spare-hose')?.count??0,0)
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  report.push({width,height,locale,journey,blockedPosition,loaded,oldFaultActionRemoved:true,reloadAndDepartureRetained:true,stats:head.save.stats,errors,externalConnections:0});console.log(JSON.stringify(report.at(-1)))
 }catch(e){await page.screenshot({path:`_qa/ui/brake-${width}-${locale}-failure-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/brake-browser-report.json',JSON.stringify(report,null,2))
