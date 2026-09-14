import type {OriginalHead} from '../server/original-train-runtime'
import {originalCharacterPresent} from './original-character-presence'
import {originalWorldWalkable} from './original-world-space'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {LabError} from './journey-runtime'
const physicalIds=new Set(originalTrainChapterSpatialPlan().characters.filter(c=>c.kind==='physical').map(c=>c.id))
export type CompanionPositions=Record<string,{x:number;y:number}>
export type OriginalCompanionHead=OriginalHead&{companionPositions?:CompanionPositions}
/** Single-player spatial snapshot, not membership, story state or multiplayer proof.
 * Missing snapshots retain the current formation; legacy saves keep fixed placement. */
export function originalCompanionContext(head:OriginalHead,value:unknown):OriginalCompanionHead{
 if(value===undefined)return head
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>4)throw new LabError('INVALID_COMPANION_POSITIONS')
 const positions:CompanionPositions={}
 for(const [id,p] of Object.entries(value as Record<string,any>)){
  if(!physicalIds.has(id)||!head.save.partyMemberIds.includes(id)||!originalCharacterPresent(head.save,id))throw new LabError('COMPANION_NOT_FOLLOWING')
  if(!p||typeof p!=='object'||Object.keys(p).sort().join(',')!=='x,y'||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new LabError('INVALID_COMPANION_POSITIONS')
  positions[id]={x:p.x,y:p.y}
 }
 const context={...head,companionPositions:positions}
 for(const [id,p] of Object.entries(positions)){
  // Ignore only the actor's own body, retaining every other person and obstacle.
  const withoutSelf={...context,save:{...head.save,characters:head.save.characters.filter(c=>c.id!==id)}}
  if(!originalWorldWalkable(withoutSelf,p))throw new LabError('INVALID_COMPANION_POSITION')
 }
 return context
}

/** Scene changes reset the formation; departures remove only former members. */
export function retainOriginalCompanions(next:OriginalHead,previous:OriginalHead):OriginalHead{
 const result={...next}
 if(next.sceneId!==previous.sceneId){delete result.companionPositions;return result}
 if(result.companionPositions)result.companionPositions=Object.fromEntries(Object.entries(result.companionPositions).filter(([id])=>next.save.partyMemberIds.includes(id)&&originalCharacterPresent(next.save,id)))
 return result
}
