import {RecoverableSessionClient,type SessionLock,type Transport} from './recoverable-session-client'
import type {OriginalHead} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan,originalTrainPlanWalkable,originalCompatibleMapVersions} from './original-train-spatial-plan'
import {originalChapterRejections} from './original-chapters'
import {buildEndingSnapshot} from './vendor/original-train/engine/endingDirector'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
const world=originalTrainChapterSpatialPlan()
/** Wire validation only: the server retains sole ownership of original rules. */
export function assertOriginalClientHead(value:unknown):asserts value is OriginalHead{
 const h=value as OriginalHead,s=h?.save,room=world.scenes.find(r=>r.id===h?.sceneId)
 if(!h||!s||s.version!==8||s.cartridgeId!==world.cartridgeId||!originalCompatibleMapVersions.some(v=>v===h.mapVersion)||!room||!h.position||!originalTrainPlanWalkable(h.sceneId,h.position)||!Array.isArray(s.map)||s.map.filter(n=>n.current).length!==1||s.map.find(n=>n.current)?.id!==room.storyLocationId)throw Error('ORIGINAL_SAVE_UNSUPPORTED')
}
/** Instantiate with an original-world namespace and authenticated transport.
 * No browser reducer, local authority fallback or production endpoint is added. */
export class OriginalSessionClient extends RecoverableSessionClient<OriginalHead>{
 constructor(storage:Storage,prefix:string,transport:Transport,lock?:SessionLock){super(storage,prefix,transport,{scene:h=>h.sceneId,assertHead:assertOriginalClientHead,terminalErrors:['CHARACTER_NOT_PRESENT','ORIGINAL_NARRATION_NOT_READY','ORIGINAL_FINALE_PENDING',...originalChapterRejections],ending:{
  request:h=>({snapshot_id:buildEndingSnapshot(h.save,h.save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn).id,mapVersion:h.mapVersion}),
  terminalErrors:['ENDING_NOT_READY','ENDING_SCENE_MISMATCH','ENDING_SNAPSHOT_MISMATCH','INVALID_ENDING'],
  assertResult:(r,b)=>{const f=r?.head?.save?.finale;if(r?.kind!=='ending'||r.endingId!==b.ending_id||r.snapshotId!==b.snapshot_id||r.head.version!==b.expected_version+1||r.head.sceneId!==b.sceneId||r.head.mapVersion!==b.mapVersion||f?.status!=='complete'||f.snapshot?.id!==b.snapshot_id||f.ending?.snapshotId!==b.snapshot_id)throw Error('ENDING_RESPONSE_MISMATCH')},
 }},lock)}
}
