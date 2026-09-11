import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
import {originalBackgroundReleases} from '../src/original-asset-releases'
import {originalEnvironmentLayouts} from '../src/original-environment-layouts'
import {environmentStoryRoute} from './environment-story-route'
const origin='http://127.0.0.1:5335',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let head:any,failAsset=true;const errors:string[]=[],blocked:string[]=[],engineMaps:string[]=[],checked:any[]=[]
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return route.abort()}if(u.pathname.endsWith('.tmx')&&!u.search)engineMaps.push(u.pathname);if(u.pathname.endsWith('/pine-line-90af55e7.png')&&failAsset){failAsset=false;return route.abort('failed')}return route.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok()){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
 const ready=async(version:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error')&&((window as any).__environmentQa?.motion()?.scene===(window as any).__environmentQa?.motion()?.renderedScene),version)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function action(id:string,expected:number,failed=false){const entity=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(entity,id);const label=entity.person?.name??entity.actions[0].label,choice=entity.actions.find(a=>a.id===id)!.label;await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:choice,exact:true}).click();if(failed){await page.getByRole('alertdialog').waitFor();assert.equal(head.version,expected);return}await ready(expected);await close()}
 async function checkEnvironment(roofY:number){
  const id=head.assets.backgrounds[head.sceneId],release=originalBackgroundReleases[id],layout=originalEnvironmentLayouts[id];assert.ok(layout)
  const hash=await page.locator('.og-background').evaluate(async(img:HTMLImageElement)=>{const b=await(await fetch(img.src)).arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('')});assert.equal(hash,release.sha256)
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(450);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(150)
  const start=await page.evaluate(()=>(window as any).__environmentQa.motion());assert.ok(start.position.x>=60&&start.position.x<70,JSON.stringify(start))
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(1000);await page.keyboard.up('ArrowDown');await page.waitForTimeout(180)
  const motion=await page.evaluate(()=>(window as any).__environmentQa.motion());assert.ok(motion.position.y>=roofY-3&&motion.position.y<=roofY+.01,JSON.stringify(motion));assert.ok(Math.hypot(motion.position.x-motion.renderedPosition.x,motion.position.y-motion.renderedPosition.y)<1.5)
  assert.ok(engineMaps.some(p=>p.endsWith(layout.map.path.slice(1))));assert.ok(!engineMaps.some(p=>p.endsWith('/'+head.sceneId+'.tmx')))
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.screenshot({path:`_qa/ui/environment-${head.sceneId}-${width}-${lang}-roof-local-qa.png`});checked.push({scene:head.sceneId,hash,versionedEngineMap:layout.map.path,roofCollision:motion.position,logicalSceneMatchesRendered:true})
 }
 try{
 await page.goto(origin+'/?story=original');await ready(0);await close()
 const idRef=()=>head.id;let journeyId='',bindings:any
 for(const [i,id]of environmentStoryRoute.entries()){
  if(id==='commit-forest-route'){await action(id,i,true);assert.equal(head.sceneId,'train-at-dead-station');await page.getByRole('button',{name:t('重新连接并恢复','Reconnect and recover'),exact:true}).click();await ready(i)}
  await action(id,i+1);if(!journeyId){journeyId=idRef();bindings=structuredClone(head.assets)}assert.equal(head.id,journeyId);assert.deepEqual(head.assets,bindings)
  const roof=({'pine-inspect':235,'tunnel-inspect':233,'town-inspect':229} as Record<string,number>)[id];if(roof)await checkEnvironment(roof)
  if(id==='pine-invite'||id==='tunnel-ventilate'||id==='town-pack-kit'){await page.screenshot({path:`_qa/ui/environment-${head.sceneId}-${width}-${lang}-action-local-qa.png`});await page.reload();await ready(i+1);assert.equal(head.id,journeyId);assert.deepEqual(head.assets,bindings)}
  console.log(JSON.stringify({width,action:id,version:head.version,scene:head.sceneId}))
 }
 assert.equal(head.save.finale.status,'ready');await page.getByRole('button',{name:t('展开结局','Continue to the ending'),exact:true}).click();await ready(environmentStoryRoute.length+1);assert.equal(head.save.finale.status,'complete');await page.screenshot({path:`_qa/ui/environment-full-story-${width}-${lang}-ending-local-qa.png`});await page.reload();await ready(environmentStoryRoute.length+1);assert.equal(head.id,journeyId);assert.equal(head.save.finale.status,'complete');assert.deepEqual(head.assets,bindings)
 assert.deepEqual(errors,[]);assert.ok(blocked.every(u=>u==='https://images.aiwaves.tech'));assert.equal(checked.length,3)
 evidence.push({width,height,lang,checked,failedImageDidNotCommit:true,refreshes:4,fixedAssetsThroughEnding:true,actions:environmentStoryRoute.length,finalVersion:head.version,externalConnections:0,pageErrors:errors,limits:'Local synthetic run only; characters/equipment and pass/bridge/junction art still incomplete. Not a platform playthrough.'})
 }catch(e){await page.screenshot({path:`_qa/ui/environment-story-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());console.error(head?{version:head.version,scene:head.sceneId,facts:head.save.facts}:{});throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/rpg-environment-story-browser.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
