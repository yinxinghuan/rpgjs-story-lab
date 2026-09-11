import {originalCharacterWalkable,originalCharacterSafePosition} from '../src/original-character-space'
import {assertPublishedBackground} from '../src/background-publication'
import {LabError,validateAction} from '../src/journey-runtime'
import {executeBoundStoryTurn} from '../src/bound-story-turn'
import {compileSpatialBinding} from '../src/spatial-binding'
import {originalTrainChapterSpatialPlan,originalTrainPlanWalkable,originalTrainRoom,originalCompatibleMapVersions} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterBindingRules,originalChapterLabel,resolveOriginalChapter,executeOriginalChapter,projectOriginalChapterChoices} from '../src/original-chapters'
import {assertPassSourceAction} from '../src/original-pass-chapter'
import {assertPineSourceAction} from '../src/original-pine-chapter'
import {originalCharacterPresent} from '../src/original-character-presence'
import {lastTrainToDawn,lastTrainToDawnEn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {executeStoryTurn,type StoryTurnGenerator} from '../src/vendor/original-train/engine/executeTurn'
import {resolveDomainAction} from '../src/vendor/original-train/engine/domainRules'
import type {StorySave,Locale} from '../src/vendor/original-train/types'
import {originalEndingPolicy,type OriginalEndingGenerator} from './original-ending'
import {SessionAuthority,type AuthorityStorage,type SessionRuntime} from './session-authority'
import {assertOriginalAssetBindings,newOriginalAssetBindings,type OriginalAssetBindings} from '../src/original-asset-releases'
import {originalActionIntentIssues,originalIsAuthoredAction} from '../src/original-action-intent'
import {originalGameEntities,originalGameObjective} from '../src/original-game-projection'
import type {OriginalActionInterpreter} from './original-action-interpreter'
import {originalDialogueContext,originalLocalDialogue,originalRecollectionReply,type OriginalDialogueGenerator} from './original-dialogue'
import {originalConversationBlocks} from '../src/original-conversation'
export type OriginalHead={id:string;version:number;save:StorySave;sceneId:string;position:{x:number;y:number};mapVersion:string;assets?:OriginalAssetBindings}
export const originalCartridge=(locale:Locale)=>locale==='en'?lastTrainToDawnEn:lastTrainToDawn
const world=originalTrainChapterSpatialPlan()
const bindingFor=(c:ReturnType<typeof originalCartridge>)=>compileSpatialBinding({...c,domainRules:{...c.domainRules,rules:[...c.domainRules!.rules,...originalChapterBindingRules]}},world,originalTrainPlanWalkable)
const bindings={zh:bindingFor(lastTrainToDawn),en:bindingFor(lastTrainToDawnEn)}
/** Mandatory content admission. Callers must validate assets and story projection
 * before enabling a playable session; source-rule QA uses an explicit test gate. */
export type OriginalPresentationGate=(head:OriginalHead,previous?:OriginalHead,actionId?:string|null)=>true
export const originalPresentationUnavailable:OriginalPresentationGate=()=>{throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409)}
const authoredOnly:StoryTurnGenerator={send:async()=>{throw new LabError('ORIGINAL_NARRATION_NOT_READY',503)}}
export function assertOriginalHead(value:unknown):asserts value is OriginalHead{
 const h=value as OriginalHead,s=h?.save
 if(!h||!s||s.version!==8||s.cartridgeId!=='last-train-to-dawn'||!['zh','en'].includes(s.locale)||!originalCompatibleMapVersions.some(v=>v===h.mapVersion)||!Number.isSafeInteger(h.version)||h.version<0||typeof h.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(h.id)||!h.position||!s.finale||!['idle','ready','generating','complete','failed'].includes(s.finale.status)||!Array.isArray(s.blocks)||!Array.isArray(s.inventory)||!Array.isArray(s.characters)||!Array.isArray(s.relationships)||!Array.isArray(s.partyMemberIds)||!s.facts||!s.danger)throw new LabError('ORIGINAL_SAVE_UNSUPPORTED',409)
 const binding=bindings[s.locale]
 try{assertOriginalAssetBindings(h.assets)}catch{throw new LabError('ORIGINAL_ASSET_VERSION_UNSUPPORTED',409)}
 try{binding.locate(s,h.sceneId)}catch{throw new LabError('ORIGINAL_SAVE_UNSUPPORTED',409)}
 if(!binding.validPosition(h.sceneId,h.position)||originalCartridge(s.locale).statDefinitions.some(d=>!Number.isFinite(s.stats?.[d.id])||s.stats[d.id]<d.min||s.stats[d.id]>d.max))throw new LabError('ORIGINAL_SAVE_UNSUPPORTED',409)
}
export function originalTrainRuntime(admit:OriginalPresentationGate=originalPresentationUnavailable,generator:StoryTurnGenerator=authoredOnly,endingGenerator?:OriginalEndingGenerator,interpreter?:OriginalActionInterpreter,dialogue?:OriginalDialogueGenerator):SessionRuntime<OriginalHead>{
 const clone=<T>(value:T):T=>structuredClone(value)
 const check=(head:OriginalHead,previous?:OriginalHead,actionId?:string|null)=>{if(admit(clone(head),previous?clone(previous):undefined,actionId)!==true)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409)}
 const position=(h:OriginalHead,value:unknown)=>{const p=value as OriginalHead['position'];if(!p||!bindings[h.save.locale].validPosition(h.sceneId,p)||!originalCharacterWalkable(h,p))throw new LabError('INVALID_POSITION');return {x:p.x,y:p.y}}
 return {
  initial:(locale,id,options)=>{if(options!==undefined)assertPublishedBackground(options);const h:OriginalHead={id,version:0,save:clone(createInitialSave(originalCartridge(locale))),sceneId:originalTrainRoom('dead-station'),position:{x:192,y:430},mapVersion:world.mapVersion,assets:options===undefined?newOriginalAssetBindings():{version:2,published:clone(options)}};assertOriginalHead(h);check(h);return h},
  upgrade:value=>{assertOriginalHead(value);return {...clone(value),mapVersion:world.mapVersion,position:originalCharacterSafePosition(value,value.position)}},assertReadable:assertOriginalHead,scene:h=>h.sceneId,position,validateAction,
  preserveConcurrent:()=>{},assertPrepared:(candidate,current,actionId)=>check(candidate,current,actionId),ending:originalEndingPolicy(originalCartridge,admit,endingGenerator),
  prepare:async(h,body,reserveNarration)=>{
   assertOriginalHead(h);validateAction(body)
   if(['ready','generating','failed','complete'].includes(h.save.finale.status)&&!h.save.finale.epilogueActive)throw new LabError('ORIGINAL_FINALE_PENDING',409)
   if(body.expected_version!==h.version)throw new LabError('VERSION_CONFLICT',409)
   if(body.sceneId!==h.sceneId)throw new LabError('OFF_SCENE_ENTITY')
   if(body.mode!==undefined&&!['local','live'].includes(body.mode))throw new LabError('INVALID_NARRATION_MODE')
   if(body.mode==='live'&&!(body.type==='dialogue'?dialogue:interpreter))throw new LabError('ORIGINAL_NARRATION_NOT_READY',409)
   const c=originalCartridge(h.save.locale),binding=bindings[h.save.locale],pos=position(h,body.position)
   const entity=world.entities.find(e=>e.id===body.target&&e.scene===h.sceneId)
   if(!entity)throw new LabError('UNKNOWN_ENTITY')
   if(!binding.canInteract(entity.id,h.sceneId,pos))throw new LabError('TOO_FAR')
   const person=world.characters.find(p=>p.entities.includes(entity.id))
   if(person&&!originalCharacterPresent(h.save,person.id))throw new LabError('CHARACTER_NOT_PRESENT')
   if(body.type==='dialogue'){
    if(!person)throw new LabError('ORIGINAL_DIALOGUE_TARGET_REQUIRED',409)
    if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
    check({...h,position:pos})
    const text=body.text.trim(),context=originalDialogueContext(h,person.id),recollection=originalRecollectionReply(text,context),useModel=body.mode==='live'&&recollection===null
    if(useModel&&!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
    const reply=recollection??(useModel?await dialogue!(text,clone(context)):originalLocalDialogue(text,context))
    if(typeof reply!=='string'||!reply.trim()||reply.length>900)throw new LabError('ORIGINAL_DIALOGUE_REJECTED',409)
    // Conversation appends paired visible blocks to the existing v8 archive.
    // Story scene, danger, resources, choices and relationships remain identical.
    const next:OriginalHead={...h,version:h.version+1,position:pos,save:{...h.save,blocks:[...h.save.blocks,...originalConversationBlocks(h.save,person.id,body.action_id,text,reply.trim())]}}
    assertOriginalHead(next);check(next,h,null)
    return {head:next,kind:'dialogue',accepted:true,speakerId:person.id,source:useModel?'model':'author',...(recollection!==null?{guard:'recorded-conversation'}:{})}
   }
   const actions=originalGameEntities(h).find(e=>e.id===entity.id)?.actions.map(a=>({id:a.id,label:a.label}))??[]
   const authoredLabels=[...entity.actions.flatMap(id=>c.domainRules?.rules.find(r=>r.id===id)?.match??[]),...actions.map(a=>a.label)]
   let input:string,interpretedAction:string|undefined
   if(body.type==='action'){
    const rule=c.domainRules?.rules.find(r=>r.id===body.action)
    const chapter=originalChapterActions.find(r=>r.id===body.action)
    if((!rule&&!chapter)||!entity.actions.includes(body.action))throw new LabError('UNSUPPORTED_ACTION')
    input=rule?rule.match[0]:originalChapterLabel(chapter!.id,h.save.locale)
   }else if(body.type==='free-input'){
    if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
    input=body.text.trim()
    if(originalActionIntentIssues(input,authoredLabels).length)throw new LabError('ORIGINAL_ACTION_REQUIRES_COMMITMENT',409)
   }else throw new LabError('INVALID_ACTION_TYPE')
   if(body.type==='free-input'&&body.mode==='live'&&!originalIsAuthoredAction(input,authoredLabels)){
    check({...h,position:pos})
    if(!actions.length)throw new LabError('ORIGINAL_NARRATION_NOT_READY',409)
    if(!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
    const id=await interpreter!(input,{locale:h.save.locale,sceneId:h.sceneId,target:entity.id,objective:originalGameObjective(h),actions:clone(actions)})
    if(!id||!actions.some(a=>a.id===id))throw new LabError('ORIGINAL_INTENT_UNSUPPORTED',409)
    const rule=c.domainRules?.rules.find(r=>r.id===id),chapter=originalChapterActions.find(a=>a.id===id)
    if(!rule&&!chapter)throw new LabError('ORIGINAL_INTENT_UNSUPPORTED',409)
    interpretedAction=id
    input=rule?rule.match[0]:originalChapterLabel(chapter!.id,h.save.locale)
   }
   const chapter=resolveOriginalChapter(input,h.save.locale,h.save)
   if(chapter){
    if(!entity.actions.includes(chapter))throw new LabError('UNSUPPORTED_ACTION')
    check({...h,position:pos})
    const bound=await executeBoundStoryTurn({save:h.save,binding,sceneId:h.sceneId,target:entity.id,position:pos,
     execute:async(save,admitAction)=>{admitAction(chapter);return executeOriginalChapter(save,c,chapter)},
     assertPresentation:(before,after,id)=>{const transition=binding.assertTransition(before,after,id,h.sceneId);const next:OriginalHead={...h,save:after,version:h.version+1,sceneId:transition?.scene??h.sceneId,position:transition?.position??pos};assertOriginalHead(next);check(next,h,id)},
    })
    return {head:{...h,save:bound.result.save,sceneId:bound.sceneId,position:bound.position,version:h.version+1},kind:'action',accepted:true,actionId:chapter,source:'author',...(interpretedAction?{interpretation:{input:body.text.trim(),actionId:interpretedAction}}:{})}
   }
   const resolution=resolveDomainAction(h.save,c,input)
   // Only existing author actions are currently connected. No invented command
   // or dialogue fallback may silently advance an unprepared original chapter.
   if(!resolution)throw new LabError('ORIGINAL_NARRATION_NOT_READY',409)
   if(!entity.actions.includes(resolution.ruleId))throw new LabError('UNSUPPORTED_ACTION')
   if(resolution.status==='accepted'){assertPineSourceAction(h.save,resolution.ruleId);assertPassSourceAction(h.save,resolution.ruleId)}
   check({...h,position:pos})
   const bound=await executeBoundStoryTurn({save:h.save,binding,sceneId:h.sceneId,target:entity.id,position:pos,
    execute:async(save,admitAction)=>{admitAction(resolution.ruleId);const result=await executeStoryTurn({save,cartridge:c,action:input,generator});return {...result,save:projectOriginalChapterChoices(result.save),acceptedActionId:resolution.status==='accepted'?resolution.ruleId:null}},
    assertPresentation:(before,after,id)=>{const transition=binding.assertTransition(before,after,id,h.sceneId);const candidate:OriginalHead={...h,save:after,version:h.version+1,sceneId:transition?.scene??h.sceneId,position:transition?.position??pos};assertOriginalHead(candidate);check(candidate,h,id)},
   })
   return {head:{...h,save:bound.result.save,sceneId:bound.sceneId,position:bound.position,version:h.version+1},kind:'action',accepted:resolution.status==='accepted',actionId:resolution.ruleId,source:bound.result.source,...(interpretedAction?{interpretation:{input:body.text.trim(),actionId:interpretedAction}}:{})}
  },
 }
}
/** Same SQLite transaction/replay implementation as the live carriage. This is
 * guarded by the original release switch and mandatory presentation admission. */
export class OriginalTrainAuthority extends SessionAuthority<OriginalHead>{
 constructor(db:AuthorityStorage,admit:OriginalPresentationGate=originalPresentationUnavailable,generator?:StoryTurnGenerator,endingGenerator?:OriginalEndingGenerator,interpreter?:OriginalActionInterpreter,dialogue?:OriginalDialogueGenerator){super(db,originalTrainRuntime(admit,generator,endingGenerator,interpreter,dialogue))}
}
