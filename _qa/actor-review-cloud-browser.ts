import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5331',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const [width,height,lang] of [[320,568,'zh'],[390,844,'en']] as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true}),blocked:string[]=[],errors:string[]=[],posts:string[]=[],replies:any[]=[];let lose=true
 await context.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url())
  if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return route.abort()}
  if(u.origin===origin&&u.pathname.endsWith('/actor-reviews')&&r.method()==='POST'){
   posts.push(r.postDataJSON().id);const response=await route.fetch();replies.push(await response.json())
   if(lose&&response.ok()){lose=false;return route.abort('failed')}
   return route.fulfill({response})
  }
  return route.continue()
 })
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const t=(zh:string,en:string)=>lang==='zh'?zh:en
 await page.goto(origin+'/_qa/sprite-creator.html?lang='+lang+'&generation=origin')
 await page.getByRole('button',{name:t('载入阿达候选（方向尚未通过）','Load Ada candidate (directions unapproved)'),exact:true}).click();await page.locator('#sprite-foot').fill('300')
 const process=()=>page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
 await process();const panel=page.locator('.cl-actor-review');await panel.waitFor();await panel.locator('summary').click()
 await page.locator('#actor-review-alternatingSteps').selectOption('fail');await panel.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).click()
 await panel.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 const originalId=await page.locator('#sprite-history').inputValue(),cloud=page.getByRole('region',{name:t('在线人物与设备','Online character and equipment art'),exact:true})
 const save=()=>cloud.getByRole('button',{name:t('在线保存当前人物或设备','Save current character or equipment online'),exact:true}).click()
 await save();const failure=cloud.getByRole('alert');await failure.filter({hasText:t('素材已在线保存，但人物检查未能确认。','Art is saved online, but the actor review is unconfirmed.')}).waitFor();assert.equal(replies[0].revision,1)
 await failure.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-cloud-${width}-${lang}-lost-reply-local-qa.png`})
 await page.reload();await panel.waitFor();await save();await cloud.getByText(t('素材与本次人物检查已在线保存','Art and this actor review are saved online'),{exact:false}).waitFor()
 assert.equal(posts.length,2);assert.equal(posts[0],posts[1]);assert.equal(replies[1].revision,1)
 await panel.locator('summary').click();await page.locator('#actor-review-direction').selectOption('right');await page.locator('#actor-review-facing').selectOption('fail');await panel.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).click()
 await panel.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor();await save();await cloud.getByText(t('素材与本次人物检查已在线保存','Art and this actor review are saved online'),{exact:false}).waitFor();assert.equal(replies[2].revision,2)
 await process();await panel.waitFor();await panel.locator('summary').click();assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked')
 await cloud.getByRole('button',{name:t('查看在线人物与设备','View online character and equipment art'),exact:true}).click()
 await cloud.getByRole('button',{name:t('取回此素材及原图','Restore art and originals'),exact:true}).click()
 await cloud.getByText(t('已取回素材及最近一次人物检查','Art and the latest actor review are restored'),{exact:false}).waitFor()
 assert.equal(await page.locator('#sprite-history').inputValue(),originalId)
 await panel.locator('summary').click();assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
 await page.locator('#actor-review-direction').selectOption('right');assert.equal(await page.locator('#actor-review-facing').inputValue(),'fail')
 await panel.getByRole('status').scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-cloud-${width}-${lang}-restored-local-qa.png`})
 await page.reload();await panel.waitFor();await panel.locator('summary').click();assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.cl-actor-review button,.cl-actor-review select')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}))
 assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(b=>b.height>=44&&b.width<=width));assert.deepEqual(blocked,[]);assert.deepEqual(errors,[])
 evidence.push({viewport:{width,height},lang,originalId,requests:posts,revisions:replies.map(r=>r.revision),firstResponseLost:true,retryAfterReload:true,latestReviewRestored:true,restoredReviewSurvivesReload:true,layout,externalRequests:blocked,pageErrors:errors})
 await context.close()
}}finally{await browser.close()}
writeFileSync('/private/tmp/rpg-actor-review-cloud-browser.json',JSON.stringify({mode:'new isolated headless contexts, local real Worker/SQLite API, retained platform PNG, no external requests',evidence},null,2));console.log(JSON.stringify(evidence))
