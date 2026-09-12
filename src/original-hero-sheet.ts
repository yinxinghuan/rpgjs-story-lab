import {actorSheet} from './actor-sheet'
import type {OriginalAssetBindings} from './original-asset-releases'
import {originalBoundHero} from './original-bound-hero'
export function originalHeroSheet(image:string,assets?:OriginalAssetBindings){
 const r=originalBoundHero(assets)
 return actorSheet('hero',image,r.resource.width,r.resource.height,r.baselines,r.scale,r.centers)
}
