// Component-only local QA. Not a game entry, no journey or external API access.
import React,{useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetExpansionPhotoView} from '../src/old-street-expansion-photo-view'
import '../src/old-street-dev.css'
function RecoveryCheck(){
 const [counts,setCounts]=useState({reads:0,files:0,posts:0})
 const [matched,setMatched]=useState(false)
 const api=useMemo(()=>{
  const n={reads:0,files:0,posts:0}
  const bytes=fetch('../assets/oldstreet/laundry-print-v1.png').then(r=>r.arrayBuffer()).then(b=>new Uint8Array(b))
  return async(path:string,body?:unknown)=>{
   if(body!==undefined){n.posts++;setCounts({...n});throw Error('QA_UNEXPECTED_GENERATION')}
   if(path.endsWith('-file')){n.files++;setCounts({...n});if(n.files===1)throw Error('QA_DOWNLOAD_INTERRUPTED');return Array.from(await bytes)}
   n.reads++;setCounts({...n});if(n.reads===1)throw Error('QA_STATUS_INTERRUPTED')
   const image=await bytes,sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',image))].map(b=>b.toString(16).padStart(2,'0')).join('')
   return {job:{id:'synthetic',state:'candidate',attempt:1,recoverable:false,nextAt:0,asset:{sha256,bytes:image.length}}}
  }
 },[])
 return <main className="os-dev" style={{alignItems:"stretch",padding:16,maxWidth:390,margin:'0 auto',background:'#ede7d6',color:'#252a29',minHeight:'100vh'}}>
  <h1 style={{fontSize:18}}>局部恢复检查</h1>
  <p>合成故障：首次状态请求失败，再模拟首次图片下载失败。</p>
  <output>状态读取 {counts.reads} · 图片下载 {counts.files} · 生成请求 {counts.posts}</output>
  <OldStreetExpansionPhotoView locale="zh" sessionId="synthetic" api={api} disabled={false} matched={matched} submit={async()=>setMatched(true)} pause={()=>{}} choice="" decide={async()=>{}}/>
 </main>
}
createRoot(document.getElementById('root')!).render(<RecoveryCheck/>);
