import {oldStreetPhotoMatches} from '../src/old-street-photo-puzzle'
import {oldStreetTalkReply,oldStreetTalkBlocks} from '../src/old-street-conversation'
import {oldStreetPerson} from '../src/old-street-characters'
import type {OriginalActionInterpreter} from './original-action-interpreter'
import {originalActionIntentIssues} from '../src/original-action-intent'
import {oldStreetActionNames} from '../src/old-street-action-input'
import {completeOldStreetEnding} from '../src/old-street-ending'
import {resolveOldStreetInput} from '../src/old-street-action-input'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {SessionAuthority, type AuthorityStorage, type SessionRuntime} from './session-authority'
import {LabError, validateAction} from '../src/journey-runtime'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetWalkable,oldStreetSafePosition} from '../src/old-street-space'
import {prepareDoorTravel} from '../src/spatial-door-travel'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction, applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import type {StorySave} from '../src/vendor/original-train/types'

import {assertOldStreetHead,type OldStreetHead} from '../src/old-street-head'
export {assertOldStreetHead,type OldStreetHead} from '../src/old-street-head'
export type OldStreetGate = (head:OldStreetHead, previous?:OldStreetHead, actionId?:string)=>true
const unavailable:OldStreetGate = () => {throw new LabError('OLD_STREET_PRESENTATION_NOT_READY',409)}
const plan = oldStreetSpatialPlan()
/** Installs story semantics in the existing transaction authority, not a second save engine.
 * No production route is enabled until real presentation admission is supplied. */
