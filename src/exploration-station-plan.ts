import type {DomainActionRule,Locale} from './vendor/original-train/types'
import {compileSpatialBinding,type SpatialBindingDefinition,type SpatialPoint} from './spatial-binding'

export const stationRooms=['station-carriage-07','station-carriage-06','station-platform','station-waiting','station-tools','station-signal'] as const
export type StationRoom=typeof stationRooms[number]
type Entrance={room:StationRoom;id:string;kind:'gangway'|'side-door'|'door'|'stairs';position:SpatialPoint;approach:SpatialPoint}
const entrance=(room:StationRoom,id:string,kind:Entrance['kind'],x:number,y:number,ax:number,ay:number):Entrance=>({room,id,kind,position:{x,y},approach:{x:ax,y:ay}})
/** Paired entrances are authoring truth. Backgrounds must be made to match these
 * door positions; no existing background has been silently relabelled. */
export const stationConnections:Array<{id:string;a:Entrance;b:Entrance}>=[
 {id:'gangway',a:entrance('station-carriage-07','front','gangway',190,70,186,98),b:entrance('station-carriage-06','rear','gangway',190,506,186,472)},
 {id:'platform-07',a:entrance('station-carriage-07','platform-door','side-door',242,400,210,392),b:entrance('station-platform','carriage-07','side-door',90,420,116,414)},
 {id:'platform-06',a:entrance('station-carriage-06','platform-door','side-door',242,160,210,158),b:entrance('station-platform','carriage-06','side-door',90,160,116,158)},
 {id:'waiting',a:entrance('station-platform','waiting-door','door',306,320,270,314),b:entrance('station-waiting','platform-door','door',76,320,106,314)},
 {id:'tools',a:entrance('station-platform','tools-door','door',306,100,270,104),b:entrance('station-tools','platform-door','door',76,320,106,314)},
 {id:'signal-stairs',a:entrance('station-waiting','upstairs','stairs',260,90,252,124),b:entrance('station-signal','downstairs','stairs',120,470,120,434)},
]
export const stationDoorId=(e:Entrance)=>`${e.room}:${e.id}`
export const stationCrossingId=(e:Entrance)=>`through:${stationDoorId(e)}`
export function stationTravelRules(locale:Locale):DomainActionRule[]{
 const zh=locale==='zh'
 return stationConnections.flatMap(({a,b})=>[[a,b],[b,a]].map(([from,to])=>({
  id:stationCrossingId(from),intent:stationCrossingId(from),match:[stationCrossingId(from)],
  requirements:[{type:'map' as const,nodeId:from.room,reason:zh?'先走到这处出入口。':'Approach this entrance first.'}],
  effects:[{type:'map' as const,nodeId:to.room}],successText:zh?(from.kind==='stairs'?'你沿楼梯来到另一层。':'你穿过门，来到相邻的空间.'):(from.kind==='stairs'?'You follow the stairs to the other floor.':'You pass through the doorway into the adjoining space.'),successChoices:['','',''] as [string,string,string],
 })))
}
export function stationSpatialPlan():SpatialBindingDefinition{
 const doors=stationConnections.flatMap(c=>[c.a,c.b])
 return {version:1,cartridgeId:'station-exploration',mapVersion:'station-door-layout-1',interactionDistance:54,
  scenes:stationRooms.map(id=>({id,spawn:{x:180,y:280}})),
  entities:doors.map(e=>({id:stationDoorId(e),scene:e.room,position:e.position,approach:e.approach,states:['open'],actions:[stationCrossingId(e)]})),
  portals:stationConnections.flatMap(({a,b})=>[[a,b],[b,a]].map(([from,to])=>({actionId:stationCrossingId(from),fromScene:from.room,scene:to.room,position:{...to.approach}}))),characters:[],
 }
}
/** Temporary collision layout only; production art admission remains required. */
export function stationLayoutWalkable(scene:string,p:SpatialPoint){const carriage=scene.startsWith('station-carriage-');return stationRooms.includes(scene as StationRoom)&&p.x>=(carriage?150:64)&&p.x+9<=(carriage?234:320)&&p.y>=64&&p.y+15<=512}
export function bindStationLayout(locale:Locale){return compileSpatialBinding({id:'station-exploration',initialMap:stationRooms.map((id,i)=>({id,current:i===0})),characters:[],domainRules:{rules:stationTravelRules(locale)}},stationSpatialPlan(),stationLayoutWalkable)}
