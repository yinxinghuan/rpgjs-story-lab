import {fieldChoices,fieldKnowledge,type FieldSelection} from './old-street-field-inquiry'
import {archiveReadingChoices,archiveReadingStatus,type ArchiveReadingAction} from './old-street-archive-reading'
import {campaignCommission} from './old-street-campaign-story'
import {campaignAnchor} from './old-street-campaign'
import type {OldStreetHead} from './old-street-head'
import {originalActionIntentIssues} from './original-action-intent'
import {archiveEvidence,archiveRackState,archiveRackLabel} from './old-street-archive'
import {publicRecordAction,publicRecordKnowledge} from './old-street-public-record'

type CampaignAction={id:string;label:string;type:'campaign-read'|'campaign-decide'|'campaign-observe';stage:'trace'|'parcel'|'archive'|'field';selection?:FieldSelection|number|'take'|'leave'|'share'|'withdraw'|'slide'|'restore'|ArchiveReadingAction}
/** Labels describe every visible choice, never which one is correct. The model
 * proposes an ID; the existing campaign authority still evaluates the choice. */
export function campaignInputActions(h:OldStreetHead,target:string):CampaignAction[]{
 const c=h.campaign,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 if(!c||!h.save.facts['letter-taken'])return []
 const field=fieldChoices(h,target);if(field.length)return field
 if(h.sceneId==='archive'&&c.archive&&target==='archive-rack'&&archiveRackState(h.save.facts)?.slide)return [{id:'campaign:move-rack',label:archiveRackLabel(h.save.facts,h.save.locale),type:'campaign-decide',stage:'archive',selection:h.save.facts['archive-rack-shifted']===true?'restore':'slide'}]
 if(target==='archive-index'&&archiveRackState(h.save.facts)?.indexBlocked)return []
 if(c.archive&&h.sceneId==='archive'&&['archive-index','archive-ledger','archive-desk'].includes(target))return [...archiveReadingChoices(c.archive,h.save,target,h.save.locale).map(a=>({id:'campaign:'+a.selection,label:a.label,type:'campaign-decide' as const,stage:'archive' as const,selection:a.selection})),{id:'campaign:examine-'+target,label:t(target==='archive-desk'?'整理记录卡':target==='archive-index'?'查阅施工索引':'查阅工作日志',target==='archive-desk'?'Arrange the event cards':target==='archive-index'?'Examine the work index':'Examine the work log'),type:'campaign-observe',stage:'archive'}]
 if(h.sceneId===campaignAnchor.trace.scene&&target===campaignAnchor.trace.target)return [
  ...(c.archive?.order?[{id:h.save.facts['archive-published']===true?'campaign:withdraw-summary':'campaign:share-summary',label:publicRecordAction(h.save.facts['archive-published']===true,h.save.locale),type:'campaign-decide' as const,stage:'trace' as const,selection:h.save.facts['archive-published']===true?'withdraw' as const:'share' as const}]:[]),
  {id:'campaign:read-trace',label:t('查阅寄存记录','Read the filing records'),type:'campaign-read',stage:'trace'},
  ...(c.trace?.observed&&c.trace.selected===undefined?c.trace.content.records.map((r,selection)=>({
   id:`campaign:select-record-${selection}`,label:t(`选定记录「${r.label}」（${r.mark}；${r.wrapping}）`,`Select record “${r.label}” (${r.mark}; ${r.wrapping})`),
   type:'campaign-decide' as const,stage:'trace' as const,selection,
  })):[]),
 ]
 if(h.sceneId===campaignAnchor.parcel.scene&&target===campaignAnchor.parcel.target&&c.trace?.selected!==undefined)return [
  {id:'campaign:read-parcel',label:t('阅读寄存材料','Read the archived papers'),type:'campaign-read',stage:'parcel'},
  ...(c.parcel?.observed&&!c.parcel.disposition?[
   {id:'campaign:take-parcel',label:t('带走寄存材料原件','Take the original archived papers'),type:'campaign-decide' as const,stage:'parcel' as const,selection:'take' as const},
   {id:'campaign:leave-parcel',label:t('记住材料内容，把原件留在架上','Remember the contents and leave the original on the shelf'),type:'campaign-decide' as const,stage:'parcel' as const,selection:'leave' as const},
  ]:[]),
 ]
 return []
}
export function resolveCampaignInput(text:string,actions:ReadonlyArray<{id:string;label:string}>){
 if(originalActionIntentIssues(text,actions.map(a=>a.label)).length)return undefined
 const normalize=(s:string)=>s.normalize('NFKC').trim().toLowerCase().replace(/[。.!！]+$/u,'')
 // Exact visible choices are an offline convenience, not the natural language parser.
 return actions.find(a=>normalize(a.label)===normalize(text))?.id
}
export function campaignPropTitle(h:Pick<OldStreetHead,'save'|'campaign'>,target:string):readonly [string,string]|undefined{
 if(!h.campaign||!h.save.facts['letter-taken'])return
 if(target==='record-book')return h.campaign.archive?.order?(h.save.facts['archive-published']===true?['记录册 · 已留下调查摘要','Record book · your findings']:['记录册 · 可留下调查摘要','Record book · share your findings']):['记录册 · 寄存记录','Record book · filing records']
 if(target==='photo-folder'&&h.campaign.trace?.selected!==undefined)return ['旧资料架','Old paper shelf']
}
export function campaignInputKnowledge(h:OldStreetHead){
 const c=h.campaign,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 const knowledge:Array<{id:string;text:string}>=[]
 if(!c)return knowledge
 const commission=campaignCommission(h.save);if(commission)knowledge.push({id:'learned:campaign-commission',text:commission})
 if(!h.save.facts['letter-taken'])return knowledge
 knowledge.push({id:'learned:filing-slip',text:t('密封信旁有一张独立寄存条，需要在修表铺记录册比对。','A separate filing slip beside the sealed letter can be compared with the shop record book.')})
 if(c.trace?.observed){
  const {clue,records}=c.trace.content
  knowledge.push({id:'learned:campaign-records',text:t('已经查阅的寄存条与记录：','Previously examined slip and records: ')+JSON.stringify({clue,records})})
 }
 if(c.trace?.selected!==undefined)knowledge.push({id:'learned:campaign-match',text:t(`已确认记录：${c.trace.content.records[c.trace.selected].label}。这条记录指向地下储物室的旧资料架。`,`Confirmed record: ${c.trace.content.records[c.trace.selected].label}. This record points to the old paper shelf in the cellar.`)})
 if(c.parcel?.observed){knowledge.push({id:'learned:campaign-papers',text:c.parcel.content.fragment});if(c.parcel.content.question)knowledge.push({id:'learned:campaign-question',text:c.parcel.content.question})}
 if(c.archive){
  const reading=archiveReadingStatus(c.archive,h.save,'archive-'+c.archive.content.denseSource,h.save.locale);if(reading)knowledge.push({id:'learned:archive-reading-status',text:reading})
  for(const source of c.archive.examined)knowledge.push({id:'learned:archive-'+source,text:archiveEvidence(c.archive.content,source,h.save.locale).join(' ')})
  if(c.archive.order)knowledge.push({id:'learned:archive-discovery',text:c.archive.content.discovery})
 }
 if(c.parcel?.disposition)knowledge.push({id:'learned:campaign-disposition',text:c.parcel.disposition==='take'?t('寄存材料原件已在行囊里，不在架上。','The original archived papers are in your bag, no longer on the shelf.'):t('你已选择把寄存材料原件留在架上，记住内容。','You chose to leave the original archived papers on the shelf and remember their contents.')})
 return [...knowledge,...publicRecordKnowledge(h),...fieldKnowledge(h).map(k=>({...k,id:'learned:'+k.id}))]
}
