import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
const origin='http://127.0.0.1:5334',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any,failAsset=true;const errors:string[]=[],blocked:string[]=[],assets:string[]=[],engineMaps:string[]=[]
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return route.abort()}if(u.pathname.endsWith('.tmx')&&!u.search)engineMaps.push(u.pathname);if(u.pathname.endsWith('/graystone-yard-78f22e9b.png')){assets.push(u.pathname);if(failAsset){failAsset=false;return route.abort('failed')}}return route.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok()){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
 const ready=async(version:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error')&&((window as any).__environmentQa?.motion()?.scene===(window as any).__environmentQa?.motion()?.renderedScene),version)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function action(id:string,expected:number,failed=false){const entity=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(entity,id);const label=entity.person?.name??entity.actions[0].label,choice=entity.actions.find(a=>a.id===id)!.label;await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:choice,exact:true}).click();if(failed){await page.getByRole('alertdialog').waitFor();assert.equal(head.version,expected);return}await ready(expected);await close()}
 try{
 await page.goto(origin+'/?story=original');await ready(0);await close();await action('repair-starter',1)
 await action('commit-quarry-route',1,true);assert.equal(head.sceneId,'train-at-dead-station');await page.getByRole('button',{name:t('重新连接并恢复','Reconnect and recover'),exact:true}).click();await ready(1)
 await action('commit-quarry-route',2);assert.equal(head.sceneId,'train-at-graystone-yard');assert.equal(head.assets.backgrounds['train-at-graystone-yard'],'graystone-yard-platform-78f22e9b')
 const hash=await page.locator('.og-background').evaluate(async(img:HTMLImageElement)=>{const b=await(await fetch(img.src)).arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('')});assert.equal(hash,'78f22e9b4bf42265be03e5db8462ff732b7ed46706f5cea8cf297d0dd3aa2129')
 await action('yard-meet',3);await page.screenshot({path:`_qa/ui/environment-yard-${width}-${lang}-gate-local-qa.png`})
 // Keyboard movement probes the roof without hitting Ada's touch target above it.
 await page.keyboard.down('ArrowLeft');await page.waitForTimeout(450);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(150)
 const start=await page.evaluate(()=>(window as any).__environmentQa.motion());assert.ok(start.position.x>=60&&start.position.x<70)
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(1000);await page.keyboard.up('ArrowDown');await page.waitForTimeout(180)
 const after=await page.evaluate(()=>(window as any).__environmentQa.motion());assert.ok(after.position.y>=228&&after.position.y<=231.01,JSON.stringify(after));assert.ok(Math.hypot(after.position.x-after.renderedPosition.x,after.position.y-after.renderedPosition.y)<1.5)
 assert.ok(engineMaps.some(p=>p.endsWith('/graystone-yard-78f22e9b.tmx')));assert.ok(!engineMaps.some(p=>p.endsWith('/train-at-graystone-yard.tmx')))
 await page.screenshot({path:`_qa/ui/environment-yard-${width}-${lang}-roof-local-qa.png`})
 await action('yard-work-pact',4);assert.equal(head.save.facts['yard-agreement'],'work');await page.screenshot({path:`_qa/ui/environment-yard-${width}-${lang}-pump-local-qa.png`})
 const savedId=head.id;await page.reload();await ready(4);assert.equal(head.id,savedId);assert.equal(head.assets.backgrounds['train-at-graystone-yard'],'graystone-yard-platform-78f22e9b');await page.screenshot({path:`_qa/ui/environment-yard-${width}-${lang}-restored-local-qa.png`})
 await action('yard-first-exit',5);assert.equal(head.sceneId,'train-at-tunnel');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.ok(blocked.every(u=>u==='https://images.aiwaves.tech'))
 evidence.push({width,height,lang,sceneHash:hash,actualRoofCollision:true,engineMaps,failedImageDidNotCommit:true,sameJourneyAfterRefresh:true,pumpWorkPact:true,departedToTunnel:true,version:head.version,actualAssetRequests:assets.length,externalConnections:0,pageErrors:errors,unqualifiedEntities:'Mako and pump are still development markers; this is environment evidence only'})
 }catch(e){await page.screenshot({path:`_qa/ui/environment-yard-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());console.error(head?{version:head.version,scene:head.sceneId,facts:head.save.facts}:{});throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/rpg-environment-browser.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
