import type {SceneResource} from './scene-readiness'
import type {StorySave} from './vendor/original-train/types'
export const fixedEquipmentReleases={
 'tunnel-fan-parts-v1':{entityId:'tunnel-fan',scene:'train-at-tunnel',body:{x:-13,y:-12,w:26,h:15},
  housing:{kind:'background',path:'./art/fan-housing-v1.png',sha256:'b21bbe6f95f3fa982c980a975a1133c2fcf904c96cb3c5e15820dca3fb4f107b',bytes:74600,width:320,height:640} satisfies SceneResource,
  rotor:{kind:'background',path:'./art/fan-rotor-v1.png',sha256:'8e07f4c8a840678f11e9c44f253d7584c4a12563b67113299e42ace1e6867c3f',bytes:36046,width:320,height:640} satisfies SceneResource,
 },
} as const
export type FixedEquipmentBindings=Partial<Record<'tunnel-fan',keyof typeof fixedEquipmentReleases>>
export const fanArt=fixedEquipmentReleases['tunnel-fan-parts-v1']
export const originalFanState=(save:StorySave)=>save.facts['tunnel-cargo-policy']==='retained'?'running':'stopped'
export const fanRotorScale=.046
export const fanRotationPose=(elapsedMs:number)=>'spin-'+Math.floor(((Math.max(0,elapsedMs)%1200)/1200)*36)
/** Two immutable source parts. The housing never changes between states. */
export function originalFanSheets(housing:string,rotor:string){
 const frame=(rotation:number)=>({time:0,frameX:0,frameY:0,anchor:[.5,.5],scale:[fanRotorScale,fanRotorScale],x:0,y:1+(353-486)*.11,rotation})
 return [{id:'original-fan-housing-v1',image:housing,width:320,height:640,framesWidth:1,framesHeight:1,textures:{stand:{animations:()=>[[{time:0,frameX:0,frameY:0,anchor:[.5,544/640],scale:[.11,.11],x:0,y:1}]]}}},
  {id:'original-fan-rotor-v1',image:rotor,width:320,height:640,framesWidth:1,framesHeight:1,textures:{stopped:{animations:()=>[[frame(0)]]},...Object.fromEntries(Array.from({length:36},(_,i)=>['spin-'+i,{animations:()=>[[frame(i*Math.PI*2/36)]]}]))}}]
}
