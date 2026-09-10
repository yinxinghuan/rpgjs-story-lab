import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRpgRenderer,type RpgRendererRuntime,type RendererPoint} from './rpg-renderer'
import {heroSheet} from './sprite-config'
import {findGridPath} from './grid-path'
import {originalTrainPlanWalkable,originalTrainSpatialPlan} from './original-train-spatial-plan'
import './original-scene-preview.css'
declare const __ORIGINAL_SCENE_PREVIEW__:{sceneId:string;background:string;sha256:string}|null
/** In-project renderer workbench. No StorySave, authority or synthetic quests. */
export default function OriginalScenePreview(){
 const config=__ORIGINAL_SCENE_PREVIEW__!,world=originalTrainSpatialPlan(),spawn=world.scenes.find(s=>s.id===config.sceneId)!.spawn
 const frame=useRef<HTMLDivElement>(null),runtime=useRef<RpgRendererRuntime|null>(null),[position,setPosition]=useState(spawn),[destination,setDestination]=useState<RendererPoint|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[background,setBackground]=useState(''),[notice,setNotice]=useState(''),[rendered,setRendered]=useState<RendererPoint|null>(null)
 const zh=navigator.language.startsWith('zh'),t=(a:string,b:string)=>zh?a:b
 const positionRef=useRef(position);positionRef.current=position
 function camera(){const f=frame.current;if(!f)return;const viewport=f.parentElement!,scale=f.clientWidth/384;const immersive=matchMedia('(max-width:699px),(max-height:500px)').matches;f.style.setProperty('--camera-y',`${immersive?Math.max(Math.min(0,viewport.clientHeight-f.clientHeight),Math.min(0,viewport.clientHeight*.52-(positionRef.current.y+15)*scale)):0}px`)}
 useLayoutEffect(camera,[position.y])
 useEffect(()=>{const f=frame.current!;const observer=new ResizeObserver(camera);observer.observe(f);observer.observe(f.parentElement!);return()=>observer.disconnect()},[])
 useEffect(()=>{
  let disposed=false,blobUrl='',probe:ReturnType<typeof setInterval>|undefined;const controller=new AbortController()
  void(async()=>{try{
   const response=await fetch(config.background,{signal:controller.signal});if(!response.ok)throw Error('BACKGROUND_HTTP')
   const bytes=await response.arrayBuffer(),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(digest!==config.sha256)throw Error('BACKGROUND_DIGEST')
   blobUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));const image=new Image();image.src=blobUrl;await image.decode();if(image.naturalWidth!==1024||image.naturalHeight!==1536)throw Error('BACKGROUND_SIZE')
   if(disposed)return;setBackground(blobUrl)
   createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:[config.sceneId],initialScene:config.sceneId,initialPosition:spawn,heroGraphic:'hero',spritesheets:[heroSheet],mapEvents:()=>[],walkable:(p,s)=>originalTrainPlanWalkable(s,p),safePosition:(p,s)=>originalTrainPlanWalkable(s,p)?p:spawn,findPath:(a,b,s)=>findGridPath(a,b,p=>originalTrainPlanWalkable(s,p)),onPosition:setPosition,onDestination:setDestination,onReady:r=>{runtime.current=r;probe=setInterval(()=>setRendered(r.renderedPosition()),150);void r.restore(spawn,config.sceneId).then(()=>{if(!disposed){r.pause(false);setReady(true)}}).catch(()=>setError(t('地图尚未准备好，请重新载入。','The map is not ready. Reload to retry.')))}})
  }catch{if(!disposed)setError(t('场景资源未通过检查，请重新载入。','Scene resources failed validation. Reload to retry.'))}})()
  return()=>{disposed=true;controller.abort();if(probe)clearInterval(probe);runtime.current?.destroy();if(blobUrl)URL.revokeObjectURL(blobUrl)}
 },[])
 function walk(p:RendererPoint){if(!ready)return;setNotice(runtime.current?.walkTo(p)?'':t('这里不可通行','This area is blocked'))}
 function ground(e:React.MouseEvent<HTMLDivElement>){if((e.target as HTMLElement).closest('button'))return;const rect=frame.current!.getBoundingClientRect();walk({x:(e.clientX-rect.left)*384/rect.width-4.5,y:(e.clientY-rect.top)*576/rect.height-15})}
 const points=[['starter','左侧检修位','Starter side'],['brakes','右侧制动位','Brake side'],['fuel-shed','燃料棚前','Fuel frontage'],['departure-control','出站控制位','Departure position']]
 return <main className="cl-app cl-original-preview"><header className="cl-header"><div><p className="cl-eyebrow">{t('原作探索模式 · 场景检查','Original world · Scene check')}</p><h1>{t('北岬站检修区','North Cape apron')}</h1></div></header><section className="cl-world" aria-label={t('北岬站可行走地图','Walkable North Cape map')}><div className="cl-map-frame" ref={frame} onClick={ground}>{background&&<img className="cl-backdrop" src={background} alt="" draggable={false}/>}<div id="rpg"/>{destination&&<div className="cl-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/576*100+'%'}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></div>}{!ready&&!error&&<div className="cl-loading">{t('正在准备原作地图…','Preparing original map…')}</div>}</div></section><footer className="cl-original-checks"><p>{notice||t('点地面行走 · 方向键 / WASD；人物与剧情尚待接入。','Click to walk · Arrows / WASD; cast and story are not connected yet.')}</p><div>{points.map(([id,zh,en])=><button disabled={!ready} key={id} onClick={()=>walk(world.entities.find(e=>e.id===id)!.approach)}>{t(zh,en)}</button>)}<button disabled={!ready} onClick={()=>walk({x:188,y:130})}>{t('检查车体碰撞','Check train collision')}</button><button disabled={!ready} onClick={()=>walk(spawn)}>{t('返回空地','Return to apron')}</button></div><output aria-label={t('运行位置','Runtime position')} data-scene={runtime.current?.renderedScene()??''}>{Math.round(position.x)},{Math.round(position.y)} · {t('画面','Rendered')} {rendered?`${Math.round(rendered.x)},${Math.round(rendered.y)}`:'—'}</output></footer>{error&&<aside className="cl-error" role="alert"><p>{error}</p><button onClick={()=>location.reload()}>{t('重新载入','Reload')}</button></aside>}</main>
}
