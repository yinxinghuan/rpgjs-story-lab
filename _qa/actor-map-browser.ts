import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const publishing=process.argv.includes('--publish'),origin=publishing?'http://127.0.0.1:5333':'http://127.0.0.1:5332',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang] of [[320,568,'zh'],[390,844,'en']] as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true}),blocked:string[]=[],errors:string[]=[];let losePublish=true,failActorFile=false;const publications:any[]=[],actorFiles:string[]=[]
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return route.abort()}
  if(publishing&&u.pathname.endsWith('/publish-actor')&&route.request().method()==='POST'){const response=await route.fetch();if(response.ok()){publications.push(await response.json());if(losePublish){losePublish=false;return route.abort('failed')}}return route.fulfill({response})}
  if(publishing&&u.pathname.includes('/actor-releases/')&&u.pathname.endsWith('/file')){actorFiles.push(u.pathname);if(failActorFile){failActorFile=false;return route.abort('failed')}}return route.continue()})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const t=(a:string,b:string)=>lang==='zh'?a:b
 try{
 await page.goto(origin+'/_qa/sprite-creator.html?lang='+lang+'&generation=origin')
 await page.getByRole('button',{name:'Load synthetic QA source',exact:true}).click();await page.locator('#sprite-foot').fill('20')
 const process=()=>page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
 await process();const sheet=page.locator('.cl-actor-review');await sheet.waitFor();await sheet.locator('summary').click()
 for(const d of ['down','left','right','up']){await page.locator('#actor-review-direction').selectOption(d);for(const c of ['facing','alternatingSteps','attachments'])await page.locator('#actor-review-'+c).selectOption('pass')}
 await sheet.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).click();await sheet.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 const draftId=await page.locator('#sprite-history').inputValue()
 await page.getByRole('link',{name:t('在地图里试走这个人物','Try this actor in the map')}).click()
 const trial=page.locator('.cl-actor-map-review'),summary=trial.locator('summary'),scene=page.getByRole('combobox',{name:t('检查场景','Inspect scene'),exact:true})
 await page.getByRole('button',{name:t('返回空地','Return to apron'),exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.cl-loading')&&!(document.querySelector('.cl-original-checks select') as HTMLSelectElement)?.disabled)
 await summary.click()
 async function walk(key:string){await page.keyboard.down(key);await page.waitForTimeout(900);await page.keyboard.up(key);await page.waitForTimeout(180)}
 for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'])await walk(key)
 assert.match(await summary.innerText(),/5\/8/)
 await page.getByRole('button',{name:t('检查车体碰撞','Check train collision'),exact:true}).click();await page.getByText(t('这里不可通行','This area is blocked'),{exact:true}).waitFor();assert.match(await summary.innerText(),/6\/8/)
 await trial.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-map-${width}-${lang}-home-local-qa.png`})
 await scene.selectOption('train-at-river-valley');await page.waitForFunction(()=>document.querySelector('output[data-scene]')?.getAttribute('data-scene')==='train-at-river-valley'&&!document.querySelector('.cl-loading'))
 await summary.click();await summary.click();await walk('ArrowRight');assert.match(await summary.innerText(),/7\/8/);await page.screenshot({path:`_qa/ui/actor-map-${width}-${lang}-river-local-qa.png`})
 await scene.selectOption('train-at-dead-station');await page.waitForFunction(()=>document.querySelector('output[data-scene]')?.getAttribute('data-scene')==='train-at-dead-station'&&!document.querySelector('.cl-loading'))
 await summary.click();await summary.click();await walk('ArrowLeft');assert.match(await summary.innerText(),/8\/8/)
 const save=trial.getByRole('button',{name:t('确认人物画面并保存检查','Confirm actor visuals and save review'),exact:true});await save.click()
 await trial.getByRole('button',{name:t('人物地图检查已保存','Actor map review saved'),exact:true}).waitFor()
 await page.screenshot({path:`_qa/ui/actor-map-${width}-${lang}-saved-local-qa.png`})
 await page.getByRole('link',{name:t('返回人物准备','Back to sprite preparation'),exact:true}).click();await sheet.waitFor();await sheet.locator('summary').click()
 await sheet.getByText(t('此版本已保存地图试走及画面确认','This version has a saved map trial and visual confirmation'),{exact:false}).waitFor()
 const cloud=page.getByRole('region',{name:t('在线人物与设备','Online character and equipment art'),exact:true})
 await cloud.getByRole('button',{name:t('在线保存当前人物或设备','Save current character or equipment online'),exact:true}).click();await cloud.getByText(t('素材与本次人物检查已在线保存','Art and this actor review are saved online'),{exact:false}).waitFor()
 await process();await sheet.waitFor();await cloud.getByRole('button',{name:t('查看在线人物与设备','View online character and equipment art'),exact:true}).click();await cloud.getByRole('button',{name:t('取回此素材及原图','Restore art and originals'),exact:true}).click()
 await cloud.getByText(t('已取回素材及最近一次人物检查','Art and the latest actor review are restored'),{exact:false}).waitFor();assert.equal(await page.locator('#sprite-history').inputValue(),draftId)
 await page.reload();await sheet.waitFor();await sheet.locator('summary').click();await sheet.getByText(t('此版本已保存地图试走及画面确认','This version has a saved map trial and visual confirmation'),{exact:false}).waitFor()
 if(publishing){
  const publish=()=>cloud.getByRole('button',{name:t('公开发布阿达人物版本','Publish Ada character version publicly'),exact:true}).click()
  await publish();await cloud.getByRole('alert').waitFor();assert.equal(publications.length,1)
  await page.reload();await sheet.waitFor();await publish();await cloud.getByText(t('阿达人物版本已发布','Ada character version published'),{exact:false}).waitFor();assert.deepEqual(publications[1],publications[0]);const release=publications[0]
  await cloud.getByRole('button',{name:t('公开发布阿达人物版本','Publish Ada character version publicly'),exact:true}).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`_qa/ui/actor-published-${width}-${lang}-creator-local-qa.png`})
  failActorFile=true;await cloud.getByRole('link',{name:t('用此阿达进入独立旅程','Enter a separate journey with this Ada'),exact:true}).click()
  await page.getByRole('alertdialog').waitFor();assert.equal(await page.locator('.og-game').getAttribute('data-actor-version'),release.id)
  await page.getByRole('button',{name:t('重新连接并恢复','Reconnect and recover'),exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.og-game')?.getAttribute('data-version')==='0'&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'))
  const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
  await close();await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:t('阿达','Ada'),exact:true}).click()
  await page.getByRole('dialog').getByRole('heading',{name:t('阿达','Ada'),exact:true}).waitFor();await close()
  async function photograph(direction:'down'|'left'|'right'|'up',name:string){const bytes=await page.screenshot({path:`_qa/ui/actor-published-${width}-${lang}-${name}-local-qa.png`}),p=PNG.sync.read(bytes),colors=[[25,80,100],[145,85,25],[30,85,170],[125,45,145]],counts=colors.map(()=>0);for(let i=0;i<p.data.length;i+=4)for(let c=0;c<colors.length;c++)if(colors[c].every((v,j)=>Math.abs(p.data[i+j]-v)<5))counts[c]++;const selected=['down','left','right','up'].indexOf(direction);assert.ok(counts[selected]>50&&counts.every((n,i)=>i===selected||counts[selected]>n*4),`${direction} actual rendered diagnostic pixels: ${counts}`)}
  await photograph('down','ada')
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');await page.waitForTimeout(180)
  await photograph('right','right')
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(900);await page.keyboard.up('ArrowUp');await page.waitForTimeout(180)
  await photograph('up','back')
  async function nearby(label:string){await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).waitFor();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.og-loading')&&!document.querySelector('.og-error'));await close()}
  await nearby(t('和阿达检修启动机','Repair the starter with Ada'));assert.equal(await page.locator('.og-game').getAttribute('data-version'),'1')
  await nearby(t('走河谷支线','take the river valley branch'));assert.equal(await page.locator('.og-game').getAttribute('data-scene'),'train-at-river-valley')
  assert.equal(await page.locator('.og-game').getAttribute('data-actor-version'),release.id);await page.reload();await page.waitForFunction(()=>document.querySelector('.og-game')?.getAttribute('data-version')==='2'&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'))
  assert.equal(await page.locator('.og-game').getAttribute('data-version'),'2');assert.equal(await page.locator('.og-game').getAttribute('data-actor-version'),release.id)
  await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:t('阿达','Ada'),exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:t('阿达','Ada'),exact:true}).waitFor();await close()
  await photograph('down','river')
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');await page.waitForTimeout(180)
  await photograph('left','left')
  evidence.push({width,height,lang,releaseId:release.id,publishReplies:publications.length,lostPublishReplyRecovered:true,missingActorRecovered:true,actorFileRequests:actorFiles.length,originalVersion:2,originalScene:'train-at-river-valley',actorVersionRetained:true,syntheticDiagnosticOnly:true})
  await page.goto(origin+'/creator.html?create_art=sprite');await sheet.waitFor()
 }
 await page.getByRole('button',{name:t('载入阿达候选（方向尚未通过）','Load Ada candidate (directions unapproved)'),exact:true}).click();await page.locator('#sprite-foot').fill('300');await process();await sheet.waitFor();await sheet.locator('summary').click();await page.locator('#actor-review-alternatingSteps').selectOption('fail');await sheet.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).click();await sheet.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 await page.getByRole('link',{name:t('在地图里试走这个人物','Try this actor in the map')}).click();await trial.waitFor();await summary.click()
 await trial.getByRole('status').waitFor();assert.equal(await trial.getByRole('button',{name:t('确认人物画面并保存检查','Confirm actor visuals and save review'),exact:true}).isEnabled(),false)
 await page.waitForFunction(()=>!document.querySelector('.cl-loading'));await trial.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-map-${width}-${lang}-ada-rejected-local-qa.png`})
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.ok(blocked.every(b=>b==='https://images.aiwaves.tech'))
 evidence.push({width,height,lang,syntheticDraftId:draftId,checks:8,onlineRestoreWithMap:true,reloadRetainsMap:true,adaNotApproved:true,visualApproval:'synthetic fixture only; no real actor admitted',externalConnections:0,blockedOrigins:[...new Set(blocked)],pageErrors:errors})
 }catch(e){await page.screenshot({path:`_qa/ui/actor-map-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync(publishing?'/private/tmp/rpg-actor-publication-browser.json':'/private/tmp/rpg-actor-map-browser.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
