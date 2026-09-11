import {getGameApiBase} from './game-id'
import {backgroundReleaseId} from './background-publication'
export const DEVICE_CHECKS=['broken','repaired','front','back','collision'] as const
export const DEVICE_LAYOUT='starter-slot-1'
export type DeviceGeometry={cellWidth:number;cellHeight:number;foot:{x:number;y:number};bounds:Array<[number,number,number,number]>;scale:number;footprint:{width:number;depth:number;front:number}}
export type DeviceReview={sha256:string;layout:typeof DEVICE_LAYOUT;geometry:DeviceGeometry;checks:string[];visualAccepted:true}
export type PublishedDevice={version:1;id:string;slot:'starter';sha256:string;bytes:number;width:number;height:number;review:DeviceReview}
export const deviceReleaseId=backgroundReleaseId
const invalid=()=>{throw Error('DEVICE_RELEASE_INVALID')}
const integer=(n:unknown,a:number,b:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=a&&n<=b
export function deviceGeometry(cellWidth:number,cellHeight:number,foot:DeviceGeometry['foot'],bounds:DeviceGeometry['bounds']):DeviceGeometry{
 if(!integer(cellWidth,8,768)||!integer(cellHeight,8,1536)||cellWidth*2*cellHeight>1572864||!foot||Object.keys(foot).sort().join(',')!=='x,y'||!integer(foot.x,1,cellWidth-2)||!integer(foot.y,4,cellHeight-1)||!Array.isArray(bounds)||bounds.length!==2)return invalid()
 for(const b of bounds)if(!Array.isArray(b)||b.length!==4||!integer(b[0],1,cellWidth-2)||!integer(b[1],1,foot.y-4)||!integer(b[2],b[0]+1,cellWidth-1)||!integer(b[3],foot.y,cellHeight-1))return invalid()
 const height=foot.y-bounds[0][1],scale=40/height
 if(bounds.some(b=>foot.y-b[1]<height*.75||foot.y-b[1]>height*1.25))return invalid()
 const front=Math.ceil(Math.max(0,...bounds.map(b=>b[3]-foot.y))*scale)
 const width=Math.ceil(Math.max(...bounds.flatMap(b=>[foot.x-b[0],b[2]-foot.x]))*scale*2)
 if(width<8||width>48||front>12)return invalid()
 return {cellWidth,cellHeight,foot:{...foot},bounds:structuredClone(bounds),scale,footprint:{width,depth:12+front,front}}
}
export function sameDeviceGeometry(a:DeviceGeometry,b:DeviceGeometry){return a.cellWidth===b.cellWidth&&a.cellHeight===b.cellHeight&&a.foot.x===b.foot.x&&a.foot.y===b.foot.y&&a.scale===b.scale&&a.footprint.width===b.footprint.width&&a.footprint.depth===b.footprint.depth&&a.footprint.front===b.footprint.front&&JSON.stringify(a.bounds)===JSON.stringify(b.bounds)}
export function assertDeviceReview(r:any,sha:string):asserts r is DeviceReview{
 if(!r||Object.keys(r).sort().join(',')!=='checks,geometry,layout,sha256,visualAccepted'||r.sha256!==sha||r.layout!==DEVICE_LAYOUT||r.visualAccepted!==true||!Array.isArray(r.checks)||r.checks.length!==DEVICE_CHECKS.length||DEVICE_CHECKS.some(c=>!r.checks.includes(c)))throw Error('DEVICE_REVIEW_REQUIRED')
 const g=r.geometry;if(!g||Object.keys(g).sort().join(',')!=='bounds,cellHeight,cellWidth,foot,footprint,scale'||!g.footprint||Object.keys(g.footprint).sort().join(',')!=='depth,front,width')return invalid()
 if(!sameDeviceGeometry(g,deviceGeometry(g.cellWidth,g.cellHeight,g.foot,g.bounds)))return invalid()
}
export function assertPublishedDevice(v:any):asserts v is PublishedDevice{
 if(!v||Object.keys(v).sort().join(',')!=='bytes,height,id,review,sha256,slot,version,width'||v.version!==1||!deviceReleaseId(v.id)||v.slot!=='starter'||!/^[a-f0-9]{64}$/.test(v.sha256)||!integer(v.bytes,45,8*1024*1024))return invalid()
 assertDeviceReview(v.review,v.sha256);if(v.width!==v.review.geometry.cellWidth*2||v.height!==v.review.geometry.cellHeight)return invalid()
}
export function deviceReleasePath(id:string){if(!deviceReleaseId(id))return invalid();return getGameApiBase()+'/api/creator/device-releases/'+id}
