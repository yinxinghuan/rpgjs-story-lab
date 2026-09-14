import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'
// Reviewed three-state pump; old journeys without this binding retain their art.
export const yardPumpResource:SceneResource={kind:'background',path:'./art/yard-pump-candidate-v1.png',sha256:'4b477baffa31247f6c1ba946d5060e3ac60e9821020772922ff4197130c18f6e',bytes:471277,width:1536,height:640}
export const yardPumpArt={entityId:'yard-pump',graphic:'original-yard-pump-v1',foot:{x:256,y:500},scale:.085,body:{x:-19,y:-12,w:38,h:16}} as const
export function originalYardPumpState(save:StorySave){return save.facts['yard-agreement']==='work'?'repaired':save.facts['yard-agreement']==='forced'?'forced':'stopped'}
export function originalYardPumpSheet(image:string){
 const frame=(column:number)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[.5,500/640],scale:[yardPumpArt.scale,yardPumpArt.scale],x:0,y:1}]]})
 return {id:yardPumpArt.graphic,image,width:1536,height:640,framesWidth:3,framesHeight:1,textures:{stopped:frame(0),repaired:frame(1),forced:frame(2)}}
}
