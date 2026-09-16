// Local component fixture only. No session, model or media requests; excluded from build inputs.
import React,{useCallback,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetCampaignView} from '../src/old-street-campaign-view'
import type {OldStreetCampaign} from '../src/old-street-campaign'
import {OldStreetJournalView} from '../src/old-street-journal-view'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import '../src/old-street-dev.css'
const trace={title:'The filing records beside the old workshop ledger',clue:{mark:'two notches',wrapping:'linen cord'},records:[
 {label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'},
 {label:'Roof measurements',mark:'one notch',wrapping:'linen cord'},
 {label:'Street repairs',mark:'two notches',wrapping:'linen cord'},
]}
function Fixture(){
 const [journalOpen,setJournalOpen]=useState(false)
 const [open,setOpen]=useState(false),[mode,setMode]=useState('disconnect'),[locale,setLocale]=useState<'en'|'zh'>('en'),[campaign,setCampaign]=useState<OldStreetCampaign>({version:1}),[feedback,setFeedback]=useState(''),[posts,setPosts]=useState(0),[reads,setReads]=useState(0)
 const calls=useRef(0),job=useRef<any>(null)
 const api=useCallback(async(_path:string,body?:unknown)=>{
  if(body){setPosts(n=>n+1);job.current={state:'planning'};calls.current=0;return {job:job.current}}
  setReads(n=>n+1);calls.current++
  if(mode==='disconnect'&&job.current?.state==='planning'&&calls.current===2)throw Error('SYNTHETIC_DISCONNECT')
  if(job.current?.state==='planning'&&calls.current>=3)job.current={state:'ready'}
  return {job:job.current}
 },[mode])
 const start=(next:string)=>{setMode(next);setPosts(0);setReads(0);calls.current=0;job.current=null;setFeedback('');setCampaign(next==='records'?{version:1,trace:{id:'fixture-trace',content:trace,observed:true}}:next==='parcel'?{version:1,trace:{id:'fixture-trace',content:trace,observed:true,selected:2},parcel:{id:'fixture-parcel',observed:true,content:{title:'The repaired footbridge',fragment:'A note describes the old footbridge after the flood. Three neighbours replaced its broken boards and left a safe route to the workshops. A small sketch marks which boards they replaced. Someone kept the note with the repair records so the work would not be forgotten.'}}}:{version:1});setOpen(true)}
 const save=createInitialSave(oldStreetCartridge(locale));save.facts['letter-taken']=true
 return <main className="os-dev"><h1>Local materials UI fixture</h1><button onClick={()=>setLocale(locale==='en'?'zh':'en')}>Language: {locale}</button><button onClick={()=>start('disconnect')}>Preparation with interrupted poll</button><button onClick={()=>start('records')}>Three records</button><button onClick={()=>start('parcel')}>Packet choice</button><button onClick={()=>setJournalOpen(true)}>Review discoveries</button><p>Prepare requests: {posts}; status reads: {reads}</p>{!open&&<button onClick={()=>setOpen(true)}>Reopen same papers</button>}
 {journalOpen&&<OldStreetJournalView save={save} campaign={campaign} onClose={()=>setJournalOpen(false)}/>}
 {open&&<OldStreetCampaignView campaign={campaign} stage={mode==='parcel'?'parcel':'trace'} locale={locale} sessionId="synthetic" api={api} busy={false} feedback={feedback} close={()=>setOpen(false)} act={async(type,selection)=>{
  if(type==='plan')setCampaign({version:1,trace:{id:'fixture-trace',content:trace,observed:false}})
  if(type==='observe')setCampaign(c=>({...c,trace:{...c.trace!,observed:true}}))
  if(type==='decide'&&mode==='parcel')setCampaign(c=>({...c,parcel:{...c.parcel!,disposition:selection as 'take'|'leave'}}))
  else if(type==='decide'&&selection===2){setFeedback('');setCampaign(c=>({...c,trace:{...c.trace!,selected:2}}))}
  else if(type==='decide')setFeedback(locale==='en'?'Only one detail matches. Compare both details.':'只有一处特征吻合，再对照一下两处特征。')
 }}/>}</main>
}
createRoot(document.getElementById('root')!).render(<Fixture/> )
