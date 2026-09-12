import type {SceneResource} from './scene-readiness'
/** Immutable first-production B protagonist. New art needs a new ID; changing
 * a renderer default must never change what an existing journey loads. */
export const ORIGINAL_HERO_V2='yellow-traveler-b-gait-v2'
export function originalHeroRelease(id:string=ORIGINAL_HERO_V2){
 if(id!==ORIGINAL_HERO_V2)throw Error('ORIGINAL_HERO_VERSION_UNSUPPORTED')
 return {
  id:ORIGINAL_HERO_V2,
  resource:{kind:'background',path:'./art/overhead/hero-gait-v2.png',sha256:'7e70f17d07eb2384e253635fd32be641c5986b260828ac0167659b61b9db3842',bytes:460181,width:1086,height:1448} as SceneResource & {width:number;height:number},
  scale:.14,centers:Array.from({length:4},()=>[181,181,181]),baselines:Array.from({length:4},()=>[330,330,330]),
  appearance:{hair:'short dark-brown hair',outerwear:'mustard-yellow hooded jacket',trousers:'dark teal trousers',footwear:'brown boots',attachment:'brown cross-body satchel'},
 }
}
