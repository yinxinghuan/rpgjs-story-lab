import {scenes,sceneIds,seatSource,type SceneId,type Rect} from './scene-layout'
import {propsArt,extraArt} from './art-catalog'
import {states} from './contract'
import {visualStates} from './visual-states'
import type {StorySave} from './story'
export type WorldObject={id:string;rect:Rect;atlas:'props'|'extra'|'seat';states:string[];depth:number;fit:'contain'|'stretch';furniture?:boolean;parent?:string}
const item=(id:string,rect:Rect,atlas:WorldObject['atlas'],states:string[],depth=rect.y+rect.h):WorldObject=>({id,rect,atlas,states,depth,fit:atlas==='props'?'contain':'stretch'})
export const worldObjects:Record<SceneId,WorldObject[]>={
 carriage:[item('cabinet',{x:138,y:80,w:40,h:50},'props',['closed','open','empty']),item('panel',{x:206,y:100,w:30,h:26},'props',['broken','repaired']),item('exit',{x:173,y:28,w:38,h:52},'props',['locked','doorOpen'])],
 baggage:[item('supply',{x:138,y:108,w:40,h:50},'props',['closed','empty']),{...item('supply-battery',{x:157,y:132,w:9,h:8},'extra',['battery'],159),parent:'supply'},item('record',{x:216,y:196,w:16,h:24},'extra',['record']),item('forward',{x:173,y:28,w:38,h:52},'props',['doorOpen']),item('back',{x:173,y:492,w:38,h:43},'props',['doorOpen'])],
 cab:[item('radio',{x:164,y:184,w:56,h:52},'extra',['unpowered','powered','connected']),item('cabBack',{x:173,y:494,w:38,h:43},'props',['doorOpen'])],
}
for(const scene of sceneIds)worldObjects[scene].push(...scenes[scene].furniture.map(f=>({...item(f.id,f,f.art==='seat'?'seat':'extra',[f.art]),furniture:true})))
export const objectId=(scene:SceneId,id:string)=>'art-'+scene+'-'+id
export function objectAtlas(object:WorldObject,variant:'balanced'|'baseline'){
 if(object.atlas==='props')return propsArt[variant]
 if(object.atlas==='extra')return extraArt
 return {path:'./art/seat.png',width:seatSource.imageWidth,height:seatSource.imageHeight,crops:{seat:[seatSource.x,seatSource.y,seatSource.w,seatSource.h]} as Record<string,number[]>}
}
export function objectFrame(object:WorldObject,crop:number[]){const [x,y,w,h]=crop,r=object.rect,scale=Math.min(r.w/w,r.h/h),width=object.fit==='contain'?w*scale:r.w,height=object.fit==='contain'?h*scale:r.h
 // Keep the admitted SVG placement when moving art into the engine's depth layer.
 return {crop:{x,y,w,h},rect:{x:r.x+(r.w-width)/2,y:r.y+(r.h-height)/2,w:width,h:height},anchor:[.5,1],scale:[width/w,height/h],x:r.x+r.w/2-Math.round(r.x+r.w/2),y:r.y+(r.h+height)/2-object.depth+1}
}
export function objectSheets(variant:'balanced'|'baseline'){
 return sceneIds.flatMap(scene=>worldObjects[scene].map(object=>{const atlas=objectAtlas(object,variant),texture=(state:string,visible=true)=>{const f=objectFrame(object,atlas.crops[state]);return {rectWidth:f.crop.w,rectHeight:f.crop.h,offset:{x:f.crop.x,y:f.crop.y},animations:()=>[[{time:0,frameX:0,frameY:0,anchor:f.anchor,scale:f.scale,x:f.x,y:f.y,opacity:visible?1:0}]]}}
 return {id:objectId(scene,object.id),image:atlas.path,width:atlas.width,height:atlas.height,framesWidth:1,framesHeight:1,textures:Object.fromEntries(['stand','hidden',...object.states].map(state=>[state,texture(state==='stand'||state==='hidden'?object.states[0]:state,state!=='hidden')]))}
 }))
}
export type ObjectProjection={id:string;state:string;visible:boolean;tint:string}
export const objectAnimation=(projection:ObjectProjection)=>projection.visible?projection.state:'hidden'
export function projectWorldObjects(scene:SceneId,save:StorySave):ObjectProjection[]{const vs=states(save),emergency=scene==='carriage'&&save.facts.power_radio
 return worldObjects[scene].map(object=>{const state=object.id==='supply-battery'?'battery':object.furniture?object.states[0]:visualStates[object.id as keyof typeof visualStates]?.[vs[object.id as keyof typeof vs]]??object.states[0]
 return {id:objectId(scene,object.id),state,visible:object.id!=='supply-battery'||Boolean(save.facts.supply_open&&!save.facts.battery_taken),tint:emergency?'#b8b8b8':object.furniture?'#d9d9d9':save.facts.repaired?'#ffffff':'#d4d4d4'}
 })
}
