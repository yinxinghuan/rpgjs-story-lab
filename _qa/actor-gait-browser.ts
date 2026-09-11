import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5337',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,locale] of [[320,568,'zh'],[390,844,'en']] as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true,reducedMotion:'reduce'}),errors:string[]=[],blocked:string[]=[]
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return r.abort()}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message))
 try{
 await page.goto(origin+'/creator.html?create_art=sprite');await page.locator('#sprite-file').setInputFiles('public/art/overhead/hero-gait-v2.png')
 await page.locator('#sprite-mode').selectOption('alpha');await page.locator('#sprite-foot').fill('300')
 await page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
 const review=page.getByRole('region',{name:t('人物图集检查','Actor sheet review')}),summary=review.locator('summary');await summary.click()
 const frame=review.getByRole('img',{name:t('步态播放画面','Gait playback'),exact:true}),column=()=>frame.getAttribute('data-column')
 assert.equal(await column(),'1');assert.equal(await frame.getAttribute('data-playing'),'false')
 const sequences:any[]=[]
 for(const direction of ['up','left','right','down']){
  await page.locator('#actor-review-direction').selectOption(direction);await page.getByRole('button',{name:t('查看站立','Show standing'),exact:true}).click()
  const poses=[];for(let i=0;i<4;i++){await page.getByRole('button',{name:t('下一帧','Next pose'),exact:true}).click();poses.push(Number(await column()))}assert.deepEqual(poses,[2,1,0,1]);sequences.push({direction,poses})
 }
 await page.locator('#actor-review-direction').selectOption('up');await page.locator('#actor-gait-speed').selectOption('150')
 await page.getByRole('button',{name:t('播放步态','Play gait'),exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cl-gait-preview [role=img]')?.getAttribute('data-column')==='2')
 await page.getByRole('button',{name:t('暂停','Pause'),exact:true}).click();const paused=await column();await page.waitForTimeout(500);assert.equal(await column(),paused)
 await page.getByRole('button',{name:t('播放步态','Play gait'),exact:true}).click();await page.locator('#actor-review-direction').selectOption('left');await page.waitForFunction(()=>document.querySelector('.cl-gait-preview [role=img]')?.getAttribute('data-column')==='1'&&document.querySelector('.cl-gait-preview [role=img]')?.getAttribute('data-playing')==='false');assert.equal(await column(),'1');assert.equal(await frame.getAttribute('data-playing'),'false')
 await page.getByRole('button',{name:t('播放步态','Play gait'),exact:true}).click();await summary.click();await page.waitForFunction(()=>document.querySelector('.cl-gait-preview [role=img]')?.getAttribute('data-playing')==='false');await summary.click();assert.equal(await frame.getAttribute('data-playing'),'false')
 assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked');assert.equal(await page.locator('#actor-review-facing').inputValue(),'unchecked')
 await page.locator('#actor-review-direction').selectOption('up');await page.locator('#actor-review-alternatingSteps').selectOption('fail');await page.getByRole('button',{name:t('保存图集检查记录','Save sheet review'),exact:true}).click()
 await page.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 await page.reload();await summary.click();assert.equal(await frame.getAttribute('data-playing'),'false');assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
 await frame.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 for(const b of await review.locator('.cl-gait-preview button').all()){const box=await b.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44)}
 await page.screenshot({path:`_qa/ui/actor-gait-${width}-${locale}-local-qa.png`});assert.deepEqual(errors,[])
 evidence.push({width,height,locale,reducedMotion:'reduce',sequences,pauseStable:true,directionReset:true,closeStops:true,noAutomaticApproval:true,rejectedObservationRestored:true,noOverflow:true,errors,blockedOrigins:[...new Set(blocked)]})
 }finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/actor-gait-browser.json',JSON.stringify(evidence,null,2)+'\n')}
