import {authoredOriginalEnding,validateSelectedOriginalEnding} from '../src/original-ending-options'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
import {LabError,validateAction} from '../src/journey-runtime'
import {buildEndingSnapshot,canStartTrueEnding,fallbackEndingCandidate,finalizeEnding,validateEndingCandidate} from '../src/vendor/original-train/engine/endingDirector'
import type {StoryCartridge,StoryEndingCandidate,StoryEndingSnapshot} from '../src/vendor/original-train/types'
import type {OriginalHead,OriginalPresentationGate} from './original-train-runtime'
export type OriginalEndingGenerator=(snapshot:StoryEndingSnapshot,cartridge:StoryCartridge)=>Promise<{candidate:StoryEndingCandidate;generated:boolean}>
const authoredEnding:OriginalEndingGenerator=async(snapshot,cartridge)=>({candidate:authoredOriginalEnding(snapshot,cartridge)??fallbackEndingCandidate(snapshot,cartridge),generated:false})
const stable=(v:any):any=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v
const fingerprint=(v:unknown)=>JSON.stringify(stable(v))
function candidateShape(value:unknown):asserts value is StoryEndingCandidate{
 const c=value as StoryEndingCandidate
 const text=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=12000
 const list=(v:unknown)=>Array.isArray(v)&&v.length<=64&&v.every(text)
 const entries=(v:unknown,key:string)=>Array.isArray(v)&&v.length<=64&&v.every(e=>e&&typeof e==='object'&&text(e[key])&&text(e.text))
 if(!c||!['anchorFamily','title','thesis','finalImagePrompt'].every(k=>text(c[k as keyof StoryEndingCandidate]))||!['capabilitiesUsed','irreversibleCosts','preserved','lost','unresolved','finaleScenes'].every(k=>list(c[k as keyof StoryEndingCandidate]))||!entries(c.characterEpilogues,'characterId')||!entries(c.regionalEpilogues,'regionId')||(c.videoCandidate!==undefined&&!text(c.videoCandidate)))throw new Error('INVALID_ENDING_SHAPE')
}
export function originalEndingPolicy(cartridge:(locale:'zh'|'en')=>StoryCartridge,admit:OriginalPresentationGate,generator:OriginalEndingGenerator=authoredEnding){
 return {
  validate(body:unknown){
   const b=body as any;validateAction({action_id:b?.ending_id,expected_version:b?.expected_version})
   if(Object.keys(b).some(k=>!['ending_id','expected_version','snapshot_id','sceneId','mapVersion'].includes(k))||typeof b.snapshot_id!=='string'||!/^ending-[a-z0-9]+$/.test(b.snapshot_id)||typeof b.sceneId!=='string'||typeof b.mapVersion!=='string')throw new LabError('INVALID_ENDING')
  },
  assertCurrent(before:OriginalHead,current:OriginalHead){
   // Also protect save fields omitted by the narrative snapshot (e.g. danger).
   // Only a concurrent spatial checkpoint may change without a story version.
   if(fingerprint(before.save)!==fingerprint(current.save))throw new LabError('ENDING_SNAPSHOT_MISMATCH',409)
  },
  async prepare(head:OriginalHead,body:any){
   const c=originalEndingCartridge(head.save,cartridge(head.save.locale))
   if(body.expected_version!==head.version)throw new LabError('VERSION_CONFLICT',409)
   if(body.mapVersion!==head.mapVersion||body.sceneId!==head.sceneId)throw new LabError('ENDING_SCENE_MISMATCH',409)
   if(!['ready','failed'].includes(head.save.finale.status)||!canStartTrueEnding(head.save,c))throw new LabError('ENDING_NOT_READY',409)
   const snapshot=buildEndingSnapshot(head.save,c)
   if(body.snapshot_id!==snapshot.id)throw new LabError('ENDING_SNAPSHOT_MISMATCH',409)
   if(admit(structuredClone(head))!==true)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409)
   let result:Awaited<ReturnType<OriginalEndingGenerator>>
   try{result=await generator(structuredClone(snapshot),structuredClone(c))}catch{throw new LabError('ENDING_UNAVAILABLE',503)}
   // The generator receives a copy and can return only a candidate, never a save.
   // Validate before finalizing so malformed output cannot rewrite this snapshot.
   try{result=structuredClone(result);candidateShape(result.candidate);validateSelectedOriginalEnding(result.candidate,snapshot,c);if(typeof result.generated!=='boolean'||validateEndingCandidate(result.candidate,snapshot,c).length)throw Error()}catch{throw new LabError('ENDING_RESULT_MISMATCH',409)}
   const ending=finalizeEnding(result.candidate,snapshot,result.generated)
   const next:OriginalHead={...head,version:head.version+1,save:{...head.save,finale:{status:'complete',reason:head.save.finale.reason,snapshot,ending}}}
   if(admit(structuredClone(next),structuredClone(head),'original-finale')!==true)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409)
   return {head:next,kind:'ending',endingId:body.ending_id,snapshotId:snapshot.id,source:result.generated?'model':'author'}
  },
 }
}
