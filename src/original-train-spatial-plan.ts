import type {SpatialBindingDefinition} from './spatial-binding'
/** Authoring geometry only. These rooms have no admitted art or renderer yet. */
export const originalTrainLocations=['dead-station','river-valley','graystone-yard','pine-line','tunnel','mountain-pass','sleeping-town','dawn-junction'] as const
export const originalTrainRoom=(location:string)=>'train-at-'+location
const characters=['ada-mechanic','ren-medic','lin-scout','mara-raider'] as const
export function originalTrainSpatialPlan():SpatialBindingDefinition{
 const scenes=originalTrainLocations.map(id=>({id:originalTrainRoom(id),storyLocationId:id,spawn:{x:192,y:430}}))
 const initial=originalTrainRoom('dead-station')
 const entity=(id:string,scene:string,x:number,y:number,states:string[],actions:string[]=[])=>({id,scene,position:{x,y},approach:{x,y:y+25},states,actions})
 return {version:1,cartridgeId:'last-train-to-dawn',mapVersion:'original-train-authoring-1',actionScope:'scene',interactionDistance:60,scenes,
  entities:[entity('starter',initial,110,160,['broken','repaired'],['repair-starter']),entity('brakes',initial,260,170,['unchecked','cracked','replaced'],['inspect-brakes','replace-brake-hose']),entity('fuel-shed',initial,95,360,['sealed','salvaged'],['salvage-fuel-shed']),entity('departure-control',initial,270,380,['unset','valley','quarry','forest'],['commit-valley-route','commit-quarry-route','commit-forest-route']),
   ...scenes.map(s=>entity(s.id+'-switch',s.id,280,80,['sealed','overridden'],['use-master-switch-key'])),
   ...characters.flatMap((id,i)=>scenes.map(s=>entity(s.id+'-'+id,s.id,80+i*70,270,['hidden','present','absent']))),
  ],
  portals:[['commit-valley-route','river-valley'],['commit-quarry-route','graystone-yard'],['commit-forest-route','pine-line']].map(([actionId,location])=>({actionId,fromScene:initial,scene:originalTrainRoom(location),position:{x:192,y:430}})),
  characters:characters.map(id=>({id,kind:'physical',travels:true,entities:scenes.map(s=>s.id+'-'+id)})),
 }
}
// North Cape v2: shared projected footprint, also exported into its TMX.
// Other regions remain authoring candidates until their own background review.
export const originalTrainObstacles=[{x:0,y:0,w:60,h:576},{x:336,y:0,w:48,h:576},{x:0,y:0,w:384,h:16},{x:0,y:560,w:384,h:16},{x:146,y:0,w:90,h:248},{x:17,y:260,w:57,h:134}]
export const originalTrainPlanWalkable=(scene:string,p:{x:number;y:number})=>originalTrainLocations.some(id=>originalTrainRoom(id)===scene)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x+9<=384&&p.y>=0&&p.y+15<=576&&!originalTrainObstacles.some(o=>p.x+9>o.x&&p.x<o.x+o.w&&p.y+15>o.y&&p.y<o.y+o.h)
