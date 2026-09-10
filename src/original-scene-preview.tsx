import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRpgRenderer,type RpgRendererRuntime,type RendererPoint} from './rpg-renderer'
import {heroSheet} from './sprite-config'
import {findGridPath} from './grid-path'
import {originalTrainPlanWalkable,originalTrainSpatialPlan,originalTrainRoom} from './original-train-spatial-plan'
import {SceneReadiness,loadBrowserSceneResource,type SceneResourceManifest} from './scene-readiness'
import './original-scene-preview.css'
declare const __ORIGINAL_SCENE_PREVIEW__:{initialScene:string;resources:SceneResourceManifest}|null
/** In-project renderer workbench. No StorySave, authority or synthetic quests. */
export default function OriginalScenePreview(){
 const config=__ORIGINAL_SCENE_PREVIEW__!,world=originalTrainSpatialPlan(),spawn=world.scenes.find(s=>s.id===config.initialScene)!.spawn
 const checks=useRef<HTMLElement>(null),frame=useRef<HTMLDivElement>(null),runtime=useRef<RpgRendererRuntime|null>(null),readiness=useRef<SceneReadiness|null>(null),mounted=useRef(true),busy=useRef(false)
 const [position,setPosition]=useState(spawn),[destination,setDestination]=useState<RendererPoint|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[background,setBackground]=useState(''),[notice,setNotice]=useState(''),[rendered,setRendered]=useState<RendererPoint|null>(null),[scene,setScene]=useState(config.initialScene),[requested,setRequested]=useState(config.initialScene),[engineReady,setEngineReady]=useState(false),[switching,setSwitching]=useState(true)
 const zh=navigator.language.startsWith('zh'),t=(a:string,b:string)=>zh?a:b
 const names:Record<string,string>={[originalTrainRoom('dead-station')]:t('北岬站检修区','North Cape apron'),[originalTrainRoom('river-valley')]:t('河谷断桥近岸','River Valley near bank')}
 const positionRef=useRef(position);positionRef.current=position
 function camera(){const f=frame.current;if(!f)return;const viewport=f.parentElement!,scale=f.clientWidth/384;const immersive=matchMedia('(max-width:699px),(max-height:500px)').matches;const visibleHeight=Math.max(100,viewport.clientHeight-(checks.current?.offsetHeight??0));f.style.setProperty('--camera-x',`${immersive?Math.max(Math.min(0,viewport.clientWidth-f.clientWidth),Math.min(0,viewport.clientWidth*.5-(positionRef.current.x+4.5)*scale))-(viewport.clientWidth-f.clientWidth)/2:0}px`);f.style.setProperty('--camera-y',`${immersive?Math.max(Math.min(0,visibleHeight-f.clientHeight),Math.min(0,visibleHeight*.62-(positionRef.current.y+15)*scale)):0}px`)}
 useLayoutEffect(camera,[position.x,position.y])
 useEffect(()=>{const f=frame.current!;const observer=new ResizeObserver(camera);observer.observe(f);observer.observe(f.parentElement!);if(checks.current)observer.observe(checks.current);return()=>observer.disconnect()},[])
 async function enterScene(id:string){
  const r=runtime.current,loader=readiness.current;if(!r||!loader||busy.current)return
  busy.current=true;setSwitching(true);setReady(false);setError('');setNotice('');setRequested(id);r.pause(true)
  try{
   const prepared=await loader.prepare(id,true);if(!mounted.current){URL.revokeObjectURL(prepared.background);return}
   const next=world.scenes.find(s=>s.id===id)!.spawn
   await r.restore(next,id);if(!mounted.current)return
   loader.activate(id);setBackground(prepared.background);setScene(id);setPosition(r.position());setReady(true);r.pause(false)
  }catch{if(mounted.current)setError(t('场景尚未准备好，请重试。','The scene is not ready. Retry to continue.'))}
  finally{busy.current=false;if(mounted.current)setSwitching(false)}
 }
 useEffect(()=>{
  mounted.current=true;let probe:ReturnType<typeof setInterval>|undefined
  const loader=new SceneReadiness(config.resources,loadBrowserSceneResource);readiness.current=loader
  void(async()=>{try{
   const initial=await loader.prepare(config.initialScene);if(!mounted.current){URL.revokeObjectURL(initial.background);return}
   setBackground(initial.background)
   createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:Object.keys(config.resources.scenes),initialScene:config.initialScene,initialPosition:spawn,heroGraphic:'hero',spritesheets:[heroSheet],mapEvents:()=>[],walkable:(p,s)=>originalTrainPlanWalkable(s,p),safePosition:(p,s)=>originalTrainPlanWalkable(s,p)?p:world.scenes.find(room=>room.id===s)!.spawn,findPath:(a,b,s)=>findGridPath(a,b,p=>originalTrainPlanWalkable(s,p)),onPosition:setPosition,onDestination:setDestination,onReady:r=>{if(!mounted.current){r.destroy();return}runtime.current=r;setEngineReady(true);probe=setInterval(()=>setRendered(r.renderedPosition()),150);void enterScene(config.initialScene)}})
  }catch{if(mounted.current){setSwitching(false);setError(t('初始场景未通过检查，请重新载入。','Initial scene validation failed. Reload to retry.'))}}})()
  return()=>{mounted.current=false;if(probe)clearInterval(probe);runtime.current?.destroy();for(const id of Object.keys(config.resources.scenes)){const url=loader.background(id);if(url)URL.revokeObjectURL(url)}}
 },[])
 function walk(p:RendererPoint){if(!ready)return;setNotice(runtime.current?.walkTo(p)?'':t('这里不可通行','This area is blocked'))}
 function ground(e:React.MouseEvent<HTMLDivElement>){if((e.target as HTMLElement).closest('button'))return;const rect=frame.current!.getBoundingClientRect();walk({x:(e.clientX-rect.left)*384/rect.width-4.5,y:(e.clientY-rect.top)*576/rect.height-15})}
 const river=scene===originalTrainRoom('river-valley')
 const points:Array<{label:string;position:RendererPoint}>=river?[{label:t('桥头观察位','Bridge approach'),position:{x:188,y:330}},{label:t('左侧岸边','Left bank'),position:{x:80,y:390}},{label:t('右侧岸边','Right bank'),position:{x:290,y:390}},{label:t('返回停靠方向','Train approach'),position:spawn}]:[['starter','左侧检修位','Starter side'],['brakes','右侧制动位','Brake side'],['fuel-shed','燃料棚前','Fuel frontage'],['departure-control','出站控制位','Departure position']].map(([id,zh,en])=>({label:t(zh,en),position:world.entities.find(e=>e.id===id)!.approach}))
 return <main className="cl-app cl-original-preview">
  <header className="cl-header"><div><p className="cl-eyebrow">{t('原作探索模式 · 场景检查','Original world · Scene check')}</p><h1>{names[scene]}</h1></div></header>
  <section className="cl-world" aria-label={t('原作可行走地图','Walkable original map')}><div className="cl-map-frame" ref={frame} onClick={ground}>
   {background&&<img className="cl-backdrop" src={background} alt="" draggable={false}/>}<div id="rpg"/>
   {destination&&<div className="cl-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/576*100+'%'}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></div>}
   {!ready&&!error&&<div className="cl-loading">{t('正在准备原作地图…','Preparing original map…')}</div>}
  </div></section>
  <footer className="cl-original-checks" ref={checks}><label>{t('检查场景','Inspect scene')}<select aria-label={t('检查场景','Inspect scene')} disabled={!engineReady||switching} value={requested} onChange={e=>void enterScene(e.target.value)}>{Object.keys(names).map(id=><option key={id} value={id}>{names[id]}</option>)}</select></label><p>{notice||t('点地面行走 · 人物与剧情尚待接入。','Click to walk · Cast and story are not connected yet.')}</p><div>
   {points.map(p=><button disabled={!ready} key={p.label} onClick={()=>walk(p.position)}>{p.label}</button>)}
   <button disabled={!ready} onClick={()=>walk({x:188,y:river?250:130})}>{river?t('检查水面阻挡','Check water collision'):t('检查车体碰撞','Check train collision')}</button><button disabled={!ready} onClick={()=>walk(spawn)}>{t('返回空地','Return to apron')}</button>
  </div><output aria-label={t('运行位置','Runtime position')} data-scene={runtime.current?.renderedScene()??''}>{Math.round(position.x)},{Math.round(position.y)} · {t('画面','Rendered')} {rendered?`${Math.round(rendered.x)},${Math.round(rendered.y)}`:'—'}</output></footer>
  {error&&<aside className="cl-error" role="alert"><p>{error}</p><button onClick={()=>engineReady?void enterScene(requested):location.reload()}>{engineReady?t('重试','Retry'):t('重新载入','Reload')}</button></aside>}
 </main>
}
