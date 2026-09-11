import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const origin='http://127.0.0.1:5349'
const browser=await chromium.launch({executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',headless:true})
try{const context=await browser.newContext({viewport:{width:390,height:844},locale:'zh-CN'});let failed=false
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin&&!['blob:','data:'].includes(u.protocol))return r.abort();if(!failed&&/\/original-game-[^/]+\.js$/.test(u.pathname)){failed=true;return r.abort()}return r.continue()})
 const page=await context.newPage();await page.goto(origin+'/');await page.getByRole('button',{name:'重新载入旅程',exact:true}).waitFor();assert.equal(failed,true);assert.equal(await page.locator('.og-game').count(),0)
 await page.screenshot({path:'_qa/ui/original-boot-download-failed-390-local-qa.png'});await page.getByRole('button',{name:'重新载入旅程',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.og-game')?.getAttribute('data-version')==='0'&&!document.querySelector('.og-loading')&&!document.querySelector('.og-error'));await page.getByRole('button',{name:'关闭面板',exact:true}).click();await page.screenshot({path:'_qa/ui/original-boot-recovered-390-local-qa.png'})
 console.log(JSON.stringify({entry:'cloud-default',missingChunkRecovered:true,journeyVersion:0,viewport:[390,844],externalConnections:0}));await context.close()
}finally{await browser.close()}
