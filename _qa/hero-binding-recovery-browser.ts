import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {originalHeroRelease,ORIGINAL_HERO_V2} from '../src/original-hero-release'
const origin='http://127.0.0.1:5359',report:any[]=[],art=originalHeroRelease()
const corrupt=Buffer.from(readFileSync('public/'+art.resource.path.slice(2)));corrupt[corrupt.length-1]^=1
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:locale==='zh'?'zh-CN':'en-US'}),errors:string[]=[],heroRequests:string[]=[];let broken=true,head:any,actions=0
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return r.abort();if(u.pathname.endsWith('/hero-study.png'))throw Error('UNBOUND_COMPARISON_HERO_REQUESTED');if(u.pathname.endsWith('/hero-gait-v2.png')){heroRequests.push(u.searchParams.get('scene_asset')??'');if(broken){broken=false;return r.fulfill({status:200,contentType:'image/png',body:corrupt})}}if(u.pathname.endsWith('/actions'))actions++;return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok())try{const b=await r.json(),h=b.head??b;if(h.id&&h.save)head=h}catch{}})
 const ready=(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-error')&&!document.querySelector('.og-loading'),v)
 const close=async()=>{const b=page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true});if(await b.count())await b.click()}
 try{
  await page.goto(origin+'/?art=baseline');await page.getByRole('alertdialog').waitFor();assert.match(await page.getByRole('alertdialog').innerText(),/HERO_ART_UNAVAILABLE/)
  assert.equal(head.version,0);assert.equal(head.assets.hero,ORIGINAL_HERO_V2);const journey=head.id,initial=structuredClone(head)
  assert.equal(actions,0);await page.screenshot({path:`_qa/ui/hero-binding-corrupt-${width}-${locale}-platform-layout-local-qa.png`})
  await page.getByRole('button',{name:t('重新连接并恢复','Reconnect and recover'),exact:true}).click();await ready(0);await close();assert.equal(head.id,journey);assert.deepEqual(head.save,initial.save)
  for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){await page.keyboard.down(key);await page.waitForTimeout(250);await page.keyboard.up(key)}
  await page.waitForTimeout(300);await page.screenshot({path:`_qa/ui/hero-binding-recovered-${width}-${locale}-platform-layout-local-qa.png`})
  await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();const label=t('和阿达检修启动机','Repair the starter with Ada');await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await ready(1);await close()
  const saved=structuredClone(head);await page.reload();await ready(1);await close();assert.equal(head.id,journey);assert.deepEqual(head.save,saved.save);assert.deepEqual(head.assets,saved.assets)
  assert.ok(heroRequests.length>=3);assert.ok(heroRequests.every(s=>s===art.resource.sha256));assert.equal(actions,1);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  report.push({width,height,locale,heroVersion:ORIGINAL_HERO_V2,corruptImageRejected:true,noFallbackImage:true,comparisonQueryIgnored:true,recoverySameJourney:true,storyUnchangedByFailure:true,repairAndRefresh:true,heroRequests:heroRequests.length,sha256:art.resource.sha256,actions,errors,externalConnections:0,realIPhone:false})
 }catch(e){console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/hero-binding-recovery-browser.json',JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report))
