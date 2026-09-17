import React,{useState,useId} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetFloor} from '../src/old-street-floor'
import {OldStreetRoomWalls,OldStreetRoomForeground} from '../src/old-street-room-walls-view'
import {OldStreetBuildingEdges,OldStreetEntranceEaves} from '../src/old-street-boundaries'
import {oldStreetEnvironmentArt as art} from '../src/old-street-environment-art'
import {oldStreetDoors} from '../src/old-street-space'
import {OldStreetEntranceArt} from '../src/old-street-entrance-art'
import aFront from '../doc/entrance-options-20260917/prepared/a-recessed-masonry-wide.png'
import bFront from '../doc/entrance-options-20260917/prepared/b-roller-shutter-wide.png'
import cFront from '../doc/entrance-options-20260917/prepared/c-covered-vestibule-wide.png'
import bSide from '../doc/entrance-options-20260917/prepared/b-roller-shutter-side.png'
import cSide from '../doc/entrance-options-20260917/prepared/c-covered-vestibule-side.png'
import stonePassage from '../doc/entrance-art-20260917/prepared/passage-ground.png'
type Side='W'|'E'|'N'|'S'
type Door=ReturnType<typeof oldStreetDoors>[number]
const options=[
 {id:'A',title:'嵌墙门洞',front:aFront,side:stonePassage,note:'正面用朴素宽木门；侧面让门藏进墙后，以石门槛和暗部指明入口。'},
 {id:'B',title:'金属卷帘',front:bFront,side:bSide,note:'灰色砌体与旧金属，适合工坊、仓库。侧面只露出门槛与凹口。'},
 {id:'C',title:'石砌雨棚',front:cFront,side:cSide,note:'粗石门框与小雨棚，侧面有更明显的遮阴和进深。'},
]
const hero=new URL('./art/overhead/hero-gait-v2.png',document.baseURI).href
function Hero({x,y,side}:{x:number;y:number;side:Side}){const row={N:3,S:0,W:1,E:2}[side];return <svg x={x-181*.24} y={y-330*.24} width={362*.24} height={362*.24} viewBox={`362 ${row*362} 362 362`} overflow="hidden"><image href={hero} width="1086" height="1448" style={{imageRendering:'pixelated'}}/></svg>}
function Candidate({option,door:d,foreground=false}:{option:typeof options[number];door:Door;foreground?:boolean}){
 const id=useId().replace(/:/g,''),side=d.side==='W'||d.side==='E'
 if(foreground&&(side||d.side!=='S'))return null
 const scale=side?(option.id==='A'?.22:.17):.22,rotation=side?(d.side==='W'?-90:90):0
 const base=side?0:d.side==='S'?8:0,source=side?option.side:option.front
 return <g data-option={option.id} transform={`translate(${d.position.x} ${d.position.y+base}) rotate(${rotation}) scale(${scale})`}>
  <defs><clipPath id={id}><rect x="0" y="0" width="384" height="442"/><rect x="240" y="400" width="100" height="110"/></clipPath></defs>
  <g transform={`translate(-192 ${side?-256:-450})`}><g clipPath={foreground?`url(#${id})`:undefined}><svg width="384" height="512" viewBox={`${side?0:384} 0 384 512`} overflow="hidden"><image href={source} width="768" height="512" style={{imageRendering:'pixelated'}}/></svg></g></g>
 </g>
}
function Scene({option,side,walls,baseline}:{option:typeof options[number];side:Side;walls:boolean;baseline:boolean}){
 const room=side==='W'||side==='E'?'street':'shop',d=oldStreetDoors().find(d=>d.room===room&&d.side===side)!,{x,y}=d.position
 const foot=side==='W'?{x:x+40,y:y+16}:side==='E'?{x:x-40,y:y+16}:side==='N'?{x,y:y+55}:{x,y:y-25}
 const view=side==='W'?`${x-54} ${y-72} 138 148`:side==='E'?`${x-84} ${y-72} 138 148`:`${x-69} ${y-98} 138 148`
 return <svg className="scene" viewBox={view} aria-label={`${option.id} ${option.title} ${side} 场景对照`}>
  <rect width="384" height="576" fill="#25302d"/>
  {walls&&<OldStreetBuildingEdges room={room}/>}<OldStreetFloor room={room} pixelShop compositeShop/>
  {baseline?<OldStreetEntranceArt door={d} closed={false} art={art}/>:<Candidate option={option} door={d}/>}
  {walls&&<OldStreetRoomWalls room={room} facts={{}} compositeShop/>}
  <Hero {...foot} side={side}/>
  {baseline?<OldStreetEntranceArt door={d} closed={false} art={art} foreground/>:<Candidate option={option} door={d} foreground/>}
  {walls&&<><OldStreetRoomForeground room={room} facts={{}}/><OldStreetEntranceEaves room={room} image={art.streetEdges}/></>}
 </svg>
}
function Review(){
 const[side,setSide]=useState<Side>('W'),[walls,setWalls]=useState(true),[baseline,setBaseline]=useState(false)
 return <main><header><p className="eyebrow">本地美术对照 · 未定版</p><h1>入口方案</h1><p>人物、地面与镜头倍率固定。比较门洞比例，以及入口被墙体和屋檐遮住的关系。</p>
 <nav aria-label="观察方向">{([['W','左侧门'],['E','右侧门'],['N','正面门'],['S','底端门']] as const).map(([s,t])=><button key={s} aria-pressed={side===s} onClick={()=>setSide(s)}>{t}</button>)}</nav>
 <div className="controls"><label><input type="checkbox" checked={walls} onChange={e=>setWalls(e.target.checked)}/>显示墙体遮挡</label><label><input type="checkbox" checked={baseline} onChange={e=>setBaseline(e.target.checked)}/>对比上一版门</label></div></header>
 <section className="grid">{options.map(o=><article key={o.id}><h2><span>{o.id}</span>{o.title}</h2><Scene option={o} side={side} walls={walls} baseline={baseline}/><p>{o.note}</p></article>)}</section>
 <footer>本页用于选视觉方向，不读写游戏存档。当前先比较开放入口；定方向后再制作一致的关闭状态与完整行走验证。阶梯和已认可的巷道保持原样。</footer>
 <style>{`*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif}main{max-width:1180px;margin:auto;padding:24px}header{max-width:780px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#b9b89e}h1{font-size:30px;margin:5px 0 10px}header>p{line-height:1.65;color:#c6c8b5}nav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 8px}button{min-height:44px;padding:10px 18px;color:#e5e3ca;background:#303e38;border:1px solid #566057;border-radius:8px;font:inherit;cursor:pointer}button[aria-pressed=true]{background:#d6c899;color:#24342c;border-color:#d6c899}.controls{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:22px}.controls label{min-height:44px;display:flex;gap:8px;align-items:center;font-size:14px}.controls input{width:18px;height:18px;accent-color:#d6c899}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{border:1px solid #53604e;border-radius:12px;overflow:hidden;background:#293730}h2{display:flex;align-items:center;gap:12px;font-size:18px;margin:16px}h2 span{font-size:13px;display:grid;place-items:center;width:27px;height:27px;border:1px solid #ada780;border-radius:50%;color:#dacc9d}.scene{display:block;width:100%;background:#25302d}article p{margin:16px;color:#bfc5b5;font-size:14px;line-height:1.6;min-height:68px}footer{margin-top:22px;color:#aeb7a8;font-size:13px;line-height:1.7;max-width:850px}button,input{-webkit-tap-highlight-color:transparent;touch-action:manipulation}@media(max-width:800px){main{padding:18px}.grid{grid-template-columns:1fr}article{max-width:480px;width:100%;margin:auto}.scene{max-height:390px}nav button{padding:8px 12px}header>p{font-size:14px}}`}</style>
 </main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
