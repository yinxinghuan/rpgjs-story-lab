import type {OriginalHead} from '../server/original-train-runtime'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import {originalCharacterPresent} from './original-character-presence'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {assertPassSourceAction} from './original-pass-chapter'
import {assertPineSourceAction} from './original-pine-chapter'
import {originalPlaceBlocks} from './original-place-presentation'
const world=originalTrainChapterSpatialPlan()
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
 if(save.objective!==c.opening.objective)return save.objective
 const region=save.map.find(m=>m.current)?.id
 if(region==='river-valley')return t('先查看断桥的情况，再决定怎样接应诊所。','Inspect the broken bridge before choosing how to reach the clinic.')
 if(region==='pine-line')return t('检查林线信号，确认前方是否安全。','Check the forest signal and confirm whether the track is safe.')
 if(region==='graystone-yard')return t('了解货场的燃料条件，再决定怎样交换。','Learn the yard’s fuel terms before choosing an agreement.')
 return save.facts['starter-repaired']?t('列车已经点火；检查补给与制动，再选择第一条支线。','The engine is running. Check supplies and brakes, then choose your first branch.'):save.objective
}
