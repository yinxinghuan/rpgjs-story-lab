import {RecoverableSessionClient,type SessionLock,type Transport} from './recoverable-session-client'
import type {OriginalHead} from '../server/original-train-runtime'
import {originalTrainSpatialPlan,originalTrainPlanWalkable} from './original-train-spatial-plan'
const world=originalTrainSpatialPlan()
/** Wire validation only: the server retains sole ownership of original rules. */
export function assertOriginalClientHead(value:unknown):asserts value is OriginalHead{
 const h=value as OriginalHead,s=h?.save,room=world.scenes.find(r=>r.id===h?.sceneId)
 if(!h||!s||s.version!==8||s.cartridgeId!==world.cartridgeId||h.mapVersion!==world.mapVersion||!room||!h.position||!originalTrainPlanWalkable(h.sceneId,h.position)||!Array.isArray(s.map)||s.map.filter(n=>n.current).length!==1||s.map.find(n=>n.current)?.id!==room.storyLocationId)throw Error('ORIGINAL_SAVE_UNSUPPORTED')
}
/** Instantiate with an original-world namespace and authenticated transport.
 * No browser reducer, local authority fallback or production endpoint is added. */
export class OriginalSessionClient extends RecoverableSessionClient<OriginalHead>{
 constructor(storage:Storage,prefix:string,transport:Transport,lock?:SessionLock){super(storage,prefix,transport,{scene:h=>h.sceneId,assertHead:assertOriginalClientHead,terminalErrors:['CHARACTER_NOT_PRESENT','ORIGINAL_NARRATION_NOT_READY']},lock)}
}
