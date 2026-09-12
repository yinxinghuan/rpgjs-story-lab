import {originalEnvironmentWalkable} from './original-environment-layouts'
import {originalSceneBackgroundVersion} from './original-asset-releases'
import {assertOriginalActionPlan,type OriginalActionPlan} from './original-action-plan'
import {RecoverableSessionClient,type SessionLock,type Transport} from './recoverable-session-client'
import type {OriginalHead} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan,originalCompatibleMapVersions} from './original-train-spatial-plan'
import {originalChapterRejections} from './original-chapters'
import {originalEndingCartridge} from './original-ending-capabilities'
import {buildEndingSnapshot} from './vendor/original-train/engine/endingDirector'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
import {assertOriginalAssetBindings} from './original-asset-releases'
const world=originalTrainChapterSpatialPlan()
/** Wire validation only: the server retains sole ownership of original rules. */
export function assertOriginalClientHead(value:unknown):asserts value is OriginalHead{
 const h=value as OriginalHead,s=h?.save,room=world.scenes.find(r=>r.id===h?.sceneId)
 assertOriginalAssetBindings(h?.assets)
 if(!h||!s||s.version!==8||s.cartridgeId!==world.cartridgeId||!originalCompatibleMapVersions.some(v=>v===h.mapVersion)||!room||!h.position||!originalEnvironmentWalkable(originalSceneBackgroundVersion(h.assets,h.sceneId),h.sceneId,h.position)||!Array.isArray(s.map)||s.map.filter(n=>n.current).length!==1||s.map.find(n=>n.current)?.id!==room.storyLocationId)throw Error('ORIGINAL_SAVE_UNSUPPORTED')
}
/** Instantiate with an original-world namespace and authenticated transport.
 * HTTP transport is supplied separately; no browser reducer or local writer. */
export class OriginalSessionClient extends RecoverableSessionClient<OriginalHead>{
 constructor(storage:Storage,prefix:string,transport:Transport,lock?:SessionLock,prepareScene?:(plan:OriginalActionPlan)=>Promise<void>){super(storage,prefix,transport,{scene:h=>h.sceneId,assertHead:assertOriginalClientHead,...(prepareScene?{preparedAction:{assertPlan:assertOriginalActionPlan,ready:prepareScene}}:{}),terminalErrors:['ORIGINAL_BRAKE_ALREADY_REPAIRED','ACTION_NOT_PREPARED','PREPARED_ACTION_LIMIT','ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED','CHARACTER_NOT_PRESENT','ORIGINAL_NARRATION_NOT_READY','ORIGINAL_ACTION_REQUIRES_COMMITMENT','ORIGINAL_INTENT_UNSUPPORTED','ORIGINAL_DIALOGUE_UNSUPPORTED','ORIGINAL_DIALOGUE_REJECTED','ORIGINAL_DIALOGUE_TARGET_REQUIRED','ORIGINAL_FINALE_PENDING',...originalChapterRejections],ending:{
  request:h=>({snapshot_id:buildEndingSnapshot(h.save,originalEndingCartridge(h.save,h.save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn)).id,mapVersion:h.mapVersion}),
  terminalErrors:['ENDING_NOT_READY','ENDING_SCENE_MISMATCH','ENDING_SNAPSHOT_MISMATCH','INVALID_ENDING'],
  assertResult:(r,b)=>{const f=r?.head?.save?.finale;if(r?.kind!=='ending'||r.endingId!==b.ending_id||r.snapshotId!==b.snapshot_id||r.head.version!==b.expected_version+1||r.head.sceneId!==b.sceneId||r.head.mapVersion!==b.mapVersion||f?.status!=='complete'||f.snapshot?.id!==b.snapshot_id||f.ending?.snapshotId!==b.snapshot_id)throw Error('ENDING_RESPONSE_MISMATCH')},
 }},lock)}
}

export type OriginalJourneyEntry={id:string;version:number;cursor:number;scene:string;updated:number}
// Completing the ending increments the head version without adding an action event.
export function inspectOriginalDirectory(value:unknown):OriginalJourneyEntry[]{
 const rows=(value as any)?.sessions
 if(!Array.isArray(rows)||rows.length>100)throw Error('INVALID_SESSION_DIRECTORY')
 const seen=new Set<string>()
 for(const r of rows){if(!r||!/^[a-zA-Z0-9-]{16,80}$/.test(r.id)||seen.has(r.id)||!Number.isSafeInteger(r.version)||r.version<0||!Number.isSafeInteger(r.cursor)||r.cursor<0||r.cursor>r.version||r.version-r.cursor>1||!Number.isFinite(r.updated)||r.updated<0||!world.scenes.some(s=>s.id===r.scene))throw Error('INVALID_SESSION_DIRECTORY');seen.add(r.id)}
 return rows.map(({id,version,cursor,scene,updated})=>({id,version,cursor,scene,updated}))
}
