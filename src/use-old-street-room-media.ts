import {useEffect,useState} from 'react'
import type {DarkroomSlot,RoomMediaRow} from './old-street-room-media'
import {prepareRoomImage,type RoomImage} from './old-street-room-image'
type Api=(path:string,body?:unknown)=>Promise<any>
export function useOldStreetRoomMedia(api:Api,journey:string|undefined,enabled:boolean){
 const [snapshot,setSnapshot]=useState<{journey?:string;attempt?:number;images:Partial<Record<DarkroomSlot,RoomImage>>;failed:boolean}>({images:{},failed:false})
 const [attempt,setAttempt]=useState(0),[fallbackJourney,setFallbackJourney]=useState<string>()
 const key='oldstreet-room-look:'+journey
 let savedFallback=false;try{savedFallback=window.alteruLocalStorage.getItem(key)==='baseline'}catch{}
 const fallback=!!journey&&(fallbackJourney===journey||savedFallback)
 useEffect(()=>{
  if(!journey||!enabled||fallback)return
  let live=true,timer:ReturnType<typeof setTimeout>|undefined,networkFailures=0
  const images:Partial<Record<DarkroomSlot,RoomImage>>={},checked=new Set<string>(),rejected=new Set<string>()
  const emit=(failed:boolean)=>{if(live)setSnapshot({journey,attempt,images:{...images},failed})}
  emit(false)
  async function poll(){
   try{
    const value=await api('/sessions/'+journey+'/room-art',{})
    if(!live)return
    if(!Array.isArray(value.jobs))throw Error('ROOM_MEDIA_INVALID')
    const jobs=value.jobs as RoomMediaRow[]
    if(jobs.length!==2||new Set(jobs.map(j=>j.id)).size!==2||jobs.some(j=>!['floor','bench'].includes(j.id)))throw Error('ROOM_MEDIA_INVALID')
    networkFailures=0
    await Promise.all(jobs.map(async j=>{
     if(j.state!=='ready'||!j.asset||checked.has(j.id+':'+j.asset.sha256))return
     const identity=j.id+':'+j.asset.sha256
     try{
      const bytes=new Uint8Array(await api('/sessions/'+journey+'/room-art-file?asset='+j.id))
      if(!live)return
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')
      if(bytes.length!==j.asset.bytes||hash!==j.asset.sha256)throw Error('ROOM_MEDIA_IDENTITY')
      const image=await prepareRoomImage(j.id,bytes)
      if(!live){URL.revokeObjectURL(image.url);return}
      if(images[j.id])URL.revokeObjectURL(images[j.id]!.url)
      images[j.id]=image;checked.add(identity);rejected.delete(j.id);emit(rejected.size>0)
     }catch{if(live){checked.add(identity);rejected.add(j.id);emit(true)}}
    }))
    if(!live)return
    emit(rejected.size>0||jobs.some(j=>j.state==='failed'))
    if(jobs.some(j=>j.recoverable))timer=setTimeout(()=>void poll(),8000)
   }catch{if(live){emit(true);if(++networkFailures<=3)timer=setTimeout(()=>void poll(),8000)}}
  }
  void poll()
  return()=>{live=false;clearTimeout(timer);Object.values(images).forEach(image=>URL.revokeObjectURL(image!.url))}
 },[api,journey,enabled,fallback,attempt])
 const current=enabled&&snapshot.journey===journey&&snapshot.attempt===attempt&&!fallback
 return {images:current?snapshot.images:{},failed:current&&snapshot.failed,fallback,
  retry:()=>setAttempt(n=>n+1),useBaseline:()=>{try{window.alteruLocalStorage.setItem(key,'baseline')}catch{};setFallbackJourney(journey)}}
}
