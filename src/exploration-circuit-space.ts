import type {Locale,StorySave} from './vendor/original-train/types'
import {compileSpatialBinding,type SpatialBindingDefinition,type SpatialPoint} from './spatial-binding'
import {explorationCircuitRules} from './exploration-circuit-rules'

/** Unadmitted layout for the candidate story version. These are measured layout
 * definitions, not aliases for existing train background images. */
export const explorationCircuitSpace:SpatialBindingDefinition={
 version:1,cartridgeId:'exploration-candidate',mapVersion:'exploration-circuit-layout-1',interactionDistance:54,
 scenes:[{id:'explore-power',spawn:{x:180,y:460}},{id:'explore-signal-inside',spawn:{x:180,y:460}}],
 entities:[
  {id:'explore-cabinet',scene:'explore-power',position:{x:110,y:310},approach:{x:145,y:310},states:['closed','open-full','open-empty'],actions:['explore-open-cabinet','explore-take-fuse']},
  {id:'explore-tool-rack',scene:'explore-power',position:{x:270,y:310},approach:{x:235,y:310},states:['full','empty'],actions:['explore-take-wedge']},
  {id:'explore-light-socket',scene:'explore-power',position:{x:120,y:150},approach:{x:120,y:177},states:['empty','powered'],actions:['explore-insert-light','explore-remove-light']},
  {id:'explore-lock-socket',scene:'explore-power',position:{x:260,y:150},approach:{x:260,y:177},states:['empty','powered'],actions:['explore-insert-lock','explore-remove-lock']},
  {id:'explore-door-frame',scene:'explore-power',position:{x:190,y:100},approach:{x:190,y:132},states:['closed','open','braced'],actions:['explore-observe-stop','explore-brace-door','explore-enter-signal']},
  {id:'explore-release',scene:'explore-signal-inside',position:{x:120,y:430},approach:{x:150,y:430},states:['latched','released'],actions:['explore-inside-release']},
  {id:'explore-return-door',scene:'explore-signal-inside',position:{x:190,y:470},approach:{x:190,y:438},states:['closed','open'],actions:['explore-return-power']},
 ],portals:[{actionId:'explore-enter-signal',scene:'explore-signal-inside',position:{x:180,y:460}},{actionId:'explore-return-power',scene:'explore-power',position:{x:190,y:132}}],characters:[],
}
const bodies=[{scene:'explore-power',x:90,y:280,w:35,h:50},{scene:'explore-power',x:265,y:280,w:35,h:50},{scene:'explore-power',x:105,y:128,w:35,h:30},{scene:'explore-power',x:245,y:128,w:35,h:30},{scene:'explore-power',x:165,y:76,w:50,h:28},{scene:'explore-signal-inside',x:105,y:412,w:30,h:30}]
export function explorationCircuitWalkable(scene:string,p:SpatialPoint){
 return explorationCircuitSpace.scenes.some(s=>s.id===scene)&&p.x>=64&&p.x+9<=320&&p.y>=64&&p.y+15<=512&&!bodies.some(b=>b.scene===scene&&p.x+9>b.x&&p.x<b.x+b.w&&p.y+15>b.y&&p.y<b.y+b.h)
}
export function bindExplorationCircuit(locale:Locale,save?:Pick<StorySave,'facts'>){
 return compileSpatialBinding({id:explorationCircuitSpace.cartridgeId,initialMap:explorationCircuitSpace.scenes.map((s,i)=>({id:s.id,current:i===0})),characters:[],domainRules:{rules:explorationCircuitRules(locale,save)}},explorationCircuitSpace,explorationCircuitWalkable)
}
/** This content cannot yet enter production: art and full story/session wiring are absent. */
export const explorationCircuitAdmission={ready:false,missing:['approved room artwork','complete story cartridge and session version routing']} as const
