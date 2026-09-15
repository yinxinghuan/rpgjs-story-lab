import type {StorySave} from './vendor/original-train/types'
export function oldStreetJournal(save:StorySave){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 const details:Record<string,string>={
  lens:t('可以看清细小的刻记。','Useful for examining tiny marks.'),
  trolley:t('从洗衣店借来，用完可以放回原处。','Borrowed from the laundry; return it to its bay when finished.'),
  'letter-key':t('修表师借给你的小格钥匙，用完要交还。','The watchmaker lent you this compartment key. Bring it back when finished.'),
  letter:t('写着家人姓名的密封信。','A sealed letter addressed to your family.'),
  clock:t('修表师请你送回洗衣店的旧钟。','The watchmaker asked you to take this clock back to the laundry.'),
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
 if(typeof f['darkroom-photo-matched']==='string')notes.push({id:'darkroom-photo',title:t('暗房里的旧街照片','Old street photograph'),text:t('屋檐与石板路已拼合成完整的街景。','The rooflines and paving join into a complete street view.')})
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
 return {purpose:f.departed===true?t('信已经交给家人。','The letter has been delivered.'):f['letter-taken']===true?t('信已收好，可以从街口回家；也可以继续逛逛。','You have the letter. Go home from the street, or keep exploring.'):t('到修表铺取家人寄存的信。','Collect your family’s letter from the watch shop.'),items:save.inventory.filter(i=>i.count>0).map(i=>({id:i.id,title:i.label,count:i.count,text:details[i.id]??i.detail??''})),notes,people}
}
