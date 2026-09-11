import type {SceneResource,SceneResourceManifest} from './scene-readiness'

const northCape='train-at-dead-station'
export const ORIGINAL_BACKGROUND_BASELINE='north-cape-baseline-e8e36bba'
export const ORIGINAL_BACKGROUND_PLATFORM='north-cape-platform-8fc11a96'
/** These are reviewed bytes, not a promise that later generations will pass. */
export const originalBackgroundReleases:Record<string,SceneResource&{scene:string;source:'baseline'|'alteru-media';taskId?:string}>={
 [ORIGINAL_BACKGROUND_BASELINE]:{scene:northCape,source:'baseline',kind:'background',path:'./art/original-north-cape.png',sha256:'e8e36bbadda8a8b73cc280431e256ad6583795738a9b62f9efc0a44474d32483',bytes:2566605,width:1024,height:1536},
 [ORIGINAL_BACKGROUND_PLATFORM]:{scene:northCape,source:'alteru-media',taskId:'mt_1a1c4492493eaf68a32331d43d91c207',kind:'background',path:'./art/approved/north-cape-8fc11a96.png',sha256:'8fc11a96c0670c54c090723190ba6b9d8c39f1ebdd27e6649ecc0ba07da9d031',bytes:2811504,width:1024,height:1536},
}
export type OriginalAssetBindings={version:1;backgrounds:Record<string,string>}
export const newOriginalAssetBindings=():OriginalAssetBindings=>({version:1,backgrounds:{[northCape]:ORIGINAL_BACKGROUND_PLATFORM}})
export function assertOriginalAssetBindings(value:unknown):asserts value is OriginalAssetBindings|undefined{
 if(value===undefined)return // Existing saves remain on their legacy background.
 const a=value as OriginalAssetBindings
 if(!a||a.version!==1||Object.keys(a).some(k=>!['version','backgrounds'].includes(k))||!a.backgrounds||Array.isArray(a.backgrounds)||typeof a.backgrounds!=='object'||Object.keys(a.backgrounds).length!==1)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
 for(const [scene,id] of Object.entries(a.backgrounds))if(typeof id!=='string'||!Object.hasOwn(originalBackgroundReleases,id)||originalBackgroundReleases[id].scene!==scene)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
}
export function originalBackgroundVersion(bindings?:OriginalAssetBindings){assertOriginalAssetBindings(bindings);return bindings?.backgrounds[northCape]??ORIGINAL_BACKGROUND_BASELINE}
/** Select registered immutable bytes; neither a query nor a response URL can
 * replace the background. Maps and non-admitted categories stay unchanged. */
export function originalBoundSceneResources(base:SceneResourceManifest,bindings?:OriginalAssetBindings):SceneResourceManifest{
 const id=originalBackgroundVersion(bindings),release=originalBackgroundReleases[id]
 const result=structuredClone(base),room=result.scenes[northCape]
 if(!room||room.assets.filter(a=>a.kind==='background').length!==1)throw Error('ORIGINAL_BACKGROUND_SLOT_MISSING')
 const {scene:_,source:__,taskId:___,...asset}=release
 room.assets=room.assets.map(a=>a.kind==='background'?asset:a)
 room.version=room.version+'.'+id
 return result
}
