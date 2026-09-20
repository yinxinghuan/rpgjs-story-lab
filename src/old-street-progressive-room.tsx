import type {RoomImage} from './old-street-room-image'
import {darkroomMediaSlots} from './old-street-room-media'
import './old-street-progressive-room.css'
export function DarkroomMediaStatus({complete,failed,locale,useBaseline,retry}:{complete:boolean;failed:boolean;locale:string;useBaseline:()=>void;retry:()=>void}){
 const zh=locale==='zh'
 return <aside className="os-room-progress">
  {!complete&&<p role="status">{zh?(failed?'部分景物暂未载入，你可以继续探索。':'世界正在加载，可以先四处看看。'):(failed?'Some scenery is unavailable. You can keep exploring.':'The world is loading. You can look around.')}</p>}
  <details><summary>{zh?'景物':'Scenery'}</summary><div><button onClick={useBaseline}>{zh?'使用原有景物':'Use original scenery'}</button>{failed&&<button onClick={retry}>{zh?'重新载入景物':'Reload scenery'}</button>}</div></details>
 </aside>
}
export function DarkroomFloor({image}:{image?:RoomImage}){
 const r=darkroomMediaSlots.floor.rect
 return image?<svg x={r.x} y={r.y} width={r.w} height={r.h} viewBox={`0 0 ${r.w} ${r.h}`} overflow="hidden"><image href={image.url} width={r.h} height={r.h} x={(r.w-r.h)/2} preserveAspectRatio="xMidYMid meet"/></svg>:<rect {...{x:r.x,y:r.y,width:r.w,height:r.h}} fill="#343f39" stroke="#626d60"/>
}
export function DarkroomBench({image}:{image?:RoomImage}){
 const r=darkroomMediaSlots.bench.rect
 if(!image)return <g data-room-placeholder="bench"><rect x={r.x} y={r.y-22} width={r.w} height={r.h+22} rx="2" fill="#555b50" stroke="#9aa18b"/><path d={`M${r.x},${r.y}h${r.w}`} stroke="#9aa18b"/></g>
 const b=image.bounds,scale=r.w/b.width
 return <image data-room-image="bench" href={image.url} x={r.x-b.x*scale} y={r.y+r.h-(b.y+b.height)*scale} width={image.width*scale} height={image.height*scale}/>
}
