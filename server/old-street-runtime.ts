import {recordOldStreetInteraction} from '../src/old-street-characters'
import {SessionAuthority, type AuthorityStorage, type SessionRuntime} from './session-authority'
import {LabError, validateAction} from '../src/journey-runtime'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetWalkable} from '../src/old-street-space'
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
export function oldStreetRuntime(admit:OldStreetGate=unavailable):SessionRuntime<OldStreetHead> {
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
    upgrade:value=>{assertOldStreetHead(value);return structuredClone(value)},assertReadable:assertOldStreetHead,
    scene:h=>h.sceneId,position,validateAction,preserveConcurrent:()=>{},
    assertPrepared:(candidate,current,id)=>check(candidate,current,id),
    prepare:async(h,body)=>{
      assertOldStreetHead(h);validateAction(body)
      if(h.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
      if(h.save.facts.departed)throw new LabError('OLD_STREET_JOURNEY_COMPLETE',409)
      if(body.sceneId!==h.sceneId)throw new LabError('OFF_SCENE_ENTITY')
      if(body.type!=='action'||typeof body.action!=='string')throw new LabError('INVALID_ACTION_TYPE')
      if(body.mode!==undefined&&body.mode!=='local')throw new LabError('OLD_STREET_INTERPRETER_NOT_READY',409)
      const pos=position(h,body.position),binding=bindOldStreet(h.save.locale,h.save)
      if(!binding.admits(body.action,body.target,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
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
        next={...h,version:h.version+1,save,position:pos}
      }
      check(next,h,body.action)
      return {head:next,kind:'action',accepted:true,actionId:body.action,source:'author',text}
    },
  }
}
export class OldStreetAuthority extends SessionAuthority<OldStreetHead> {
  constructor(db:AuthorityStorage,admit:OldStreetGate=unavailable){super(db,oldStreetRuntime(admit))}
}
