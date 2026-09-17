import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {useOldStreetPreparations} from '../src/use-old-street-preparations'
import {OldStreetPreparationsView} from '../src/old-street-preparations-view'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import type {OldStreetHead} from '../src/old-street-head'
import '../src/old-street-dev.css'
import '../src/old-street-interface.css'
const head={id:'synthetic-ui-progress',save:createInitialSave(oldStreetCartridge('en')),expansions:[{version:1,id:'synthetic-request',template:'photo-darkroom-v1',sourceScene:'photo',input:'Old photograph',status:'requested',requestedAtVersion:1}]} as OldStreetHead
head.save.facts['darkroom-ready']=true
let job='preparing',calls:string[]=[],offline=false
const api=async(...args:unknown[])=>{calls.push(args.length===1?'GET':'WRITE');if(offline)throw Error('offline');return {job:{state:job}}}
function Preview(){
 const [revision,setRevision]=useState(0),[journey,setJourney]=useState('A')
 const {preparations,announcement}=useOldStreetPreparations({...head,id:head.id+journey},{planning:true,media:true,campaign:false},api,String(revision))
 return <main style={{background:'#eee7d8',padding:16,color:'#232929',maxWidth:390,margin:'auto'}}><h1>Preparation UI test</h1><button onClick={()=>{job='candidate';offline=false;setRevision(n=>n+1)}}>Finish existing task</button><button onClick={()=>{offline=true;setRevision(n=>n+1)}}>Disconnect query</button><button onClick={()=>{offline=false;setRevision(n=>n+1)}}>Reconnect query</button><button onClick={()=>setJourney(j=>j==='A'?'B':'A')}>Switch synthetic journey</button><p role="status">{announcement||'No completion announcement'}</p><OldStreetPreparationsView rows={preparations} locale="en"/><output>Reads: {calls.length}; writes: {calls.filter(c=>c==='WRITE').length}; journey: {journey}</output></main>
}
createRoot(document.getElementById('root')!).render(<Preview/> )
