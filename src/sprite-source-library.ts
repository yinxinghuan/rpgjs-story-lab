import {verifySpritePng,type SpriteCompositionInput,type SpriteDraft,type SpriteDraftRepository} from './sprite-draft'
import {assertSpriteGenerationSource} from './sprite-generation-recipe'

export type SavedSpriteSource={key:string;draftId:string;revision:number;slot:number|null;createdAt:number;sourceName:string;sha256:string;columns:number;column:number;signature:string}
function inputs(draft:SpriteDraft):Array<{slot:number|null;input:SpriteCompositionInput}>{
 if(draft.sourceKind!=='states')return []
 if(draft.composition){
  if(draft.composition.version!==1||draft.deviceStateSet!=='repair'||!Array.isArray(draft.composition.inputs)||draft.composition.inputs.length!==2)return []
  return draft.composition.inputs.map((input,slot)=>({slot,input}))
 }
 return [{slot:null,input:{source:draft.source,sourceName:draft.sourceName,columns:draft.spec?.columns??1,column:0,...(draft.generation?{generation:draft.generation}:{})}}]
}
function signature(input:SpriteCompositionInput){
 const g=input.generation
 return JSON.stringify([input.source.sha256,input.sourceName,input.columns,input.column,g?[g.version,g.recipe,g.requestId,g.sessionId,g.taskId]:null])
}
function validGrid(input:SpriteCompositionInput){return Boolean(input?.source)&&Number.isInteger(input.source.width)&&input.source.width>0&&Number.isInteger(input.columns)&&input.columns>=1&&input.columns<=12&&Number.isInteger(input.column)&&input.column>=0&&input.column<input.columns&&input.source.width%input.columns===0}
/** Metadata only: large PNG buffers stay in their existing draft records. */
export function savedSpriteSources(history:SpriteDraft[]):SavedSpriteSource[]{
 const seen=new Set<string>(),options:SavedSpriteSource[]=[]
 for(const draft of history)for(const {slot,input} of inputs(draft)){
  if(!validGrid(input))continue
  const sig=signature(input);if(seen.has(sig))continue;seen.add(sig)
  options.push({key:`${draft.id}:${slot??'source'}`,draftId:draft.id,revision:draft.revision,slot,createdAt:draft.createdAt,sourceName:input.sourceName,sha256:input.source.sha256,columns:input.columns,column:input.column,signature:sig})
 }
 return options
}
/** Re-read the selected record and copy only after verifying its original bytes.
 * Later edits to column settings must never mutate a retained source record. */
export async function resolveSavedSpriteSource(repo:SpriteDraftRepository,choice:SavedSpriteSource):Promise<SpriteCompositionInput>{
 const draft=await repo.get(choice.draftId)
 if(!draft||draft.revision!==choice.revision)throw Error('SPRITE_SOURCE_CHANGED')
 const selected=inputs(draft).find(p=>p.slot===choice.slot)?.input
 if(!selected||!validGrid(selected)||signature(selected)!==choice.signature)throw Error('SPRITE_SOURCE_CHANGED')
 await verifySpritePng(selected.source)
 if(selected.generation)assertSpriteGenerationSource(selected.generation)
 return structuredClone(selected)
}
