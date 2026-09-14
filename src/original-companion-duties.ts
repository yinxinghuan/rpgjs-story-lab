import type {OriginalHead} from '../server/original-train-runtime'
import {originalBoundWorldPlan} from './original-world-plan'
import {originalCharacterPresent} from './original-character-presence'
/** Work posts follow explicit current-scene assignments, never historical facts
 * from a chapter the train already left. Returned points are hitbox top-left. */
export function originalCompanionDutyTargets(h:OriginalHead){
 const targets:Record<string,{x:number;y:number}>={},f=h.save.facts
 if(h.sceneId!=='train-at-mountain-pass'||f['pass-debriefed'])return targets
 const ids=[...(f['pass-lookout']==='lin-scout'?['lin-scout']:[]),...(f['pass-duty']?['ada-mechanic']:[]),...(f['pass-duty']==='mara-raider'?['mara-raider']:[])]
 const world=originalBoundWorldPlan(h.assets)
 for(const id of ids){
  if(!h.save.partyMemberIds.includes(id)||!originalCharacterPresent(h.save,id))continue
  const character=world.characters.find(c=>c.id===id),entity=world.entities.find(e=>e.scene===h.sceneId&&character?.entities.includes(e.id))
  if(entity)targets[id]={x:entity.position.x-4.5,y:entity.position.y-15}
 }
 return targets
}
