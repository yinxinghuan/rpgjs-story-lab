import type {Transport} from './recoverable-session-client'
import {CreatorCloudDrafts} from './creator-cloud'
import {SpriteCloudArchive} from './sprite-cloud'
import {LayeredCloudArchive} from './layered-cloud'
import {backgroundReleaseId,backgroundReleasePath} from './background-publication'
import {actorReleasePath} from './actor-publication'
import {deviceReleasePath} from './device-publication'
import {layerReleasePath} from './layered-archive-contract'
export const ASSEMBLY_SLOTS=['background','actor','device','fan']as const
export type AssemblySlot=typeof ASSEMBLY_SLOTS[number]
export type AssemblySelection=Record<AssemblySlot,string>
export type AssemblyOption={id:string;name:string;createdAt:number;preview:string}
export type AssemblyCatalog=Record<AssemblySlot,AssemblyOption[]>
export const emptyAssembly=():AssemblySelection=>({background:'',actor:'',device:'',fan:''})
export function readAssembly(value:string|null):AssemblySelection{
 if(!value)return emptyAssembly();const r=JSON.parse(value)
 if(!r||Object.keys(r).sort().join(',')!=='actor,background,device,fan'||ASSEMBLY_SLOTS.some(s=>typeof r[s]!=='string'||r[s]&&!backgroundReleaseId(r[s])))throw Error('ASSEMBLY_SELECTION_INVALID')
 return r
}
/** Read only this creator's archives and immutable publication metadata. A
 * failed category rejects the refresh; it never silently becomes a default. */
export async function loadAssemblyCatalog(api:Transport):Promise<AssemblyCatalog>{
 const backgrounds=new CreatorCloudDrafts(api),sprites=new SpriteCloudArchive(api),layers=new LayeredCloudArchive(api)
 const [b,s,l]=await Promise.all([backgrounds.list(),sprites.list(),layers.list()])
 const out:AssemblyCatalog={background:[],actor:[],device:[],fan:[]}
 await Promise.all([
  ...b.map(async d=>{const r=await backgrounds.publication(d.id);if(r)out.background.push({id:r.id,name:d.lighting,createdAt:d.createdAt,preview:backgroundReleasePath(r.id)+'/file'})}),
  ...s.filter(d=>d.state==='ready').map(async d=>{const [a,e]=await Promise.all([sprites.actorPublication(d.manifest.id),sprites.publication(d.manifest.id)]);if(a)out.actor.push({id:a.id,name:d.manifest.draft.sourceName,createdAt:d.createdAt,preview:actorReleasePath(a.id)+'/file'});if(e)out.device.push({id:e.id,name:d.manifest.draft.sourceName,createdAt:d.createdAt,preview:deviceReleasePath(e.id)+'/file'})}),
  ...l.filter(d=>d.state==='ready').map(async d=>{const r=await layers.publication(d.manifest.id);if(r)out.fan.push({id:r.id,name:d.manifest.sourceName,createdAt:d.createdAt,preview:layerReleasePath(r.id)+'/housing'})}),
 ])
 for(const slot of ASSEMBLY_SLOTS){out[slot].sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id));if(new Set(out[slot].map(r=>r.id)).size!==out[slot].length)throw Error('ASSEMBLY_CATALOG_INVALID')}
 return out
}
export function assemblyJourneyHref(selection:AssemblySelection,catalog:AssemblyCatalog){
 readAssembly(JSON.stringify(selection));const q=new URLSearchParams({story:'original'})
 for(const slot of ASSEMBLY_SLOTS)if(selection[slot]){if(!catalog[slot].some(r=>r.id===selection[slot]))throw Error('ASSEMBLY_RELEASE_UNAVAILABLE');q.set(slot+'_release',selection[slot])}
 return './?'+q.toString()
}
