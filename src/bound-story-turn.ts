import type {compileSpatialBinding,SpatialPoint,SpatialSnapshot} from './spatial-binding'
type Binding=ReturnType<typeof compileSpatialBinding>
/** An engine adapter, not a reducer or persistence service. The supplied engine
 * owns rules/history/finale. The outer authority commits only the returned candidate. */
export async function executeBoundStoryTurn<S extends SpatialSnapshot & {version:number},R extends {save:S;acceptedActionId:string|null}>(options:{
 save:S;binding:Binding;sceneId:string;target:string;position:SpatialPoint;
 execute:(save:S,admitAction:(actionId:string)=>boolean)=>Promise<R>;
 assertPresentation:(before:S,after:S,actionId:string|null)=>void|Promise<void>;
}){
 const base=structuredClone(options.save),position={...options.position},binding=options.binding
 binding.locate(base,options.sceneId)
 if(!binding.canInteract(options.target,options.sceneId,position))throw Error('SPATIAL_INTERACTION_NOT_ADMITTED')
 const admitted=new Set<string>()
 let executing=true
 const admit=(id:string)=>{
  if(!executing||!binding.admits(id,options.target,options.sceneId,position))throw Error('SPATIAL_ACTION_NOT_ADMITTED')
  admitted.add(id);return true
 }
 let result:R
 try{result=await options.execute(structuredClone(base),admit)}finally{executing=false}
 // Detach engine-owned references before validation and eventual persistence.
 const candidate=structuredClone(result)
 if(candidate.save.version!==base.version)throw Error('UNADMITTED_STORY_SCHEMA_CHANGE')
 if(candidate.acceptedActionId&&!admitted.has(candidate.acceptedActionId))throw Error('UNADMITTED_ENGINE_ACTION')
 const arrival=binding.assertTransition(base,candidate.save,candidate.acceptedActionId,options.sceneId)
 await options.assertPresentation(structuredClone(base),structuredClone(candidate.save),candidate.acceptedActionId)
 return {result:candidate,sceneId:arrival?.scene??options.sceneId,position:arrival?.position??position}
}
