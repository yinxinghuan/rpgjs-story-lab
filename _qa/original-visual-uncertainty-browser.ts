import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
const origin='http://127.0.0.1:5363',report:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height,locale]of [[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},locale:locale==='zh'?'zh-CN':'en-US',hasTouch:true})
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['blob:','data:'].includes(u.protocol)?r.continue():r.abort()})
 const page=await context.newPage(),t=(a:string,b:string)=>locale==='zh'?a:b,errors:string[]=[];let head:any,result:any
 page.on('pageerror',e=>errors.push(e.message))
 page.on('response',async r=>{if(r.url().includes('/api/original/sessions')&&r.ok())try{const b=await r.json(),h=b.head??b;if(h.save&&h.id)head=h;if(b.guard)result=b}catch{}})
 const ready=async(v:number)=>page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)
 try{
  await page.goto(origin);await ready(0);const initial=structuredClone(head)
  await page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
  await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click()
  await page.getByRole('dialog').getByRole('button',{name:head.save.characters.find((p:any)=>p.id==='ada-mechanic').name,exact:true}).click()
  await page.getByRole('button',{name:t('交谈','Talk'),exact:true}).click()
  await page.getByRole('button',{name:t('开启在线交谈','Turn on online conversation'),exact:true}).click()
  await page.locator('#og-input').fill(t('你的小灯怎么固定的？','How is your lamp fastened?'))
  await page.getByRole('button',{name:t('说话','Say'),exact:true}).click();await ready(1)
  assert.equal(result.source,'author');assert.equal(result.guard,'unestablished-visual-detail')
  assert.deepEqual({...head.save,blocks:initial.save.blocks},initial.save);assert.deepEqual(head.assets,initial.assets)
  const reply=head.save.blocks.at(-1).text;assert.match(reply,locale==='zh'?/无法判断/:/does not show/)
  await page.locator('p[data-kind]').filter({hasText:reply}).scrollIntoViewIfNeeded()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.screenshot({path:`_qa/ui/original-visual-uncertainty-${width}-${locale}-platform-layout-local-qa.png`})
  await page.reload();await ready(1);assert.equal(head.id,initial.id);assert.equal(head.save.blocks.at(-1).text,reply);assert.deepEqual(errors,[])
  report.push({width,height,locale,source:result.source,guard:result.guard,reply,storyAndAssetsUnchanged:true,refreshRetained:true,errors,externalConnections:0,realIPhone:false})
 }finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-visual-uncertainty-browser.json',JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report))
