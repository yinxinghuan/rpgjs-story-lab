import React,{useEffect,useState} from 'react'
import {STRIDE_DISTANCE,walkingPose} from './walking-motion'

/** Same pose order as the renderer; time is slowed for inspection, not a movement simulation. */
export function gaitPreviewColumn(phase:number){return Number(walkingPose((phase%4)*STRIDE_DISTANCE/4).slice(-1))}
export default function ActorGaitPreview({imageUrl,row,cellWidth,cellHeight,active,busy,locale,glide=false}:{imageUrl:string;row:number;cellWidth:number;cellHeight:number;active:boolean;busy:boolean;locale:'zh'|'en';glide?:boolean}){
 const t=(a:string,b:string)=>locale==='zh'?a:b
 const [phase,setPhase]=useState(1),[playing,setPlaying]=useState(false),[delay,setDelay]=useState(300)
 useEffect(()=>{setPlaying(false);setPhase(1)},[imageUrl,row])
 useEffect(()=>{if(!active||busy)setPlaying(false)},[active,busy])
 useEffect(()=>{
  const hide=()=>{if(document.hidden)setPlaying(false)}
  document.addEventListener('visibilitychange',hide)
  return()=>document.removeEventListener('visibilitychange',hide)
 },[])
 useEffect(()=>{
  if(!playing||!active||busy)return
  const timer=window.setInterval(()=>setPhase(p=>(p+1)%4),delay)
  return()=>window.clearInterval(timer)
 },[playing,active,busy,delay])
 const column=gaitPreviewColumn(phase)
 return <div className="cl-gait-preview">
  <p>{glide?t('播放顺序：第1帧 → 静止 → 第3帧 → 静止，与地图切帧一致；检查摆动衔接和锚点稳定。','Pose order: frame 1 → rest → frame 3 → rest, matching map animation. Inspect sway transitions and anchor stability.'):t('播放顺序与游戏一致：第1帧 → 站立 → 第3帧 → 站立。可慢放或逐帧检查；这里不模拟移动速度。','Uses the game’s pose order: frame 1 → standing → frame 3 → standing. Slow down or step through poses; this does not simulate movement speed.')}</p>
  <figure><div role="img" aria-label={t('步态播放画面','Gait playback')} data-column={column} data-playing={playing&&active&&!busy} style={{aspectRatio:`${cellWidth} / ${cellHeight}`,backgroundImage:`url("${imageUrl}")`,backgroundSize:'300% 400%',backgroundPosition:`${column*50}% ${row*100/3}%`}}/><figcaption>{t(`当前：第${column+1}帧${column===1?(glide?'（静止）':'（站立）'):''}`,`Current: frame ${column+1}${column===1?(glide?' (rest)':' (standing)'):''}`)}</figcaption></figure>
  <label htmlFor="actor-gait-speed">{t('检查速度','Review speed')}</label><select id="actor-gait-speed" disabled={busy} value={delay} onChange={e=>setDelay(Number(e.target.value))}><option value={150}>{t('正常 · 每帧150毫秒','Regular · 150 ms per pose')}</option><option value={300}>{t('慢放 · 每帧300毫秒','Slow · 300 ms per pose')}</option><option value={600}>{t('更慢 · 每帧600毫秒','Slower · 600 ms per pose')}</option></select>
  <div className="cl-gait-preview__controls"><button disabled={busy||!active} onClick={()=>setPlaying(p=>!p)}>{playing?t('暂停','Pause'):t('播放步态','Play gait')}</button><button disabled={busy||!active} onClick={()=>{setPlaying(false);setPhase(p=>(p+1)%4)}}>{t('下一帧','Next pose')}</button><button disabled={busy||!active} onClick={()=>{setPlaying(false);setPhase(1)}}>{glide?t('查看静止','Show rest'):t('查看站立','Show standing')}</button></div>
  <p>{glide?t('检查轮廓连续、身体不过度跳动、单侧配件不跳边。不要给无足角色添加腿。播放不会自动通过检查。','Check continuous silhouette, stable body and consistent sided attachments. Do not add legs to a legless character. Playback does not approve checks.'):t('停下时双脚应落地。播放时确认左右腿交替、身体不过度跳动、配件不跳边。播放和逐帧操作不会自动勾选检查项。','Both feet should be grounded when standing. During playback, check alternating legs, body stability and consistent attachments. Playback and stepping never mark a check as passed.')}</p>
 </div>
}
