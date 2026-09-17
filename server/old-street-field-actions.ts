import {readFieldContent,fieldSites,fieldLead,fieldChoices} from '../src/old-street-field-inquiry'
import {bindOldStreet} from '../src/old-street-space'
import {LabError} from '../src/journey-runtime'
import type {OldStreetHead} from '../src/old-street-head'
import type {CampaignCandidate} from './old-street-campaign-actions'
export function prepareFieldAction(h:OldStreetHead,body:any,position:OldStreetHead['position'],candidate?:CampaignCandidate){
 if(!h.campaign?.archive?.order)throw new LabError('CAMPAIGN_OBSERVATION_REQUIRED',409)
 const next=structuredClone(h),c=next.campaign!,save=next.save,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 const nearby=(target:string,scene:string)=>h.sceneId===scene&&body.target===target&&bindOldStreet(save.locale,save).canInteract(target,scene,position)
 let text=''
 if(body.type==='campaign-plan'){
  if(c.field||!nearby('archive-desk','archive'))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
  const raw=candidate?.(h,'field');if(!raw)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
  try{c.field={id:body.action_id,content:readFieldContent(raw),observed:false}}catch{throw new LabError('CAMPAIGN_PLAN_REJECTED',409)}
  text=fieldLead(c.field,save.locale)
 }else{
  const f=c.field;if(!f||!nearby(body.target,body.target==='viewing-table'?'photo':fieldSites[f.content.target].room))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
  const selection=body.type==='campaign-observe'?'read':body.type==='campaign-decide'?body.selection:undefined
  if(!fieldChoices(h,body.target).some(a=>a.selection===selection))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
  if(selection==='read'){f.observed=true;save.facts['field-note-finding']=f.content.finding;text=f.content.finding}
  else if(selection==='copy'){
   f.copy={title:f.content.title,finding:f.content.finding};save.facts['field-note-copy']=f.copy.finding
   save.inventory.push({id:'field-note-copy',label:t('便笺副本','Written copy of the note'),count:1,rarity:'common'})
   text=t('你在放大台上摊平便笺，仔细抄录一份收进行囊。原件没有被交出或归还。','You flatten the note on the viewing table, carefully copy it, and pack the copy. The original has not been handed over or returned.')
   if(f.disposition==='take')text+=t(`可回${fieldSites[f.content.target].label[0]}放回原件。`,` Return the original to ${fieldSites[f.content.target].label[1]} if you want to leave it for others.`)
   if(f.disposition!=='take')text=t('你在放大台抄录一份便笺收进行囊，原件仍放在台上。','You make a written copy at the viewing table and pack it. The original remains on the table.')
  }else{
   const taking=selection==='take'||selection==='borrow'
   f.disposition=taking?'take':'leave';save.facts['field-note-disposition']=f.disposition
   if(!taking)save.inventory=save.inventory.filter(i=>i.id!=='field-note')
   if(taking)save.inventory.push({id:'field-note',label:t('补充便笺','Supplementary note'),count:1,rarity:'common'})
   text=taking?t('你收好便笺原件。可以带回家，也可以到照相馆放大台抄录后归还。','You pack the original note. Bring it home, or copy it at the studio viewing table and return it.'):t('你记住内容，把便笺平放回原处，留给后来的人。','You remember what it says and lay the note back for the next reader.')
  }
 }
 save.blocks.push({id:body.action_id+':field',kind:'narration',text,data:{oldStreetCampaignStage:'field'}})
 next.version++;next.position=position
 return {head:next,accepted:true,kind:'field-inquiry',text}
}
