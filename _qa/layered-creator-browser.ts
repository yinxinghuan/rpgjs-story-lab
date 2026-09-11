import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {originalGameEntities} from '../src/original-game-projection'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const cloudTest=process.argv.includes('--cloud'),origin=cloudTest?'http://127.0.0.1:5347':'http://127.0.0.1:5345',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang] of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true}),errors:string[]=[],blocked:string[]=[]
 let losePart=cloudTest,losePublish=cloudTest;const requests:string[]=[]
 await context.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return r.abort()}if(cloudTest&&r.request().method()==='POST'&&u.pathname.includes('/layers/')){requests.push(u.pathname);if(losePart&&u.pathname.endsWith('/parts')){losePart=false;const response=await r.fetch();assert.equal(response.ok(),true);return r.abort('failed')}if(losePublish&&u.pathname.endsWith('/publish')){losePublish=false;const response=await r.fetch();assert.equal(response.ok(),true);return r.abort('failed')}}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b;page.on('pageerror',e=>errors.push(e.message))
 try{
 await page.goto(origin+'/creator.html?create_art=sprite');await page.getByRole('link',{name:t('制作固定机壳与旋转部件','Prepare a housing and rotating part'),exact:true}).click()
 await page.getByRole('button',{name:t('载入平台通风机原图','Load platform fan source'),exact:true}).click()
 await page.locator('#layer-housingScale').waitFor();if(cloudTest)await page.locator('#layer-periodMs').fill('1600');const sourceId=await page.locator('#layer-history').inputValue()
 await page.getByRole('button',{name:t('处理并保存分层候选','Process and save layered candidate'),exact:true}).click()
 const mapLink=page.getByRole('link',{name:t('在地图里检查分层设备','Inspect layered device in the map'),exact:true});await mapLink.waitFor();const firstId=await page.locator('#layer-history').inputValue();assert.notEqual(firstId,sourceId)
 await page.reload();await mapLink.waitFor();assert.equal(await page.locator('#layer-history').inputValue(),firstId);assert.equal(await page.locator('#layer-rotorScale').inputValue(),'0.046')
 assert.equal(await page.locator('.cl-sprite__preview img').count(),3);await page.locator('.cl-sprite__preview img').nth(2).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`_qa/ui/layered-creator-${width}-${lang}-cutouts-local-qa.png`})
 await mapLink.click();await page.waitForFunction(()=>!!(window as any).__layerRenderer&&!document.querySelector('.cl-loading'))
 const panel=page.getByRole('region',{name:t('分层设备检查','Layered device checks'),exact:true}),summary=panel.locator('summary')
 const poses=()=>page.evaluate(()=>(window as any).__layerPoses()),position=()=>page.evaluate(()=>(window as any).__layerRenderer.position())
 await page.getByRole('button',{name:t('走到机座前','Walk in front of base'),exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).__layerRenderer.position();return Math.hypot(p.x-104,p.y-164)<1})
 await page.getByRole('button',{name:t('检查机座阻挡','Check base collision'),exact:true}).click();await page.getByText(t('这里不可通行','This area is blocked'),{exact:true}).waitFor();assert.deepEqual(await position(),{x:104,y:164})
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(700);await page.keyboard.up('ArrowUp');const collision=await position();assert.ok(collision.y>=163&&collision.y<164)
 await page.getByRole('button',{name:t('走到机座前','Walk in front of base'),exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).__layerRenderer.position();return Math.hypot(p.x-104,p.y-164)<1})
 async function frames(){const list:Buffer[]=[],names:any[]=[];const clip=await page.locator('.cl-map-frame').evaluate(el=>{const r=el.getBoundingClientRect(),s=r.width/384;return{x:r.x+90*s,y:r.y+123*s,width:40*s,height:40*s}});for(let i=0;i<4;i++){names.push(await poses());list.push(await page.screenshot({clip}));await page.waitForTimeout(130)}const a=PNG.sync.read(list[0]);let changed=0,roofChanged=0;for(const b of list.slice(1)){const d=PNG.sync.read(b);assert.equal(d.width,a.width);for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const k=(y*a.width+x)*4;if([0,1,2].some(c=>a.data[k+c]!==d.data[k+c])){changed++;if(y<a.height*.25)roofChanged++}}}return {names,changed,roofChanged}}
 const stopped=await frames();assert.equal(stopped.changed,0)
 await page.getByRole('button',{name:t('运行叶轮','Run rotor'),exact:true}).click();await page.waitForTimeout(cloudTest?1800:1500);const running=await frames();assert.ok(running.changed>20);assert.equal(running.roofChanged,0)
 await page.screenshot({path:`_qa/ui/layered-creator-${width}-${lang}-running-local-qa.png`})
 await page.getByRole('button',{name:t('停止叶轮','Stop rotor'),exact:true}).click();const stoppedAgain=await poses();await page.waitForTimeout(400);assert.deepEqual(await poses(),stoppedAgain)
 await page.getByRole('button',{name:t('走到机座后','Walk behind base'),exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).__layerRenderer.position();return Math.hypot(p.x-104,p.y-128)<1})
 await summary.click();await page.waitForFunction(()=>document.querySelector('.cl-layer-review summary')?.textContent?.includes('5/5'));const approve=page.getByRole('button',{name:t('确认分层画面并保存检查','Confirm layered visuals and save review'),exact:true});assert.equal(await approve.isEnabled(),true)
 // Exercise explicit confirmation in an isolated test draft; screenshots receive a separate visual review.
 await approve.click();await page.getByRole('button',{name:t('分层地图检查已保存','Layered map review saved'),exact:true}).waitFor()
 await page.screenshot({path:`_qa/ui/layered-creator-${width}-${lang}-review-local-qa.png`})
 await summary.click();await page.getByRole('combobox',{name:t('检查场景','Inspect scene'),exact:true}).selectOption('train-at-river-valley');await page.waitForFunction(()=>document.querySelector('output[data-scene]')?.getAttribute('data-scene')==='train-at-river-valley'&&!document.querySelector('.cl-loading'))
 await page.getByRole('button',{name:t('走到机座前','Walk in front of base'),exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).__layerRenderer.position();return Math.hypot(p.x-276,p.y-424)<1});await page.screenshot({path:`_qa/ui/layered-creator-${width}-${lang}-river-local-qa.png`})
 await page.getByRole('link',{name:t('返回分层设备准备','Back to layered preparation'),exact:true}).click();await page.getByText(t('此保存版本已记录地图画面确认；在线发布状态见下方。','Map visual confirmation is recorded for this saved version; see publication status below.'),{exact:true}).waitFor()
 await page.reload();await page.locator('#layer-periodMs').fill(cloudTest?'1800':'1600');await page.getByRole('button',{name:t('处理并保存分层候选','Process and save layered candidate'),exact:true}).click();await page.waitForFunction(old=>(document.querySelector('#layer-history') as HTMLSelectElement)?.value!==old&&!!document.querySelector('a[href*="layered_draft"]'),firstId)
 assert.equal(await page.getByText(t('此保存版本已记录地图画面确认；在线发布状态见下方。','Map visual confirmation is recorded for this saved version; see publication status below.'),{exact:true}).count(),0)
 await page.locator('#layer-history').selectOption(firstId);await page.waitForFunction(expected=>(document.querySelector('#layer-periodMs') as HTMLInputElement)?.value===expected,cloudTest?'1600':'1200');await page.getByText(t('此保存版本已记录地图画面确认；在线发布状态见下方。','Map visual confirmation is recorded for this saved version; see publication status below.'),{exact:true}).waitFor()

 let cloudEvidence:any
 if(cloudTest){
  const online=page.getByRole('region',{name:t('在线分层设备','Online layered devices'),exact:true})
  await online.getByRole('button',{name:t('在线保存当前分层设备','Save layered device online'),exact:true}).click();await online.getByRole('alert').waitFor()
  await online.getByRole('button',{name:t('在线保存当前分层设备','Save layered device online'),exact:true}).click();await online.getByText(t('原图、两层素材、参数与当前检查已在线保存。','Original, both layers, settings and current review saved online.'),{exact:true}).waitFor()
  await online.getByRole('button',{name:t('公开发布通风机版本','Publish fan version publicly'),exact:true}).click();await online.getByRole('alert').waitFor()
  await online.getByRole('button',{name:t('公开发布通风机版本','Publish fan version publicly'),exact:true}).click();await online.getByRole('link',{name:t('用此通风机进入独立旅程','Enter a separate journey with this fan'),exact:true}).waitFor()
  const href=await online.getByRole('link',{name:t('用此通风机进入独立旅程','Enter a separate journey with this fan'),exact:true}).getAttribute('href'),releaseId=new URL(href!,origin).searchParams.get('fan_release')!
  await page.reload();await online.getByRole('button',{name:t('查看在线分层设备','View online layered devices'),exact:true}).click();await online.getByRole('button',{name:t('取回此分层设备及原图','Restore layered device and original'),exact:true}).click();await online.getByText(t('原图、两层素材、参数与已保存检查已取回。','Original, both layers, settings and saved review restored.'),{exact:true}).waitFor()
  assert.equal(await page.locator('#layer-periodMs').inputValue(),'1600');assert.equal(await page.locator('#layer-history').inputValue(),firstId)
  let head:any;const loaded=new Set<string>()
  page.on('response',async r=>{if(r.ok()&&r.url().includes('/layer-releases/')&&/\/(housing|rotor)$/.test(new URL(r.url()).pathname))loaded.add(r.url());if(r.ok()&&r.url().includes('/api/original/sessions')){try{const b=await r.json(),h=b.head??b;if(h.id&&h.save&&(!head||h.version>=head.version))head=h}catch{}}})
  await online.getByRole('link',{name:t('用此通风机进入独立旅程','Enter a separate journey with this fan'),exact:true}).click()
  const ready=async(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)
  await ready(0);assert.equal(head.assets.fan.id,releaseId);assert.equal(head.assets.fan.spec.periodMs,1600);assert.equal(loaded.size,2);if(await page.getByRole('dialog').count())await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
  const actions=['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led',lang==='zh'?'tunnel-ventilate':'tunnel-discard']
  for(const [i,id] of actions.entries()){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(i+1);await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()}
  const sample=()=>page.evaluate(()=>(window as any).__fanQa()),initial=await sample();await page.waitForTimeout(260);const later=await sample();assert.equal(initial['art-fan-housing'].animation,'stand');assert.equal(later['art-fan-housing'].animation,'stand');assert.equal(initial['art-fan-rotor'].animation!==later['art-fan-rotor'].animation,lang==='zh')
  const fuel=head.save.stats.fuel,sessionId=head.id;await page.screenshot({path:`_qa/ui/layered-cloud-${width}-${lang}-story-local-qa.png`});await page.reload();await ready(9);assert.equal(head.id,sessionId);assert.equal(head.save.stats.fuel,fuel);assert.equal(head.assets.fan.id,releaseId)
  cloudEvidence={releaseId,loaded:[...loaded],lostPartRecovered:!losePart,lostPublishRecovered:!losePublish,restoredSettings:true,sessionId,storyVersion:9,fuel,state:head.save.facts['tunnel-cargo-policy'],initial,later,requestCount:requests.length}
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
 evidence.push({cloud:cloudEvidence,width,height,lang,sourceId,firstId,stopped,running,collision,checks:5,refreshRestores:true,changedSpecForksReview:true,oldReviewRetained:true,river:true,errors,blocked:[...new Set(blocked)]})
 }catch(e){await page.screenshot({path:`_qa/ui/layered-creator-${width}-${lang}-failure-local-qa.png`});throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync(cloudTest?'/private/tmp/layer-cloud-browser-report.json':'/private/tmp/layer-browser-report.json',JSON.stringify(evidence,null,2)+'\n')}
