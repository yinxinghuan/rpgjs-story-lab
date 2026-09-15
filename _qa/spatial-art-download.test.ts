import test from 'node:test'
import assert from 'node:assert/strict'
import {downloadSpatialArt} from '../src/spatial-art-download'
test('independent image downloads begin together and progress counts actual completed responses',async()=>{
 const started:string[]=[],release:Record<string,()=>void>={},progress:number[]=[]
 const fetchImpl=(async(url:string)=>{started.push(url);await new Promise<void>(resolve=>{release[url]=resolve});return new Response(new Blob([url]))}) as typeof fetch
 const work=downloadSpatialArt([{id:'a',url:'a'},{id:'b',url:'b'}],{fetchImpl,progress:n=>progress.push(n)})
 assert.deepEqual(started,['a','b']);assert.deepEqual(progress,[0]);release.b();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(progress,[0,1]);release.a()
 const urls=await work;try{assert.deepEqual(progress,[0,1,2]);assert.equal(await (await fetch(urls.a)).text(),'a');assert.equal(await (await fetch(urls.b)).text(),'b')}finally{Object.values(urls).forEach(url=>URL.revokeObjectURL(url))}
})
test('a failed image aborts outstanding downloads without returning a partial asset set',async()=>{
 let aborted=false
 const fetchImpl=(async(url:string,options:RequestInit)=>url==='bad'?new Response('missing',{status:404}):new Promise((_,reject)=>{options.signal!.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'))},{once:true})})) as typeof fetch
 await assert.rejects(downloadSpatialArt([{id:'bad',url:'bad'},{id:'other',url:'other'}],{fetchImpl}),/ART_DOWNLOAD_FAILED:bad/);assert.ok(aborted)
})
test('deadline and page cancellation abort stalled transfers',async()=>{
 let aborts=0
 const fetchImpl=(async(_url:string,options:RequestInit)=>new Promise((_,reject)=>{const stop=()=>{aborts++;reject(Error('aborted'))};if(options.signal!.aborted)stop();else options.signal!.addEventListener('abort',stop,{once:true})})) as typeof fetch
 await assert.rejects(downloadSpatialArt([{id:'a',url:'a'}],{fetchImpl,timeoutMs:10}),/ART_DOWNLOAD_TIMEOUT/)
 const controller=new AbortController(),work=downloadSpatialArt([{id:'a',url:'a'}],{fetchImpl,signal:controller.signal});controller.abort();await assert.rejects(work,/ART_DOWNLOAD_TIMEOUT/);assert.equal(aborts,2)
})
