import {campaignAnchor,campaignRecordMatches,readParcelContent,readTraceContent,type CampaignContext} from '../src/old-street-campaign'
import type {OldStreetHead} from '../src/old-street-head'
import {bindOldStreet} from '../src/old-street-space'
import {LabError} from '../src/journey-runtime'
import type {OldStreetCampaignGenerator} from './old-street-campaign-planner'
import {prepareArchiveAction} from './old-street-archive-actions'
export type CampaignCandidate=(head:OldStreetHead,stage:'trace'|'parcel'|'archive')=>unknown|undefined

export async function prepareCampaignAction(head:OldStreetHead,body:any,position:OldStreetHead['position'],generate:OldStreetCampaignGenerator|undefined,reserve:()=>boolean,candidate?:CampaignCandidate){
 if(body.stage==='archive')return prepareArchiveAction(head,body,position,candidate)
 const anchor=campaignAnchor[body.stage as keyof typeof campaignAnchor],c=head.campaign
 if(!anchor||!c||head.save.facts['letter-taken']!==true||head.sceneId!==anchor.scene||body.target!==anchor.target||!bindOldStreet(head.save.locale,head.save).canInteract(anchor.target,anchor.scene,position))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 const next=structuredClone(head),campaign=next.campaign!,save=next.save,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 let text=''
 if(body.type==='campaign-plan'||body.type==='campaign-read'&&!campaign[body.stage as 'trace'|'parcel']){
  if(campaign[body.stage as 'trace'|'parcel'])throw new LabError('CAMPAIGN_ALREADY_PREPARED',409)
  if(!generate&&!candidate)throw new LabError('CAMPAIGN_GENERATOR_UNAVAILABLE',409)
  let context:CampaignContext={stage:'trace',locale:save.locale}
  if(body.stage==='parcel'){
   if(campaign.trace?.selected===undefined)throw new LabError('CAMPAIGN_TRACE_REQUIRED',409)
   context={stage:'parcel',locale:save.locale,previous:structuredClone(campaign.trace.content.records[campaign.trace.selected]),...(campaign.version===2?{investigation:true as const}:{})}
  }
  let raw:unknown
  if(candidate){raw=candidate(head,body.stage);if(raw===undefined)throw new LabError('CAMPAIGN_NOT_PREPARED',409)}
  else{
   if(!reserve())throw new LabError('NARRATION_RATE_LIMIT',429)
   const signal=AbortSignal.timeout(22000)
   try{raw=await generate!(context,signal);signal.throwIfAborted()}catch{throw new LabError('OLD_STREET_MODEL_UNAVAILABLE',409)}
  }
  try{
   if(body.stage==='trace')campaign.trace={id:body.action_id,content:readTraceContent(raw),observed:false}
   else campaign.parcel={id:body.action_id,content:readParcelContent(raw),observed:false}
  }catch{throw new LabError('CAMPAIGN_PLAN_REJECTED',409)}
  text=t('材料已经展开，可以仔细看看。','The papers are laid out, ready to examine.')
 }
 if(body.type==='campaign-observe'||body.type==='campaign-read'){
  if(body.stage==='trace'){
   if(!campaign.trace)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
   campaign.trace.observed=true
   const {clue,records}=campaign.trace.content
   text=t(`寄存条：${clue.mark}；${clue.wrapping}。\n`, `Filing slip: ${clue.mark}; ${clue.wrapping}.\n`)+records.map(r=>`${r.label}: ${r.mark}; ${r.wrapping}`).join('\n')
  }else{
   if(!campaign.parcel)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
   campaign.parcel.observed=true;text=campaign.parcel.content.fragment
  }
 }else if(body.type==='campaign-decide'){
  if(body.stage==='trace'){
   if(body.selection==='share'||body.selection==='withdraw'){
    if(!campaign.archive?.order)throw new LabError('CAMPAIGN_OBSERVATION_REQUIRED',409)
    const publish=body.selection==='share'
    if((save.facts['archive-published']===true)===publish)throw new LabError('CAMPAIGN_ALREADY_RESOLVED',409)
    save.facts['archive-published']=publish
    text=publish?t('你把核对过的经过抄进记录册，给后来的人留下一页。原件和密封信仍按原来的去向保存。','You copy the verified account into the record book for later visitors. The original papers and sealed letter stay where you chose to keep them.'):t('你从公共记录册撤下这页摘要。已经查清的经过仍记在自己的发现里。','You remove your summary from the public record book. What you learned remains in your own discoveries.')
   }else{
   if(!campaign.trace?.observed||campaign.trace.selected!==undefined)throw new LabError('CAMPAIGN_OBSERVATION_REQUIRED',409)
   if(!campaignRecordMatches(campaign.trace.content,body.selection))throw new LabError('CAMPAIGN_RECORD_MISMATCH',409)
   campaign.trace.selected=body.selection
   text=t('两处特征都对上了。对应的纸袋在地下储物室的旧资料架上。','Both details match. The packet is on the old paper shelf in the cellar.')
   save.objective=t('到地下储物室查看对应的寄存材料。','Find the matching packet on the cellar shelf.')
   }
  }else{
   if(!campaign.parcel?.observed||campaign.parcel.disposition||!['take','leave'].includes(body.selection))throw new LabError('CAMPAIGN_OBSERVATION_REQUIRED',409)
   campaign.parcel.disposition=body.selection
   save.facts['campaign-enclosure-disposition']=body.selection
   if(body.selection==='take')save.inventory.push({id:'letter-enclosure',label:t('寄存的旧街材料','Archived street papers'),count:1,rarity:'common'})
   text=body.selection==='take'?t('你把材料收好，准备和密封信一起带回去。架上不再留着这份原件。','You pack the papers to bring home with the sealed letter. The original is no longer on the shelf.'):t('你记住材料里的发现，把原件留在架上。回家时可以转述，但不会带走实物。','You remember what you read and leave the original on the shelf. You can tell your family about it, but will not bring the papers.')
   save.objective=t('从街口带信回家，或继续帮助街上的人。','Take the letter home from the street, or stay to help the neighbors.')
   if(campaign.version===2&&!campaign.archive?.order)save.objective=t('从资料架继续追查，进入隔壁档案工作间核对原始记录。','Follow the papers into the adjoining archive to examine the source records.')
  }
 }else if(body.type!=='campaign-plan')throw new LabError('INVALID_ACTION_TYPE')
 next.version++;next.position=position
 save.blocks.push({id:body.action_id+':campaign',kind:'narration',text,data:{oldStreetCampaignStage:body.stage}})
 return {head:next,kind:body.type,accepted:true,text}
}
