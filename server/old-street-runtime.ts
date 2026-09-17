import {evidenceChoices} from '../src/old-street-shared-evidence'
import {prepareEvidenceShare} from './old-street-shared-evidence'
import {archivePhotoSource,archivePhotoSuggestion} from '../src/old-street-archive-photo'
import {introduceCampaignCommission,campaignCommission,campaignPhotoPurpose} from '../src/old-street-campaign-story'
import {oldStreetAttemptContext,type OldStreetAttemptGenerator} from './old-street-attempt'
import {prepareCampaignAction,type CampaignCandidate} from './old-street-campaign-actions'
import {campaignComplete} from '../src/old-street-campaign'
import {campaignInputActions,resolveCampaignInput} from '../src/old-street-campaign-interaction'
import type {OldStreetCampaignGenerator} from './old-street-campaign-planner'
import type {ExpansionPlan} from '../src/old-street-expansion-plan'
import {oldStreetClockObserved} from '../src/old-street-clock-puzzle'
import {oldStreetPhotoMatches} from '../src/old-street-photo-puzzle'
import {oldStreetAuthoredTalkReply,oldStreetTalkReply,oldStreetTalkBlocks} from '../src/old-street-conversation'
import {oldStreetDialogueContext,type OldStreetDialogueGenerator} from './old-street-dialogue'
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
/** Only wraps the model await before a candidate or commit exists. Transport
 * failures after a Session commit must remain ambiguous and recover by receipt. */
