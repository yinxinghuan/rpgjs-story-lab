import {junctionActions} from './original-junction-chapter'
import type {SpatialBindingDefinition} from './spatial-binding'
/** Authoring geometry. North Cape runs in preflight; other rooms and the
 * original cast/state assets are not yet admitted for playable story sessions. */
export const originalTrainLocations=['dead-station','river-valley','graystone-yard','pine-line','tunnel','mountain-pass','sleeping-town','dawn-junction'] as const
export const originalTrainRoom=(location:string)=>'train-at-'+location
const characters=['ada-mechanic','ren-medic','lin-scout','mara-raider'] as const
export const originalFloodBridgeRoom='train-at-flood-bridge'
export const originalChapterMapVersion='original-train-authoring-10'
export const originalCompatibleMapVersions=['original-train-authoring-2','original-train-authoring-3','original-train-authoring-4','original-train-authoring-5','original-train-authoring-6','original-train-authoring-7','original-train-authoring-8','original-train-authoring-9',originalChapterMapVersion] as const
export function originalTrainSpatialPlan():SpatialBindingDefinition{
 const scenes=originalTrainLocations.map(id=>({id:originalTrainRoom(id),storyLocationId:id,spawn:{x:192,y:430}}))
 const initial=originalTrainRoom('dead-station')
 const entity=(id:string,scene:string,x:number,y:number,states:string[],actions:string[]=[])=>({id,scene,position:{x,y},approach:{x,y:y+25},states,actions})
 return {version:1,cartridgeId:'last-train-to-dawn',mapVersion:'original-train-authoring-2',actionScope:'scene',interactionDistance:60,scenes,
  entities:[entity('starter',initial,110,160,['broken','repaired'],['repair-starter']),entity('brakes',initial,260,170,['unchecked','cracked','replaced'],['inspect-brakes','replace-brake-hose']),entity('fuel-shed',initial,95,360,['sealed','salvaged'],['salvage-fuel-shed']),entity('departure-control',initial,270,380,['unset','valley','quarry','forest'],['commit-valley-route','commit-quarry-route','commit-forest-route']),
   ...scenes.map(s=>entity(s.id+'-switch',s.id,280,s.storyLocationId==='river-valley'?335:80,['sealed','overridden'],['use-master-switch-key'])),
   ...characters.flatMap((id,i)=>scenes.map(s=>entity(s.id+'-'+id,s.id,80+i*70,s.storyLocationId==='river-valley'?400:270,['hidden','present','absent']))),
  ],
  portals:[['commit-valley-route','river-valley'],['commit-quarry-route','graystone-yard'],['commit-forest-route','pine-line']].map(([actionId,location])=>({actionId,fromScene:initial,scene:originalTrainRoom(location),position:{x:192,y:430}})),
  characters:characters.map(id=>({id,kind:'physical',travels:true,entities:scenes.map(s=>s.id+'-'+id)})),
 }
}
/** Additive chapter bindings, still authoring-only until presentation admission.
 * Existing v2 rooms/footprints/positions do not change. */
