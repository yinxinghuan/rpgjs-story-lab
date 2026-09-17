import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetJournalView} from '../src/old-street-journal-view'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {oldStreetCharacterDefinitions,currentOldStreetCastFacts} from '../src/old-street-characters'
import '../src/old-street-dev.css'
function Review(){
 const [open,setOpen]=useState(true),[locale,setLocale]=useState<'en'|'zh'>('zh'),[empty,setEmpty]=useState(false),[legacy,setLegacy]=useState(false),[failedPhoto,setFailedPhoto]=useState(false)
 const save=createInitialSave(oldStreetCartridge(locale)),zh=locale==='zh'
 if(!empty){
  Object.assign(save.facts,{'clock-mark-known':true,'photos-matched':true,'roof-index-read':true,'roof-plank-taken':true,...(!legacy?currentOldStreetCastFacts:{'laundry-cast-v2':false,'photographer-cast-v2':false})})
  save.characters=oldStreetCharacterDefinitions(locale,save).map(c=>({...c,status:'known' as const,origin:'cartridge' as const,lastKnownLocation:'street',updatedAtScene:0}))
  save.inventory=[['darkroom-print','旧街照片','Street photograph'],['lens','放大镜','Magnifying glass'],['clock','旧钟','Old clock'],['letter-key','小格钥匙','Compartment key'],['trolley','推车','Trolley'],['photos','旧照片','Old photographs'],['roof-plank','长木板','Long plank'],['street-negative','底片','Negative'],['letter','密封信','Sealed letter'],['field-note','便笺','Written note']].map(([id,z,e])=>({id,label:zh?z:e,count:1,detail:''}))
 }
 return <main className="os-dev"><button onClick={()=>setOpen(true)}>Open backpack</button><button onClick={()=>setLocale(zh?'en':'zh')}>中文 / English</button><button onClick={()=>setEmpty(!empty)}>Empty: {String(empty)}</button><button onClick={()=>setFailedPhoto(!failedPhoto)}>Failed photo: {String(failedPhoto)}</button><button onClick={()=>setLegacy(!legacy)}>Legacy: {String(legacy)}</button>{open&&<OldStreetJournalView photoImage={failedPhoto?'./_qa/missing-photo.png':undefined} save={save} onClose={()=>setOpen(false)}/>}</main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
