import type {StorySave} from './story'
import {executeSpatialStoryTurn} from './spatial-story-turn'
import {assertSpatialStoryProjection} from './spatial-story-projection'
import {validActionTarget,safePosition,entities,currentScene,type Position,type EntityId,type Proposal} from './contract'
import type {SceneId} from './scene-layout'
import type {JournalImage} from './journal-image'
export type Head={journalImage?:JournalImage;id:string;version:number;save:StorySave;position:Position;mapVersion:string}
export class LabError extends Error{constructor(public code:string,public status=400){super(code);this.message=code}}
export type Narrator=(input:string,save:StorySave,target:EntityId,live:boolean)=>Promise<{proposal:Proposal;trace:unknown}>
export function validateAction(body:any){
 if(!body||typeof body.action_id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.action_id)||!Number.isSafeInteger(body.expected_version))throw new LabError('INVALID_ACTION')
}
// One action/scene/reducer contract for SQLite and the explicit browser edition.
export async function prepareAction(h:Head,body:any,narrator:Narrator){
 validateAction(body)
 if(h.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
  const target=body.target as EntityId;if(!Object.hasOwn(entities,target))throw new LabError('UNKNOWN_ENTITY')
  const scene=currentScene(h.save);if((body.sceneId??'carriage')!==scene||entities[target].scene!==scene)throw new LabError('OFF_SCENE_ENTITY');
  const pos=safePosition(body.position,scene);if(!body.position||pos.x!==body.position.x||pos.y!==body.position.y)throw new LabError('INVALID_POSITION')
  if(Math.hypot(pos.x-entities[target].x,pos.y-entities[target].y)>=70)throw new LabError('TOO_FAR')
 if(body.type==='free-input'){
  if(body.mode!==undefined&&!['local','live'].includes(body.mode))throw new LabError('INVALID_NARRATION_MODE')
  if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
 }else if(body.type!=='action'||typeof body.action!=='string'||!body.action)throw new LabError('INVALID_ACTION_TYPE')
 const result=await executeSpatialStoryTurn({save:h.save,contentSeed:h.id,target,actionId:body.type==='action'?body.action:undefined,input:body.type==='free-input'?body.text:undefined,live:body.mode==='live',narrator,admitAction:id=>{if(!validActionTarget(id,target,pos,scene))throw new LabError('UNSUPPORTED_ACTION');return true}})
 const {save,text,kind,accepted,actionId,trace}=result
 const arrival=assertSpatialStoryProjection(h.save,save,accepted?actionId:null)
 const next={...h,save,position:arrival?safePosition(arrival.position,arrival.scene as SceneId):pos,version:h.version+1}
 return {head:next,text,kind,accepted,actionId:actionId??null,trace}
}
