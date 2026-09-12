import {actorSheet} from './actor-sheet'
import {originalHeroVersion,type OriginalAssetBindings} from './original-asset-releases'
import {originalHeroRelease} from './original-hero-release'
export function originalHeroSheet(image:string,assets?:OriginalAssetBindings){
 const r=originalHeroRelease(originalHeroVersion(assets))
 return actorSheet('hero',image,r.resource.width,r.resource.height,r.baselines,r.scale,r.centers)
}
