import type {SpriteDraft,SpritePng} from './sprite-draft'
import {verifySpritePng,verifySpriteComposition} from './sprite-draft'
import type {PixelRaster} from './sprite-preparation'
import {originalTrainRoom} from './original-train-spatial-plan'
import {deviceGeometry,sameDeviceGeometry,assertPublishedDevice,type PublishedDevice} from './device-publication'
export const DEVICE_STATES=['closed','open','empty'] as const
export const REPAIR_STATES=['broken','repaired'] as const
export type DeviceState=typeof DEVICE_STATES[number]|typeof REPAIR_STATES[number]
export type DevicePreview={id:string;states:readonly DeviceState[];png:SpritePng;cellWidth:number;cellHeight:number;foot:{x:number;y:number};scale:number;bounds:Array<[number,number,number,number]>;footprint:{width:number;depth:number;front:number}}
const invalid=()=>{throw Error('DEVICE_MAP_CANDIDATE_INVALID')}
/** Read-only admission. State slots have declared meanings; semantic/visual
 * review still has to establish that the supplied frames depict those states. */
export async function inspectDeviceMapCandidate(draft:SpriteDraft,id:string,decode:(png:SpritePng)=>Promise<PixelRaster>):Promise<DevicePreview>{
 if(draft.deviceStateSet!==undefined&&draft.deviceStateSet!=='repair')return invalid()
 const s=draft.spec,r=draft.result,states=draft.deviceStateSet==='repair'?REPAIR_STATES:DEVICE_STATES,columns=states.length
 if(draft.version!=='sprite-draft-1'||draft.id!==id||draft.state!=='candidate'||!s||!r||s.kind!=='states'||s.columns!==columns||s.rows!==1||r.algorithm!=='neutral-matte-unmix-1')return invalid()
 if(!Number.isInteger(s.cellWidth)||!Number.isInteger(s.cellHeight)||s.cellWidth<8||s.cellHeight<8||r.png.width!==s.cellWidth*columns||r.png.height!==s.cellHeight||r.frames.length!==columns||s.sourceAnchors?.length!==columns)return invalid()
 if(!Number.isInteger(s.foot.x)||!Number.isInteger(s.foot.y)||s.foot.x<1||s.foot.x>=s.cellWidth-1||s.foot.y<4||s.foot.y>=s.cellHeight)return invalid()
 await verifySpritePng(draft.source);await verifySpriteComposition(draft,decode);await verifySpritePng(r.png)
 for(let col=0;col<columns;col++){const f=r.frames[col],a=s.sourceAnchors[col];if(f.column!==col||f.row!==0||f.sourceAnchor.x!==a.x||f.sourceAnchor.y!==a.y||f.sourceAnchor.x+f.offset.x!==s.foot.x||f.sourceAnchor.y+f.offset.y!==s.foot.y)return invalid()}
 return inspectDeviceImage(r.png,s,states,decode,'creator-device-'+id)
}
export async function inspectDeviceImage(png:SpritePng,s:{cellWidth:number;cellHeight:number;foot:{x:number;y:number}},states:readonly DeviceState[],decode:(png:SpritePng)=>Promise<PixelRaster>,id:string):Promise<DevicePreview>{
 await verifySpritePng(png);const p=await decode(png),columns=states.length
 if(p.width!==png.width||p.height!==png.height||p.rgba.length!==p.width*p.height*4||p.width!==s.cellWidth*columns||p.height!==s.cellHeight)return invalid()
 const bounds:DevicePreview['bounds']=[]
 for(let col=0;col<columns;col++){
  let left=s.cellWidth,top=s.cellHeight,right=0,bottom=0,clear=0,solid=0,contact=0
  for(let y=0;y<s.cellHeight;y++)for(let x=0;x<s.cellWidth;x++){
   const alpha=p.rgba[(y*p.width+col*s.cellWidth+x)*4+3]
   if(alpha===0)clear++
   if(alpha>200){solid++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);if(Math.abs(x-s.foot.x)<=Math.max(2,s.cellWidth*.06)&&y>=s.foot.y-3&&y<=s.foot.y)contact++}
   if((x===0||y===0||x===s.cellWidth-1||y===s.cellHeight-1)&&alpha!==0)return invalid()
  }
  if(!solid||!contact||clear<s.cellWidth*s.cellHeight*.2||s.foot.y-top<4)return invalid()
  bounds.push([left,top,right,bottom])
 }
 if(states===REPAIR_STATES||states.join(',')==='broken,repaired')return {id,states,png,...deviceGeometry(s.cellWidth,s.cellHeight,s.foot,bounds)}
 const height=s.foot.y-bounds[0][1],scale=50/height
 if(bounds.some(b=>s.foot.y-b[1]<height*.75||s.foot.y-b[1]>height*1.25)||!Number.isFinite(scale))return invalid()
 // Reserve the whole door swing across all states. State changes never trap a
 // player by introducing a new solid cell beneath their feet.
 const extent=Math.max(...bounds.flatMap(b=>[s.foot.x-b[0],b[2]-s.foot.x]))*scale
 const front=Math.ceil(Math.max(0,...bounds.map(b=>b[3]-s.foot.y))*scale)
 const footprint={width:Math.ceil(extent*2),depth:12+front,front}
 if(footprint.width<8||footprint.width>64||footprint.depth>40)return invalid()
 return {id,states,png,cellWidth:s.cellWidth,cellHeight:s.cellHeight,foot:{...s.foot},scale,bounds,footprint}
}
export function deviceCandidateSheet(c:DevicePreview,image:string){
 const texture=(column:number)=>({animations:()=>[[{frameX:column,frameY:0,time:0,anchor:[c.foot.x/c.cellWidth,c.foot.y/c.cellHeight],scale:[c.scale,c.scale],x:0,y:1}]]})
 return {id:c.id,image,width:c.png.width,height:c.png.height,framesWidth:c.states.length,framesHeight:1,textures:{stand:texture(0),...Object.fromEntries(c.states.map((s,i)=>[s,texture(i)]))}}
}
export async function verifyPublishedDevicePixels(release:PublishedDevice,png:SpritePng,decode:(png:SpritePng)=>Promise<PixelRaster>){
 assertPublishedDevice(release)
 if(png.sha256!==release.sha256||png.bytes.length!==release.bytes||png.width!==release.width||png.height!==release.height)return invalid()
 const c=await inspectDeviceImage(png,release.review.geometry,REPAIR_STATES,decode,'published-device')
 if(!sameDeviceGeometry(c,release.review.geometry))throw Error('DEVICE_GEOMETRY_MISMATCH')
 return c
}
export function deviceCandidatePlacement(scene:string,c?:Pick<DevicePreview,'states'>){if(scene===originalTrainRoom('river-valley'))return {x:280,y:420};if(scene===originalTrainRoom('dead-station'))return {x:110,y:c?.states[0]==='broken'?160:235};throw Error('DEVICE_MAP_SCENE_UNAVAILABLE')}
export function deviceCandidateBlocks(c:DevicePreview,scene:string,p:{x:number;y:number}){
 const a=deviceCandidatePlacement(scene,c),left=a.x-c.footprint.width/2,top=a.y-c.footprint.depth+c.footprint.front
 return p.x+9>left&&p.x<left+c.footprint.width&&p.y+15>top&&p.y<a.y+c.footprint.front
}
