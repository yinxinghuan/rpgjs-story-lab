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
    if(s.facts['darkroom-photo-discovery']!==undefined&&(typeof s.facts['darkroom-photo-matched']!=='string'||typeof s.facts['darkroom-photo-discovery']!=='string'||!s.facts['darkroom-photo-discovery'].trim()||s.facts['darkroom-photo-discovery'].length>220))throw Error('PHOTO_DISCOVERY_NOT_OBSERVED')
    if(s.facts['archive-ready']===true&&(!h.campaign?.archive||s.facts['archive-layout']!==h.campaign.archive.content.layout)||h.campaign?.archive&&s.facts['archive-ready']!==true||h.sceneId==='archive'&&!h.campaign?.archive)throw Error('ARCHIVE_NOT_ADMITTED')
    if(h.campaign&&s.facts.departed&&!campaignComplete(h.campaign))throw Error('CAMPAIGN_INCOMPLETE')
    if(s.facts['archive-published']===true&&!h.campaign?.archive?.order)throw Error('ARCHIVE_NOT_RECONSTRUCTED')
    if(s.facts['archive-room']!==undefined&&s.facts['archive-room']!==JSON.stringify(h.campaign?.archive?.content.room)||h.campaign?.archive?.content.room&&s.facts['archive-room']!==JSON.stringify(h.campaign.archive.content.room))throw Error('ARCHIVE_ROOM_MISMATCH')
    const reading=s.facts['archive-reading-position'],dense=h.campaign?.archive?.content.denseSource
    if(s.facts['archive-dense-source']!==dense||reading!==undefined&&(!dense||!['carried','desk'].includes(String(reading)))||s.inventory.filter(i=>i.id===archiveReadingItem).length!==(reading==='carried'?1:0)||s.inventory.some(i=>i.id===archiveReadingItem&&i.count!==1))throw Error('ARCHIVE_READING_STATE_INVALID')
    if(s.facts['archive-rack-shifted']!==undefined&&(typeof s.facts['archive-rack-shifted']!=='boolean'||!h.campaign?.archive||!archiveRackState(s.facts)?.slide))throw Error('ARCHIVE_RACK_STATE_INVALID')
  } catch {throw new LabError('OLD_STREET_SAVE_UNSUPPORTED',409)}
}
