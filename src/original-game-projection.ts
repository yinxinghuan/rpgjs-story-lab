import type {OriginalHead} from '../server/original-train-runtime'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import {originalCharacterPresent} from './original-character-presence'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {assertPassSourceAction} from './original-pass-chapter'
import {assertPineSourceAction,pineSidingOpened} from './original-pine-chapter'
import {originalPlaceBlocks} from './original-place-presentation'
import {resolveOriginalChapter} from './original-chapters'
import {originalActionIntentIssues} from './original-action-intent'
const world=originalTrainChapterSpatialPlan()
/** Preparation follows the same action resolver as authority, but never commits
 * a turn. An unrelated branch must not prevent the selected route loading. */
export function originalActionDestinations(head:OriginalHead,target:string,input:{action:string}|{text:string}){
 const entity=world.entities.find(e=>e.id===target&&e.scene===head.sceneId)
 if(!entity)return []
 const c=head.save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn
 if('text' in input){
  const labels=[...entity.actions.flatMap(id=>c.domainRules?.rules.find(r=>r.id===id)?.match??[]),...(originalGameEntities(head).find(e=>e.id===target)?.actions.map(a=>a.label)??[])]
  if(originalActionIntentIssues(input.text,labels).length)return []
 }
 const action='action' in input?input.action:resolveOriginalChapter(input.text.trim(),head.save.locale,head.save)??resolveDomainAction(head.save,c,input.text.trim())?.ruleId
 return world.portals.filter(p=>p.fromScene===head.sceneId&&p.actionId===action&&entity.actions.includes(p.actionId)).map(p=>p.scene)
}
/** Read-only UI projection. Clicks still require the server's full rule check. */
export function originalGameEntities(head:OriginalHead){
 const save=head.save,c=save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn,terminal=save.finale.status!=='idle'
 return world.entities.filter(e=>e.scene===head.sceneId).flatMap(e=>{
  const actor=world.characters.find(p=>p.entities.includes(e.id))
  if(actor&&!originalCharacterPresent(save,actor.id))return []
  const actions=terminal?[]:e.actions.flatMap(id=>{
   const choice=save.choices.find(a=>a.id===id);if(choice)return [choice]
   const rule=c.domainRules?.rules.find(r=>r.id===id);if(!rule||resolveDomainAction(save,c,rule.match[0])?.status!=='accepted')return []
   try{assertPassSourceAction(save,id);assertPineSourceAction(save,id)}catch{return []}
   return [{id,label:rule.match[0]}]
  })
  if(!actions.length&&!actor)return []
  return [{...e,actions,person:actor?save.characters.find(p=>p.id===actor.id):undefined}]
 })
}

/** Frozen v8 can append the same domain outcome as narration and summary.
 * Suppress only identical same-turn prose; keep changes and later repetition. */
export function originalReadingBlocks(save:OriginalHead['save']){
 const seen=new Set<string>()
 return originalPlaceBlocks(save.blocks,save.locale).filter(block=>{
  if(block.id.startsWith('action-')){seen.clear();return true}
  if(block.kind==='image')return false
  // Reducer fact receipts remain in the authoritative history, not player prose.
  if(block.kind==='event'&&block.id.startsWith('facts-')&&block.data?.factIds!==undefined)return false
  if(!['narration','summary','event'].includes(block.kind))return true
  const key=(block.speaker??'')+'\0'+block.text
  if(seen.has(key))return false
  seen.add(key);return true
 })
}

export function originalGameObjective(head:OriginalHead){
 const save=head.save,c=save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 if(save.finale.status==='complete')return t('旅程已经收束，可以回顾一路上的选择。','The journey is complete. Revisit the choices you made.')
 if(save.finale.status==='ready')return t('最终归属已经确定，展开这次旅程的结局。','Your final choice is recorded. Continue to this journey’s ending.')
 const region=save.map.find(m=>m.current)?.id
 if(region==='pine-line'&&save.facts['pine-inspected']){
  if(save.facts['pine-escort-decision'])return t('沿核实的线路前往白石隧道。','Follow the verified route to White Stone Tunnel.')
  if(save.facts['pine-route-checked'])return t('决定林澈同行，还是留守信号点。','Decide whether Lin travels with you or stays at the signal post.')
  if(save.facts['pine-clear-method']&&!save.facts['pine-met'])return t('去打开仍传来敲门声的救援车。','Open the rescue car where the knocking is coming from.')
  if(!save.facts['pine-clear-method']&&pineSidingOpened(save))return t('确认列车已停在侧线的安全位置。','Confirm that the train is safely positioned on the siding.')
 }
 if(save.objective!==c.opening.objective)return save.objective
 if(region==='river-valley')return t('先查看断桥的情况，再决定怎样接应诊所。','Inspect the broken bridge before choosing how to reach the clinic.')
 if(region==='pine-line')return t('检查林线信号，确认前方是否安全。','Check the forest signal and confirm whether the track is safe.')
 if(region==='graystone-yard')return t('了解货场的燃料条件，再决定怎样交换。','Learn the yard’s fuel terms before choosing an agreement.')
 return save.facts['starter-repaired']?t('列车已经点火；检查补给与制动，再选择第一条支线。','The engine is running. Check supplies and brakes, then choose your first branch.'):save.objective
}