export function oldStreetRuntime(admit:OldStreetGate=unavailable,interpreter?:OriginalActionInterpreter):SessionRuntime<OldStreetHead> {
  const check=(h:OldStreetHead,previous?:OldStreetHead,id?:string)=>{
    assertOldStreetHead(h)
    if(admit(structuredClone(h),previous?structuredClone(previous):undefined,id)!==true)throw new LabError('OLD_STREET_PRESENTATION_NOT_READY',409)
  }
  const position=(h:OldStreetHead,value:unknown)=>{
    const p=value as OldStreetHead['position']
    if(!p || !oldStreetWalkable(h.sceneId,p,h.save))throw new LabError('INVALID_POSITION')
    return {x:p.x,y:p.y}
  }
  return {
    initial:(locale,id)=>{const h:OldStreetHead={id,version:0,mapVersion:plan.mapVersion,sceneId:'street',position:{...plan.scenes.find(s=>s.id==='street')!.spawn},save:createInitialSave(oldStreetCartridge(locale))};check(h);return h},
    upgrade:value=>{assertOldStreetHead(value);const next=structuredClone(value);next.mapVersion=plan.mapVersion;next.position=oldStreetSafePosition(next.sceneId,next.position,next.save);if(next.save.facts.departed)completeOldStreetEnding(next.save,oldStreetCartridge(next.save.locale));return next},assertReadable:assertOldStreetHead,
    scene:h=>h.sceneId,position,validateAction,preserveConcurrent:()=>{},
    assertPrepared:(candidate,current,id)=>check(candidate,current,id),
    prepare:async(h,body,reserveNarration)=>{
      assertOldStreetHead(h);validateAction(body)
      if(h.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
      if(h.save.facts.departed)throw new LabError('OLD_STREET_JOURNEY_COMPLETE',409)
      if(body.sceneId!==h.sceneId)throw new LabError('OFF_SCENE_ENTITY')
      if(!['action','free-input','dialogue'].includes(body.type))throw new LabError('INVALID_ACTION_TYPE')
      if(body.type==='action'&&typeof body.action!=='string')throw new LabError('INVALID_ACTION_TYPE')
      if(body.mode!==undefined&&!['local','live'].includes(body.mode))throw new LabError('INVALID_NARRATION_MODE')
      const pos=position(h,body.position),binding=bindOldStreet(h.save.locale,h.save)
      if(body.type==='dialogue'){
        const person=oldStreetPerson(body.target)
        if(!person||person.room!==h.sceneId||!binding.canInteract(body.target,h.sceneId,pos))throw new LabError('OLD_STREET_DIALOGUE_TARGET_REQUIRED',409)
        if(!h.save.characters.some(c=>c.id===person.id))throw new LabError('OLD_STREET_DIALOGUE_INTRODUCTION_REQUIRED',409)
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        const text=body.text.trim(),reply=oldStreetTalkReply(h.save,body.target,text)
        const save=structuredClone(h.save);save.blocks.push(...oldStreetTalkBlocks(save,body.target,body.action_id,text,reply))
        const next={...h,version:h.version+1,position:pos,save};check(next,h)
        return {head:next,kind:'dialogue',accepted:true,speakerId:person.id,source:'author',text:reply}
      }
      if(body.type==='free-input'){
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.id===body.target&&e.scene===h.sceneId)
        if(!entity||!binding.canInteract(entity.id,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
        let action=resolveOldStreetInput(body.text,h.save.locale,entity.actions)
        if(!action&&body.mode==='live'){
          if(!interpreter)throw new LabError('OLD_STREET_INTERPRETER_NOT_READY',409)
          const c=oldStreetCartridge(h.save.locale)
          const actions=entity.actions.filter(id=>id!=='oldstreet:leave'&&oldStreetActionNames[id.replace('oldstreet:','')]&&resolveDomainAction(h.save,c,id)?.status==='accepted').map(id=>({id,label:oldStreetActionNames[id.replace('oldstreet:','')][h.save.locale==='zh'?0:1]}))
          if(!actions.length||originalActionIntentIssues(body.text,actions.map(a=>a.label)).length)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
          check({...h,position:pos})
          if(!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
          const candidate=await interpreter(body.text,{locale:h.save.locale,sceneId:h.sceneId,target:entity.id,objective:h.save.objective,actions:structuredClone(actions)})
          if(candidate&&actions.some(a=>a.id===candidate))action=candidate
        }
        if(!action)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
        body={...body,action}
      }
      if(!binding.admits(body.action,body.target,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
      if(body.action==='oldstreet:match-photos'&&!oldStreetPhotoMatches(body.photoMatch))throw new LabError('OLD_STREET_PHOTO_ALIGNMENT_REQUIRED',409)
      check({...h,position:pos})
      const c=oldStreetCartridge(h.save.locale),resolution=resolveDomainAction(h.save,c,body.action)
      if(!resolution || resolution.status!=='accepted')throw new LabError('OLD_STREET_ACTION_UNAVAILABLE',409)
      let next:OldStreetHead, text=resolution.successText
      if(oldStreetDoors().some(d=>d.actionId===body.action)) {
        const result=prepareDoorTravel(h.save,c,binding,{scene:h.sceneId,target:body.target,position:pos,actionId:body.action})
        next={...h,version:h.version+1,save:result.save,sceneId:result.scene,position:result.position}
      } else {
        const save=structuredClone(h.save);applyDomainResolution(save,c,resolution)
        text=recordOldStreetInteraction(save,body.target,body.action,resolution.successText,body.action_id).map(b=>b.text).join("\n")
        // Returning a borrowed object can restore collision underneath the player.
        next={...h,version:h.version+1,save,position:oldStreetSafePosition(h.sceneId,pos,save)}
      }
      if(next.save.facts.departed)completeOldStreetEnding(next.save,c)
      check(next,h,body.action)
      return {head:next,kind:'action',accepted:true,actionId:body.action,source:'author',text,...(body.type==='free-input'?{interpretation:{input:body.text,actionId:body.action}}:{})}
    },
  }
}
export class OldStreetAuthority extends SessionAuthority<OldStreetHead> {
  constructor(db:AuthorityStorage,admit:OldStreetGate=unavailable,interpreter?:OriginalActionInterpreter){super(db,oldStreetRuntime(admit,interpreter))}
}
