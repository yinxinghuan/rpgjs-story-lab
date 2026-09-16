import {campaignAnchor} from './old-street-campaign'
import type {OldStreetHead} from './old-street-head'
import {originalActionIntentIssues} from './original-action-intent'

type CampaignAction={id:string;label:string;type:'campaign-read'|'campaign-decide';stage:'trace'|'parcel';selection?:number|'take'|'leave'}
/** Labels describe every visible choice, never which one is correct. The model
 * proposes an ID; the existing campaign authority still evaluates the choice. */
export function campaignInputActions(h:OldStreetHead,target:string):CampaignAction[]{
 const c=h.campaign,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 if(!c||!h.save.facts['letter-taken'])return []
 if(h.sceneId===campaignAnchor.trace.scene&&target===campaignAnchor.trace.target)return [
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
export function resolveCampaignInput(text:string,actions:CampaignAction[]){
 if(originalActionIntentIssues(text,actions.map(a=>a.label)).length)return undefined
 const normalize=(s:string)=>s.normalize('NFKC').trim().toLowerCase().replace(/[。.!！]+$/u,'')
 // Exact visible choices are an offline convenience, not the natural language parser.
 return actions.find(a=>normalize(a.label)===normalize(text))?.id
}
export function campaignPropTitle(h:Pick<OldStreetHead,'save'|'campaign'>,target:string):readonly [string,string]|undefined{
 if(!h.campaign||!h.save.facts['letter-taken'])return
 if(target==='record-book')return ['记录册 · 寄存记录','Record book · filing records']
 if(target==='photo-folder'&&h.campaign.trace?.selected!==undefined)return ['旧资料架','Old paper shelf']
}
export function campaignInputKnowledge(h:OldStreetHead){
 const c=h.campaign,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 const knowledge:Array<{id:string;text:string}>=[]
 if(!c||!h.save.facts['letter-taken'])return knowledge
 knowledge.push({id:'learned:filing-slip',text:t('密封信旁有一张独立寄存条，需要在修表铺记录册比对。','A separate filing slip beside the sealed letter can be compared with the shop record book.')})
 if(c.trace?.observed){
  const {clue,records}=c.trace.content
  knowledge.push({id:'learned:campaign-records',text:t('已经查阅的寄存条与记录：','Previously examined slip and records: ')+JSON.stringify({clue,records})})
 }
 if(c.trace?.selected!==undefined)knowledge.push({id:'learned:campaign-match',text:t(`已确认记录：${c.trace.content.records[c.trace.selected].label}。这条记录指向地下储物室的旧资料架。`,`Confirmed record: ${c.trace.content.records[c.trace.selected].label}. This record points to the old paper shelf in the cellar.`)})
 if(c.parcel?.observed)knowledge.push({id:'learned:campaign-papers',text:c.parcel.content.fragment})
 if(c.parcel?.disposition)knowledge.push({id:'learned:campaign-disposition',text:c.parcel.disposition==='take'?t('寄存材料原件已在行囊里，不在架上。','The original archived papers are in your bag, no longer on the shelf.'):t('你已选择把寄存材料原件留在架上，记住内容。','You chose to leave the original archived papers on the shelf and remember their contents.')})
 return knowledge
}
