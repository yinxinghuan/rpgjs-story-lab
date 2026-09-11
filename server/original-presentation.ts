import {LabError} from '../src/journey-runtime'
import {assertOriginalHead,type OriginalPresentationGate} from './original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalSceneBackgroundVersion} from '../src/original-asset-releases'
import {originalCharacterHasArt} from '../src/original-character-art'
import {originalEquipmentHasArt} from '../src/original-equipment-art'
import {originalGameEntities} from '../src/original-game-projection'
import {originalWorldWalkable} from '../src/original-world-space'

const world=originalTrainChapterSpatialPlan()
/** Structural admission for the reviewed single-player edition. Byte integrity
 * is checked by the build and browser loader; this is not an aesthetic judge.
 * Old authoring snapshots remain readable, but are not silently given new art. */
export const originalReleasedPresentation:OriginalPresentationGate=(head,previous)=>{
 assertOriginalHead(head)
 const reject=()=>{throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409)}
 if(!head.assets||head.mapVersion!==world.mapVersion)reject()
 for(const scene of world.scenes){
  // River Valley uses the original reviewed scene. Every other room must have
  // an explicit immutable background binding; absence means a draft whitebox.
  if(scene.id!=='train-at-river-valley'&&!originalSceneBackgroundVersion(head.assets,scene.id))reject()
 }
 for(const character of world.characters)if(!originalCharacterHasArt(character.id,head.assets))reject()
 if(!originalEquipmentHasArt('tunnel-fan',head.assets))reject()
 if(!originalWorldWalkable(head,head.position))reject()
 for(const entity of originalGameEntities(head)){
  if(!originalWorldWalkable(head,entity.approach))reject()
  if(entity.person&&!originalCharacterHasArt(entity.person.id,head.assets))reject()
 }
 if(previous&&(previous.id!==head.id||JSON.stringify(previous.assets)!==JSON.stringify(head.assets)))reject()
 return true
}
