import {oldStreetPropState} from './old-street-prop-state'
import type {StorySave} from './vendor/original-train/types'
export function oldStreetCurrentPurpose(save:StorySave){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 if(f.departed===true)return t('信已经交给家人。','The letter has been delivered.')
 if(f['letter-taken']===true)return t('信已收好，可以从街口回家；也可以继续逛逛。','You have the letter. Go home from the street, or keep exploring.')
 if(f['letter-unlocked']===true)return t('修表铺的小格已经打开，回去收好里面的信。','The compartment in the watch shop is open. Collect the letter inside.')
 if(save.inventory.some(i=>i.id==='letter-key'&&i.count>0))return t('带钥匙回修表铺，打开小格取信。','Take the key to the watch shop and open the compartment to collect the letter.')
 if(save.characters.some(c=>c.id==='zhou-watchmaker'&&c.status==='known'))return t('向河边工作棚的修表师借小格钥匙，再回铺里取信。','Borrow the compartment key from the watchmaker at the riverside workshop, then return to the shop for the letter.')
 return t('到修表铺取家人寄存的信。','Collect your family’s letter from the watch shop.')
}
export function oldStreetJournal(save:StorySave){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 const details:Record<string,string>={
  'darkroom-print':t('在暗房拼合的旧街照片。','The old street photograph you matched in the darkroom.'),
  lens:t('可以看清细小的刻记。','Useful for examining tiny marks.'),
  trolley:t('从洗衣店借来，用完可以放回原处。','Borrowed from the laundry; return it to its bay when finished.'),
  'letter-key':t('修表师借给你的小格钥匙，用完要交还。','The watchmaker lent you this compartment key. Bring it back when finished.'),
  letter:t('写着家人姓名的密封信。','A sealed letter addressed to your family.'),
  clock:t('修表师请你送回洗衣店的旧钟。','The watchmaker asked you to take this clock back to the laundry.')+(f['clock-mark-known']===true?'':t('也可以先到修表铺抽屉旁，用放大镜看看钟底。','You can also examine its underside with the lens beside the watch-shop drawer before returning it.')),
  photos:t('照片夹上印着照相馆的标记。','The folder bears the photo studio’s stamp.'),
 }
 const notes:Array<{id:string;title:string;text:string}>=[]
 const encounters:Record<string,{character:string;text:string}>={
  'kept-promise':{character:'zhou-watchmaker',text:t('你已把借来的钥匙交还给他。','You returned the key he lent you.')},
  'returned-family-clock':{character:'lan-laundry',text:t('你帮她送回了母亲留下的旧钟。','You brought back the clock that belonged to her mother.')},
  'returned-photographs':{character:'xu-photographer',text:t('你帮她找回并交还了旧照片。','You found and returned her old photographs.')},
 }
 // Only the persisted introduced roster is visible; future cast definitions
 // and global facts alone cannot make a person appear here.
 const people=save.characters.filter(c=>['known','companion','departed'].includes(c.status)).map(c=>{
  const events=[...new Set(save.relationships.filter(r=>r.characterId===c.id&&r.delta>0&&encounters[r.axis]?.character===c.id).map(r=>encounters[r.axis].text))]
  return {id:c.id,title:c.name,text:[c.role,...events].filter(Boolean).join(' · ')}
 })
 if(typeof f['darkroom-photo-matched']==='string')notes.push({id:'darkroom-photo',title:t('暗房里的旧街照片','Old street photograph'),text:f['darkroom-photo-choice']==='keep'?t('你把拼好的照片带在身上。','You carry the completed photograph.'):f['darkroom-photo-choice']==='leave'?t('拼好的照片留在暗房显影台上。','The completed photograph remains on the darkroom bench.'):t('屋檐与石板路已拼合成完整的街景。','The rooflines and paving join into a complete street view.')})
 const note=(fact:string,title:[string,string],text:[string,string])=>{if(f[fact]===true)notes.push({id:fact,title:t(...title),text:t(...text)})}
 note('clock-mark-known',['钟底的刻记','Mark beneath the clock'],['放大镜下能看见一对燕子。','Two swallows are engraved beneath the clock.'])
 note('clock-returned',['旧钟的来历','The clock’s history'],['洗衣店主说，这是母亲留下的钟。','The laundry owner said the clock belonged to her mother.'])
 note('photos-matched',['拼合的旧照','The matched photograph'],['窗沿和晾衣绳接上后，是洗衣店的旧店面。','The window sill and clothesline form an old view of the laundry.'])
 note('photos-returned',['照片物归原主','Photographs returned'],['摄影师收回了找到的照片。','The photographer has the recovered photographs.'])
 note('crates-cleared',['露出的台阶','Steps uncovered'],['旧箱已移到墙边，可以从院子下到地下室。','The crates are beside the wall. The courtyard steps lead down to the cellar.'])
 note('yard-unlatched',['院门捷径','Courtyard shortcut'],['棚侧插销已打开，院子和工作棚可以直接往返。','The bolt is open. The workshop and courtyard now connect directly.'])
 for(const subject of ['clock','photo'])if(f[`${subject}-consent`]===true){
  notes.push({id:`${subject}-record`,title:subject==='clock'?t('旧钟记录','Clock record'):t('旧照记录','Photograph record'),text:f[`${subject}-recorded`]===true?t('获准留下的这一条已放进修表铺记录册。','The approved entry is in the watch shop’s record book.'):t('主人已同意留下这一条，目前未放在记录册中。','The owner approved this entry; it is not currently in the record book.')})
 }
 const observations=new Map<string,{id:string;text:string}>()
 for(const block of save.blocks){
  let discoveries:unknown
  try{discoveries=JSON.parse(String(block.data?.oldStreetDiscoveries??'null'))}catch{continue}
  if(!Array.isArray(discoveries))continue
  for(const discovery of discoveries){
   if(!discovery||typeof discovery.id!=='string'||typeof discovery.text!=='string')continue
   if(discovery.id.startsWith('learned:'))continue
   observations.set(discovery.id,{id:'observation:'+block.id+':'+discovery.id,text:discovery.text})
  }
 }
 for(const [key,entry] of observations){
  // Completed photographs already have one authoritative note above.
  if(key==='visible:developing-bench'&&typeof f['darkroom-photo-matched']==='string')continue
  const state=key.startsWith('visible:')?oldStreetPropState(key.slice(8),save):undefined
  notes.push({...entry,title:state?t('观察记录','Observation'):t('先前的观察','Earlier observation'),text:state?t(...state):entry.text.replace(/^当前房间的物件状态：/,'').replace(/^Object state in the current room: /,'')})
 }
 return {purpose:oldStreetCurrentPurpose(save),items:save.inventory.filter(i=>i.count>0).map(i=>({id:i.id,title:i.label,count:i.count,text:details[i.id]??i.detail??''})),notes,people}
}
