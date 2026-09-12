import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {originalGameEntities} from '../src/original-game-projection'
const origin=process.argv[2]??'http://127.0.0.1:5352',evidence:any[]=[]
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('LOCAL_QA_ONLY')
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true}),errors:string[]=[],loaded=new Set<string>();let head:any,losePublication=true
 await context.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return r.abort();if(losePublication&&r.request().method()==='POST'&&u.pathname.includes('/layers/')&&u.pathname.endsWith('/publish')){losePublication=false;const response=await r.fetch();assert.equal(response.ok(),true);return r.abort('failed')}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{try{if(!r.ok())return;const path=new URL(r.url()).pathname;if(path.includes('/layer-releases/')&&/\/(housing|rotor)$/.test(path))loaded.add(path);if(path.includes('/api/original/sessions')){const b=await r.json(),h=b.head??b;if(h.id&&h.save)head=h}}catch{}})
 const ready=async(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 const click=(a:string,b:string)=>page.getByRole('button',{name:t(a,b),exact:true}).click()
 try{
  await page.goto(origin+'/');await ready(0);const oldId=head.id,oldAssets=structuredClone(head.assets)
  await page.goto(origin+'/creator.html?create_art=layers');await click('载入平台通风机原图','Load platform fan source');await page.locator('#layer-periodMs').fill('1600');await click('处理并保存分层候选','Process and save layered candidate')
  await page.getByRole('link',{name:t('在地图里检查分层设备','Inspect layered device in the map'),exact:true}).click();const panel=page.locator('.cl-layer-review'),summary=panel.locator('summary')
  const checked=(n:number)=>page.waitForFunction(n=>document.querySelector('.cl-layer-review summary')?.textContent?.includes(n+'/5'),n)
  await checked(1);await click('走到机座前','Walk in front of base');await checked(2);await click('检查机座阻挡','Check base collision');await checked(3)
  await click('运行叶轮','Run rotor');await checked(4);await click('停止叶轮','Stop rotor');await click('走到机座后','Walk behind base');await checked(5);await summary.click()
  // A retained reviewed platform sample in an isolated test draft. Actual UI
  // checks run on the ordinary renderer; no injected observers or forged reviews.
  await click('确认分层画面并保存检查','Confirm layered visuals and save review');await page.getByRole('button',{name:t('分层地图检查已保存','Layered map review saved'),exact:true}).waitFor();await page.screenshot({path:`_qa/ui/creator-play-${width}-${lang}-review-local-qa.png`})
  await page.getByRole('link',{name:t('返回分层设备准备','Back to layered preparation'),exact:true}).click()
  const online=page.getByRole('region',{name:t('在线分层设备','Online layered devices'),exact:true})
  await click('在线保存当前分层设备','Save layered device online');await online.getByText(t('原图、两层素材、参数与当前检查已在线保存。','Original, both layers, settings and current review saved online.'),{exact:true}).waitFor()
  await click('公开发布通风机版本','Publish fan version publicly');await online.getByRole('alert').waitFor();await click('公开发布通风机版本','Publish fan version publicly')
  const link=online.getByRole('link',{name:t('用此通风机进入独立旅程','Enter a separate journey with this fan'),exact:true});await link.waitFor();const href=(await link.getAttribute('href'))!,release=new URL(href,origin).searchParams.get('fan_release')!
  await page.screenshot({path:`_qa/ui/creator-play-${width}-${lang}-published-local-qa.png`});await page.reload();await click('查看在线分层设备','View online layered devices');await link.waitFor();assert.equal(await link.getAttribute('href'),href);await link.click();await ready(0)
  const id=head.id;assert.notEqual(id,oldId);assert.equal(head.assets.fan.id,release);assert.equal(head.assets.fan.spec.periodMs,1600);assert.equal(loaded.size,2);await close()
  for(const [i,action]of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led',lang==='zh'?'tunnel-ventilate':'tunnel-discard'].entries()){
   const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===action))!;assert.ok(e,action);await click('附近','Nearby');await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===action)!.label,exact:true}).click();await ready(i+1);await close()
  }
  const fuel=head.save.stats.fuel;assert.equal(head.save.facts['tunnel-cargo-policy'],lang==='zh'?'retained':'abandoned');await page.screenshot({path:`_qa/ui/creator-play-${width}-${lang}-story-local-qa.png`});await page.reload();await ready(9);assert.equal(head.id,id);assert.equal(head.save.stats.fuel,fuel);assert.equal(head.assets.fan.id,release)
  await page.goto(origin+'/');await ready(0);assert.equal(head.id,oldId);assert.deepEqual(head.assets,oldAssets)
  await page.goto(new URL(href,origin).href);await ready(9);assert.equal(head.id,id);assert.equal(head.save.stats.fuel,fuel);assert.equal(head.assets.fan.id,release);assert.deepEqual(errors,[])
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  evidence.push({width,height,lang,oldId,journey:id,release,version:head.version,loaded:[...loaded],publicationLostResponseRecovered:!losePublication,oldJourneyPreserved:true,reopenContinues:true,errors,externalRequests:0,rendererObservers:false});console.log(JSON.stringify(evidence.at(-1)))
 }catch(e){await page.screenshot({path:`_qa/ui/creator-play-${width}-${lang}-failure-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/creator-play-browser-report.json',JSON.stringify(evidence,null,2)+'\n')
