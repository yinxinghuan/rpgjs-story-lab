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
  const f=c.field;if(!f||!nearby(f.content.target,fieldSites[f.content.target].room))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
  const selection=body.type==='campaign-observe'?'read':body.type==='campaign-decide'?body.selection:undefined
  if(!fieldChoices(h,body.target).some(a=>a.selection===selection))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
  if(selection==='read'){f.observed=true;save.facts['field-note-finding']=f.content.finding;text=f.content.finding}
  else{
   f.disposition=selection;save.facts['field-note-disposition']=selection
   if(selection==='take')save.inventory.push({id:'field-note',label:t('补充便笺','Supplementary note'),count:1,rarity:'common'})
   text=selection==='take'?t('你收好便笺，准备让家人亲眼看看。原处只剩一道纸张压过的痕迹。','You pack the note to show your family. Only the paper’s impression remains where it lay.'):t('你记住内容，把便笺平放回原处，留给后来的人。','You remember what it says and lay the note back for the next reader.')
  }
 }
 save.blocks.push({id:body.action_id+':field',kind:'narration',text,data:{oldStreetCampaignStage:'field'}})
 next.version++;next.position=position
 return {head:next,accepted:true,kind:'field-inquiry',text}
}
