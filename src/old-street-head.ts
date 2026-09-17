import {archivePhotoSource} from './old-street-archive-photo'
import {archiveReadingItem} from './old-street-archive-reading'
import {archiveRackState} from './old-street-archive'
import type {StorySave} from './vendor/original-train/types'
import {LabError} from './journey-runtime'
import {assertOldStreetExpansions,type OldStreetExpansionRequest} from './old-street-expansion'
import {assertOldStreetCampaign,campaignComplete,type OldStreetCampaign} from './old-street-campaign'
import {oldStreetSpatialPlan,oldStreetWalkable,bindOldStreet} from './old-street-space'
export type OldStreetHead = {id:string; version:number; mapVersion:string; sceneId:string; position:{x:number;y:number}; save:StorySave;expansions?:OldStreetExpansionRequest[];campaign?:OldStreetCampaign}
const plan = oldStreetSpatialPlan()
export function assertOldStreetHead(value:unknown): asserts value is OldStreetHead {
  const h=value as OldStreetHead, s=h?.save
  if (!h || !s || s.cartridgeId!=='old-street-letter' || s.version!==8 || !['zh','en'].includes(s.locale)
    || !Number.isSafeInteger(h.version) || h.version<0 || typeof h.id!=='string' || !/^[a-zA-Z0-9-]{16,80}$/.test(h.id)
    || ![plan.mapVersion,'oldstreet-furniture-3','oldstreet-blockout-1','oldstreet-blockout-2'].includes(h.mapVersion) || !s.facts || !Array.isArray(s.map) || !Array.isArray(s.inventory)
    || !Array.isArray(s.blocks) || !Array.isArray(s.characters) || !Array.isArray(s.relationships)
    || !h.position || !oldStreetWalkable(h.sceneId,h.position,s,h.mapVersion==='oldstreet-blockout-1'?{w:9,h:15}:undefined,undefined,[plan.mapVersion,'oldstreet-furniture-3'].includes(h.mapVersion),undefined,h.mapVersion!==plan.mapVersion)) throw new LabError('OLD_STREET_SAVE_UNSUPPORTED',409)
  try {
    bindOldStreet(s.locale,s).locate(s,h.sceneId);assertOldStreetExpansions(h.expansions);assertOldStreetCampaign(h.campaign)
    if(h.expansions?.[0]?.archiveSource&&JSON.stringify(h.expansions[0].archiveSource)!==JSON.stringify(archivePhotoSource(h.campaign)))throw Error('ARCHIVE_PHOTO_SOURCE_MISMATCH')
    if(h.expansions?.[0]&&h.expansions[0].photoMethod!==h.campaign?.photoMethod)throw Error('PHOTO_METHOD_MISMATCH')
    if(h.campaign?.version===3){
      const request=h.expansions?.[0],matched=s.facts['darkroom-photo-matched'],linked=s.facts['campaign-photo-archive']
      if(request&&!request.archiveSource||s.facts['darkroom-ready']===true&&!request||matched!==undefined&&(!request||linked!==h.campaign.archive?.id)||linked!==undefined&&(typeof matched!=='string'||!matched||linked!==request?.archiveSource?.archiveId||typeof s.facts['darkroom-photo-discovery']!=='string')||s.facts['darkroom-photo-choice']!==undefined&&(!matched||!['keep','leave'].includes(String(s.facts['darkroom-photo-choice']))))throw Error('CAMPAIGN_PHOTO_STATE_INVALID')
      const kept=s.facts['darkroom-photo-choice']==='keep'
      if(s.inventory.filter(i=>i.id==='darkroom-print').length!==(kept?1:0)||s.inventory.some(i=>i.id==='darkroom-print'&&i.count!==1))throw Error('CAMPAIGN_PHOTO_POSSESSION_INVALID')
    }
    if(s.facts['darkroom-photo-discovery']!==undefined&&(typeof s.facts['darkroom-photo-matched']!=='string'||typeof s.facts['darkroom-photo-discovery']!=='string'||!s.facts['darkroom-photo-discovery'].trim()||s.facts['darkroom-photo-discovery'].length>220))throw Error('PHOTO_DISCOVERY_NOT_OBSERVED')
    if(s.facts['field-note-finding']!==(h.campaign?.field?.observed?h.campaign.field.content.finding:undefined)||s.facts['field-note-disposition']!==h.campaign?.field?.disposition)throw Error('FIELD_NOTE_STATE_INVALID')
    if(s.facts['field-note-copy']!==h.campaign?.field?.copy?.finding||s.inventory.filter(i=>i.id==='field-note-copy').length!==(h.campaign?.field?.copy?1:0)||s.inventory.some(i=>i.id==='field-note-copy'&&i.count!==1))throw Error('FIELD_COPY_STATE_INVALID')
    if(s.inventory.filter(i=>i.id==='field-note').length!==(h.campaign?.field?.disposition==='take'?1:0)||s.inventory.some(i=>i.id==='field-note'&&i.count!==1))throw Error('FIELD_NOTE_POSSESSION_INVALID')
    if(s.facts['archive-ready']===true&&(!h.campaign?.archive||s.facts['archive-layout']!==h.campaign.archive.content.layout)||h.campaign?.archive&&s.facts['archive-ready']!==true||h.sceneId==='archive'&&!h.campaign?.archive)throw Error('ARCHIVE_NOT_ADMITTED')
    if(h.campaign&&s.facts.departed&&!campaignComplete(h.campaign,s.facts))throw Error('CAMPAIGN_INCOMPLETE')
    if(s.facts['archive-published']===true&&!h.campaign?.archive?.order)throw Error('ARCHIVE_NOT_RECONSTRUCTED')
    if(s.facts['archive-room']!==undefined&&s.facts['archive-room']!==JSON.stringify(h.campaign?.archive?.content.room)||h.campaign?.archive?.content.room&&s.facts['archive-room']!==JSON.stringify(h.campaign.archive.content.room))throw Error('ARCHIVE_ROOM_MISMATCH')
    if(s.facts['archive-ledger-site']!==h.campaign?.archive?.content.ledgerSite||s.facts['archive-loan-read']!==undefined&&(s.facts['archive-loan-read']!==true||!h.campaign?.archive?.content.ledgerSite))throw Error('ARCHIVE_LOAN_STATE_INVALID')
    const reading=s.facts['archive-reading-position'],dense=h.campaign?.archive?.content.denseSource
    if(s.facts['archive-dense-source']!==dense||reading!==undefined&&(!dense||!['carried','desk'].includes(String(reading)))||s.inventory.filter(i=>i.id===archiveReadingItem).length!==(reading==='carried'?1:0)||s.inventory.some(i=>i.id===archiveReadingItem&&i.count!==1))throw Error('ARCHIVE_READING_STATE_INVALID')
    if(s.facts['archive-rack-shifted']!==undefined&&(typeof s.facts['archive-rack-shifted']!=='boolean'||!h.campaign?.archive||!archiveRackState(s.facts)?.slide))throw Error('ARCHIVE_RACK_STATE_INVALID')
  } catch {throw new LabError('OLD_STREET_SAVE_UNSUPPORTED',409)}
}
