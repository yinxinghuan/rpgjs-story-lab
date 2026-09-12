import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const origin=process.argv[2]??'http://127.0.0.1:5354'
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('LOCAL_QA_ONLY')
const source='doc/platform-art-candidates/20260912/hero-reproduce-01/candidate.png'
const sourceSha='8eadfcf1f93a95dabbb5dc1ee7c9e6ad4007e4be48682739de41c3df65566076'
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
assert.equal(hash(readFileSync(source)),sourceSha)
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
const evidence:any[]=[]
try{for(const [width,height,locale] of [[320,568,'zh'],[390,844,'en']] as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true}),errors:string[]=[],blocked=new Set<string>()
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.add(u.origin);return r.abort()}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.goto(origin+'/creator.html?create_art=sprite')
  await page.locator('#sprite-file').setInputFiles(source)
  await page.locator('#sprite-foot').fill('300')
  await page.getByRole('button',{name:t('处理并保存新候选','Process and save new candidate'),exact:true}).click()
  const review=page.getByRole('region',{name:t('人物图集检查','Actor sheet review')})
  await review.locator('summary').click()
  // These are the explicit visual findings of this bounded probe, never
  // inferred from a successful processor or a movement trace.
  for(const direction of ['down','left','right','up']){
   await page.locator('#actor-review-direction').selectOption(direction)
   await page.locator('#actor-review-facing').selectOption('pass')
   await page.locator('#actor-review-attachments').selectOption('unchecked')
   await page.locator('#actor-review-alternatingSteps').selectOption(['left','right'].includes(direction)?'fail':'pass')
  }
  await page.getByRole('button',{name:t('保存图集检查记录','Save sheet review'),exact:true}).click()
  await review.getByText(t('当前记录已保存。','The current record is saved.'),{exact:false}).waitFor()
  const download=await page.getByRole('link',{name:t('导出候选 PNG','Export candidate PNG'),exact:true}).getAttribute('href')
  assert.ok(download?.startsWith('blob:'))
  const bytes=await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url!)).arrayBuffer())),download)
  writeFileSync(`_qa/ui/hero-reproduce-${width}-prepared.png`,new Uint8Array(bytes))
  await page.locator('#actor-review-direction').selectOption('left')
  await review.locator('.cl-actor-review__frames').scrollIntoViewIfNeeded()
  await page.screenshot({path:`_qa/ui/hero-reproduce-${width}-side-platform-layout-local-qa.png`})
  await page.getByRole('link',{name:t('在地图里试走这个人物','Try this actor in the map'),exact:true}).click()
  await page.waitForFunction(()=>!!document.querySelector('output[data-scene]')&&!document.querySelector('.cl-loading')&&!document.querySelector('.cl-error'))
  const trial=page.locator('.cl-actor-map-review');await trial.locator('summary').click()
  assert.equal(await trial.getByRole('button',{name:t('确认人物画面并保存检查','Confirm actor visuals and save review'),exact:true}).isEnabled(),false)
  await trial.locator('summary').click()
  const positions:string[]=[]
  for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){
   await page.keyboard.down(key);await page.waitForTimeout(450)
   await page.screenshot({path:`_qa/ui/hero-reproduce-${width}-${key}-platform-layout-local-qa.png`})
   await page.keyboard.up(key);await page.waitForTimeout(180)
   positions.push(await page.locator('output[data-scene]').innerText())
  }
  assert.ok(new Set(positions).size>1)
  await page.reload();await page.waitForFunction(()=>!!document.querySelector('output[data-scene]')&&!document.querySelector('.cl-loading')&&!document.querySelector('.cl-error'))
  await page.getByRole('link',{name:t('返回人物准备','Back to sprite preparation'),exact:true}).click()
  await review.locator('summary').click();await page.locator('#actor-review-direction').selectOption('left')
  assert.equal(await page.locator('#actor-review-alternatingSteps').inputValue(),'fail')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[])
  evidence.push({width,height,locale,sourceSha,preparedSha:hash(new Uint8Array(bytes)),positions,rejectedSheetRetained:true,mapApprovalBlocked:true,externalRequests:0,blockedOrigins:[...blocked],pageErrors:errors,actualIPhone:false})
 }catch(e){await page.screenshot({path:`_qa/ui/hero-reproduce-${width}-failure-platform-layout-local-qa.png`});throw e}finally{await context.close()}
}}finally{await browser.close();assert.equal(hash(readFileSync(source)),sourceSha);writeFileSync('/private/tmp/hero-reproduction-browser.json',JSON.stringify(evidence,null,2)+'\n')}
console.log(JSON.stringify(evidence))
