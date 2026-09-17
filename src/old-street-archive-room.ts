import {findGridPath} from './grid-path'

export const archiveRoomFloor={x:88,y:64,w:208,h:448}
export const archiveRoomArrival={x:184,y:456}
type Point={x:number;y:number}
type Body=Point&{w:number;h:number}
type ArchiveProp={id:string;room:'archive';body:Body;position:Point;approach:Point;actions:string[]}
type Room={floor:Body;arrival:Point;props:ArchiveProp[];indexBlocked:boolean;ledgerBlocked:boolean;alternating:boolean;slide?:{from:Body;to:Body}}
const cache=new Map<string,[Room,Room]>()
const overlaps=(a:Body,b:Body)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y

/** Cells are a compact authoring format, not a second movement engine. Validation
 * uses the same 4-unit path search and 16×26 body as ordinary exploration. */
export function archiveRoomLayout(raw:unknown,shifted=false):Room{
 if(!Array.isArray(raw)||raw.length!==9||raw.some(row=>typeof row!=='string'||!/^[.SILTtMm]{5}$/.test(row)))throw Error('ARCHIVE_ROOM_INVALID: room must be an array of 9 strings, each 5 cells using only . S I L T t M m.')
 const rows=raw as string[],key=rows.join('/'),cached=cache.get(key)
 if(cached)return cached[shifted?1:0]
 const flat=rows.join('')
 if(['I','L','T','t'].some(mark=>flat.split(mark).length!==2)||(flat.match(/S/g)?.length??0)>6)throw Error('ARCHIVE_ROOM_INVALID: include exactly one I, one L, one T and one t, and at most 6 S.')
 const move=flat.indexOf('M'),park=flat.indexOf('m')
 if((move<0)!==(park<0)||move>=0&&(flat.lastIndexOf('M')!==move||flat.lastIndexOf('m')!==park||Math.floor(move/5)!==Math.floor(park/5)||Math.abs(move-park)!==1))throw Error('ARCHIVE_ROOM_INVALID: optional M and m must occur once each and touch horizontally in the same row (Mm or mM, never M.m). Put M directly below I; leave the row below the pair empty.')
 const bodyAt=(cell:number)=>({x:92+(cell%5)*40,y:96+Math.floor(cell/5)*40,w:40,h:40})
 const slide=move<0?undefined:{from:bodyAt(move),to:bodyAt(park)}
 const props:ArchiveProp[]=[];let stored=0
 for(let r=0;r<9;r++)for(let c=0;c<5;c++){
  const mark=rows[r][c],x=92+c*40,y=96+r*40
  if(mark==='.'||mark==='t'||mark==='m')continue
  if(mark==='T'&&rows[r][c+1]!=='t')throw Error('ARCHIVE_ROOM_INVALID: T must have t immediately on its right, forming Tt in one row.')
  const storage=mark==='S'||mark==='M',desk=mark==='T',w=desk?72:40,h=storage?40:desk?32:28
  const body={x:x+(desk?4:0),y:y+(storage?0:4),w,h}
  props.push({id:mark==='M'?'archive-rack':storage?`archive-storage-${stored++}`:desk?'archive-desk':mark==='I'?'archive-index':'archive-ledger',room:'archive',body,
   position:{x:body.x+w/2,y:body.y+h},approach:{x:body.x+w/2-8,y:y+44},actions:[]})
 }
 const walkable=(placed:ArchiveProp[],p:Point)=>{
  const a={...p,w:16,h:26},f=archiveRoomFloor
  return a.x>=f.x&&a.y>=f.y&&a.x+a.w<=f.x+f.w&&a.y+a.h<=f.y+f.h&&!placed.some(b=>overlaps(a,b.body))
 }
 const make=(moved:boolean):Room=>{
  const placed=props.map(p=>p.id!=='archive-rack'||!moved||!slide?p:{...p,body:slide.to,position:{x:slide.to.x+20,y:slide.to.y+40},approach:{x:slide.to.x+12,y:slide.to.y+44}})
  const index=placed.find(p=>p.id==='archive-index')!
  const ledger=placed.find(p=>p.id==='archive-ledger')!
  const alternating=!!slide&&overlaps({...ledger.approach,w:16,h:26},slide.to)
  const indexBlocked=!!slide&&!moved,ledgerBlocked=alternating&&moved
  // A movable rack must really obstruct the index, not manufacture a story
  // gate in an otherwise clear room. Parking it must expose the real approach.
  if(indexBlocked&&!overlaps({...index.approach,w:16,h:26},slide!.from))throw Error('ARCHIVE_RACK_NOT_BLOCKING: put M in the cell directly below I, with m adjacent horizontally.')
  const canWalk=(p:Point)=>walkable(placed,p)
  if(!canWalk(archiveRoomArrival))throw Error('ARCHIVE_ROOM_UNREACHABLE: the bottom entrance is blocked.')
  const blocked=placed.filter(p=>!p.id.startsWith('archive-storage-')&&!(indexBlocked&&p.id==='archive-index')&&!(ledgerBlocked&&p.id==='archive-ledger')).filter(p=>!findGridPath(archiveRoomArrival,p.approach,canWalk).length)
  if(blocked.length)throw Error('ARCHIVE_ROOM_UNREACHABLE: '+blocked.map(p=>p.id).join(', ')+' cannot be reached from the bottom '+(moved?'after moving the rack':'in the initial state')+'. Leave clear standing floor directly below each item and a connected path to it.')
  return {floor:archiveRoomFloor,arrival:archiveRoomArrival,props:placed,indexBlocked,ledgerBlocked,alternating,...(slide?{slide}:{})}
 }
 const states:[Room,Room]=[make(false),make(true)]
 if(slide){
  // A single horizontal shift never sweeps through another item or the
  // player's normal standing point. Reversal is equally safe and reachable.
  const swept={x:Math.min(slide.from.x,slide.to.x),y:slide.from.y,w:80,h:40}
  if(props.some(p=>p.id!=='archive-rack'&&overlaps(swept,p.body)))throw Error('ARCHIVE_ROOM_INVALID')
 }
 // No pathfinding in the animation loop. Bound cache growth across journeys.
 if(cache.size>=32)cache.delete(cache.keys().next().value!)
 cache.set(key,states)
 return states[shifted?1:0]
}
export function readArchiveRoom(raw:unknown):string[]{archiveRoomLayout(raw);return [...raw as string[]]}
