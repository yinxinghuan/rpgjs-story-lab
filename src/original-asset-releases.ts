import {GRAYSTONE_BACKGROUND,originalEnvironmentLayouts} from './original-environment-layouts'
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
 [GRAYSTONE_BACKGROUND]:{scene:'train-at-graystone-yard',source:'alteru-media',taskId:'mt_9672d560da014da197c499f1f277185c',kind:'background',path:'./art/approved/graystone-yard-78f22e9b.png',sha256:'78f22e9b4bf42265be03e5db8462ff732b7ed46706f5cea8cf297d0dd3aa2129',bytes:3346737,width:1024,height:1536},
}
type BackgroundBindings={version:1;backgrounds:Record<string,string>}|{version:2;published:PublishedBackground;additional?:Record<string,string>}
type LegacyBindings=BackgroundBindings|{version:3;background:BackgroundBindings;starter:PublishedDevice}
export type OriginalAssetBindings=LegacyBindings|{version:4;base:LegacyBindings;ada:PublishedActor}
export const originalBaseAssets=(a?:OriginalAssetBindings):LegacyBindings|undefined=>a?.version===4?a.base:a
export const originalActorRelease=(a?:OriginalAssetBindings)=>a?.version===4?a.ada:undefined
export function originalStarterRelease(a?:OriginalAssetBindings){const base=originalBaseAssets(a);return base?.version===3?base.starter:undefined}
export const currentOriginalBackgrounds:Readonly<Record<string,string>>={[northCape]:ORIGINAL_BACKGROUND_PLATFORM,'train-at-graystone-yard':GRAYSTONE_BACKGROUND}
export const newOriginalAssetBindings=():OriginalAssetBindings=>({version:1,backgrounds:{...currentOriginalBackgrounds}})
const additionalBackgrounds=()=>Object.fromEntries(Object.entries(currentOriginalBackgrounds).filter(([scene])=>scene!==northCape))
function publishedBackgroundBinding(published:PublishedBackground):BackgroundBindings{const additional=additionalBackgrounds();return {version:2,published:structuredClone(published),...(Object.keys(additional).length?{additional}:{})}}
function assertAdditionalBackgrounds(value:unknown){if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).length>8)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');for(const [scene,id]of Object.entries(value))if(scene===northCape||typeof id!=='string'||!Object.hasOwn(originalBackgroundReleases,id)||originalBackgroundReleases[id].scene!==scene)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')}
export function assertOriginalAssetBindings(value:unknown):asserts value is OriginalAssetBindings|undefined{
 if(value===undefined)return // Existing saves remain on their legacy background.
 const a=value as OriginalAssetBindings
 if(a?.version===4){if(Object.keys(a).sort().join(',')!=='ada,base,version'||![1,2,3].includes(a.base?.version))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertOriginalAssetBindings(a.base);assertPublishedActor(a.ada);return}
 if(a?.version===3){if(Object.keys(a).sort().join(',')!=='background,starter,version'||![1,2].includes(a.background?.version))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertOriginalAssetBindings(a.background);assertPublishedDevice(a.starter);return}
 if(a?.version===2){if(Object.keys(a).sort().join(',')!==(a.additional===undefined?'published,version':'additional,published,version'))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedBackground(a.published);if(a.additional!==undefined)assertAdditionalBackgrounds(a.additional);return}
 if(!a||a.version!==1||Object.keys(a).some(k=>!['version','backgrounds'].includes(k))||!a.backgrounds||Array.isArray(a.backgrounds)||typeof a.backgrounds!=='object'||Object.keys(a.backgrounds).length>9||!Object.hasOwn(a.backgrounds,northCape))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
 for(const [scene,id] of Object.entries(a.backgrounds))if(typeof id!=='string'||!Object.hasOwn(originalBackgroundReleases,id)||originalBackgroundReleases[id].scene!==scene)throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED')
}
export function originalBackgroundVersion(bindings?:OriginalAssetBindings):string{assertOriginalAssetBindings(bindings);if(bindings?.version===4)return originalBackgroundVersion(bindings.base);if(bindings?.version===3)return originalBackgroundVersion(bindings.background);return bindings?.version===2?bindings.published.id:bindings?.backgrounds[northCape]??ORIGINAL_BACKGROUND_BASELINE}
function backgroundOnly(bindings?:OriginalAssetBindings):BackgroundBindings|undefined{
 assertOriginalAssetBindings(bindings)
 const base=originalBaseAssets(bindings);return base?.version===3?base.background:base
}
export function originalSceneBackgroundVersion(bindings:OriginalAssetBindings|undefined,scene:string){const a=backgroundOnly(bindings);return a?.version===1?a.backgrounds[scene]:a?.version===2?(scene===northCape?a.published.id:a.additional?.[scene]):scene===northCape?ORIGINAL_BACKGROUND_BASELINE:undefined}
/** A cache key for all fixed room art, excluding unrelated character/device art. */
export function originalEnvironmentVersion(bindings?:OriginalAssetBindings){
 const a=backgroundOnly(bindings),ids=a?.version===1?a.backgrounds:a?.version===2?{...a.additional,[northCape]:a.published.id}:{[northCape]:ORIGINAL_BACKGROUND_BASELINE}
 return JSON.stringify(Object.entries(ids).sort(([a],[b])=>a.localeCompare(b)))
}
export function originalRendererMapIds(bindings?:OriginalAssetBindings){const ids:Record<string,string>={};for(const [id,layout]of Object.entries(originalEnvironmentLayouts))if(originalSceneBackgroundVersion(bindings,layout.scene)===id)ids[layout.scene]=layout.map.path.slice('./map/'.length,-'.tmx'.length);return ids}
/** Select only registered immutable bytes. Old snapshots without a room binding
 * keep the base room, even after newer journeys adopt its reviewed environment. */
