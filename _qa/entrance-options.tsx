import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Scene,type Side} from './entrance-option-scene'
import aFront from '../doc/entrance-options-20260917/prepared/a-recessed-masonry-wide.png'
import bFront from '../doc/entrance-options-20260917/prepared/b-roller-shutter-wide.png'
import cFront from '../doc/entrance-options-20260917/prepared/c-covered-vestibule-wide.png'
import bSide from '../doc/entrance-options-20260917/prepared/b-roller-shutter-side.png'
import cSide from '../doc/entrance-options-20260917/prepared/c-covered-vestibule-side.png'
import stonePassage from '../doc/entrance-art-20260917/prepared/passage-ground.png'
const options=[
 {id:'A',title:'嵌墙门洞',front:aFront,side:stonePassage,note:'正面用朴素宽木门；侧面让门藏进墙后，以石门槛和暗部指明入口。'},
 {id:'B',title:'金属卷帘',front:bFront,side:bSide,note:'灰色砌体与旧金属，适合工坊、仓库。侧面只露出门槛与凹口。'},
 {id:'C',title:'石砌雨棚',front:cFront,side:cSide,note:'粗石门框与小雨棚，侧面有更明显的遮阴和进深。'},
]
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
