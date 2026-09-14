import type {OriginalHead} from '../server/original-train-runtime'
import type {SceneResource} from './scene-readiness'
import {originalBoundWorldPlan} from './original-world-plan'
import {originalEnvironmentWalkable} from './original-environment-layouts'
import {originalSceneBackgroundVersion} from './original-asset-releases'
import {originalEquipmentBodies} from './original-equipment-art'

export const passengerArt={
 blue:{graphic:'passenger-blue-v1',resource:{kind:'background',path:'./art/overhead/attendant.png',width:1086,height:1448,bytes:699200,sha256:'4a8edd9a612af68eca5b6c845586088e24a2ae812fd544405ac89a76c4b38464'} as SceneResource},
 gray:{graphic:'passenger-gray-v1',resource:{kind:'background',path:'./art/overhead/mechanic.png',width:1086,height:1448,bytes:705093,sha256:'528735d4e01625854f42a82afbe79468edd8502b6c7def1bdfe7f947d0ba0c9b'} as SceneResource},
}
export type PassengerKind=keyof typeof passengerArt
/** Two visible members of the existing passenger group, not extra party members.
 * They step onto the platform only after it has been inspected as a safe stop. */
export function originalPassengers(head:Pick<OriginalHead,'sceneId'|'save'|'assets'>){
 if(head.sceneId!=='train-at-sleeping-town'||!head.save.facts['town-inspected'])return []
 const world=originalBoundWorldPlan(head.assets),scene=world.scenes.find(s=>s.id===head.sceneId)!,entities=world.entities.filter(e=>e.scene===head.sceneId)
 const background=originalSceneBackgroundVersion(head.assets,head.sceneId),equipment=originalEquipmentBodies(head.sceneId,head.assets)
 const clear=(p:{x:number;y:number})=>originalEnvironmentWalkable(background,head.sceneId,p)&&!equipment.some(b=>p.x+9>b.x&&p.x<b.x+b.w&&p.y+15>b.y&&p.y<b.y+b.h)
 const candidates=[{x:76,y:330},{x:112,y:435},{x:84,y:210},{x:300,y:420},{x:308,y:210}].filter(p=>clear(p)&&clear({x:p.x,y:p.y+26})&&Math.hypot(p.x-scene.spawn.x,p.y-scene.spawn.y)>35&&entities.every(e=>[e.position,e.approach].every(q=>Math.hypot(p.x-q.x,p.y-q.y)>38)))
 return candidates.slice(0,2).map((p,index)=>{
  const kind:PassengerKind=index===0?'blue':'gray'
  return {id:'passenger-'+kind,ambient:true as const,kind,graphic:passengerArt[kind].graphic,position:{x:p.x+4.5,y:p.y+15},approach:{x:p.x,y:p.y+26},label:head.save.locale==='zh'?(kind==='blue'?'蓝绿外套的乘客':'灰发乘客'):(kind==='blue'?'Passenger in a teal coat':'Gray-haired passenger')}
 })
}
export function originalPassengerBodies(head:Pick<OriginalHead,'sceneId'|'save'|'assets'>){return originalPassengers(head).map(p=>({x:p.position.x-4.5,y:p.position.y-15,w:9,h:15}))}
export function originalPassengerConversation(head:Pick<OriginalHead,'save'>,kind:PassengerKind){
 const s=head.save,t=(zh:string,en:string)=>s.locale==='zh'?zh:en
 return {
  greeting:kind==='blue'?t('穿蓝绿外套的乘客看向你：“我就在车门附近等着，出发时叫我。”','The passenger in the teal coat looks toward you. “I’ll wait near the train. Call me when we leave.”'):t('灰发乘客望了望列车，转过身来：“最后这一段，咱们慢慢商量。”','The gray-haired passenger turns from the train. “Let’s talk through this last stretch.”'),
  topics:[
   {label:t('大家现在怎么样？','How is everyone doing?'),reply:s.stats.morale>=65?t('“大家比刚才安定些了。你把下一步说清楚，我们就知道该怎么配合。”','“People feel steadier now. Tell us what comes next so we know how to help.”'):t('“还有人紧张。别只告诉我们快走，也告诉我们为什么走、往哪里走。”','“Some are still nervous. Tell us why we’re leaving and where we’re going.”')},
   {label:t('还需要休息吗？','Do you need more rest?'),reply:s.facts['town-rested']?t('“刚才歇过一会儿，好多了。水位还在涨，我不想因为自己耽误大家。”','“That break helped. The water is rising; I don’t want to hold everyone up.”'):t('“能喘口气当然好，不过我知道桥那边不能一直等。你定下时间，记得告诉大家。”','“A breather would help, but the bridge won’t wait forever. Let us know when it’s time.”')},
  ],
 }
}
