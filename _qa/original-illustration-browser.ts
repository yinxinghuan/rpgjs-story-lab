import {chromium} from 'playwright'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {newCapability} from '../src/cloud-session'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import {ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import {GAME_ID} from '../src/game-id'
const origin='http://127.0.0.1:5355',results:any[]=[]
const browser=await chromium.launch({headless:true,executablePath:'/Users/yin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{for(const [width,height]of [[320,568],[390,844]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true}),blocked=new Set<string>()
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){blocked.add(new URL(r.request().url()).origin);return r.abort()}return r.continue()})
 const page=await context.newPage()
 // tsx preserves local helper names; this shim is test-context-only.
 await page.addInitScript('window.__name = (fn) => fn')
 try{
  await page.goto(origin+'/creator.html?create_art=sprite')
  const result=await page.evaluate(async({base,headers})=>{
   const call=async(path:string,body?:unknown)=>{const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error('HTTP_'+r.status);return r}
   const head=await(await call('/sessions',{enrollment_id:crypto.randomUUID(),locale:'zh'})).json(),path='/sessions/'+head.id+'/illustrations'
   const make=()=>call(path,{scene:head.sceneId,expected_version:head.version,retry:false})
   const first=await(await make()).json(),job=first.illustrations[0]
   const r=await call(path+'/'+head.sceneId+'/file'),bytes=new Uint8Array(await r.arrayBuffer())
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
   const blob=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
   const image=new Image();image.src=blob;await image.decode();const decoded=[image.naturalWidth,image.naturalHeight];URL.revokeObjectURL(blob)
   const repeated=await(await make()).json(),after=await(await call('/sessions/'+head.id)).json()
   return {sha,decoded,bytes:bytes.length,oneJob:repeated.illustrations.length===1&&repeated.illustrations[0].id===job.id,storyUnchanged:JSON.stringify(head)===JSON.stringify(after),fileHeader:r.headers.get('X-Original-Runtime')}
  },{base:origin+'/'+GAME_ID+'/api/original',headers:{Authorization:'Bearer '+newCapability(),[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}})
  assert.equal(result.sha,'ef122477079498a7215a0b83afe761d975b8e704e97f3d52a06f9437f7f1b8f5');assert.deepEqual(result.decoded,[768,1024]);assert.equal(result.bytes,1486728);assert.ok(result.oneJob&&result.storyUnchanged);assert.equal(result.fileHeader,ORIGINAL_RUNTIME_CONTRACT)
  results.push({width,height,...result,blockedOrigins:[...blocked],externalRequests:0,scope:'Native browser decoding and authenticated compiled-Worker HTTP round-trip only. No illustration UI or real device acceptance.'})
 }finally{await context.close()}
}}finally{await browser.close();writeFileSync('/private/tmp/original-illustration-browser.json',JSON.stringify(results,null,2)+'\n')}
console.log(JSON.stringify(results))