async function oldStreetModelCall<T>(work:()=>Promise<T>):Promise<T>{
 try{return await work()}catch(error){
  if(error instanceof LabError&&['OLD_STREET_DIALOGUE_TIMEOUT','OLD_STREET_DIALOGUE_REJECTED'].includes(error.code))throw error
  throw new LabError('OLD_STREET_MODEL_UNAVAILABLE',409)
 }
}
export function oldStreetRuntime(admit:OldStreetGate=unavailable,interpreter?:OriginalActionInterpreter,dialogue?:OldStreetDialogueGenerator,expansionPlan?:(h:OldStreetHead)=>ExpansionPlan|undefined,expansionPhoto?:(h:OldStreetHead)=>string|undefined,attempt?:OldStreetAttemptGenerator,campaignGenerator?:OldStreetCampaignGenerator,campaignCandidate?:CampaignCandidate):SessionRuntime<OldStreetHead> {
  const check=(h:OldStreetHead,previous?:OldStreetHead,id?:string)=>{
    assertOldStreetHead(h)
    if(admit(structuredClone(h),previous?structuredClone(previous):undefined,id)!==true)throw new LabError('OLD_STREET_PRESENTATION_NOT_READY',409)
  }
  const finish=(h:OldStreetHead,previous:OldStreetHead,id?:string)=>{
    const objective=campaignPhotoPurpose(h.save,h.campaign)
    if(objective)h.save={...h.save,objective}
    check(h,previous,id)
  }
  const position=(h:OldStreetHead,value:unknown)=>{
    const p=value as OldStreetHead['position']
    if(!p || !oldStreetWalkable(h.sceneId,p,h.save))throw new LabError('INVALID_POSITION')
    return {x:p.x,y:p.y}
  }
  return {
    initial:(locale,id,options)=>{
      const h:OldStreetHead={id,version:0,mapVersion:plan.mapVersion,sceneId:'street',position:{...plan.scenes.find(s=>s.id==='street')!.spawn},save:createInitialSave(oldStreetCartridge(locale))}
      if(options!==undefined){
        if((!campaignGenerator&&!campaignCandidate)||!['letter-trail-v1','letter-trail-v2','letter-trail-v3'].some(campaign=>JSON.stringify(options)===JSON.stringify({campaign})))throw new LabError('CAMPAIGN_NOT_AVAILABLE',409)
        const name=(options as {campaign:string}).campaign
        if(name==='letter-trail-v3'&&(!expansionPlan||!expansionPhoto))throw new LabError('CAMPAIGN_NOT_AVAILABLE',409)
        h.campaign={version:name==='letter-trail-v3'?3:name==='letter-trail-v2'?2:1}
        if(h.campaign.version!==1)introduceCampaignCommission(h.save,h.campaign.version)
      }
      check(h);return h
    },
    upgrade:value=>{assertOldStreetHead(value);const next=structuredClone(value);next.mapVersion=plan.mapVersion;next.position=oldStreetSafePosition(next.sceneId,next.position,next.save);if(next.save.facts.departed)completeOldStreetEnding(next.save,oldStreetCartridge(next.save.locale));return next},assertReadable:assertOldStreetHead,
    scene:h=>h.sceneId,position,validateAction,preserveConcurrent:()=>{},
    assertPrepared:(candidate,current,id)=>check(candidate,current,id),
    prepare:async(h,body,reserveNarration)=>{
      assertOldStreetHead(h);validateAction(body)
      if(h.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
      if(h.save.facts.departed)throw new LabError('OLD_STREET_JOURNEY_COMPLETE',409)
      if(body.sceneId!==h.sceneId)throw new LabError('OFF_SCENE_ENTITY')
      if(!['action','free-input','dialogue','expansion-request','expansion-activate','expansion-photo-match','expansion-photo-decision','campaign-plan','campaign-read','campaign-observe','campaign-decide'].includes(body.type))throw new LabError('INVALID_ACTION_TYPE')
      if(body.type==='action'&&typeof body.action!=='string')throw new LabError('INVALID_ACTION_TYPE')
      if(body.mode!==undefined&&!['local','live'].includes(body.mode))throw new LabError('INVALID_NARRATION_MODE')
      const pos=position(h,body.position),binding=bindOldStreet(h.save.locale,h.save)
      if(body.type.startsWith('campaign-')){
        const result=await prepareCampaignAction(h,body,pos,campaignGenerator,reserveNarration,campaignCandidate)
        finish(result.head,h);return result
      }
      const resolveAttempt=async(actions:Array<{id:string;label:string}>)=>{
        check({...h,position:pos})
        if(!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
        const context=oldStreetAttemptContext(h,body.target,actions),result=await oldStreetModelCall(()=>attempt!(body.text,context))
        if(result.kind==='action')return {actionId:result.actionId}
        else {
          const save=structuredClone(h.save)
          const discoveries=context.knowledge.filter(k=>!k.id.startsWith('learned:')&&result.discoveryIds.includes(k.id))
          save.blocks.push({id:body.action_id+':attempt',kind:'narration',text:result.text,data:{oldStreetAttemptTarget:body.target,oldStreetAttemptScene:h.sceneId,input:body.text,outcome:result.outcome,oldStreetDiscoveries:JSON.stringify(discoveries)}})
          const next={...h,version:h.version+1,position:pos,save};finish(next,h)
          return {response:{head:next,kind:'attempt',accepted:true,source:'model',text:result.text,outcome:result.outcome}}
        }
      }
      if(body.type==='free-input'&&h.sceneId==='darkroom'&&body.target==='developing-bench'){
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        if(!binding.canInteract(body.target,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
        const allowed=['oldstreet:observe-darkroom',...(!h.save.facts['darkroom-photo-matched']?(expansionPhoto?.(h)?['oldstreet:match-darkroom-photo']:[]):!h.save.facts['darkroom-photo-choice']?['oldstreet:keep-darkroom-photo','oldstreet:leave-darkroom-photo']:[])]
        let action=resolveOldStreetInput(body.text,h.save.locale,allowed)
        if(!action&&attempt&&body.mode!=='local'){
          const actions=allowed.map(id=>({id,label:oldStreetActionNames[id.replace('oldstreet:','')][h.save.locale==='zh'?0:1]}))
          const resolved=await resolveAttempt(actions)
          if(resolved.response)return resolved.response
          action=resolved.actionId
        }
        if(!action&&(body.mode==='live'||body.mode===undefined&&!!interpreter)){
          const actions=allowed.map(id=>({id,label:oldStreetActionNames[id.replace('oldstreet:','')][h.save.locale==='zh'?0:1]}))
          if(originalActionIntentIssues(body.text,actions.map(a=>a.label)).length)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
          if(!interpreter)throw new LabError('OLD_STREET_INTERPRETER_NOT_READY',409)
          if(!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
          const candidate=await oldStreetModelCall(()=>interpreter!(body.text,{locale:h.save.locale,sceneId:h.sceneId,target:body.target,objective:h.save.objective,actions}))
          if(candidate&&allowed.includes(candidate))action=candidate
        }
        if(!action)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
        body=action==='oldstreet:match-darkroom-photo'?{...body,type:'expansion-photo-match'}:action==='oldstreet:keep-darkroom-photo'||action==='oldstreet:leave-darkroom-photo'?{...body,type:'expansion-photo-decision',decision:action==='oldstreet:keep-darkroom-photo'?'keep':'leave'}:{...body,type:'action',action}
      }
      if(body.type==='expansion-photo-decision'){
        if(h.sceneId!=='darkroom'||!h.save.facts['darkroom-photo-matched']||h.save.facts['darkroom-photo-choice']||!['keep','leave'].includes(body.decision)||!binding.canInteract('developing-bench',h.sceneId,pos))throw new LabError('OLD_STREET_ACTION_UNAVAILABLE',409)
        const save=structuredClone(h.save),keep=body.decision==='keep'
        save.facts['darkroom-photo-choice']=body.decision
        if(keep)save.inventory.push({id:'darkroom-print',label:save.locale==='zh'?'旧街照片':'Old street photograph',count:1,rarity:'common'})
        const text=save.locale==='zh'?(keep?'你把拼好的旧街照片收进随身行囊。':'你把照片平整地留在显影台上。'):(keep?'You tuck the completed street photograph into your bag.':'You leave the photograph flat on the developing bench.')
        recordOldStreetInteraction(save,'developing-bench','expansion-photo-decision',text,body.action_id)
        const next={...h,version:h.version+1,position:pos,save};finish(next,h)
        return {head:next,kind:'expansion-photo-decision',accepted:true,text}
      }
      if(body.type==='expansion-photo-match'){
        if(h.save.facts['darkroom-photo-matched'])throw new LabError('OLD_STREET_ACTION_UNAVAILABLE',409)
        const hash=expansionPhoto?.(h)
        if(h.sceneId!=='darkroom'||!h.save.facts['darkroom-ready']||!hash||!binding.canInteract('developing-bench',h.sceneId,pos))throw new LabError('OLD_STREET_EXPANSION_UNAVAILABLE',409)
        if(!oldStreetPhotoMatches(body.photoMatch,hash))throw new LabError('OLD_STREET_PHOTO_ALIGNMENT_REQUIRED',409)
        const save=structuredClone(h.save);save.facts['darkroom-photo-matched']=hash
        const prepared=expansionPlan?.(h),content=prepared?.content
        if(h.campaign?.version===3){
          if(!h.campaign.archive?.order||!content||prepared?.requestId!==h.expansions?.[0]?.id||h.expansions?.[0]?.archiveSource?.archiveId!==h.campaign.archive.id)throw new LabError('OLD_STREET_EXPANSION_UNAVAILABLE',409)
          save.facts['campaign-photo-archive']=h.campaign.archive.id
        }
        if(content)save.facts['darkroom-photo-discovery']=content.discovery
        const text=content?.discovery??(save.locale==='zh'?'这张旧街照片完整了。':'The old street photograph is complete.')
        recordOldStreetInteraction(save,'developing-bench','expansion-photo-match',text,body.action_id)
        const next={...h,version:h.version+1,position:pos,save};finish(next,h)
        return {head:next,kind:'expansion-photo-match',accepted:true,text}
      }
      if(body.type==='expansion-activate'){
        const expansion=expansionPlan?.(h)
        if(h.sceneId!=='photo'||!expansion||expansion.requestId!==h.expansions?.[0]?.id)throw new LabError('OLD_STREET_EXPANSION_UNAVAILABLE',409)
        const save=structuredClone(h.save);save.facts['darkroom-ready']=true
        if(!save.map.some(n=>n.id==='darkroom'))save.map.push({id:'darkroom',label:save.locale==='zh'?'暗房':'Darkroom',current:false,visited:false})
        const next={...h,version:h.version+1,position:pos,save};finish(next,h)
        return {head:next,kind:'expansion-activate',accepted:true,text:save.locale==='zh'?'暗房门可以打开了。':'The darkroom door can now be opened.'}
      }
      if(body.type==='expansion-request'){
        if(h.sceneId!=='photo'||body.template!=='photo-darkroom-v1')throw new LabError('OLD_STREET_EXPANSION_UNAVAILABLE',409)
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        if(h.expansions?.length)throw new LabError('OLD_STREET_EXPANSION_ALREADY_REQUESTED',409)
        const followArchive=h.campaign?.version===3||body.followArchive===true
        const archiveSource=followArchive?archivePhotoSource(h.campaign):undefined
        if(followArchive&&!archiveSource)throw new LabError('OLD_STREET_EXPANSION_UNAVAILABLE',409)
        const next:OldStreetHead={...h,version:h.version+1,position:pos,expansions:[{version:1,id:body.action_id,template:'photo-darkroom-v1',sourceScene:'photo',input:h.campaign?.version===3?archivePhotoSuggestion(h.save.locale):body.text.trim(),status:'requested',requestedAtVersion:h.version,...(archiveSource?{archiveSource}:{})}]}
        finish(next,h)
        return {head:next,kind:'expansion-request',accepted:true,text:h.save.locale==='zh'?'已记下你想探索的新去处。准备好后才能进入；现在可以继续逛。':'Your exploration idea is saved. You can keep exploring while the new area is prepared.'}
      }
      if(body.type==='dialogue'){
        const person=oldStreetPerson(body.target)
        if(!person||person.room!==h.sceneId||!binding.canInteract(body.target,h.sceneId,pos))throw new LabError('OLD_STREET_DIALOGUE_TARGET_REQUIRED',409)
        if(!h.save.characters.some(c=>c.id===person.id))throw new LabError('OLD_STREET_DIALOGUE_INTRODUCTION_REQUIRED',409)
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        check({...h,position:pos})
        const text=body.text.trim(),authored=oldStreetAuthoredTalkReply(h.save,body.target,text),useModel=(body.mode==='live'||body.mode===undefined&&!!dialogue)&&authored===null
        if(useModel&&!dialogue)throw new LabError('OLD_STREET_DIALOGUE_NOT_READY',409)
        if(useModel&&!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
        const reply=authored??(useModel?await oldStreetModelCall(()=>dialogue!(text,oldStreetDialogueContext(h,body.target))):oldStreetTalkReply(h.save,body.target,text))
        if(typeof reply!=='string'||!reply.trim()||reply.length>(useModel?300:650))throw new LabError('OLD_STREET_DIALOGUE_REJECTED',409)
        const save=structuredClone(h.save);save.blocks.push(...oldStreetTalkBlocks(save,body.target,body.action_id,text,reply))
        const next={...h,version:h.version+1,position:pos,save};finish(next,h)
        return {head:next,kind:'dialogue',accepted:true,speakerId:person.id,source:useModel?'model':'author',text:reply}
      }
      if(body.type==='free-input'){
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new LabError('INVALID_TEXT')
        const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.id===body.target&&e.scene===h.sceneId)
        if(!entity||!binding.canInteract(entity.id,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
        const campaignActions=campaignInputActions(h,entity.id),sharedActions=evidenceChoices(h,entity.id)
        let action=resolveCampaignInput(body.text,[...campaignActions,...sharedActions])??resolveOldStreetInput(body.text,h.save.locale,entity.actions)
        if(!action&&attempt&&body.mode!=='local'){
          const cartridge=oldStreetCartridge(h.save.locale)
          const actions=[...[...campaignActions,...sharedActions].map(({id,label})=>({id,label})),...entity.actions.filter(id=>id!=='oldstreet:leave'&&oldStreetActionNames[id.replace('oldstreet:','')]&&resolveDomainAction(h.save,cartridge,id)?.status==='accepted').map(id=>({id,label:oldStreetActionNames[id.replace('oldstreet:','')][h.save.locale==='zh'?0:1]}))]
          const resolved=await resolveAttempt(actions)
          if(resolved.response)return resolved.response
          action=resolved.actionId
        }
        if(!action&&(body.mode==='live'||body.mode===undefined&&!!interpreter)){
          if(!interpreter)throw new LabError('OLD_STREET_INTERPRETER_NOT_READY',409)
          const c=oldStreetCartridge(h.save.locale)
          const actions=[...[...campaignActions,...sharedActions].map(({id,label})=>({id,label})),...entity.actions.filter(id=>id!=='oldstreet:leave'&&oldStreetActionNames[id.replace('oldstreet:','')]&&resolveDomainAction(h.save,c,id)?.status==='accepted').map(id=>({id,label:oldStreetActionNames[id.replace('oldstreet:','')][h.save.locale==='zh'?0:1]}))]
          if(!actions.length||originalActionIntentIssues(body.text,actions.map(a=>a.label)).length)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
          check({...h,position:pos})
          if(!reserveNarration())throw new LabError('NARRATION_RATE_LIMIT',429)
          const candidate=await oldStreetModelCall(()=>interpreter!(body.text,{locale:h.save.locale,sceneId:h.sceneId,target:entity.id,objective:h.save.objective,actions:structuredClone(actions)}))
          if(candidate&&actions.some(a=>a.id===candidate))action=candidate
        }
        if(!action)throw new LabError('OLD_STREET_INPUT_UNSUPPORTED',409)
        if(sharedActions.some(a=>a.id===action)){
          const result=prepareEvidenceShare(h,entity.id,action,body.action_id,pos)
          finish(result.head,h)
          return {...result,interpretation:{input:body.text,actionId:action}}
        }
        const campaignAction=campaignActions.find(a=>a.id===action)
        if(campaignAction){
          const result=await prepareCampaignAction(h,{...body,type:campaignAction.type,stage:campaignAction.stage,selection:campaignAction.selection},pos,campaignGenerator,reserveNarration,campaignCandidate)
          finish(result.head,h)
          return {...result,interpretation:{input:body.text,actionId:action}}
        }
        body={...body,action}
      }
      if(!binding.admits(body.action,body.target,h.sceneId,pos))throw new LabError('UNSUPPORTED_ACTION')
      if(body.action==='oldstreet:leave'&&h.campaign&&!campaignComplete(h.campaign,h.save.facts))throw new LabError('CAMPAIGN_UNFINISHED',409)
      check({...h,position:pos})
      const c=oldStreetCartridge(h.save.locale),resolution=resolveDomainAction(h.save,c,body.action)
      if(!resolution || resolution.status!=='accepted')throw new LabError('OLD_STREET_ACTION_UNAVAILABLE',409)
      if(body.action==='oldstreet:inspect-clock'&&!oldStreetClockObserved(body.clockInspection))throw new LabError('OLD_STREET_CLOCK_INSPECTION_REQUIRED',409)
      if(body.action==='oldstreet:match-photos'&&!oldStreetPhotoMatches(body.photoMatch))throw new LabError('OLD_STREET_PHOTO_ALIGNMENT_REQUIRED',409)
      let next:OldStreetHead, text=resolution.successText
      if(body.action==='oldstreet:take-letter'&&h.campaign)text=h.save.locale==='zh'?'你收好密封信，信旁另有一张寄存条。先到铺里的记录册比对标记，找出还在旧街的材料。':'You secure the sealed letter. A separate filing slip beside it points to papers still on the street. Compare its marks with the shop record book.'
      if(body.action==='oldstreet:take-letter'&&campaignCommission(h.save))text=h.save.locale==='zh'?'你收好密封信，没有拆开。旁边的寄存条指向家人托你查清的旧街记录，铺里的记录册能帮你找到它。':'You put away the letter without opening it. The filing slip points to the street records your family asked about; the shop ledger can help you locate them.'
      if(body.action==='oldstreet:observe-darkroom'&&h.save.facts['darkroom-photo-matched']){const keep=h.save.facts['darkroom-photo-choice']==='keep';text=h.save.locale==='zh'?(keep?'拼好的旧街照片已在你的行囊里。':'拼好的旧街照片平放在显影台上。'):(keep?'The completed street photograph is in your bag.':'The completed street photograph lies flat on the developing bench.')}
      if(oldStreetDoors().some(d=>d.actionId===body.action)) {
        const result=prepareDoorTravel(h.save,c,binding,{scene:h.sceneId,target:body.target,position:pos,actionId:body.action})
        next={...h,version:h.version+1,save:result.save,sceneId:result.scene,position:result.position}
      } else {
        const save=structuredClone(h.save);applyDomainResolution(save,c,resolution)
        if(body.action==='oldstreet:take-letter'&&h.campaign)save.objective=h.save.locale==='zh'?'在修表铺记录册中比对寄存条，寻找相关材料。':'Compare the filing slip with the shop record book to trace the archived papers.'
        text=recordOldStreetInteraction(save,body.target,body.action,text,body.action_id).map(b=>b.text).join("\n")
        // Returning a borrowed object can restore collision underneath the player.
        next={...h,version:h.version+1,save,position:oldStreetSafePosition(h.sceneId,pos,save)}
      }
      if(next.save.facts.departed)completeOldStreetEnding(next.save,c)
      finish(next,h,body.action)
      return {head:next,kind:'action',accepted:true,actionId:body.action,source:'author',text,...(body.type==='free-input'?{interpretation:{input:body.text,actionId:body.action}}:{})}
    },
  }
}
export class OldStreetAuthority extends SessionAuthority<OldStreetHead> {
  override directory(owner:string){return super.directory(owner).map(row=>({...row,complete:this.get(owner,row.id).save.finale.status==='complete'}))}
  constructor(db:AuthorityStorage,admit:OldStreetGate=unavailable,interpreter?:OriginalActionInterpreter,dialogue?:OldStreetDialogueGenerator,expansionPlan?:(h:OldStreetHead)=>ExpansionPlan|undefined,expansionPhoto?:(h:OldStreetHead)=>string|undefined,attempt?:OldStreetAttemptGenerator,campaignGenerator?:OldStreetCampaignGenerator,campaignCandidate?:CampaignCandidate){super(db,oldStreetRuntime(admit,interpreter,dialogue,expansionPlan,expansionPhoto,attempt,campaignGenerator,campaignCandidate))}
}
