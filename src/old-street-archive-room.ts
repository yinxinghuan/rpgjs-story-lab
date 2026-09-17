import {findGridPath} from './grid-path'

export const archiveRoomFloor={x:88,y:64,w:208,h:448}
export const archiveRoomArrival={x:184,y:456}
type Point={x:number;y:number}
type Body=Point&{w:number;h:number}
type ArchiveProp={id:string;room:'archive';body:Body;position:Point;approach:Point;actions:string[]}
type Room={floor:Body;arrival:Point;props:ArchiveProp[]}
const cache=new Map<string,Room>()
const overlaps=(a:Body,b:Body)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y

/** Cells are a compact authoring format, not a second movement engine. Validation
 * uses the same 4-unit path search and 16×26 body as ordinary exploration. */
export function archiveRoomLayout(raw:unknown):Room{
 if(!Array.isArray(raw)||raw.length!==9||raw.some(row=>typeof row!=='string'||!/^[.SILTt]{5}$/.test(row)))throw Error('ARCHIVE_ROOM_INVALID')
 const rows=raw as string[],key=rows.join('/'),cached=cache.get(key)
 if(cached)return cached
 const flat=rows.join('')
 if(['I','L','T','t'].some(mark=>flat.split(mark).length!==2)||(flat.match(/S/g)?.length??0)>6)throw Error('ARCHIVE_ROOM_INVALID')
 const props:ArchiveProp[]=[];let stored=0
 for(let r=0;r<9;r++)for(let c=0;c<5;c++){
  const mark=rows[r][c],x=92+c*40,y=96+r*40
  if(mark==='.'||mark==='t')continue
  if(mark==='T'&&rows[r][c+1]!=='t')throw Error('ARCHIVE_ROOM_INVALID')
  const storage=mark==='S',desk=mark==='T',w=desk?72:40,h=storage?40:desk?32:28
  const body={x:x+(desk?4:0),y:y+(storage?0:4),w,h}
  props.push({id:storage?`archive-storage-${stored++}`:desk?'archive-desk':mark==='I'?'archive-index':'archive-ledger',room:'archive',body,
   position:{x:body.x+w/2,y:body.y+h},approach:{x:body.x+w/2-8,y:y+44},actions:[]})
 }
 const canWalk=(p:Point)=>{
  const a={...p,w:16,h:26},f=archiveRoomFloor
  return a.x>=f.x&&a.y>=f.y&&a.x+a.w<=f.x+f.w&&a.y+a.h<=f.y+f.h&&!props.some(b=>overlaps(a,b.body))
 }
 if(!canWalk(archiveRoomArrival)||props.filter(p=>!p.id.startsWith('archive-storage-')).some(p=>!findGridPath(archiveRoomArrival,p.approach,canWalk).length))throw Error('ARCHIVE_ROOM_UNREACHABLE')
 const result:Room={floor:archiveRoomFloor,arrival:archiveRoomArrival,props}
 // No pathfinding in the animation loop. Bound cache growth across journeys.
 if(cache.size>=32)cache.delete(cache.keys().next().value!)
 cache.set(key,result)
 return result
}
export function readArchiveRoom(raw:unknown):string[]{archiveRoomLayout(raw);return [...raw as string[]]}
