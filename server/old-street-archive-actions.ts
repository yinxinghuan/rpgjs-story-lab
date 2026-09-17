import {archiveLoanAt,archiveLoanLead} from '../src/old-street-archive-loan'
import {campaignPhotoPurpose} from '../src/old-street-campaign-story'
import {applyArchiveReading} from './old-street-archive-reading'
import {archiveEvidence,archiveOrderMatches,readArchiveContent,assertArchiveInquiry,archiveRackState,type ArchiveSource} from '../src/old-street-archive'
import {bindOldStreet,oldStreetWalkable} from '../src/old-street-space'
import type {OldStreetHead} from '../src/old-street-head'
import type {CampaignCandidate} from './old-street-campaign-actions'
import {LabError} from '../src/journey-runtime'
/** Preparation makes the room available; reading a source and submitting an
 * order require actual proximity in the admitted layout. No auto-solving. */
export function prepareArchiveAction(head:OldStreetHead,body:any,position:OldStreetHead['position'],candidate?:CampaignCandidate){
 if((!head.campaign||head.campaign.version<2)||!head.campaign.parcel?.observed)throw new LabError('CAMPAIGN_PAPERS_REQUIRED',409)
 const next=structuredClone(head),c=next.campaign!,save=next.save,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 const offSite=!!c.archive&&archiveLoanAt(c.archive.content,body.target)
 const expected=body.type==='campaign-plan'?{scene:'cellar',target:'photo-folder'}:{scene:offSite?c.archive!.content.ledgerSite!:'archive',target:body.target}
 if(head.sceneId!==expected.scene||body.target!==expected.target||!bindOldStreet(save.locale,save).canInteract(body.target,head.sceneId,position))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 let text=''
 if(body.type==='campaign-plan'){
  if(c.archive)throw new LabError('CAMPAIGN_ALREADY_PREPARED',409)
  const raw=candidate?.(head,'archive');if(raw===undefined)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
  try{const content=readArchiveContent(raw);if(c.parcel?.content.inquiry)assertArchiveInquiry(content,c.parcel.content.inquiry);c.archive={id:body.action_id,content,examined:[]}}catch{throw new LabError('CAMPAIGN_PLAN_REJECTED',409)}
  if(c.archive.content.ledgerSite)save.facts['archive-ledger-site']=c.archive.content.ledgerSite
  if(c.archive.content.denseSource)save.facts['archive-dense-source']=c.archive.content.denseSource
  save.facts['archive-ready']=true;save.facts['archive-layout']=c.archive.content.layout
  if(c.archive.content.room)save.facts['archive-room']=JSON.stringify(c.archive.content.room)
  if(!save.map.some(n=>n.id==='archive'))save.map.push({id:'archive',label:t('档案工作间','Archive workroom'),current:false,visited:false})
  text=t('这些材料来自隔壁档案工作间。地下室东侧的门已可通行，里面有两处原始记录和一张整理桌。','These papers came from the adjoining archive workroom. The cellar’s east doorway is accessible; inside are two sets of source records and a sorting table.')
  if(c.archive.content.ledgerSite)text=t('档案工作间在地下室东侧门后。进去查找施工索引、工作日志和整理桌。','The archive is through the cellar’s east doorway. Look for the index, work log and sorting table inside.')
  save.objective=t('从地下室侧门进入档案工作间，调查两处记录，在桌面还原先后顺序。','Enter the archive through the cellar side door. Examine both sources and reconstruct the order at the table.')
  if(archiveRackState(save.facts)?.slide)text+=t('施工索引前挡着一座可以挪开的储物架，旁边留着空位。','A movable storage rack blocks the work index; an empty space beside it lets you slide it aside.')
 }else{
  const archive=c.archive;if(!archive)throw new LabError('CAMPAIGN_NOT_PREPARED',409)
  const source=body.target==='archive-index'?'index':body.target==='archive-ledger'||offSite?'ledger':undefined
  if(body.type==='campaign-observe'&&body.target==='archive-ledger'&&archive.content.ledgerSite){
   save.facts['archive-loan-read']=true;text=archiveLoanLead(archive.content,save.locale)
   if(!archive.examined.includes('ledger'))save.objective=text
  }else if(body.type==='campaign-decide'&&['read-lens','carry-sheet','spread-sheet','return-sheet'].includes(body.selection)){
   text=applyArchiveReading(next,body.target,body.selection)
  }else if(body.type==='campaign-decide'&&body.target==='archive-rack'){
   if(!archiveRackState(save.facts)?.slide||!['slide','restore'].includes(body.selection))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
   const shifted=body.selection==='slide'
   if((save.facts['archive-rack-shifted']===true)===shifted)throw new LabError('CAMPAIGN_ALREADY_RESOLVED',409)
   save.facts['archive-rack-shifted']=shifted
   if(!oldStreetWalkable('archive',position,save))throw new LabError('CAMPAIGN_RACK_SPACE_REQUIRED',409)
   text=shifted?t('储物架移开了，现在可以走近索引。','The rack slides aside. You can now reach the work index.'):t('储物架回到原位，已读线索仍然保留。','The rack is back. Your notes are still saved.')
  }else if(body.type==='campaign-observe'&&source){
   if(archive.content.denseSource===source&&!archive.examined.includes(source))throw new LabError('CAMPAIGN_READING_AID_REQUIRED',409)
   if(!archive.examined.includes(source))archive.examined.push(source as ArchiveSource)
   text=archiveEvidence(archive.content,source,save.locale).join('\n')
   if(offSite){save.facts['archive-loan-read']=true;save.objective=t('工作日志已记下。回档案工作间补齐线索，在整理桌核对。','The work log is noted. Return to the archive, finish examining the evidence and compare it at the table.')}
  }else if(body.type==='campaign-observe'&&body.target==='archive-desk'){
   text=t('桌上放着四张记录卡。找到施工索引与工作日志，再按记录的先后关系排列。','Four event cards lie on the table. Find the work index and work log, then arrange the events using their recorded order.')
  }else if(body.type==='campaign-decide'&&body.target==='archive-desk'){
   if(archive.order)throw new LabError('CAMPAIGN_ALREADY_RESOLVED',409)
   if(archive.examined.length!==2)throw new LabError('CAMPAIGN_ARCHIVE_EVIDENCE_REQUIRED',409)
   if(!archiveOrderMatches(archive.content,body.order))throw new LabError('CAMPAIGN_ARCHIVE_ORDER_MISMATCH',409)
   archive.order=[...body.order];text=archive.content.discovery
   save.facts['archive-reconstructed']=true
   save.objective=campaignPhotoPurpose(save,c)??(c.parcel?.disposition?t('记录已还原。可以带信回家，或继续探索。','The records are reconstructed. Take the letter home, or keep exploring.'):t('记录已还原，回资料架决定原件的去向。','The records are reconstructed. Return to the paper shelf to decide where the original belongs.'))
  }else throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 }
 next.version++;next.position=position
 save.blocks.push({id:body.action_id+':campaign',kind:'narration',text,data:{oldStreetCampaignStage:'archive',archiveReconstructed:body.type==='campaign-decide'&&body.target==='archive-desk'&&body.order?1:0}})
 return {head:next,kind:body.type,accepted:true,text}
}
