import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5330'
// Fresh non-persistent contexts only. Never attach to the user's browser/profile.
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
mkdirSync('_qa/ui',{recursive:true});const evidence:any[]=[]
try{for(const [width,height,lang] of [[320,568,'zh'],[390,844,'en']] as const){
 const context=await browser.newContext({viewport:{width,height},locale:lang==='zh'?'zh-CN':'en-US',hasTouch:true}),external:string[]=[],errors:string[]=[]
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin||['blob:','data:'].includes(u.protocol))return route.continue();external.push(u.origin);return route.abort()})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const t=(zh:string,en:string)=>lang==='zh'?zh:en
 const url=origin+'/_qa/sprite-creator.html?lang='+lang+'&generation=origin'
 await page.goto(url);await page.getByRole('button',{name:t('载入阿达候选（方向尚未通过）','Load Ada candidate (directions unapproved)'),exact:true}).click()
 await page.locator('#sprite-foot').fill('300')
 const process=()=>page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
 await process();const panel=page.locator('.cl-actor-review');await panel.waitFor()
 await panel.locator('summary').click();assert.equal(await page.locator('#actor-review-direction').inputValue(),'up')
 await page.locator('#actor-review-alternatingSteps').selectOption('fail')
 await page.locator('#actor-review-facing').selectOption('pass')
 await page.locator('#actor-review-attachments').selectOption('fail')
 await panel.locator('.cl-actor-review__frames').scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-review-${width}-${lang}-back-local-qa.png`})
 await page.locator('#actor-review-direction').selectOption('right');await page.locator('#actor-review-facing').selectOption('fail')
 await page.locator('#actor-review-background').selectOption('light')
 await panel.locator('.cl-actor-review__frames').scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-review-${width}-${lang}-right-local-qa.png`})
 await panel.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).click()
 await panel.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
 await panel.getByRole('button',{name:t('保存图集检查记录','Save sheet review')}).scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/actor-review-${width}-${lang}-saved-local-qa.png`})
 const rejectedId=await page.locator('#sprite-history').inputValue()
 await page.reload();await panel.waitFor();await panel.locator('summary').click()
 assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
 await process();await page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).waitFor({state:'visible'})
 await page.waitForFunction(id=>(document.querySelector('#sprite-history') as HTMLSelectElement)?.value!==id,rejectedId)
 await panel.waitFor();await panel.locator('summary').click()
 assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'unchecked')
 await page.locator('#sprite-history').selectOption(rejectedId)
 await page.waitForFunction(()=> (document.querySelector('#actor-review-alternatingSteps') as HTMLSelectElement)?.value==='fail')
 const layout=await panel.evaluate(el=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:[...el.querySelectorAll('select,button')].map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})),frames:[...el.querySelectorAll('figure>div')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,position:getComputedStyle(e).backgroundPosition}))}))
 assert.equal(layout.overflow,false);assert.ok(layout.controls.every(c=>c.height>=44&&c.width<=width));assert.equal(layout.frames.length,3)
 // Complete the retained-source workflow through normal UI in the same isolated page.
 const combo=page.locator('details').filter({has:page.locator('summary').filter({hasText:t('组合修复前后的状态图','Combine before / after repair images')})})
 await combo.locator('summary').click();await page.getByRole('button',{name:t('载入启动机状态样本','Load starter state samples')}).click()
 async function waitCandidate(){
  await page.locator('#sprite-view option[value=result]').waitFor({state:'attached'});await page.waitForFunction(()=>!(document.querySelector('#sprite-view option[value=result]') as HTMLOptionElement)?.disabled)
  const id=await page.locator('dt').filter({hasText:t('记录 ID','Record ID')}).locator('xpath=following-sibling::dd[1]').textContent()
  await page.waitForFunction(id=>{const e=document.querySelector('#sprite-history') as HTMLSelectElement;return e&&!e.disabled&&e.value===id},id)
 }
 await process();await waitCandidate()
 async function candidateHash(){return page.locator('dt').filter({hasText:t('候选摘要','Candidate SHA-256')}).locator('xpath=following-sibling::dd[1]').textContent()}
 const firstHash=await candidateHash()
 assert.match(firstHash??'',/^[a-f0-9]{64}$/)
 const choices=await page.locator('#sprite-part-saved-0 option').evaluateAll(es=>es.map(e=>({value:(e as HTMLOptionElement).value,text:e.textContent})).filter(e=>e.value))
 assert.equal(choices.length,2);assert.match(choices[0].text!,/2\/3/);assert.match(choices[1].text!,/1\/1/)
 await page.locator('#sprite-part-saved-0').selectOption(choices[0].value);await page.locator('#sprite-part-saved-1').selectOption(choices[1].value)
 assert.equal(await page.locator('#sprite-part-columns-0').inputValue(),'3');assert.equal(await page.locator('#sprite-part-column-0').inputValue(),'2');assert.equal(await page.locator('#sprite-part-columns-1').inputValue(),'1')
 await page.locator('#sprite-part-column-0').scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/source-reuse-${width}-${lang}-local-qa.png`})
 await page.getByRole('button',{name:t('组合并保存原图','Assemble and retain originals')}).click();await page.locator('#sprite-anchors').fill('173,463; 173,468');await page.locator('#sprite-foot').fill('544');await process()
 await waitCandidate()
 const secondHash=await candidateHash();assert.equal(secondHash,firstHash)
 await page.reload();await page.locator('#sprite-history').waitFor();assert.equal(await candidateHash(),firstHash)
 assert.deepEqual(external,[]);assert.deepEqual(errors,[])
 evidence.push({viewport:{width,height},lang,rejectedId,reviewReopen:true,reprocessClearsReview:true,oldReviewRetained:true,layout,retainedColumns:[[3,2],[1,1]],recomposedSha256:secondHash,recompositionAndReloadMatch:true,externalRequests:external,pageErrors:errors})
 await context.close()
}}finally{await browser.close()}
writeFileSync('/private/tmp/rpg-actor-review-browser.json',JSON.stringify({mode:'isolated local headless browser; no media generation or production access',evidence},null,2));console.log(JSON.stringify(evidence))
