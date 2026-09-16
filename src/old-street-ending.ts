import type {StorySave,StoryCartridge,StoryEndingCandidate} from './vendor/original-train/types'
import {buildEndingSnapshot,finalizeEnding} from './vendor/original-train/engine/endingDirector'
/** A quiet exploration ending has no mandatory loss, four-act montage or new
 * image job. Reuse the Core snapshot/finale format, not train-specific drama. */
export function completeOldStreetEnding(save:StorySave,cartridge:StoryCartridge):void{
 if(save.cartridgeId!=='old-street-letter'||cartridge.id!==save.cartridgeId||save.facts.departed!==true)throw Error('OLD_STREET_ENDING_NOT_READY')
 if(save.finale.status==='complete')return
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 const flag=(id:string)=>save.facts[id]===true
 const preserved=[t('密封信已交到家人手里。','The sealed letter is back with your family.')]
 if(save.facts['campaign-enclosure-disposition']==='take')preserved.push(t('你也带回了在旧街查到的寄存材料，原件不再留在资料架上。','You also brought home the archived papers you traced. The original no longer remains on the shelf.'))
 if(save.facts['campaign-enclosure-disposition']==='leave')preserved.push(t('你向家人转述了材料里的发现，原件仍留在旧街。','You told your family what you found in the papers. The original remains on the old street.'))
 if(flag('archive-reconstructed')){const record=save.blocks.find(b=>b.data?.archiveReconstructed===1);if(record)preserved.push(record.text)}
 if(flag('clock-returned'))preserved.push(t('旧钟回到了洗衣店。','The old clock is back at the laundry.'))
 if(flag('photos-returned'))preserved.push(t('照片夹回到了照相馆。','The photo folder is back at the studio.'))
 if(flag('clock-recorded')&&flag('clock-consent'))preserved.push(t('旧钟的来历留在记录册里。','The clock’s history remains in the record book.'))
 if(flag('photo-recorded')&&flag('photo-consent'))preserved.push(t('获准分享的店面旧照留在记录册里。','The approved shop photograph remains in the record book.'))
 if(save.facts['darkroom-photo-choice']==='keep')preserved.push(t('你带回了一张在暗房拼好的旧街照片。','You brought home the street photograph you matched in the darkroom.'))
 if(save.facts['darkroom-photo-choice']==='leave')preserved.push(t('拼好的旧街照片留在暗房，等下一位来客翻看。','The completed street photograph remains in the darkroom for another visitor.'))
 const unresolved=save.inventory.filter(i=>i.count>0&&['letter-key','trolley','clock','photos'].includes(i.id)).map(i=>t(`你离开时还带着${i.label}。`,`You still carried ${i.label} when you left.`))
 const known=new Set(save.characters.map(c=>c.id))
 const name=(id:string)=>save.characters.find(c=>c.id===id)?.name??''
 const watchmaker=name('zhou-watchmaker'),laundry=name('lan-laundry'),photographer=name('xu-photographer')
 const epilogues=[
  {characterId:'zhou-watchmaker',text:flag('key-borrowed')?t(`${watchmaker}的小格钥匙还在你这里。`,`You still have the compartment key you borrowed from ${watchmaker}.`):t(`你把借用的钥匙还给了${watchmaker}。`,`You returned the borrowed key to ${watchmaker}.`)},
  {characterId:'lan-laundry',text:flag('clock-returned')?t(`${laundry}把母亲的钟放回了柜台。`,`${laundry} put her mother’s clock back on the counter.`):t(`你在洗衣店认识了${laundry}。`,`You met ${laundry} at the laundry.`)},
  {characterId:'xu-photographer',text:flag('photos-returned')?t(`${photographer}收好了你找回的照片。`,`${photographer} put away the photographs you found.`):t(`你在照相馆认识了${photographer}。`,`You met ${photographer} at the photo studio.`)},
 ].filter(e=>known.has(e.characterId))
 // Meeting Zhou without borrowing a key is possible in legacy drafts. Do not
 // invent a returned key unless a recorded promise actually exists.
 const zhou=epilogues.find(e=>e.characterId==='zhou-watchmaker')
 if(zhou&&!flag('key-borrowed')&&!save.relationships.some(r=>r.characterId==='zhou-watchmaker'&&r.axis==='kept-promise'))zhou.text=t(`你在河边工作棚认识了${watchmaker}。`,`You met ${watchmaker} at the riverside workshop.`)
 const candidate:StoryEndingCandidate={anchorFamily:'oldstreet-home',title:t('信已送到','The letter is home'),thesis:t('一封信到了目的地，旧街留下了你走过的痕迹。','The letter reached its destination. Your visit left its mark on the old street.'),capabilitiesUsed:[],irreversibleCosts:[],preserved,lost:[],unresolved,finaleScenes:[t('你把密封信交到家人手里。','You place the sealed letter in your family’s hands.'),...preserved.slice(1)],characterEpilogues:epilogues,regionalEpilogues:[],finalImagePrompt:''}
 const snapshot=buildEndingSnapshot(save,cartridge)
 save.finale={status:'complete',reason:'oldstreet:letter-delivered',snapshot,ending:finalizeEnding(candidate,snapshot,false)}
 save.sessionEnded=true;save.choices=[]
}
