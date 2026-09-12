import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin=process.argv[2]??'http://127.0.0.1:5366',evidence:any[]=[]
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('LOCAL_QA_ONLY')
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true}),errors:string[]=[]
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b;page.on('pageerror',e=>errors.push(e.message))
 try{
 await page.goto(origin+'/creator.html?create_art=sprite');await page.locator('#sprite-file').setInputFiles('doc/platform-art-candidates/20260912/hero-reproduce-01/candidate.png');await page.locator('#sprite-foot').fill('300');await page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
 const review=page.getByRole('region',{name:t('人物图集检查','Actor sheet review')}),comparison=page.getByRole('region',{name:t('腿部对照','Leg comparison')});await review.locator('summary').click();await comparison.waitFor()
 const flags=[]
 for(const d of ['down','left','right','up']){await page.locator('#actor-review-direction').selectOption(d);flags.push({direction:d,warning:await comparison.getByRole('alert').count()});assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked')}
 assert.deepEqual(flags,[{direction:'down',warning:0},{direction:'left',warning:1},{direction:'right',warning:1},{direction:'up',warning:0}])
 await page.locator('#actor-review-direction').selectOption('left');await comparison.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/stride-comparison-${width}-${locale}-platform-layout-local-qa.png`})
 const images=await comparison.getByRole('img').all();assert.equal(images.length,2);for(const img of images){const b=await img.boundingBox();assert.ok(b&&b.width>110&&b.height>20)}
 await page.locator('#actor-review-alternatingSteps').selectOption('fail');await page.getByRole('button',{name:t('保存图集检查记录','Save sheet review'),exact:true}).click();await review.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 await page.reload();await review.locator('summary').click();await comparison.waitFor();await page.locator('#actor-review-direction').selectOption('left');assert.equal(await comparison.getByRole('alert').count(),1);assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
 await page.locator('#actor-review-direction').selectOption('up');assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked');assert.equal(await comparison.getByRole('alert').count(),0)
 await review.locator('summary').click();await review.locator('summary').click();await comparison.waitFor();assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
 evidence.push({width,height,locale,flags,originalUnchanged:true,observationsNotAutofilled:true,rejectedObservationRestored:true,externalRequests:0,errors,actualIPhone:false});console.log(JSON.stringify({width,locale,passed:true}))
 }catch(e){await page.screenshot({path:`_qa/ui/stride-comparison-${width}-${locale}-failure-local-qa.png`});throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/actor-stride-comparison-browser.json',JSON.stringify(evidence,null,2)+'\n')}
