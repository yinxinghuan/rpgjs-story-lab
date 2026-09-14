import type {SceneResource} from './scene-readiness'
import type {StorySave} from './vendor/original-train/types'

/** Reviewed fixed bytes. Older journeys without a binding retain their prior art. */
export const dieselResource:SceneResource={kind:'background',path:'./art/diesel-reserve-candidate-v1.png',sha256:'4a1bc15a8fdad211335bd89f2856554ac704e1b8122e218e6d133422aa787386',bytes:311036,width:640,height:640}
export const dieselArt={graphic:'original-diesel-reserve-v1',foot:{x:160,y:550},scale:.065,body:{x:-8,y:-8,w:16,h:10}} as const
export const dieselFacts={
 'river-fuel-locker':'river-reserve-used',
 'pine-reserve':'pine-reserve-used',
 'tunnel-reserve':'tunnel-reserve-used',
 'pass-reserve':'pass-reserve-used',
 'bridge-reserve':'bridge-reserve-used',
} as const
export type DieselEntity=keyof typeof dieselFacts
export function isDieselEntity(id:string):id is DieselEntity{return Object.hasOwn(dieselFacts,id)}
export const dieselReleases={
 'river-diesel-v1':{entityId:'river-fuel-locker'},
 'pine-diesel-v1':{entityId:'pine-reserve'},
 'tunnel-diesel-v1':{entityId:'tunnel-reserve'},
 'pass-diesel-v1':{entityId:'pass-reserve'},
 'bridge-diesel-v1':{entityId:'bridge-reserve'},
} as const
export function originalDieselState(save:StorySave,id:DieselEntity){return save.facts[dieselFacts[id]]===true?'empty':'full'}
export function originalDieselSheet(image:string){
 const frame=(column:number)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[dieselArt.foot.x/320,dieselArt.foot.y/640],scale:[dieselArt.scale,dieselArt.scale],x:0,y:1}]]})
 return {id:dieselArt.graphic,image,width:640,height:640,framesWidth:2,framesHeight:1,textures:{full:frame(0),empty:frame(1)}}
}
