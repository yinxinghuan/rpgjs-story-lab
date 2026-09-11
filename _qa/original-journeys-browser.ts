import{chromium}from'playwright'
import assert from'node:assert/strict'
import{writeFileSync}from'node:fs'
import{originalGameEntities}from'../src/original-game-projection'
const origin='http://127.0.0.1:5338',evidence:any[]=[]
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{for(const[width,height,lang]of[[320,568,'zh'],[390,844,'en']]as const){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,locale:lang==='zh'?'zh-CN':'en-US'}),errors:string[]=[],maps:string[]=[],blocked:string[]=[];let head:any,checkpoint:any,lose=false,enrollments=0
 await context.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol)){blocked.push(u.origin);return r.abort()}if(u.pathname.endsWith('.tmx')&&!u.search)maps.push(u.pathname);if(u.pathname.endsWith('/api/original/sessions')&&q.method()==='POST'){enrollments++;if(lose){lose=false;await r.fetch();return r.abort('failed')}}return r.continue()})
 const page=await context.newPage(),t=(a:string,b:string)=>lang==='zh'?a:b
 page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.ok()&&r.url().includes('/api/original/sessions')){try{const b=await r.json(),h=b.head??b;if(r.url().endsWith('/position')&&b.position)checkpoint={id:r.url().split('/').at(-2),position:b.position};if(h.save&&h.id)head=h}catch{}}})
 const ready=async(v:number)=>{await page.waitForFunction(v=>document.querySelector('.og-game')?.getAttribute('data-version')===String(v)&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'),v)}
 const close=()=>page.getByRole('button',{name:t('关闭面板','Close panel'),exact:true}).click()
 async function action(id:string,v:number){const e=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id))!;assert.ok(e,id);await page.getByRole('button',{name:t('附近','Nearby'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.person?.name??e.actions[0].label,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:e.actions.find(a=>a.id===id)!.label,exact:true}).click();await ready(v);await close()}
 async function directory(){await page.getByRole('button',{name:t('记录','Journal'),exact:true}).click();await page.getByRole('button',{name:t('查看与继续旧旅程','View and continue saved journeys'),exact:true}).click();await page.getByRole('button',{name:t('保留旧旅程，重新出发','Keep old journeys and start again'),exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.og-loading'))}
 try{
 await page.goto(origin+'/?story=original');await ready(0);await close();await action('repair-starter',1);await action('commit-valley-route',2);const a=structuredClone(head)
 await directory();lose=true;await page.getByRole('button',{name:t('保留旧旅程，重新出发','Keep old journeys and start again'),exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(head.id,a.id)
 await page.getByRole('button',{name:t('保留旧旅程，重新出发','Keep old journeys and start again'),exact:true}).click();await ready(0);await close();assert.notEqual(head.id,a.id)
 await action('repair-starter',1);await action('commit-forest-route',2);const b=structuredClone(head);assert.notEqual(b.sceneId,a.sceneId)
 await directory();assert.equal(await page.getByRole('dialog').getByRole('button',{name:new RegExp(t('继续旅程','Continue journey'))}).count(),1)
 await page.screenshot({path:`_qa/ui/original-journeys-${width}-${lang}-list-local-qa.png`})
 await page.getByRole('dialog').getByRole('button',{name:new RegExp(t('继续旅程','Continue journey'))}).click();await ready(2);assert.equal(head.id,a.id);assert.deepEqual(head.save,a.save);assert.deepEqual(head.assets,a.assets);assert.equal(head.sceneId,a.sceneId)
 const beforeMove={...head.position};checkpoint=undefined;await page.keyboard.down('ArrowDown');await page.waitForTimeout(250);await page.keyboard.up('ArrowDown');await page.waitForTimeout(2300);assert.equal(checkpoint?.id,a.id);assert.ok(Math.hypot(checkpoint.position.x-beforeMove.x,checkpoint.position.y-beforeMove.y)>5);await page.screenshot({path:`_qa/ui/original-journeys-${width}-${lang}-valley-local-qa.png`})
 await page.reload();await ready(2);assert.equal(head.id,a.id);assert.deepEqual(head.save,a.save)
 await directory();await page.getByRole('dialog').getByRole('button',{name:new RegExp(t('继续旅程','Continue journey'))}).click();await ready(2);assert.equal(head.id,b.id);assert.deepEqual(head.save,b.save);assert.deepEqual(head.assets,b.assets)
 assert.ok(maps.some(p=>p.endsWith('/train-at-river-valley.tmx')));assert.ok(maps.some(p=>p.includes('pine-line-90af55e7.tmx')))
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.equal(enrollments,3,'initial, lost restart and same-id retry only')
 await page.screenshot({path:`_qa/ui/original-journeys-${width}-${lang}-pine-local-qa.png`});evidence.push({width,height,lang,twoJourneys:true,lostEnrollmentRecovered:true,enrollmentRequests:enrollments,saveAndAssetBindingsPreserved:true,continuedMovementCheckpoint:true,refreshContinuesSelection:true,actualMaps:[...new Set(maps)],errors,blockedOrigins:[...new Set(blocked)]})
 }catch(e){writeFileSync('/private/tmp/original-journeys-failure.json',JSON.stringify({errors,blocked,maps,body:await page.locator('body').innerText(),headId:head?.id,headVersion:head?.version},null,2));await page.screenshot({path:'_qa/ui/original-journeys-failure-local-qa.png'});throw e}finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-journeys-browser.json',JSON.stringify(evidence,null,2)+'\n')}