export function originalBoundSceneResources(base:SceneResourceManifest,bindings?:OriginalAssetBindings):SceneResourceManifest{
 const a=backgroundOnly(bindings),published=a?.version===2?a.published:undefined
 const ids=a?.version===1?a.backgrounds:a?.version===2?{...a.additional,[northCape]:a.published.id}:{[northCape]:ORIGINAL_BACKGROUND_BASELINE}
 const result=structuredClone(base)
 for(const [scene,id] of Object.entries(ids)){
  const release=scene===northCape&&published?{kind:'background' as const,scene:published.scene,source:'alteru-media',taskId:undefined,path:backgroundReleasePath(published.id)+'/file',sha256:published.sha256,bytes:published.bytes,width:published.width,height:published.height}:originalBackgroundReleases[id]
  const room=result.scenes[scene]
  if(!room||room.assets.filter(a=>a.kind==='background').length!==1)throw Error('ORIGINAL_BACKGROUND_SLOT_MISSING')
  const {scene:_,source:__,taskId:___,...asset}=release
  const layout=originalEnvironmentLayouts[id];if(layout&&layout.scene!==scene)throw Error('ORIGINAL_ENVIRONMENT_LAYOUT_MISMATCH');if(layout&&room.assets.filter(a=>a.kind==='map').length!==1)throw Error('ORIGINAL_ENVIRONMENT_MAP_SLOT_MISSING')
  room.assets=room.assets.map(a=>a.kind==='background'?asset:a.kind==='map'&&layout?layout.map:a);room.version=room.version+'.'+id
 }
 return result
}
export function originalEnrollmentAssets(options:unknown):OriginalAssetBindings{
 if(options===undefined)return newOriginalAssetBindings()
 if((options as any)?.actor){const o=options as {actor:PublishedActor;starter?:PublishedDevice;background?:PublishedBackground};if(Object.keys(o).some(k=>!['actor','starter','background'].includes(k)))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedActor(o.actor);const base=originalEnrollmentAssets(o.starter?{starter:o.starter,...(o.background?{background:o.background}:{})}:o.background) as LegacyBindings;return {version:4,base,ada:structuredClone(o.actor)}}
 if((options as any)?.starter){const o=options as {starter:PublishedDevice;background?:PublishedBackground};if(Object.keys(o).some(k=>!['starter','background'].includes(k)))throw Error('ORIGINAL_ASSET_VERSION_UNSUPPORTED');assertPublishedDevice(o.starter);if(o.background)assertPublishedBackground(o.background);return {version:3,background:o.background?publishedBackgroundBinding(o.background):newOriginalAssetBindings() as BackgroundBindings,starter:structuredClone(o.starter)}}
 assertPublishedBackground(options);return publishedBackgroundBinding(options)
}
