import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {validateOriginalBackup} from '../server/original-backup'
const origin='http://127.0.0.1:5362',report:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,lang]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true});let fail=true,downloads=0,head:any,privateResponse=false
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return r.abort();if(u.pathname.endsWith('/backup')){downloads++;if(fail){fail=false;return r.fulfill({status:503,contentType:'application/json',json:{error:'SERVICE_UNAVAILABLE'}})}}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b,errors:string[]=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/backup')&&r.ok())privateResponse=r.headers()['cache-control']==='private, no-store';if(r.url().includes('/api/original/sessions')&&r.ok())try{const b=await r.json(),h=b.head??b;if(h.save&&h.id)head=h}catch{}})
 try{await page.goto(origin);await page.waitForFunction(()=>document.querySelector('.og-game')?.getAttribute('data-version')==='0'&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'));await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 const initial=structuredClone(head);await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.getByRole('button',{name:t('查看与继续旧旅程','View and continue saved journeys'),exact:true}).click()
 const prepare=page.getByRole('button',{name:t('准备旅程备份','Prepare journey backup'),exact:true});await prepare.click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('link',{name:new RegExp(t('下载备份','Download backup'))}).count(),0);assert.equal(head.id,initial.id)
 await prepare.click();const link=page.getByRole('link',{name:new RegExp(t('下载备份','Download backup'))});await link.waitFor();await link.scrollIntoViewIfNeeded();const bounds=await link.boundingBox();assert.ok(bounds&&bounds.height>=44&&bounds.width>=44)
 const color=await link.evaluate(e=>getComputedStyle(e).color);assert.notEqual(color,'rgb(0, 0, 238)');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 await page.screenshot({path:`_qa/ui/original-backup-download-${width}-${lang}-platform-layout-local-qa.png`})
 const promise=page.waitForEvent('download');await link.click();const download=await promise,path=await download.path();assert.ok(path);const value=JSON.parse(readFileSync(path,'utf8')),payload=await validateOriginalBackup(value),saved=JSON.parse(String(payload.tables.journeys[0].data))
 assert.equal(saved.id,initial.id);assert.deepEqual(saved.save,initial.save);assert.deepEqual(saved.assets,initial.assets);assert.ok(privateResponse);assert.equal(downloads,2);assert.deepEqual(errors,[])
 report.push({width,height,lang,failedDownloadRetried:true,sameJourney:true,headUnchanged:true,downloadHeight:bounds.height,color,privateResponse,checksumValidated:true,errors,externalConnections:0,realIPhone:false})
 }finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-backup-download-browser.json',JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report))
