import {archiveRoomLayout,readArchiveRoom} from '../src/old-street-archive-room'
type RoomPlan={indexSide:'left'|'right';storageShelves:number;rack:'none'|'left'|'right'}
type Cell={r:number;c:number;value:string}
function readPlan(raw:unknown):RoomPlan{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('ARCHIVE_ROOM_PLAN_INVALID')
 const r=raw as Record<string,unknown>
 if(Object.keys(r).some(k=>!['indexSide','storageShelves','rack'].includes(k))||!['left','right'].includes(String(r.indexSide))||!Number.isInteger(r.storageShelves)||Number(r.storageShelves)<0||Number(r.storageShelves)>3||!['none','left','right'].includes(String(r.rack)))throw Error('ARCHIVE_ROOM_PLAN_INVALID: use {indexSide:left|right, storageShelves:integer 0-3, rack:none|left|right}.')
 return r as RoomPlan
}
/** Model chooses spatial intent, a seeded constructor chooses actual cells.
 * All accepted arrangements pass the game's real body/path/interaction checks. */
export function composeArchiveRoom(raw:unknown,seed=Math.floor(Math.random()*0x100000000)){
 const plan=readPlan(raw)
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('ARCHIVE_ROOM_SEED_INVALID')
 let state=seed>>>0
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000}
 const shuffled=<T>(values:T[])=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 const starts=Array.from({length:40},(_,n)=>({r:Math.floor(n/5),c:n%5}))
 for(let attempt=0;attempt<128;attempt++){
  const rows=Array.from({length:9},()=>Array<string>(5).fill('.')),clear=new Set<number>()
  const place=(cells:Cell[],standingRow:number)=>{
   if(standingRow>8||cells.some(p=>p.r<0||p.c<0||p.r>8||p.c>4||rows[p.r][p.c]!=='.'||clear.has(p.r*5+p.c))||rows[standingRow].some(v=>v!=='.'))return false
   for(const p of cells)rows[p.r][p.c]=p.value
   for(let c=0;c<5;c++)clear.add(standingRow*5+c)
   return true
  }
  const direction=plan.rack==='left'?-1:1
  const indexes=shuffled(starts.filter(p=>(plan.indexSide==='left'?p.c<=1:p.c>=3)&&(plan.rack==='none'||p.r<=6&&p.c+direction>=0&&p.c+direction<=4)))
  if(!indexes.some(p=>place([{...p,value:'I'},...(plan.rack==='none'?[]:[{r:p.r+1,c:p.c,value:'M'},{r:p.r+1,c:p.c+direction,value:'m'}])],p.r+(plan.rack==='none'?1:2))))continue
  if(!shuffled(starts).some(p=>place([{...p,value:'L'}],p.r+1)))continue
  if(!shuffled(starts.filter(p=>p.c<4)).some(p=>place([{...p,value:'T'},{r:p.r,c:p.c+1,value:'t'}],p.r+1)))continue
  const empty=shuffled(starts.filter(p=>rows[p.r][p.c]==='.'&&!clear.has(p.r*5+p.c)))
  if(empty.length<plan.storageShelves)continue
  for(const p of empty.slice(0,plan.storageShelves))rows[p.r][p.c]='S'
  const room=rows.map(r=>r.join(''))
  try{archiveRoomLayout(room);return {layout:plan.indexSide==='left'?'west-index' as const:'east-index' as const,room:readArchiveRoom(room)}}catch(error){
   if(!(error instanceof Error)||!error.message.startsWith('ARCHIVE_'))throw error
  }
 }
 throw Error('ARCHIVE_ROOM_COMPOSITION_FAILED')
}
