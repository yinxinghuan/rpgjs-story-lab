import {originalSceneBackgroundVersion,originalBackgroundReleases,ORIGINAL_BACKGROUND_PLATFORM,type OriginalAssetBindings} from './original-asset-releases'
import {TUNNEL_BACKGROUND} from './original-environment-layouts'

/** Eligibility to request an optional candidate, not approval of its output.
 * Reviewed samples: original-journal-exposure-03 and journal-tunnel-v3.
 * Pin the actual reference bytes; a new background version needs new review. */
const references:Readonly<Record<string,{scene:string;sha256:string}>>={
 [ORIGINAL_BACKGROUND_PLATFORM]:{scene:'train-at-dead-station',sha256:'8fc11a96c0670c54c090723190ba6b9d8c39f1ebdd27e6649ecc0ba07da9d031'},
 [TUNNEL_BACKGROUND]:{scene:'train-at-tunnel',sha256:'b084000a30fbfb913c7e480cf5fa01cff3bf81370251fadfc927d4a1b750001c'},
}
export function originalIllustrationEligible(assets:OriginalAssetBindings|undefined,scene:string):boolean{
 const id=originalSceneBackgroundVersion(assets,scene),approved=id?references[id]:undefined
 return Boolean(approved&&approved.scene===scene&&originalBackgroundReleases[id!]?.sha256===approved.sha256)
}
