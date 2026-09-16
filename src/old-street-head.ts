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
    if(h.campaign&&s.facts.departed&&!campaignComplete(h.campaign))throw Error('CAMPAIGN_INCOMPLETE')
  } catch {throw new LabError('OLD_STREET_SAVE_UNSUPPORTED',409)}
}
