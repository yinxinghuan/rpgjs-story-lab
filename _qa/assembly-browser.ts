import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {CreatorCloudDrafts,creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {LayeredCloudArchive} from '../src/layered-cloud'
import {assemblyBackgroundDraft,assemblyDeviceDraft,assemblyActorDraft,assemblyLayerDraft} from './assembly-fixture'
import {originalActorRelease,originalStarterRelease,originalFanRelease,originalBackgroundVersion} from '../src/original-asset-releases'
import {originalGameEntities} from '../src/original-game-projection'
import {GAME_ID} from '../src/game-id'
const origin=process.argv[2]??'http://127.0.0.1:5353',evidence:any[]=[]
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('LOCAL_QA_ONLY')
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const values=new Map<string,string>(),store={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)}}as Storage,api=creatorCloudTransport(store,async(_n,w)=>w(),fetch,origin+'/'+GAME_ID),bg=new CreatorCloudDrafts(api),sp=new SpriteCloudArchive(api),la=new LayeredCloudArchive(api)
 const selection={background:(await bg.publish(await assemblyBackgroundDraft())).id,actor:(await sp.publishActor(await assemblyActorDraft())).id,device:(await sp.publish(await assemblyDeviceDraft())).id,fan:(await la.publish(await assemblyLayerDraft())).id}
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});const errors:string[]=[],loaded=new Set<string>();let failCatalog=false,missingActor=false,head:any,enrollments=0
 await context.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return r.abort();if(failCatalog&&u.pathname.endsWith('/api/creator/sprites'))return r.abort();if(missingActor&&u.pathname.endsWith('/actor-release')){const response=await r.fetch();return r.fulfill({response,body:JSON.stringify({release:null})})}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{try{if(!r.ok())return;const path=new URL(r.url()).pathname;if(/\/(releases|actor-releases|device-releases|layer-releases)\//.test(path)&&/\/(file|housing|rotor)$/.test(path))loaded.add(path);if(path.includes('/api/original/sessions')){const b=await r.json(),h=b.head??b;if(h.id&&h.save)head=h;if(path.endsWith('/sessions')&&r.request().method()==='POST')enrollments++}}catch{}})
 const ready=async(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)
 const assembly=origin+'/creator.html?create_art=assembly',refresh=()=>page.getByRole('button',{name:t('刷新已发布版本','Refresh published versions'),exact:true}).click(),link=()=>page.getByRole('link',{name:t('进入或继续此组合的旅程','Enter or resume this combination'),exact:true})
 try{
  await page.goto(origin+'/');await ready(0);const oldId=head.id,oldAssets=structuredClone(head.assets)
  await page.goto(origin+'/creator.html?create_art=layers');await page.evaluate(cap=>window.alteruLocalStorage.setItem('creator-art-1-capability',cap),values.get('creator-art-1-capability')!)
  await page.goto(assembly);await link().waitFor();const before=enrollments
  for(const [slot,id]of Object.entries(selection))await page.locator('#assembly-'+slot).selectOption(id)
  const href=(await link().getAttribute('href'))!;for(const [slot,id]of Object.entries(selection))assert.equal(new URL(href,origin).searchParams.get(slot+'_release'),id)
  await page.reload();await link().waitFor();for(const [slot,id]of Object.entries(selection))assert.equal(await page.locator('#assembly-'+slot).inputValue(),id);assert.equal(enrollments,before)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`_qa/ui/assembly-${width}-${lang}-selection-platform-layout-local-qa.png`,fullPage:true})
  failCatalog=true;await refresh();await page.getByRole('alert').waitFor();assert.equal(await link().count(),0);for(const [slot,id]of Object.entries(selection))assert.equal(await page.locator('#assembly-'+slot).inputValue(),id)
  failCatalog=false;missingActor=true;await refresh();await page.getByRole('alert').filter({hasText:t('这些选择当前无法确认','These selections cannot currently be confirmed')}).waitFor();assert.equal(await link().count(),0);assert.equal(await page.locator('#assembly-actor').inputValue(),selection.actor)
  missingActor=false;await refresh();await link().waitFor();assert.equal(await link().getAttribute('href'),href);assert.equal(enrollments,before);await link().click();await ready(0);const id=head.id;assert.notEqual(id,oldId)
  const check=()=>{assert.equal(originalBackgroundVersion(head.assets),selection.background);assert.equal(originalActorRelease(head.assets)?.id,selection.actor);assert.equal(originalStarterRelease(head.assets)?.id,selection.device);assert.equal(originalFanRelease(head.assets)?.id,selection.fan)};check();assert.equal(loaded.size,5)
  await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click();const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id==='repair-starter'))!
  await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id==='repair-starter')!.label,exact:true}).click();await ready(1);assert.equal(head.save.stats.condition,87);await page.reload();await ready(1);assert.equal(head.id,id);check()
  await page.goto(origin+'/');await ready(0);assert.equal(head.id,oldId);assert.deepEqual(head.assets,oldAssets)
  await page.goto(assembly);await link().waitFor();await link().click();await ready(1);assert.equal(head.id,id);check();assert.deepEqual(errors,[])
  evidence.push({width,height,lang,oldId,journey:id,selection,version:1,loaded:[...loaded],failedRefreshRetained:true,missingReleaseBlocked:true,oldJourneyRetained:true,combinationResumed:true,errors,externalRequests:0,artQuality:'diagnostic actor; retained other samples, no new visual approval'});console.log(JSON.stringify({width,lang,passed:true,files:loaded.size}))
 }catch(e){await page.screenshot({path:`_qa/ui/assembly-${width}-${lang}-failure-platform-layout-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close()}
writeFileSync('/private/tmp/assembly-browser-report.json',JSON.stringify(evidence,null,2)+'\n')
