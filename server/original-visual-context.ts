import type {OriginalHead} from './original-train-runtime'
import {originalActorRelease,originalSceneBackgroundVersion,originalStarterRelease} from '../src/original-asset-releases'
import {adaStandingAppearance,adaStandingResource} from '../src/original-art-identities'
import {originalEquipmentResource,originalStarterState} from '../src/original-equipment-art'

/** Current bindings, not old dialogue or a generation prompt, own visual identity.
 * Hashes identify evidence; they are never player-facing narration or credentials.
 */
export function originalVisualContext(h:OriginalHead,speakerId:string){
 const actor=originalActorRelease(h.assets),baseline=speakerId==='ada-mechanic'&&!actor
 const speaker=speakerId==='ada-mechanic'?{
  id:speakerId,representation:baseline?'reviewed-standing':'published-sheet',assetSha256:actor?.sha256??adaStandingResource.sha256,
  appearance:baseline?{...adaStandingAppearance}:{},appearanceStatus:baseline?'reviewed':'not-described',
 }:{id:speakerId,representation:'development-marker',appearance:{},appearanceStatus:'not-described'}
 const equipment=h.sceneId==='train-at-dead-station'?[{
  id:'starter',state:originalStarterState(h.save),assetSha256:originalEquipmentResource(h.assets).sha256,
  appearance:originalStarterRelease(h.assets)?{}:{housing:'dark metal cabinet with an open left cover',interior:'exposed copper-wound starter coil'},
 }]:[]
 return {version:1,backgroundVersion:originalSceneBackgroundVersion(h.assets,h.sceneId)??'legacy-scene',speaker,equipment}
}
