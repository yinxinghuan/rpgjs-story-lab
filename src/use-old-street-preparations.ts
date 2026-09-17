import {useEffect,useRef,useState} from 'react'
import {PreparationHistory,preparationTargets,readPreparation,type Preparation} from './old-street-preparations'
import type {OldStreetHead} from './old-street-head'
/** Owns lightweight progress only. It never admits content or starts generation. */
export function useOldStreetPreparations(head:OldStreetHead|undefined,capabilities:{planning:boolean;media:boolean;campaign:boolean},api:(path:string)=>Promise<any>,refreshKey:string){
 const [snapshot,setSnapshot]=useState<{session:string;rows:Preparation[]}>({session:'',rows:[]})
 const [announcement,setAnnouncement]=useState<{session:string;text:string}>({session:'',text:''})
 const history=useRef(new PreparationHistory())
 const targets=head?preparationTargets(head,capabilities):[],key=JSON.stringify(targets),session=head?.id??''
 const zh=head?.save.locale==='zh'
 useEffect(()=>{
  let active=true,timer:ReturnType<typeof setTimeout>|undefined,inFlight=false
  const poll=async()=>{
   if(inFlight||document.hidden)return;inFlight=true
   const rows=(await Promise.all(targets.map(t=>readPreparation(api,t)))).filter((v):v is Preparation=>v!==null)
   inFlight=false;if(!active)return
   const ready=history.current.update(session,rows)
   setSnapshot({session,rows})
   if(ready.length)setAnnouncement({session,text:ready.map(row=>row.title+(zh?'已准备好。':' is ready. ')+row.returnTo).join(' ')})
   if(rows.some(row=>row.state==='waiting'||row.state==='offline'))timer=setTimeout(poll,8000)
  }
  const resume=()=>{if(!document.hidden){if(timer)clearTimeout(timer);void poll()}}
  void poll();document.addEventListener('visibilitychange',resume)
  return()=>{active=false;if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',resume)}
 },[api,session,key,refreshKey])
 useEffect(()=>{if(!announcement.text)return;const timer=setTimeout(()=>setAnnouncement({session:'',text:''}),6000);return()=>clearTimeout(timer)},[announcement])
 return {preparations:snapshot.session===session?snapshot.rows.filter(row=>targets.some(t=>t.id===row.id)):[],announcement:announcement.session===session?announcement.text:''}
}
