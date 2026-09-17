import {photoDisplayed,photoDisplayDescription} from './old-street-photo-display'
import {archiveLoanKnown,archiveLoanLead} from './old-street-archive-loan'
import {fieldKnowledge} from './old-street-field-inquiry'
import {campaignCommission,campaignPhotoPurpose} from './old-street-campaign-story'
import {oldStreetPropState} from './old-street-prop-state'
import {campaignComplete,type OldStreetCampaign} from './old-street-campaign'
import {campaignPropTitle} from './old-street-campaign-interaction'
import type {StorySave} from './vendor/original-train/types'
import {archiveEvidence} from './old-street-archive'
export function oldStreetCurrentPurpose(save:StorySave,campaign?:OldStreetCampaign){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 if(f.departed===true)return t('信已经交给家人。','The letter has been delivered.')
 if(campaign?.archive&&!campaign.archive.order&&archiveLoanKnown(campaign.archive,f)&&!campaign.archive.examined.includes('ledger'))return archiveLoanLead(campaign.archive.content,save.locale)
 if(campaign&&campaign.version>=2&&campaign.parcel?.observed&&!campaign.archive?.order)return campaign.archive?t('找到施工索引与工作日志，再到档案整理桌核对先后顺序。','Find the work index and work log, then reconstruct the order at the archive table.'):t('在地下室资料架追查原始记录，准备隔壁档案工作间。','Follow the source records from the cellar shelf to prepare the adjoining archive.')
 const photoPurpose=campaignPhotoPurpose(save,campaign);if(photoPurpose)return photoPurpose
 if(f['letter-taken']===true&&campaign&&!campaignComplete(campaign,save.facts))return campaign.trace?.selected===undefined?t('到修表铺记录册比对寄存条，寻找信件关联的材料。','Compare the filing slip with the shop record book to trace the papers linked to the letter.'):t('到地下储物室阅读寄存材料，再决定带走原件或留下。','Read the archived papers in the cellar, then decide whether to take the original or leave it there.')
 if(campaignCommission(save)&&!save.characters.some(c=>c.id==='zhou-watchmaker'&&c.status==='known')&&!f['letter-unlocked']&&!save.inventory.some(i=>i.id==='letter-key'&&i.count>0)&&!f['letter-taken'])return save.objective
 if(f['letter-taken']===true)return t('信已收好，可以从街口回家；也可以继续逛逛。','You have the letter. Go home from the street, or keep exploring.')
 if(f['letter-unlocked']===true)return t('修表铺的小格已经打开，回去收好里面的信。','The compartment in the watch shop is open. Collect the letter inside.')
 if(save.inventory.some(i=>i.id==='letter-key'&&i.count>0))return t('带钥匙回修表铺，打开小格取信。','Take the key to the watch shop and open the compartment to collect the letter.')
 if(save.characters.some(c=>c.id==='zhou-watchmaker'&&c.status==='known'))return t('向河边工作棚的修表师借小格钥匙，再回铺里取信。','Borrow the compartment key from the watchmaker at the riverside workshop, then return to the shop for the letter.')
 return t('到修表铺取家人寄存的信。','Collect your family’s letter from the watch shop.')
}
export function oldStreetJournal(save:StorySave,campaign?:OldStreetCampaign){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 const details:Record<string,string>={
  'field-note-copy':f['field-note-disposition']==='take'?t('在照相馆抄录的副本。原件也在行囊里。','A written copy made at the studio. You also carry the original.'):t('在照相馆抄录的副本。原件留在原处。','A written copy made at the studio. The original remains where you found it.'),
  'field-note':t('从交叉索引找到的补充便笺原件。','The original supplementary note found through the cross-reference.'),
  'roof-plank':t('从河边工作棚领取的备用长板，可以搭过屋顶的破损处。','A spare plank from the riverside workshop, long enough to span the damaged roof decking.'),
  'street-negative':t('从屋顶北侧柜子取出的底片，可以带回家，也可以交回照相馆。','A negative recovered from the north roof cabinet. Bring it home or return it to the studio.'),
  'darkroom-print':t('在暗房看清细节的旧街照片。','The street photograph you revealed in the darkroom.'),
  lens:t('可以看清细小的刻记。','Useful for examining tiny marks.'),
  trolley:t('从洗衣店借来，用完可以放回原处。','Borrowed from the laundry; return it to its bay when finished.'),
  'letter-key':t('修表师借给你的小格钥匙，用完要交还。','The watchmaker lent you this compartment key. Bring it back when finished.'),
  letter:t('写着家人姓名的密封信。','A sealed letter addressed to your family.'),
  'letter-enclosure':t('与密封信一同带回的寄存材料原件。','The original archived papers to bring home with the sealed letter.'),
  clock:t('修表师请你送回洗衣店的旧钟。','The watchmaker asked you to take this clock back to the laundry.')+(f['clock-mark-known']===true?'':t('也可以先到修表铺抽屉旁，用放大镜看看钟底。','You can also examine its underside with the lens beside the watch-shop drawer before returning it.')),
  photos:t('照片夹上印着照相馆的标记。','The folder bears the photo studio’s stamp.'),
 }
 const notes:Array<{id:string;title:string;text:string}>=[]
 if(typeof f['darkroom-photo-matched']==='string'&&typeof f['darkroom-photo-discovery']==='string')notes.push({id:'darkroom-photo-discovery',title:t('照片里的发现','What the photograph shows'),text:f['darkroom-photo-discovery']})
 const commission=campaignCommission(save);if(commission)notes.push({id:'campaign-commission',title:t('家人的委托','Your family’s request'),text:commission})
 if(campaign?.trace?.observed){
  const {clue,records}=campaign.trace.content
  notes.push({id:'campaign-slip',title:t('寄存条','Filing slip'),text:`${clue.mark}; ${clue.wrapping}`})
  for(const [index,r] of records.entries())notes.push({id:`campaign-record-${index}`,title:r.label,text:`${r.mark}; ${r.wrapping}`+(campaign.trace.selected===index?t(' · 已确认；记录指向地下储物室资料架。',' · Confirmed; this record points to the cellar shelf.'):'')})
 }
 if(campaign?.parcel?.observed){notes.push({id:'campaign-papers',title:campaign.parcel.content.title,text:campaign.parcel.content.fragment});if(campaign.parcel.content.question)notes.push({id:'campaign-question',title:t('记录里的疑问','The unanswered question'),text:campaign.parcel.content.question})}
 if(campaign?.parcel?.disposition)notes.push({id:'campaign-disposition',title:t('原件去向','The original papers'),text:campaign.parcel.disposition==='take'?t('原件已在行囊里，架上不再留着这份材料。','The original is in your bag, no longer on the shelf.'):t('原件留在资料架上，你记住了内容。','The original remains on the shelf; you remember its contents.')})
 if(campaign?.archive?.order)notes.push({id:'campaign-public-summary',title:t('留下的经过','A record for others'),text:f['archive-published']===true?t('调查摘要已抄进修表铺的公共记录册。原件去向不变，离开前仍可回去撤下。','Your summary is in the watch shop public record book. The original stays where you chose; you can remove the summary before leaving.'):t('摘要没有留在公共记录册。可以回修表铺抄入，也可以只把发现带回家。','No summary remains in the public record book. You may copy it in at the watch shop, or keep the findings for your family.')})
 if(campaign?.archive){for(const source of campaign.archive.examined)notes.push({id:'archive-'+source,title:t(source==='index'?'施工索引':'工作日志',source==='index'?'Work index':'Work log'),text:archiveEvidence(campaign.archive.content,source,save.locale).join(' ')});if(campaign.archive.order)notes.push({id:'archive-reconstructed',title:campaign.archive.content.title,text:campaign.archive.content.discovery})}
 for(const note of fieldKnowledge({save,campaign}))notes.push({...note,title:t(note.id==='field-lead'?'补充便笺的线索':note.id==='field-finding'?'便笺里的发现':note.id==='field-copy'?'抄录的副本':note.id==='field-handling'?'原件与副本':'便笺去向',note.id==='field-lead'?'Follow-up lead':note.id==='field-finding'?'The note’s finding':note.id==='field-copy'?'A written copy':note.id==='field-handling'?'Original and copy':'Where the note remains')})
 if(archiveLoanKnown(campaign?.archive,f))notes.push({id:'archive-loan',title:t('工作日志的去向','Where to find the work log'),text:archiveLoanLead(campaign!.archive!.content,save.locale)})
 const encounters:Record<string,{character:string;text:string}>={
  'recovered-negative':{character:'xu-photographer',text:t('你把屋顶找回的底片交给了她保存。','You entrusted her with the negative recovered from the roof.')},
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
 if(typeof f['darkroom-photo-matched']==='string')notes.push({id:'darkroom-photo',title:t('暗房里的旧街照片','Old street photograph'),text:photoDisplayed(save)?photoDisplayDescription(save):f['darkroom-photo-choice']==='keep'?t('你把看清细节的照片带在身上。','You carry the completed photograph.'):f['darkroom-photo-choice']==='leave'?t('看清细节的照片留在暗房显影台上。','The completed photograph remains on the darkroom bench.'):t('照片里的街景细节已看清。','The details of the street photograph are now clear.')})
 const note=(fact:string,title:[string,string],text:[string,string])=>{if(f[fact]===true)notes.push({id:fact,title:t(...title),text:t(...text)})}
 note('roof-index-read',['照片背面的标记','Filing mark on the print'],['对应底片在屋顶北侧柜子的双缺口纸套里。破损处需要木板跨过去。','The matching negative is in a double-notched sleeve in the north roof cabinet. A plank is needed to cross the damaged decking.'])
 note('roof-plank-taken',['屋顶的备用板','Spare roof plank'],['你已从河边工作棚领取屋顶修补用的长板。','You collected a roof repair plank from the riverside workshop.'])
 note('roof-bridge-laid',['屋顶的通路','Roof crossing'],['长板搭住破损处两侧，可以走到北边的柜子旁。','The long plank spans the damaged decking, giving access to the north cabinet.'])
 note('roof-negative-returned',['底片回到照相馆','Negative returned'],['摄影师把找回的底片收在放大台旁。','The photographer has stored the recovered negative beside the viewing table.'])
 note('clock-mark-known',['钟底的刻记','Mark beneath the clock'],['放大镜下能看见一对燕子。','Two swallows are engraved beneath the clock.'])
 note('clock-returned',['旧钟的来历','The clock’s history'],['洗衣店主说，这是母亲留下的钟。','The laundry owner said the clock belonged to her mother.'])
 note('photos-matched',['拼合的旧照','The matched photograph'],['窗沿和晾衣绳接上后，是洗衣店的旧店面。','The window sill and clothesline form an old view of the laundry.'])
 note('photos-returned',['照片物归原主','Photographs returned'],['摄影师收回了找到的照片。','The photographer has the recovered photographs.'])
 note('crates-cleared',['露出的台阶','Steps uncovered'],['旧箱已移到墙边，可以从院子下到地下室。','The crates are beside the wall. The courtyard steps lead down to the cellar.'])
 note('yard-unlatched',['院门捷径','Courtyard shortcut'],['棚侧插销已打开，院子和工作棚可以直接往返。','The bolt is open. The workshop and courtyard now connect directly.'])
 for(const subject of ['clock','photo'])if(f[`${subject}-consent`]===true){
  notes.push({id:`${subject}-record`,title:subject==='clock'?t('旧钟记录','Clock record'):t('旧照记录','Photograph record'),text:f[`${subject}-recorded`]===true?t('获准留下的这一条已放进修表铺记录册。','The approved entry is in the watch shop’s record book.'):t('主人已同意留下这一条；可到修表铺记录册前决定是否收录。','The owner approved this entry. Visit the watch shop’s record book to decide whether to include it.')})
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
  const state=key.startsWith('visible:')?(campaignPropTitle({save,campaign},key.slice(8))??oldStreetPropState(key.slice(8),save)):undefined
  notes.push({...entry,title:state?t('观察记录','Observation'):t('先前的观察','Earlier observation'),text:state?t(...state):entry.text.replace(/^当前房间的物件状态：/,'').replace(/^Object state in the current room: /,'')})
 }
 return {purpose:oldStreetCurrentPurpose(save,campaign),items:save.inventory.filter(i=>i.count>0).map(i=>({id:i.id,title:i.label,count:i.count,text:details[i.id]??i.detail??''})),notes,people}
}
