import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetJournalView} from '../src/old-street-journal-view'
import {OldStreetCampaignView} from '../src/old-street-campaign-view'
import {OldStreetArchiveView} from '../src/old-street-archive-view'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import type {OldStreetCampaign} from '../src/old-street-campaign'
import '../src/old-street-dev.css'
import '../src/old-street-interface.css'
const query=new URLSearchParams(location.search),locale=query.get('lang')==='en'?'en':'zh'
const c={version:3,trace:{observed:true,selected:0,content:{title:'寄存记录',clue:{mark:'双缺口',wrapping:'细绳'},records:[{label:'桥梁',mark:'双缺口',wrapping:'细绳'}]}},archive:{order:['d','b','a','c'],examined:['index','ledger'],content:{title:'旧街档案',discovery:'邻居们一起修复了桥梁。',cards:[{id:'a',label:'装上木板'},{id:'b',label:'裁切木板'},{id:'c',label:'重新开放'},{id:'d',label:'检查损坏'}],sources:{index:[],ledger:[]}}}} as unknown as OldStreetCampaign
function Review(){
 const [campaign,setCampaign]=useState(()=>{const value=structuredClone(c);if(query.get('phase')==='find'){value.archive=undefined;value.trace!.selected=undefined;value.trace!.content.records.push({label:'屋顶',mark:'双缺口',wrapping:'折角'},{label:'棚屋',mark:'单缺口',wrapping:'细绳'})}return value})
 const [page,setPage]=useState(''),[save,setSave]=useState(()=>{const s=createInitialSave(oldStreetCartridge(locale));s.inventory=[{id:'darkroom-print',label:locale==='zh'?'旧街照片':'Old street photograph',count:1}];s.facts['darkroom-photo-choice']='keep';s.facts['darkroom-photo-discovery']=locale==='zh'?'照片上，窗边的晾衣绳挂着衬衣。':'A shirt hangs on the clothesline beside the window.';s.facts['darkroom-photo-matched']='synthetic';return s})
 const photo=query.has('missing')?undefined:'./assets/oldstreet/laundry-print-v1.png'
 const api=async()=>({rows:[]}),noop=async()=>{},close=()=>setPage('')
 return <main className="os-dev"><header><button onClick={()=>setPage('bag')}>背包测试</button><button onClick={()=>setPage('record')}>记录册测试</button><button onClick={()=>setPage('desk')}>整理桌测试</button></header><p>仅合成 UI 状态，无网络提交或玩家存档。库存：{save.inventory.length}</p>
 {page==='bag'&&<OldStreetJournalView save={save} photoImage={photo} onClose={close}/>}
 {page==='record'&&<OldStreetCampaignView campaign={campaign} save={save} photoImage={photo} stage="trace" locale={locale} sessionId="synthetic" api={api} busy={false} feedback="" published={save.facts['archive-published']===true} close={close} act={async(_,selection)=>{if(typeof selection==='number'){if(selection===0)setCampaign(old=>({...old,trace:{...old.trace!,selected:selection}}));return}setSave(old=>{const s=structuredClone(old);if(selection==='share')s.facts['archive-published']=true;if(selection==='withdraw'){s.facts['archive-published']=false;if(s.facts['darkroom-photo-exhibited']){s.inventory=[{id:'darkroom-print',label:'旧街照片',count:1}];s.facts['darkroom-photo-exhibited']=false}};if(selection==='display-photo'){s.inventory=[];s.facts['darkroom-photo-exhibited']=true}if(selection==='retrieve-photo'){s.inventory=[{id:'darkroom-print',label:'旧街照片',count:1}];s.facts['darkroom-photo-exhibited']=false}return s})}}/>}
 {page==='desk'&&<OldStreetArchiveView save={save} archive={campaign.archive} target="archive-desk" locale={locale} sessionId="synthetic" api={api} busy={false} feedback="" readingAct={noop} fieldAdmit={noop} act={noop} tryAnother={()=>{}} close={close}/>}
 </main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
