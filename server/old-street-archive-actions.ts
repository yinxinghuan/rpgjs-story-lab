import {archiveEvidence,archiveOrderMatches,readArchiveContent,type ArchiveSource} from '../src/old-street-archive'
import {bindOldStreet} from '../src/old-street-space'
import type {OldStreetHead} from '../src/old-street-head'
import type {CampaignCandidate} from './old-street-campaign-actions'
import {LabError} from '../src/journey-runtime'
/** Preparation makes the room available; reading a source and submitting an
 * order require actual proximity in the admitted layout. No auto-solving. */
export function prepareArchiveAction(head:OldStreetHead,body:any,position:OldStreetHead['position'],candidate?:CampaignCandidate){
 if(head.campaign?.version!==2||!head.campaign.parcel?.observed)throw new LabError('CAMPAIGN_PAPERS_REQUIRED',409)
 const next=structuredClone(head),c=next.campaign!,save=next.save,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 const expected=body.type==='campaign-plan'?{scene:'cellar',target:'photo-folder'}:{scene:'archive',target:body.target}
 if(head.sceneId!==expected.scene||body.target!==expected.target||!bindOldStreet(save.locale,save).canInteract(body.target,head.sceneId,position))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 let text=''
 if(body.type==='campaign-plan'){
  if(c.archive)throw new LabError('CAMPAIGN_ALREADY_PREPARED',409)
  const raw=candidate?.(head,'archive');if(raw===undefined)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
  try{c.archive={id:body.action_id,content:readArchiveContent(raw),examined:[]}}catch{throw new LabError('CAMPAIGN_PLAN_REJECTED',409)}
  save.facts['archive-ready']=true;save.facts['archive-layout']=c.archive.content.layout
  if(!save.map.some(n=>n.id==='archive'))save.map.push({id:'archive',label:t('档案工作间','Archive workroom'),current:false,visited:false})
  text=t('这些材料来自隔壁档案工作间。地下室东侧的门已可通行，里面有两处原始记录和一张整理桌。','These papers came from the adjoining archive workroom. The cellar’s east doorway is accessible; inside are two sets of source records and a sorting table.')
  save.objective=t('从地下室侧门进入档案工作间，调查两处记录，在桌面还原先后顺序。','Enter the archive through the cellar side door. Examine both sources and reconstruct the order at the table.')
 }else{
  const archive=c.archive;if(!archive)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
  const source=body.target==='archive-index'?'index':body.target==='archive-ledger'?'ledger':undefined
  if(body.type==='campaign-observe'&&source){
   if(!archive.examined.includes(source))archive.examined.push(source as ArchiveSource)
   text=archiveEvidence(archive.content,source,save.locale).join('\n')
  }else if(body.type==='campaign-observe'&&body.target==='archive-desk'){
   text=t('桌上放着四张记录卡。调查两处资料架，再按记录的先后关系排列。','Four event cards lie on the table. Examine both shelves, then arrange the events using their recorded order.')
  }else if(body.type==='campaign-decide'&&body.target==='archive-desk'){
   if(archive.order)throw new LabError('CAMPAIGN_ALREADY_RESOLVED',409)
   if(archive.examined.length!==2)throw new LabError('CAMPAIGN_ARCHIVE_EVIDENCE_REQUIRED',409)
   if(!archiveOrderMatches(archive.content,body.order))throw new LabError('CAMPAIGN_ARCHIVE_ORDER_MISMATCH',409)
   archive.order=[...body.order];text=archive.content.discovery
   save.facts['archive-reconstructed']=true
   save.objective=c.parcel?.disposition?t('记录已还原。可以带信回家，或继续探索。','The records are reconstructed. Take the letter home, or keep exploring.'):t('记录已还原，回资料架决定原件的去向。','The records are reconstructed. Return to the paper shelf to decide where the original belongs.')
  }else throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 }
 next.version++;next.position=position
 save.blocks.push({id:body.action_id+':campaign',kind:'narration',text,data:{oldStreetCampaignStage:'archive',archiveReconstructed:body.type==='campaign-decide'?1:0}})
 return {head:next,kind:body.type,accepted:true,text}
}