export function originalTrainChapterSpatialPlan():SpatialBindingDefinition{
 const world=originalTrainSpatialPlan(),scene=originalTrainRoom('river-valley')
 world.mapVersion=originalChapterMapVersion
 world.entities.push(
  {id:'river-bridge',scene,position:{x:180,y:335},approach:{x:180,y:360},states:['unchecked','surveyed','evacuated'],actions:['river-survey','river-rescue-powered','river-rescue-manual']},
  {id:'river-fuel-locker',scene,position:{x:300,y:480},approach:{x:300,y:505},states:['reserve','empty'],actions:['river-refuel']},
  {id:'river-return-track',scene,position:{x:270,y:495},approach:{x:270,y:520},states:['waiting','departed'],actions:['river-depart']},
 )
 world.entities.find(e=>e.id===scene+'-ren-medic')!.actions=['river-treat']
 world.entities.find(e=>e.id===scene+'-ada-mechanic')!.actions=['river-stabilize']
 world.portals.push({actionId:'river-depart',fromScene:scene,scene:originalTrainRoom('tunnel'),position:{x:192,y:430}})
 const tunnel=originalTrainRoom('tunnel')
 world.entities.push(
  {id:'tunnel-fan',scene:tunnel,position:{x:110,y:160},approach:{x:110,y:185},states:['stopped','inspected','running'],actions:['tunnel-inspect','tunnel-ventilate']},
  {id:'tunnel-carriage-aisle',scene:tunnel,position:{x:150,y:380},approach:{x:150,y:405},states:['unaccounted','grouped'],actions:['tunnel-captain-led']},
  {id:'tunnel-cargo',scene:tunnel,position:{x:270,y:360},approach:{x:270,y:385},states:['retained','unloaded'],actions:['tunnel-discard']},
  {id:'tunnel-reserve',scene:tunnel,position:{x:100,y:480},approach:{x:100,y:505},states:['reserve','empty'],actions:['tunnel-refuel']},
  {id:'tunnel-exit',scene:tunnel,position:{x:280,y:480},approach:{x:280,y:505},states:['waiting','clear'],actions:['tunnel-depart']},
 )
 world.entities.find(e=>e.id===tunnel+'-ren-medic')!.actions=['tunnel-doctor-led']
 world.entities.find(e=>e.id===tunnel+'-ada-mechanic')!.actions=['tunnel-stabilize']
 world.portals.push({actionId:'tunnel-depart',fromScene:tunnel,scene:originalTrainRoom('graystone-yard'),position:{x:192,y:430}})
 const yard=originalTrainRoom('graystone-yard')
 world.entities.push(
  {id:'yard-gate',scene:yard,position:{x:110,y:160},approach:{x:110,y:185},states:['guarded','introduced'],actions:['yard-meet']},
  {id:'yard-pump',scene:yard,position:{x:270,y:360},approach:{x:270,y:385},states:['broken','repaired','forced'],actions:['yard-work-pact','yard-force-pump','yard-starting-reserve']},
  {id:'yard-exit',scene:yard,position:{x:280,y:480},approach:{x:280,y:505},states:['waiting','tunnel','pass'],actions:['yard-first-exit','yard-depart']},
 )
 world.entities.find(e=>e.id===yard+'-mara-raider')!.actions=['yard-medical-pact','yard-route-brief','yard-invite','yard-stay']
 world.entities.find(e=>e.id===yard+'-ada-mechanic')!.actions=['yard-stabilize']
 world.portals.push({actionId:'yard-first-exit',fromScene:yard,scene:tunnel,position:{x:192,y:430}},{actionId:'yard-depart',fromScene:yard,scene:originalTrainRoom('mountain-pass'),position:{x:192,y:430}})
 const pine=originalTrainRoom('pine-line')
 world.entities.push(
  {id:'pine-signal',scene:pine,position:{x:110,y:160},approach:{x:110,y:185},states:['unchecked','false-safe','tagged'],actions:['pine-inspect','pine-reverse','pine-confirm-siding']},
  {id:'pine-rescue-car',scene:pine,position:{x:270,y:360},approach:{x:270,y:385},states:['jammed','open'],actions:['pine-meet']},
  {id:'pine-reserve',scene:pine,position:{x:100,y:480},approach:{x:100,y:505},states:['reserve','empty'],actions:['pine-refuel']},
  {id:'pine-exit',scene:pine,position:{x:280,y:480},approach:{x:280,y:505},states:['waiting','verified'],actions:['pine-depart']},
 )
 world.entities.find(e=>e.id===pine+'-lin-scout')!.actions=['pine-survey-route','pine-invite','pine-stay']
 world.entities.find(e=>e.id===pine+'-ada-mechanic')!.actions=['pine-stabilize']
 world.portals.push({actionId:'pine-depart',fromScene:pine,scene:tunnel,position:{x:192,y:430}})
 const pass=originalTrainRoom('mountain-pass')
 world.entities.push(
  {id:'pass-grade-marker',scene:pass,position:{x:110,y:160},approach:{x:110,y:185},states:['unchecked','measured'],actions:['pass-inspect','pass-player-watch']},
  {id:'pass-carriage-post',scene:pass,position:{x:150,y:380},approach:{x:150,y:405},states:['unset','assigned','accounted'],actions:['pass-crew-duty','pass-debrief']},
  {id:'pass-brake-control',scene:pass,position:{x:270,y:360},approach:{x:270,y:385},states:['waiting','air','dynamic','gravel','key'],actions:['pass-air-brake','pass-dynamic-brake','pass-gravel-siding','pass-confirm-key']},
  {id:'pass-reserve',scene:pass,position:{x:100,y:480},approach:{x:100,y:505},states:['reserve','empty'],actions:['pass-refuel']},
  {id:'pass-exit',scene:pass,position:{x:280,y:480},approach:{x:280,y:505},states:['waiting','clear'],actions:['pass-depart']},
 )
 world.entities.find(e=>e.id===pass+'-lin-scout')!.actions=['pass-lin-watch']
 world.entities.find(e=>e.id===pass+'-mara-raider')!.actions=['pass-mako-duty']
 world.entities.find(e=>e.id===pass+'-ada-mechanic')!.actions=['pass-stabilize']
 world.portals.push({actionId:'pass-depart',fromScene:pass,scene:originalTrainRoom('sleeping-town'),position:{x:192,y:430}})
 const town=originalTrainRoom('sleeping-town')
 world.entities.push(
  {id:'town-platform-board',scene:town,position:{x:110,y:160},approach:{x:110,y:185},states:['unchecked','read'],actions:['town-inspect','town-route-brief']},
  {id:'town-generator',scene:town,position:{x:270,y:360},approach:{x:270,y:385},states:['silent','broadcast'],actions:['town-grid-aid','town-keep-reserve']},
  {id:'town-carriage-register',scene:town,position:{x:150,y:380},approach:{x:150,y:405},states:['undecided','public','emergency'],actions:['town-public-rules','town-emergency-command','town-rest']},
  {id:'town-supply-point',scene:town,position:{x:100,y:480},approach:{x:100,y:505},states:['stocked','empty'],actions:['town-refuel','town-use-diesel','town-pack-kit']},
  {id:'town-exit',scene:town,position:{x:280,y:480},approach:{x:280,y:505},states:['waiting','bridge'],actions:['town-depart']},
 )
 world.entities.find(e=>e.id===town+'-ada-mechanic')!.actions=['town-repair']
 world.scenes.push({id:originalFloodBridgeRoom,storyLocationId:'dawn-junction',spawn:{x:192,y:430}})
 for(const [index,id] of characters.entries()){
  const entityId=originalFloodBridgeRoom+'-'+id
  world.entities.push({id:entityId,scene:originalFloodBridgeRoom,position:{x:80+index*70,y:270},approach:{x:80+index*70,y:295},states:['hidden','present','absent'],actions:[]})
  const character=world.characters.find(c=>c.id===id)!
  character.entities=[...character.entities,entityId]
 }
 world.portals.push({actionId:'town-depart',fromScene:town,scene:originalFloodBridgeRoom,position:{x:192,y:430}})
 const bridge=originalFloodBridgeRoom
 world.entities.push(
  {id:'bridge-near-bank',scene:bridge,position:{x:110,y:160},approach:{x:110,y:185},states:['unchecked','surveyed'],actions:['bridge-inspect','bridge-kit-survey','bridge-manual-survey']},
  {id:'bridge-passenger-order',scene:bridge,position:{x:150,y:380},approach:{x:150,y:405},states:['waiting','arranged'],actions:['bridge-arrange']},
  {id:'bridge-crossing-control',scene:bridge,position:{x:270,y:360},approach:{x:270,y:385},states:['waiting','rail','key','anchor'],actions:['bridge-rail-crossing','bridge-key-crossing','bridge-anchor-crossing']},
  {id:'bridge-reserve',scene:bridge,position:{x:100,y:480},approach:{x:100,y:505},states:['reserve','empty'],actions:['bridge-refuel']},
 )
 world.entities.find(e=>e.id===bridge+'-ada-mechanic')!.actions=['bridge-stabilize']
 for(const actionId of ['bridge-rail-crossing','bridge-key-crossing','bridge-anchor-crossing'])world.portals.push({actionId,fromScene:bridge,scene:originalTrainRoom('dawn-junction'),position:{x:192,y:430}})
 world.entities.push({id:'junction-route-table',scene:originalTrainRoom('dawn-junction'),position:{x:270,y:360},approach:{x:270,y:385},states:['waiting','reviewed','decided'],actions:junctionActions.map(a=>a.id)})
 return world
}
// North Cape v2: shared projected footprint, also exported into its TMX.
// Other regions remain authoring candidates until their own background review.
export const originalTrainObstacles=[{x:0,y:0,w:60,h:576},{x:336,y:0,w:48,h:576},{x:0,y:0,w:384,h:16},{x:0,y:560,w:384,h:16},{x:146,y:0,w:90,h:248},{x:17,y:260,w:57,h:134}]
export const originalTrainObstaclesFor=(scene:string)=>scene===originalTrainRoom('river-valley')?[{x:0,y:0,w:384,h:310},{x:0,y:310,w:32,h:266},{x:352,y:310,w:32,h:266},{x:0,y:560,w:384,h:16}]:originalTrainObstacles
export const originalTrainPlanWalkable=(scene:string,p:{x:number;y:number})=>(scene===originalFloodBridgeRoom||originalTrainLocations.some(id=>originalTrainRoom(id)===scene))&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x+9<=384&&p.y>=0&&p.y+15<=576&&!originalTrainObstaclesFor(scene).some(o=>p.x+9>o.x&&p.x<o.x+o.w&&p.y+15>o.y&&p.y<o.y+o.h)
