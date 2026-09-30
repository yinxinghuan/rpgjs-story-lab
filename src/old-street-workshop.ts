import {assertOldStreetHead,type OldStreetHead} from './old-street-head'
import {oldStreetBody} from './old-street-space'
export const workshopGeometry={version:1,world:{w:384,h:576},floor:{x:88,y:112,w:208,h:320},spawn:{x:184,y:384},
 entities:[{id:'old-sign',position:{x:144,y:180},approach:{x:144,y:224},body:{x:128,y:152,w:40,h:40}},
 {id:'repair-work-order',position:{x:248,y:260},approach:{x:248,y:304},body:{x:228,y:236,w:48,h:40}},
 {id:'workshop-exit',position:{x:192,y:424},approach:{x:184,y:384}}]}
// Release gate compares this portable copy with the server geometry, byte for
// byte after canonicalization. A different layout needs a new contract version.
type Point={x:number;y:number}
export type WorkshopEntity={id:string;scene:string;position:Point;approach:Point;action:string;label:string;available:boolean;completed:boolean}
export type OldStreetPresentationHead=OldStreetHead&{restoration?:{
 contract:'oldstreet-workshop-1';runtimeVersion:string;native:{sceneId:string;position:Point};canPropose:boolean;
 room:null|{id:string;label:string;detail:string;lore:string;geometryVersion:1;entryPosition:Point;completed:number};
 entities:WorkshopEntity[];notes:{id:string;text:string}[];
}}
export function workshopWalkable(p:Point){
 const f=workshopGeometry.floor,b=oldStreetBody
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<f.x||p.y<f.y||p.x+b.w>f.x+f.w||p.y+b.h>f.y+f.h)return false
 return workshopGeometry.entities.every(e=>!e.body||!(p.x<e.body.x+e.body.w&&p.x+b.w>e.body.x&&p.y<e.body.y+e.body.h&&p.y+b.h>e.body.y))
}
export function inWorkshop(h:OldStreetPresentationHead|undefined,scene=h?.sceneId){return !!h?.restoration?.room&&h.restoration.room.id===scene}
export function checkpointPresentation(h:OldStreetPresentationHead,p:Point):OldStreetPresentationHead{
 const next={...h,position:{...p}}
 if(h.restoration&&!inWorkshop(h))next.restoration={...h.restoration,native:{...h.restoration.native,position:{...p}}}
 assertOldStreetPresentationHead(next);return next
}
export function workshopTmx(){
 const f=workshopGeometry.floor,w=workshopGeometry.world
 const bodies=[{x:0,y:0,w:w.w,h:f.y},{x:0,y:f.y+f.h,w:w.w,h:w.h-f.y-f.h},{x:0,y:f.y,w:f.x,h:f.h},{x:f.x+f.w,y:f.y,w:w.w-f.x-f.w,h:f.h},...workshopGeometry.entities.flatMap(e=>e.body?[e.body]:[])]
 const objects=bodies.map((b,i)=>`<object id="${i+1}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`).join('')
 return `<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`
}
export function assertOldStreetPresentationHead(value:unknown):asserts value is OldStreetPresentationHead{
 const h=value as OldStreetPresentationHead,r=h?.restoration
 if(r===undefined){assertOldStreetHead(value);return}
 const fail=()=>{throw Error('OLD_STREET_PRESENTATION_INVALID')}
 const point=(p:Point)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)
 const id=(s:string)=>typeof s==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(s)
 const text=(s:string)=>typeof s==='string'&&s.length>0&&s.length<=2000
 if(!r||r.contract!=='oldstreet-workshop-1'||!/^[a-f0-9]{64}$/.test(r.runtimeVersion)||typeof r.canPropose!=='boolean'||!r.native||!point(r.native.position)||!Array.isArray(r.entities)||!Array.isArray(r.notes)||r.notes.length>2)fail()
 assertOldStreetHead({...h,sceneId:r.native.sceneId,position:r.native.position})
 const inside=inWorkshop(h)
 if(inside){if(r.native.sceneId!=='shop'||!workshopWalkable(h.position)||r.canPropose)fail()}
 else if(h.sceneId!==r.native.sceneId||h.position.x!==r.native.position.x||h.position.y!==r.native.position.y)fail()
 const room=r.room
 if(room){
  if(!id(room.id)||!room.id.startsWith('slot-')||!text(room.label)||typeof room.detail!=='string'||room.detail.length>2000||typeof room.lore!=='string'||room.lore.length>2000||room.geometryVersion!==1||!point(room.entryPosition)||!Number.isInteger(room.completed)||room.completed<0||room.completed>2||r.canPropose)fail()
  const expected=inside?workshopGeometry.entities.map(e=>e.id):h.sceneId==='shop'?['workshop-entry']:[]
  if(r.entities.map(e=>e.id).join(',')!==expected.join(','))fail()
  for(const [i,e] of r.entities.entries()){
   if(!e||!id(e.action)||e.scene!==h.sceneId||!text(e.label)||typeof e.available!=='boolean'||typeof e.completed!=='boolean'||!point(e.position)||!point(e.approach))fail()
   const target=inside?workshopGeometry.entities[i]:{position:room.entryPosition,approach:room.entryPosition}
   if(e.position.x!==target.position.x||e.position.y!==target.position.y||e.approach.x!==target.approach.x||e.approach.y!==target.approach.y)fail()
  }
 }else if(r.entities.length||r.notes.length||h.sceneId!==r.native.sceneId)fail()
 if(r.notes.some(n=>!n||!id(n.id)||!text(n.text))||new Set(r.notes.map(n=>n.id)).size!==r.notes.length)fail()
}
