import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRpgRenderer,type RpgRendererRuntime,type RendererPoint} from './rpg-renderer'
import {Assets} from 'pixi.js'
import type {RpgPlayer} from '@rpgjs/server'
import {inspectDeviceMapCandidate,deviceCandidateSheet,deviceCandidatePlacement,deviceCandidateBlocks,DEVICE_STATES,type DevicePreview,type DeviceState} from './device-map-candidate'
import {heroSheet,actorSheet} from './sprite-config'
import {findGridPath} from './grid-path'
import {originalTrainPlanWalkable,originalTrainSpatialPlan,originalTrainRoom} from './original-train-spatial-plan'
import {SceneReadiness,loadBrowserSceneResource,type SceneResourceManifest} from './scene-readiness'
import {BrowserArtDrafts,artDraftDatabaseName,decodeArtCandidate} from './art-draft'
import {BrowserSpriteDrafts,spriteDatabaseName} from './sprite-draft'
import {decodeSpritePixels,spritePreviewUrl} from './sprite-browser-io'
import {inspectActorMapCandidate} from './sprite-map-candidate'
import {BACKGROUND_CHECKS,BACKGROUND_LAYOUT} from './background-publication'
import './original-scene-preview.css'
declare const __ORIGINAL_SCENE_PREVIEW__:{initialScene:string;resources:SceneResourceManifest;platformResources:SceneResourceManifest}|null
/** In-project renderer workbench. No StorySave, authority or synthetic quests. */
export default function OriginalScenePreview(){
 const query=new URLSearchParams(location.search),source=query.get('art_source'),platform=source==='platform',draftMode=source==='draft',actorDraftId=query.get('actor_draft'),deviceDraftId=query.get('device_draft')
 const actorSuffix=actorDraftId?'&actor_draft='+encodeURIComponent(actorDraftId):'',backgroundSuffix=draftMode?'&art_source=draft&draft='+encodeURIComponent(query.get('draft')??''):platform?'&art_source=platform':''
 const deviceSuffix=deviceDraftId?'&device_draft='+encodeURIComponent(deviceDraftId):''
 const device=useRef<DevicePreview|null>(null),deviceEvents=useRef(new Map<string,RpgPlayer>()),deviceStateRef=useRef<DeviceState>('closed')
 const [deviceState,setDeviceState]=useState<DeviceState>('closed')
 const [reviewChecks,setReviewChecks]=useState<string[]>([]),[reviewSaved,setReviewSaved]=useState(false),[reviewBusy,setReviewBusy]=useState(false),draftHash=useRef('')
 function applyDevice(event:RpgPlayer,state:DeviceState){const id=device.current!.id;if(event.graphics()[0]!==id)event.setGraphic(id);event.animationFixed=true;event.animationName.set(state);event.syncChanges()}
 function changeDevice(state:DeviceState){if(!ready||switching)return;deviceStateRef.current=state;setDeviceState(state);const e=deviceEvents.current.get(scene);if(e)applyDevice(e,state)}
 function walkable(p:RendererPoint,s:string){return originalTrainPlanWalkable(s,p)&&(!device.current||!deviceCandidateBlocks(device.current,s,p))}
 const rawConfig=__ORIGINAL_SCENE_PREVIEW__!,config={...rawConfig,resources:platform?rawConfig.platformResources:rawConfig.resources},world=originalTrainSpatialPlan(),spawn=world.scenes.find(s=>s.id===config.initialScene)!.spawn
 const checks=useRef<HTMLElement>(null),frame=useRef<HTMLDivElement>(null),runtime=useRef<RpgRendererRuntime|null>(null),readiness=useRef<SceneReadiness|null>(null),mounted=useRef(true),busy=useRef(false)
 const [position,setPosition]=useState(spawn),[destination,setDestination]=useState<RendererPoint|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[background,setBackground]=useState(''),[notice,setNotice]=useState(''),[rendered,setRendered]=useState<RendererPoint|null>(null),[scene,setScene]=useState(config.initialScene),[requested,setRequested]=useState(config.initialScene),[engineReady,setEngineReady]=useState(false),[switching,setSwitching]=useState(true)
 const zh=navigator.language.startsWith('zh'),t=(a:string,b:string)=>zh?a:b
 const names:Record<string,string>={[originalTrainRoom('dead-station')]:t('北岬站检修区','North Cape apron'),[originalTrainRoom('river-valley')]:t('河谷断桥近岸','River Valley near bank')}
 const positionRef=useRef(position);positionRef.current=position
 const reviewing=draftMode&&!actorDraftId&&!deviceDraftId
 // A four-unit path grid can stop sqrt(8) units from an authored approach.
 useEffect(()=>{if(!reviewing||!ready||scene!==config.initialScene||!rendered||Math.hypot(position.x-rendered.x,position.y-rendered.y)>1.5)return;const ids=world.entities.filter(e=>BACKGROUND_CHECKS.includes(e.id as any)&&Math.hypot(position.x-e.approach.x,position.y-e.approach.y)<3).map(e=>e.id);if(ids.length)setReviewChecks(old=>ids.every(id=>old.includes(id))?old:[...new Set([...old,...ids])])},[ready,position,rendered,scene])
 async function saveReview(){if(reviewBusy||reviewChecks.length!==5)return;setReviewBusy(true);try{await navigator.locks.request(artDraftDatabaseName(location.href),async()=>{const store=new BrowserArtDrafts(artDraftDatabaseName(location.href));try{const d=await store.get();if(d?.id!==query.get('draft')||!d?.candidate||d.candidate.sha256!==draftHash.current)throw Error('DRAFT_REPLACED');d.review={sha256:d.candidate.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true};await store.put(d);setReviewSaved(true)}finally{await store.close()}})}catch{setNotice(t('检查记录未能保存，请返回制作页核对候选。','The review could not be saved. Check the candidate in the creator.'))}finally{setReviewBusy(false)}}
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
   const equipment=deviceEvents.current.get(id);if(equipment)applyDevice(equipment,deviceStateRef.current)
   loader.activate(id);setBackground(prepared.background);setScene(id);setPosition(r.position());setReady(true);r.pause(false)
  }catch{if(mounted.current)setError(t('场景尚未准备好，请重试。','The scene is not ready. Retry to continue.'))}
  finally{busy.current=false;if(mounted.current)setSwitching(false)}
 }
 useEffect(()=>{
  mounted.current=true;let draftBlob='',actorBlob='',deviceBlob='';let probe:ReturnType<typeof setInterval>|undefined
  let loader=new SceneReadiness(config.resources,loadBrowserSceneResource);readiness.current=loader
  void(async()=>{try{
   if(draftMode){const store=new BrowserArtDrafts(artDraftDatabaseName(location.href));try{const draft=await store.get(query.get('draft')??'missing');if(!draft?.candidate||draft.state!=='candidate'||draft.id!==query.get('draft'))throw Error('DRAFT_NOT_READY');const checked=await decodeArtCandidate(draft.candidate);URL.revokeObjectURL(checked);const resources=structuredClone(config.resources),blob=URL.createObjectURL(new Blob([new Uint8Array(draft.candidate.bytes)],{type:'image/png'}));draftBlob=blob;draftHash.current=draft.candidate.sha256;resources.scenes[config.initialScene].assets=resources.scenes[config.initialScene].assets.map(a=>a.kind==='background'?{...a,path:blob,sha256:draft.candidate!.sha256,bytes:draft.candidate!.bytes.length}:a);loader=new SceneReadiness(resources,(resource,signal)=>loadBrowserSceneResource(resource,signal,document.baseURI,(input,init)=>{const url=String(input);return fetch(url.startsWith(blob)?blob:input,init)}));readiness.current=loader}finally{await store.close()}}
   let sheet=heroSheet,heroGraphic='hero'
   if(actorDraftId){const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{const draft=await store.get(actorDraftId);if(!draft)throw Error('SPRITE_MISSING');const candidate=await inspectActorMapCandidate(draft,actorDraftId,decodeSpritePixels);actorBlob=await spritePreviewUrl(candidate.png);const texture=await Assets.load({src:actorBlob,parser:'loadTextures'});if(texture?.width!==candidate.width||texture?.height!==candidate.height)throw Error('SPRITE_TEXTURE_NOT_READY');sheet=actorSheet(candidate.id,actorBlob,candidate.width,candidate.height,candidate.baselines,candidate.scale,candidate.centers);heroGraphic=candidate.id}finally{await store.close()}}
   if(deviceDraftId){const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{const draft=await store.get(deviceDraftId);if(!draft)throw Error('SPRITE_MISSING');const checked=await inspectDeviceMapCandidate(draft,deviceDraftId,decodeSpritePixels);deviceBlob=await spritePreviewUrl(checked.png);const texture=await Assets.load({src:deviceBlob,parser:'loadTextures'});if(texture?.width!==checked.png.width||texture?.height!==checked.png.height)throw Error('SPRITE_TEXTURE_NOT_READY');device.current=checked;deviceStateRef.current=checked.states[0];setDeviceState(checked.states[0])}finally{await store.close()}}
   const initial=await loader.prepare(config.initialScene);if(!mounted.current){URL.revokeObjectURL(initial.background);return}
   setBackground(initial.background)
   createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:Object.keys(config.resources.scenes),initialScene:config.initialScene,initialPosition:spawn,heroGraphic,spritesheets:[sheet,...(device.current?[deviceCandidateSheet(device.current,deviceBlob)]:[])],mapEvents:s=>{if(!device.current)return [];const at=deviceCandidatePlacement(s);return [{id:device.current.id+'-'+s,x:at.x,y:at.y-1,event:{onInit(this:RpgPlayer){this.setHitbox(1,1);this.through=true;deviceEvents.current.set(s,this);applyDevice(this,deviceStateRef.current)}}}]},walkable,safePosition:(p,s)=>walkable(p,s)?p:world.scenes.find(room=>room.id===s)!.spawn,findPath:(a,b,s)=>findGridPath(a,b,p=>walkable(p,s)),onPosition:setPosition,onDestination:setDestination,onReady:r=>{if(!mounted.current){r.destroy();return}runtime.current=r;setEngineReady(true);probe=setInterval(()=>setRendered(r.renderedPosition()),150);void enterScene(config.initialScene)}})
  }catch{if(mounted.current){setSwitching(false);setError(actorDraftId||deviceDraftId?t('人物、设备候选或场景未通过检查，请返回准备页核对。','The actor, device candidate or scene failed validation. Check the preparation page.'):t('初始场景未通过检查，请重新载入。','Initial scene validation failed. Reload to retry.'))}}})()
  return()=>{mounted.current=false;if(draftBlob)URL.revokeObjectURL(draftBlob);if(actorBlob){void Assets.unload(actorBlob).catch(()=>{});URL.revokeObjectURL(actorBlob);}if(deviceBlob){void Assets.unload(deviceBlob).catch(()=>{});URL.revokeObjectURL(deviceBlob)}deviceEvents.current.clear();if(probe)clearInterval(probe);runtime.current?.destroy();for(const id of Object.keys(config.resources.scenes)){const url=loader.background(id);if(url)URL.revokeObjectURL(url)}}
 },[])
 function walk(p:RendererPoint){if(!ready)return;const accepted=runtime.current?.walkTo(p);setNotice(accepted?'':t('这里不可通行','This area is blocked'));if(reviewing&&scene===config.initialScene&&p.x===188&&p.y===130&&accepted===false&&!walkable(p,scene))setReviewChecks(old=>old.includes('collision')?old:[...old,'collision'])}
 function ground(e:React.MouseEvent<HTMLDivElement>){if((e.target as HTMLElement).closest('button'))return;const rect=frame.current!.getBoundingClientRect();walk({x:(e.clientX-rect.left)*384/rect.width-4.5,y:(e.clientY-rect.top)*576/rect.height-15})}
 const river=scene===originalTrainRoom('river-valley')
 const at=deviceDraftId?deviceCandidatePlacement(scene):null
 const points:Array<{label:string;position:RendererPoint}>=at?[{label:t('走到柜前','Walk in front'),position:{x:at.x-4.5,y:at.y+(device.current?.footprint.front??0)+2}},{label:t('走到柜后','Walk behind'),position:{x:at.x-4.5,y:at.y-(device.current?.footprint.depth??12)-20}},{label:t('检查柜体阻挡','Check cabinet collision'),position:{x:at.x-4.5,y:at.y-12}}]:river?[{label:t('桥头观察位','Bridge approach'),position:{x:188,y:330}},{label:t('左侧岸边','Left bank'),position:{x:80,y:390}},{label:t('右侧岸边','Right bank'),position:{x:290,y:390}},{label:t('返回停靠方向','Train approach'),position:spawn}]:[['starter','左侧检修位','Starter side'],['brakes','右侧制动位','Brake side'],['fuel-shed','燃料棚前','Fuel frontage'],['departure-control','出站控制位','Departure position']].map(([id,zh,en])=>({label:t(zh,en),position:world.entities.find(e=>e.id===id)!.approach}))
 return <main className="cl-app cl-original-preview" data-device-state={deviceDraftId?deviceState:undefined} data-device-draft={deviceDraftId??undefined}>
  <header className="cl-header"><div><p className="cl-eyebrow">{deviceDraftId?t('设备候选状态检查 · 未准入正式游戏','Device candidate states · Not admitted to live game'):actorDraftId?t('人物候选试走 · 未准入正式游戏','Actor candidate trial · Not admitted to live game'):(platform||draftMode)&&scene===config.initialScene?t('平台背景候选 · 待质量验收','Platform background candidate · Under review'):t('原作基准素材 · 场景检查','Original baseline · Scene check')}</p><h1>{names[scene]}</h1></div></header>
  <section className="cl-world" aria-label={t('原作可行走地图','Walkable original map')}><div className="cl-map-frame" ref={frame} onClick={ground}>
   {background&&<img className="cl-backdrop" src={background} alt="" draggable={false}/>}<div id="rpg"/>
   {destination&&<div className="cl-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/576*100+'%'}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></div>}
   {!ready&&!error&&<div className="cl-loading">{t('正在准备原作地图…','Preparing original map…')}</div>}
  </div></section>
  <footer className="cl-original-checks" ref={checks}>
   <nav className="cl-art-comparison" aria-label={t('背景对照','Background comparison')}>
    <a href={`./creator.html?scene_preview=north-cape${actorSuffix}${deviceSuffix}`} aria-current={!platform&&!draftMode?'page':undefined}>{t('基准背景','Baseline')}</a>
    <a href={`./creator.html?scene_preview=north-cape&art_source=platform${actorSuffix}${deviceSuffix}`} aria-current={platform?'page':undefined}>{t('平台背景候选','Platform candidate')}</a>
    <a href="./creator.html?create_art=north-cape">{t('制作背景','Create background')}</a>
   </nav>
   {actorDraftId&&<nav className="cl-art-comparison" aria-label={t('人物候选对照','Actor comparison')}>
    <a href={`./creator.html?scene_preview=north-cape${backgroundSuffix}${deviceSuffix}`}>{t('退回基准人物','Use baseline actor')}</a>
    <a href="./creator.html?create_art=sprite">{t('返回人物准备','Back to sprite preparation')}</a>
   </nav>}
   {deviceDraftId&&<>
    <nav className="cl-art-comparison" aria-label={t('设备候选对照','Device comparison')}>
     <a href={`./creator.html?scene_preview=north-cape${backgroundSuffix}${actorSuffix}`}>{t('移除设备候选','Remove device candidate')}</a>
     <a href="./creator.html?create_art=sprite">{t('返回设备准备','Back to device preparation')}</a>
    </nav>
    <div aria-label={t('设备状态','Device state')}>{(device.current?.states??DEVICE_STATES).map((state,i)=><button key={state} aria-pressed={deviceState===state} disabled={!ready||switching} onClick={()=>changeDevice(state)}>{state==='broken'?t('修复前','Before repair'):state==='repaired'?t('修复后','After repair'):[t('关柜','Closed'),t('开柜有物','Open, stocked'),t('开柜空置','Open, empty')][i]}</button>)}</div>
   </>}
   <label>{t('检查场景','Inspect scene')}<select aria-label={t('检查场景','Inspect scene')} disabled={!engineReady||switching} value={requested} onChange={e=>void enterScene(e.target.value)}>{Object.keys(names).map(id=><option key={id} value={id}>{names[id]}</option>)}</select></label>
   <p>{notice||t('点地面行走 · 人物与剧情尚待接入。','Click to walk · Cast and story are not connected yet.')}</p>
   <div>
    {points.map(p=><button disabled={!ready} key={p.label} onClick={()=>walk(p.position)}>{p.label}</button>)}
    <button disabled={!ready} onClick={()=>walk({x:188,y:river?250:130})}>{river?t('检查水面阻挡','Check water collision'):t('检查车体碰撞','Check train collision')}</button>
    <button disabled={!ready} onClick={()=>walk(spawn)}>{t('返回空地','Return to apron')}</button>
   </div>
   {reviewing&&<details className="cl-background-review"><summary>{t('背景检查','Background checks')} {reviewChecks.length}/5</summary><p>{t('先完成四个位置与车体阻挡检查，再确认俯视角度、比例和通道与画面一致。','Visit all four positions and check train collision, then confirm the overhead view, proportions and clear paths match the image.')}</p><button disabled={!ready||reviewChecks.length!==5||reviewBusy} onClick={()=>void saveReview()}>{reviewSaved?t('画面检查已保存','Visual review saved'):t('确认画面并完成检查','Confirm the image and finish review')}</button>{reviewSaved&&<a href="./creator.html?create_art=north-cape">{t('返回制作页发布背景','Return to publish the background')}</a>}</details>}
   <output aria-label={t('运行位置','Runtime position')} data-scene={runtime.current?.renderedScene()??''}>{Math.round(position.x)},{Math.round(position.y)} · {t('画面','Rendered')} {rendered?`${Math.round(rendered.x)},${Math.round(rendered.y)}`:'—'}</output>
  </footer>
  {error&&<aside className="cl-error" role="alert"><p>{error}</p>{(actorDraftId||deviceDraftId)&&<a href="./creator.html?create_art=sprite">{t('返回人物准备检查候选','Inspect the candidate in sprite preparation')}</a>}{draftMode&&<a href="./creator.html?create_art=north-cape">{t('返回制作页选择候选','Choose a candidate in the creator')}</a>}<button onClick={()=>engineReady?void enterScene(requested):location.reload()}>{engineReady?t('重试','Retry'):t('重新载入','Reload')}</button></aside>}
 </main>
}
