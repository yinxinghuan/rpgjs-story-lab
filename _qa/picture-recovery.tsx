import React from 'react'
import {createRoot} from 'react-dom/client'
import OriginalIllustrationPanel from '../src/original-illustration-panel'
import OriginalReferencePicture from '../src/original-reference-picture'
import imageUrl from '../doc/platform-art-candidates/20260912/original-journal-exposure-03/candidate.png'
import '../src/original-game.css'
// Standalone test harness for the production component; no authority or media requests.
const decode=HTMLImageElement.prototype.decode;let stall=true
HTMLImageElement.prototype.decode=function(){return stall?new Promise(()=>{}):decode.call(this)}
const bytes=new Uint8Array(await(await fetch(imageUrl)).arrayBuffer()),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('')
const scene='train-at-dead-station',head:any={id:'11111111-1111-4111-8111-111111111111',sceneId:scene,version:0,save:{locale:'zh',map:[{id:'dead-station',label:'北岬死站'}]}}
const job={id:'22222222-2222-4222-8222-222222222222',scene,sourceVersion:0,referenceVersion:'fixture',state:'candidate',attempt:1,recoverable:false,nextAt:0,asset:{sha256:sha,bytes:bytes.length,width:768,height:1024}}
const api:any=async(path:string,body?:unknown)=>{if(body)throw Error('QA_NO_MUTATIONS');return path.endsWith('/file')?bytes.buffer:{illustrations:[job]}}
createRoot(document.getElementById('root')!).render(<main className="og-game" style={{overflow:'auto',padding:16,boxSizing:'border-box'}}><p>解码恢复测试 · 不写入旅程</p><button onClick={()=>{stall=false}}>解除解码停滞</button>{new URLSearchParams(location.search).has('reference')?<OriginalReferencePicture reference={{url:new URL(imageUrl,document.baseURI).href,sha256:sha}} locale="zh"/>:<OriginalIllustrationPanel head={head} api={api} onReadJournal={()=>{}} onContinue={()=>{}}/>}</main>)
