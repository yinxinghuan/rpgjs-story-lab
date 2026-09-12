import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5356',evidence:any[]=[]
const night=process.argv.includes('--night'),suffix=night?'-night':'',expectedSha=night?'8734c7e1e1b25bce694f5a0387b20ea523f5ef299aabef67a6ba851ca2f71933':'ef122477079498a7215a0b83afe761d975b8e704e97f3d52a06f9437f7f1b8f5'
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:locale==='zh'?'zh-CN':'en-US'}),blocked=new Set<string>(),errors:string[]=[],jobs:any[]=[]
 let listFail=true,fileFail=true,delayFile=false,posts=0,submitted=false
 await context.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.add(u.origin);return r.abort()}
  if(u.pathname.endsWith('/illustrations')){
   if(r.request().method()==='GET'&&listFail){listFail=false;return r.fulfill({status:503,contentType:'application/json',body:'{"error":"SERVICE_UNAVAILABLE"}'})}
   if(r.request().method()==='POST'){posts++;submitted=true}
   const response=await r.fetch();if(response.ok())jobs.push(...(await response.json()).illustrations);return r.fulfill({response})
  }
  if(u.pathname.includes('/illustrations/')&&u.pathname.endsWith('/file')){
   if(fileFail){fileFail=false;return r.abort()}
   if(delayFile){delayFile=false;const response=await r.fetch();await new Promise(r=>setTimeout(r,1500));return r.fulfill({response})}
  }
  return r.continue()
 })
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b;page.on('pageerror',e=>errors.push(e.message))
 const close=async()=>{const b=page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true});if(await b.count())await b.click()}
 const pictures=async()=>{await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.getByRole('button',{name:t('查看旅途画页','View journey illustrations'),exact:true}).click()}
 const ready=()=>page.waitForFunction(()=>Boolean(document.querySelector('.og-game[data-version]'))&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'))
 async function action(label:string){await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).waitFor();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await ready();await close()}
 try{
  await page.goto(origin+'/');await ready();await close();await pictures()
  await page.getByRole('button',{name:t('重新读取画页记录','Reload illustration records'),exact:true}).click()
  const generate=page.getByRole('button',{name:t('制作当前地点的画页','Create illustration of this place'),exact:true})
  await generate.waitFor();assert.equal(await page.locator('#og-illustration-scene option').count(),1)
  await generate.click();await page.getByRole('button',{name:t('正在连接…','Connecting…'),exact:true}).waitFor();assert.ok(submitted)
  assert.equal(await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).isEnabled(),true)
  await close()
  await action(t('和阿达检修启动机','Repair the starter with Ada'));await action(t('走河谷支线','take the river valley branch'))
  assert.equal(await page.locator('.og-game').getAttribute('data-version'),'2');assert.equal(await page.locator('.og-game').getAttribute('data-scene'),'train-at-river-valley')
  await pictures();await page.locator('#og-illustration-scene option[value="train-at-dead-station"]').waitFor({state:'attached'});await page.locator('#og-illustration-scene').selectOption('train-at-dead-station')
  await page.getByRole('button',{name:t('重新读取图片','Reload image'),exact:true}).waitFor({timeout:40000});await page.getByRole('button',{name:t('重新读取图片','Reload image'),exact:true}).click()
  const image=page.locator('.og-illustrations img');await image.waitFor();await image.evaluate((i:HTMLImageElement)=>i.decode());assert.equal(await image.evaluate((i:HTMLImageElement)=>i.naturalWidth),768)
  await image.scrollIntoViewIfNeeded();await page.screenshot({path:`_qa/ui/original-illustration${suffix}-${width}-${locale}-platform-layout-local-qa.png`})
  for(const button of await page.locator('.og-illustrations button,.og-illustrations select').all()){const box=await button.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44)}
  await page.locator('#og-illustration-scene').selectOption('train-at-river-valley');assert.equal(await image.count(),0)
  delayFile=true;await page.locator('#og-illustration-scene').selectOption('train-at-dead-station');await page.waitForTimeout(100);await page.locator('#og-illustration-scene').selectOption('train-at-river-valley');await page.waitForTimeout(1700);assert.equal(await image.count(),0)
  await close();await page.reload();await ready();await close();await pictures();await page.locator('#og-illustration-scene option[value="train-at-dead-station"]').waitFor({state:'attached'});await page.locator('#og-illustration-scene').selectOption('train-at-dead-station');await image.waitFor();await image.evaluate((i:HTMLImageElement)=>i.decode())
  assert.equal(posts,1);assert.equal(new Set(jobs.map(j=>j.id)).size,1);assert.equal(jobs.at(-1).asset.sha256,expectedSha)
  assert.equal(await page.locator('.og-game').getAttribute('data-version'),'2');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
  evidence.push({width,height,locale,posts,onePersistedJob:true,versionAfterRefresh:2,currentScene:'train-at-river-valley',imageScene:'train-at-dead-station',listFailureRecovered:true,fileFailureRecovered:true,lateImageHidden:true,closeDuringGeneration:true,noOverflow:true,pageErrors:errors,blockedOrigins:[...blocked],artAcceptance:false,realIPhone:false})
 }catch(e){await page.screenshot({path:`_qa/ui/original-illustration-${width}-${locale}-failure-platform-layout-local-qa.png`});console.error(await page.locator('body').innerText());throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-illustration-ui-browser'+suffix+'.json',JSON.stringify(evidence,null,2)+'\n')}
console.log(JSON.stringify(evidence))
