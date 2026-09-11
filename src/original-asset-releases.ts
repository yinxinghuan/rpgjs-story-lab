import type {SceneResource,SceneResourceManifest} from './scene-readiness'
import {assertPublishedBackground,backgroundReleasePath,type PublishedBackground} from './background-publication'
import {assertPublishedDevice,type PublishedDevice} from './device-publication'
import {assertPublishedActor,type PublishedActor} from './actor-publication'

const northCape='train-at-dead-station'
export const ORIGINAL_BACKGROUND_BASELINE='north-cape-baseline-e8e36bba'
export const ORIGINAL_BACKGROUND_PLATFORM='north-cape-platform-8fc11a96'
/** These are reviewed bytes, not a promise that later generations will pass. */
export const originalBackgroundReleases:Record<string,SceneResource&{scene:string;source:'baseline'|'alteru-media';taskId?:string}>={
 [ORIGINAL_BACKGROUND_BASELINE]:{scene:northCape,source:'baseline',kind:'background',path:'./art/original-north-cape.png',sha256:'e8e36bbadda8a8b73cc280431e256ad6583795738a9b62f9efc0a44474d32483',bytes:2566605,width:1024,height:1536},
 [ORIGINAL_BACKGROUND_PLATFORM]:{scene:northCape,source:'alteru-media',taskId:'mt_1a1c4492493eaf68a32331d43d91c207',kind:'background',path:'./art/approved/north-cape-8fc11a96.png',sha256:'8fc11a96c0670c54c090723190ba6b9d8c39f1ebdd27e6649ecc0ba07da9d031',bytes:2811504,width:1024,height:1536},
}
type BackgroundBindings={version:1;backgrounds:Record<string,string>}|{version:2;published:PublishedBackground}
type LegacyBindings=BackgroundBindings|{version:3;background:BackgroundBindings;starter:PublishedDevice}
export type OriginalAssetBindings=LegacyBindings|{version:4;base:LegacyBindings;ada:PublishedActor}
export const originalBaseAssets=(a?:OriginalAssetBindings):LegacyBindings|undefined=>a?.version===4?a.base:a
export const originalActorRelease=(a?:OriginalAssetBindings)=>a?.version===4?a.ada:undefined
export function originalStarterRelease(a?:OriginalAssetBindings){const base=originalBaseAssets(a);return base?.version===3?base.starter:undefined}
export const newOriginalAssetBindings=():OriginalAssetBindings=>({version:1,backgrounds:{[northCape]:ORIGINAL_BACKGROUND_PLATFORM}})
export function assertOriginalAssetBindings(value:unknown):asserts value is OriginalAssetBindings|undefined{
 if(value===undefined)return // Existing saves remain on their legacy background.
 const a=value as OriginalAssetBindings
 if(a?.version===4){if(Object.keys(a).sort().join(',')!=='ada,base,version'||![1,2,3].includes(a.base?.version))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertOriginalAssetBindings(a.base);assertPublishedActor(a.ada);return}
 if(a?.version===3){if(Object.keys(a).sort().join(',')!=='background,starter,version'||![1,2].includes(a.background?.version))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertOriginalAssetBindings(a.background);assertPublishedDevice(a.starter);return}
 if(a?.version===2){if(Object.keys(a).sort().join(',')!=='published,version')throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedBackground(a.published);return}
 if(!a||a.version!==1||Object.keys(a).some(k=>!['version','backgrounds'].includes(k))||!a.backgrounds||Array.isArray(a.backgrounds)||typeof a.backgrounds!=='object'||Object.keys(a.backgrounds).length!==1)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
 for(const [scene,id] of Object.entries(a.backgrounds))if(typeof id!=='string'||!Object.hasOwn(originalBackgroundReleases,id)||originalBackgroundReleases[id].scene!==scene)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
}
export function originalBackgroundVersion(bindings?:OriginalAssetBindings):string{assertOriginalAssetBindings(bindings);if(bindings?.version===4)return originalBackgroundVersion(bindings.base);if(bindings?.version===3)return originalBackgroundVersion(bindings.background);return bindings?.version===2?bindings.published.id:bindings?.backgrounds[northCape]??ORIGINAL_BACKGROUND_BASELINE}
/** Select registered immutable bytes; neither a query nor a response URL can
 * replace the background. Maps and non-admitted categories stay unchanged. */
export function originalBoundSceneResources(base:SceneResourceManifest,bindings?:OriginalAssetBindings):SceneResourceManifest{
 if(bindings?.version===4){assertOriginalAssetBindings(bindings);return originalBoundSceneResources(base,bindings.base)}
 if(bindings?.version===3){assertOriginalAssetBindings(bindings);return originalBoundSceneResources(base,bindings.background)}
 const id=originalBackgroundVersion(bindings),published=bindings?.version===2?bindings.published:undefined
 const release=published?{kind:'background' as const,scene:published.scene,source:'alteru-media',taskId:undefined,path:backgroundReleasePath(published.id)+'/file',sha256:published.sha256,bytes:published.bytes,width:published.width,height:published.height}:originalBackgroundReleases[id]
 const result=structuredClone(base),room=result.scenes[northCape]
 if(!room||room.assets.filter(a=>a.kind==='background').length!==1)throw Error('ORIGINAL_BACKGROUND_SLOT_MISSING')
 const {scene:_,source:__,taskId:___,...asset}=release
 room.assets=room.assets.map(a=>a.kind==='background'?asset:a)
 room.version=room.version+'.'+id
 return result
}
export function originalEnrollmentAssets(options:unknown):OriginalAssetBindings{
 if(options===undefined)return newOriginalAssetBindings()
 if((options as any)?.actor){const o=options as {actor:PublishedActor;starter?:PublishedDevice;background?:PublishedBackground};if(Object.keys(o).some(k=>!['actor','starter','background'].includes(k)))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedActor(o.actor);const base=originalEnrollmentAssets(o.starter?{starter:o.starter,...(o.background?{background:o.background}:{})}:o.background) as LegacyBindings;return {version:4,base,ada:structuredClone(o.actor)}}
 if((options as any)?.starter){const o=options as {starter:PublishedDevice;background?:PublishedBackground};if(Object.keys(o).some(k=>!['starter','background'].includes(k)))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedDevice(o.starter);if(o.background)assertPublishedBackground(o.background);return {version:3,background:o.background?{version:2,published:structuredClone(o.background)}:newOriginalAssetBindings() as BackgroundBindings,starter:structuredClone(o.starter)}}
 assertPublishedBackground(options);return {version:2,published:structuredClone(options)}
}
