import {originalHeroRelease} from './original-hero-release'
import {originalHeroVersion,originalPublishedHero,type OriginalAssetBindings} from './original-asset-releases'
import {heroReleasePath} from './actor-publication'
/** Role-specific immutable selection; a custom sheet cannot inherit baseline appearance. */
export function originalBoundHero(assets?:OriginalAssetBindings){
 const r=originalPublishedHero(assets)
 if(!r)return {...originalHeroRelease(originalHeroVersion(assets)),appearanceStatus:'reviewed' as const}
 return {id:r.id,resource:{kind:'background' as const,path:heroReleasePath(r.id)+'/file',sha256:r.sha256,bytes:r.bytes,width:r.width,height:r.height},scale:r.review.scale,centers:Array.from({length:4},()=>[r.foot.x,r.foot.x,r.foot.x]),baselines:Array.from({length:4},()=>[r.foot.y,r.foot.y,r.foot.y]),appearance:{},appearanceStatus:'not-described' as const}
}
