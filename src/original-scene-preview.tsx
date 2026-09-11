import {rendererNeedsPageReload} from './renderer-transition'
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
import {BrowserSpriteDrafts,spriteDatabaseName,type SpriteDraft} from './sprite-draft'
import {decodeSpritePixels,spritePreviewUrl} from './sprite-browser-io'
import {inspectActorMapCandidate,type ActorPreview} from './sprite-map-candidate'
import {ActorMapTrial,ACTOR_MAP_CHECKS,actorMapReview} from './actor-map-review'
import {currentActorReview,actorReviewStatus,saveActorMapReview} from './actor-sheet-review'
import {DEVICE_CHECKS,DEVICE_LAYOUT,deviceGeometry,sameDeviceGeometry} from './device-publication'
import {BACKGROUND_CHECKS,BACKGROUND_LAYOUT} from './background-publication'
import './original-scene-preview.css'
import {useLayeredMapTrial} from './layered-map-trial'
declare const __ORIGINAL_SCENE_PREVIEW__:{initialScene:string;resources:SceneResourceManifest;platformResources:SceneResourceManifest}|null
/** In-project renderer workbench. No StorySave, authority or synthetic quests. */
export default function OriginalScenePreview(){
 const query=new URLSearchParams(location.search),source=query.get('art_source'),platform=source==='platform',draftMode=source==='draft',actorDraftId=query.get('actor_draft'),deviceDraftId=query.get('device_draft'),layeredDraftId=query.get('layered_draft')
 const actorSuffix=actorDraftId?'&actor_draft='+encodeURIComponent(actorDraftId):'',backgroundSuffix=draftMode?'&art_source=draft&draft='+encodeURIComponent(query.get('draft')??''):platform?'&art_source=platform':''
 const layeredSuffix=layeredDraftId?'&layered_draft='+encodeURIComponent(layeredDraftId):''
 const deviceSuffix=deviceDraftId?'&device_draft='+encodeURIComponent(deviceDraftId):''
 const device=useRef<DevicePreview|null>(null),deviceEvents=useRef(new Map<string,RpgPlayer>()),deviceStateRef=useRef<DeviceState>('closed')
 const actor=useRef<{draft:SpriteDraft;candidate:ActorPreview}|null>(null),actorTrial=useRef(new ActorMapTrial())
 const [actorChecks,setActorChecks]=useState<string[]>([]),[actorSheetPassed,setActorSheetPassed]=useState(false),[actorSaved,setActorSaved]=useState(false)
 const [deviceState,setDeviceState]=useState<DeviceState>('closed')
 const [reviewChecks,setReviewChecks]=useState<string[]>([]),[reviewSaved,setReviewSaved]=useState(false),[reviewBusy,setReviewBusy]=useState(false),draftHash=useRef('')
 function applyDevice(event:RpgPlayer,state:DeviceState){const id=device.current!.id;if(event.graphics()[0]!==id)event.setGraphic(id);event.animationFixed=true;event.animationName.set(state);event.syncChanges()}
 function changeDevice(state:DeviceState){if(!ready||switching)return;deviceStateRef.current=state;setDeviceState(state);const e=deviceEvents.current.get(scene);if(e)applyDevice(e,state)}
 function walkable(p:RendererPoint,s:string){return originalTrainPlanWalkable(s,p)&&(!device.current||!deviceCandidateBlocks(device.current,s,p))&&!layer.blocks(p,s)}
 const rawConfig=__ORIGINAL_SCENE_PREVIEW__!,config={...rawConfig,resources:platform?rawConfig.platformResources:rawConfig.resources},world=originalTrainSpatialPlan(),spawn=world.scenes.find(s=>s.id===config.initialScene)!.spawn
 const checks=useRef<HTMLElement>(null),frame=useRef<HTMLDivElement>(null),runtime=useRef<RpgRendererRuntime|null>(null),readiness=useRef<SceneReadiness|null>(null),mounted=useRef(true),busy=useRef(false)
 const [position,setPosition]=useState(spawn),[destination,setDestination]=useState<RendererPoint|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[background,setBackground]=useState(''),[notice,setNotice]=useState(''),[rendered,setRendered]=useState<RendererPoint|null>(null),[scene,setScene]=useState(config.initialScene),[requested,setRequested]=useState(config.initialScene),[engineReady,setEngineReady]=useState(false),[switching,setSwitching]=useState(true),[reloadRequired,setReloadRequired]=useState(false)
 const zh=navigator.language.startsWith('zh'),t=(a:string,b:string)=>zh?a:b
 const names:Record<string,string>={[originalTrainRoom('dead-station')]:t('北岬站检修区','North Cape apron'),[originalTrainRoom('river-valley')]:t('河谷断桥近岸','River Valley near bank')}
 const positionRef=useRef(position);positionRef.current=position
 const layer=useLayeredMapTrial(layeredDraftId,{scene,ready:ready&&!switching,position,rendered,walk})
 const reviewing=draftMode&&!actorDraftId&&!deviceDraftId&&!layeredDraftId
 const deviceReviewing=Boolean(deviceDraftId)&&!actorDraftId&&device.current?.states[0]==='broken'
 async function saveActorReview(){
  const loaded=actor.current;if(reviewBusy||!loaded||!actorSheetPassed||!ACTOR_MAP_CHECKS.every(c=>actorChecks.includes(c)))return
  setReviewBusy(true)
  try{await navigator.locks.request(spriteDatabaseName(location.href),async()=>{const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{
   const saved=await saveActorMapReview(store,loaded.draft,actorMapReview(loaded.candidate,actorTrial.current.result()),loaded.candidate,decodeSpritePixels)
   actor.current={...loaded,draft:saved};setActorSaved(true)
  }finally{await store.close()}})}catch{setNotice(t('人物检查未能保存。候选或图集判断可能已变化，请返回制作页核对。','Actor review could not be saved. The candidate or sheet review may have changed; check it in the creator.'))}finally{setReviewBusy(false)}
 }
 function observeActor(){
  if(!actor.current)return
  actorTrial.current.sample(document.hidden?null:runtime.current?.motion?.()??null,performance.now())
  const next=actorTrial.current.result();setActorChecks(old=>old.join(',')===next.join(',')?old:next)
 }
 useEffect(()=>{
  const c=device.current;if(!deviceReviewing||!c||!ready||scene!==config.initialScene||!rendered||Math.hypot(position.x-rendered.x,position.y-rendered.y)>1.5)return
  const a=deviceCandidatePlacement(scene,c),hits:string[]=[deviceStateRef.current]
  if(Math.hypot(position.x-(a.x-4.5),position.y-(a.y+c.footprint.front+2))<3)hits.push('front')
  if(Math.hypot(position.x-(a.x-4.5),position.y-(a.y-c.footprint.depth-20))<3)hits.push('back')
  setReviewChecks(old=>hits.every(k=>old.includes(k))?old:[...new Set([...old,...hits])])
 },[ready,rendered,position,scene])
 async function saveDeviceReview(){
  if(reviewBusy||!device.current||!DEVICE_CHECKS.every(c=>reviewChecks.includes(c)))return;setReviewBusy(true)
  try{await navigator.locks.request(spriteDatabaseName(location.href),async()=>{const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{
   const d=await store.get();if(d?.id!==deviceDraftId)throw Error('DRAFT_REPLACED')
   const c=await inspectDeviceMapCandidate(d,d.id,decodeSpritePixels);if(c.png.sha256!==device.current!.png.sha256||!sameDeviceGeometry(c,device.current!))throw Error('DRAFT_REPLACED')
   await store.save({...d,deviceReview:{sha256:c.png.sha256,layout:DEVICE_LAYOUT,geometry:deviceGeometry(c.cellWidth,c.cellHeight,c.foot,c.bounds),checks:[...DEVICE_CHECKS],visualAccepted:true}},d);setReviewSaved(true)
  }finally{await store.close()}})}catch{setNotice(t('检查记录未能保存，请返回制作页核对候选。','The review could not be saved. Check the candidate in the creator.'))}finally{setReviewBusy(false)}
 }
 // A four-unit path grid can stop sqrt(8) units from an authored approach.
 useEffect(()=>{if(!reviewing||!ready||scene!==config.initialScene||!rendered||Math.hypot(position.x-rendered.x,position.y-rendered.y)>1.5)return;const ids=world.entities.filter(e=>BACKGROUND_CHECKS.includes(e.id as any)&&Math.hypot(position.x-e.approach.x,position.y-e.approach.y)<3).map(e=>e.id);if(ids.length)setReviewChecks(old=>ids.every(id=>old.includes(id))?old:[...new Set([...old,...ids])])},[ready,position,rendered,scene])
 async function saveReview(){if(reviewBusy||reviewChecks.length!==5)return;setReviewBusy(true);try{await navigator.locks.request(artDraftDatabaseName(location.href),async()=>{const store=new BrowserArtDrafts(artDraftDatabaseName(location.href));try{const d=await store.get();if(d?.id!==query.get('draft')||!d?.candidate||d.candidate.sha256!==draftHash.current)throw Error('DRAFT_REPLACED');d.review={sha256:d.candidate.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true};await store.put(d);setReviewSaved(true)}finally{await store.close()}})}catch{setNotice(t('检查记录未能保存，请返回制作页核对候选。','The review could not be saved. Check the candidate in the creator.'))}finally{setReviewBusy(false)}}
 function camera(){const f=frame.current;if(!f)return;const viewport=f.parentElement!,scale=f.clientWidth/384;const immersive=matchMedia('(max-width:699px),(max-height:500px)').matches;const visibleHeight=Math.max(100,viewport.clientHeight-(checks.current?.offsetHeight??0));f.style.setProperty('--camera-x',`${immersive?Math.max(Math.min(0,viewport.clientWidth-f.clientWidth),Math.min(0,viewport.clientWidth*.5-(positionRef.current.x+4.5)*scale))-(viewport.clientWidth-f.clientWidth)/2:0}px`);f.style.setProperty('--camera-y',`${immersive?Math.max(Math.min(0,visibleHeight-f.clientHeight),Math.min(0,visibleHeight*.62-(positionRef.current.y+15)*scale)):0}px`)}
 useLayoutEffect(camera,[position.x,position.y])
 useEffect(()=>{const f=frame.current!;const observer=new ResizeObserver(camera);observer.observe(f);observer.observe(f.parentElement!);if(checks.current)observer.observe(checks.current);return()=>observer.disconnect()},[])
 async function enterScene(id:string){
  const r=runtime.current,loader=readiness.current;if(!r||!loader||busy.current)return
  busy.current=true;setSwitching(true);setReady(false);setError('');setReloadRequired(false);setNotice('');setRequested(id);r.pause(true)
  try{
   const prepared=await loader.prepare(id,true);if(!mounted.current){URL.revokeObjectURL(prepared.background);return}
   const next=world.scenes.find(s=>s.id===id)!.spawn
   await r.restore(next,id);if(!mounted.current)return
   const equipment=deviceEvents.current.get(id);if(equipment)applyDevice(equipment,deviceStateRef.current)
   layer.apply(id);loader.activate(id);setBackground(prepared.background);setScene(id);setPosition(r.position());setReady(true);r.pause(false)
  }catch(e){if(mounted.current){const reload=rendererNeedsPageReload(e instanceof Error?e.message:'');setReloadRequired(reload);setError(reload?t('地图没有完成加载，请重新载入。','The map did not finish loading. Reload to continue.'):t('场景尚未准备好，请重试。','The scene is not ready. Retry to continue.'))}}
  finally{busy.current=false;if(mounted.current)setSwitching(false)}
 }
 useEffect(()=>{
  mounted.current=true;let draftBlob='',actorBlob='',deviceBlob='';let probe:ReturnType<typeof setInterval>|undefined
  let loader=new SceneReadiness(config.resources,loadBrowserSceneResource);readiness.current=loader
  void(async()=>{try{
   if(draftMode){const store=new BrowserArtDrafts(artDraftDatabaseName(location.href));try{const draft=await store.get(query.get('draft')??'missing');if(!draft?.candidate||draft.state!=='candidate'||draft.id!==query.get('draft'))throw Error('DRAFT_NOT_READY');const checked=await decodeArtCandidate(draft.candidate);URL.revokeObjectURL(checked);const resources=structuredClone(config.resources),blob=URL.createObjectURL(new Blob([new Uint8Array(draft.candidate.bytes)],{type:'image/png'}));draftBlob=blob;draftHash.current=draft.candidate.sha256;resources.scenes[config.initialScene].assets=resources.scenes[config.initialScene].assets.map(a=>a.kind==='background'?{...a,path:blob,sha256:draft.candidate!.sha256,bytes:draft.candidate!.bytes.length}:a);loader=new SceneReadiness(resources,(resource,signal)=>loadBrowserSceneResource(resource,signal,document.baseURI,(input,init)=>{const url=String(input);return fetch(url.startsWith(blob)?blob:input,init)}));readiness.current=loader}finally{await store.close()}}
   let sheet=heroSheet,heroGraphic='hero'
   if(actorDraftId){const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{const draft=await store.get(actorDraftId);if(!draft)throw Error('SPRITE_MISSING');const candidate=await inspectActorMapCandidate(draft,actorDraftId,decodeSpritePixels);actorBlob=await spritePreviewUrl(candidate.png);const texture=await Assets.load({src:actorBlob,parser:'loadTextures'});if(texture?.width!==candidate.width||texture?.height!==candidate.height)throw Error('SPRITE_TEXTURE_NOT_READY');actor.current={draft,candidate};const review=currentActorReview(draft);setActorSheetPassed(Boolean(review&&actorReviewStatus(review.answers)==='sheet-reviewed'));sheet=actorSheet(candidate.id,actorBlob,candidate.width,candidate.height,candidate.baselines,candidate.scale,candidate.centers);heroGraphic=candidate.id}finally{await store.close()}}
   if(deviceDraftId){const store=new BrowserSpriteDrafts(spriteDatabaseName(location.href));try{const draft=await store.get(deviceDraftId);if(!draft)throw Error('SPRITE_MISSING');const checked=await inspectDeviceMapCandidate(draft,deviceDraftId,decodeSpritePixels);deviceBlob=await spritePreviewUrl(checked.png);const texture=await Assets.load({src:deviceBlob,parser:'loadTextures'});if(texture?.width!==checked.png.width||texture?.height!==checked.png.height)throw Error('SPRITE_TEXTURE_NOT_READY');device.current=checked;deviceStateRef.current=checked.states[0];setDeviceState(checked.states[0])}finally{await store.close()}}
   if(layeredDraftId&&(deviceDraftId||actorDraftId))throw Error('LAYER_CONFLICTING_PREVIEW')
   const layerSheets=await layer.load()
   const initial=await loader.prepare(config.initialScene);if(!mounted.current){URL.revokeObjectURL(initial.background);return}
   setBackground(initial.background)
   createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:Object.keys(config.resources.scenes),initialScene:config.initialScene,initialPosition:spawn,heroGraphic,spritesheets:[sheet,...layerSheets,...(device.current?[deviceCandidateSheet(device.current,deviceBlob)]:[])],mapEvents:s=>{if(!device.current)return layer.mapEvents(s);const at=deviceCandidatePlacement(s,device.current);return [{id:device.current.id+'-'+s,x:at.x,y:at.y-1,event:{onInit(this:RpgPlayer){this.setHitbox(1,1);this.through=true;deviceEvents.current.set(s,this);applyDevice(this,deviceStateRef.current)}}}]},walkable,safePosition:(p,s)=>walkable(p,s)?p:world.scenes.find(room=>room.id===s)!.spawn,findPath:(a,b,s)=>findGridPath(a,b,p=>walkable(p,s)),onPosition:setPosition,onDestination:setDestination,onReady:r=>{if(!mounted.current){r.destroy();return}runtime.current=r;setEngineReady(true);probe=setInterval(()=>{setRendered(r.renderedPosition());observeActor()},actorDraftId?50:150);void enterScene(config.initialScene)}})
  }catch{if(mounted.current){setSwitching(false);setError(actorDraftId||deviceDraftId||layeredDraftId?t('人物、设备候选或场景未通过检查，请返回准备页核对。','The actor, device candidate or scene failed validation. Check the preparation page.'):t('初始场景未通过检查，请重新载入。','Initial scene validation failed. Reload to retry.'))}}})()
  return()=>{mounted.current=false;if(draftBlob)URL.revokeObjectURL(draftBlob);if(actorBlob){void Assets.unload(actorBlob).catch(()=>{});URL.revokeObjectURL(actorBlob);}if(deviceBlob){void Assets.unload(deviceBlob).catch(()=>{});URL.revokeObjectURL(deviceBlob)}deviceEvents.current.clear();if(probe)clearInterval(probe);runtime.current?.destroy();for(const id of Object.keys(config.resources.scenes)){const url=loader.background(id);if(url)URL.revokeObjectURL(url)}}
 },[])
 function walk(p:RendererPoint){if(!ready)return;const accepted=runtime.current?.walkTo(p);layer.recordWalk(p,scene,accepted===true);if(actorDraftId){actorTrial.current.collision(scene,p.x===188&&p.y===130&&accepted===false&&!walkable(p,scene));observeActor()}setNotice(accepted?'':t('这里不可通行','This area is blocked'));if(deviceReviewing&&scene===config.initialScene&&device.current){const a=deviceCandidatePlacement(scene,device.current);if(p.x===a.x-4.5&&p.y===a.y-12&&accepted===false&&deviceCandidateBlocks(device.current,scene,p))setReviewChecks(old=>old.includes('collision')?old:[...old,'collision'])}if(reviewing&&scene===config.initialScene&&p.x===188&&p.y===130&&accepted===false&&!walkable(p,scene))setReviewChecks(old=>old.includes('collision')?old:[...old,'collision'])}
 function ground(e:React.MouseEvent<HTMLDivElement>){if((e.target as HTMLElement).closest('button'))return;const rect=frame.current!.getBoundingClientRect();walk({x:(e.clientX-rect.left)*384/rect.width-4.5,y:(e.clientY-rect.top)*576/rect.height-15})}
 const river=scene===originalTrainRoom('river-valley')
 const at=deviceDraftId?deviceCandidatePlacement(scene,device.current??undefined):null
 const points:Array<{label:string;position:RendererPoint}>=at?[{label:t('走到柜前','Walk in front'),position:{x:at.x-4.5,y:at.y+(device.current?.footprint.front??0)+2}},{label:t('走到柜后','Walk behind'),position:{x:at.x-4.5,y:at.y-(device.current?.footprint.depth??12)-20}},{label:t('检查柜体阻挡','Check cabinet collision'),position:{x:at.x-4.5,y:at.y-12}}]:river?[{label:t('桥头观察位','Bridge approach'),position:{x:188,y:330}},{label:t('左侧岸边','Left bank'),position:{x:80,y:390}},{label:t('右侧岸边','Right bank'),position:{x:290,y:390}},{label:t('返回停靠方向','Train approach'),position:spawn}]:[['starter','左侧检修位','Starter side'],['brakes','右侧制动位','Brake side'],['fuel-shed','燃料棚前','Fuel frontage'],['departure-control','出站控制位','Departure position']].map(([id,zh,en])=>({label:t(zh,en),position:world.entities.find(e=>e.id===id)!.approach}))
 const actorLabels:Record<string,string>={down:t('向下行走','Walk down'),left:t('向左行走','Walk left'),right:t('向右行走','Walk right'),up:t('背向行走','Walk away'),stand:t('停步站稳','Stop and stand'),collision:t('车体阻挡','Train collision'),river:t('河谷行走','Walk in River Valley'),return:t('返回北岬后行走停步','Walk and stop back at North Cape')}
 return <main className={`cl-app cl-original-preview${actorDraftId||layeredDraftId?' cl-original-preview--actor':''}`} data-device-state={deviceDraftId?deviceState:undefined} data-device-draft={deviceDraftId??undefined}>
  <header className="cl-header"><div><p className="cl-eyebrow">{layeredDraftId?t('分层设备检查 · 未准入正式游戏','Layered device trial · Not admitted to live game'):deviceDraftId?t('设备候选状态检查 · 未准入正式游戏','Device candidate states · Not admitted to live game'):actorDraftId?t('人物候选试走 · 未准入正式游戏','Actor candidate trial · Not admitted to live game'):(platform||draftMode)&&scene===config.initialScene?t('平台背景候选 · 待质量验收','Platform background candidate · Under review'):t('原作基准素材 · 场景检查','Original baseline · Scene check')}</p><h1>{names[scene]}</h1></div></header>
  <section className="cl-world" aria-label={t('原作可行走地图','Walkable original map')}><div className="cl-map-frame" ref={frame} onClick={ground}>
   {background&&<img className="cl-backdrop" src={background} alt="" draggable={false}/>}<div id="rpg"/>
   {destination&&<div className="cl-destination" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/576*100+'%'}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></div>}
   {!ready&&!error&&<div className="cl-loading">{t('正在准备原作地图…','Preparing original map…')}</div>}
  </div></section>
  <footer className="cl-original-checks" ref={checks}>
   <nav className="cl-art-comparison" aria-label={t('背景对照','Background comparison')}>
    <a href={`./creator.html?scene_preview=north-cape${actorSuffix}${deviceSuffix}${layeredSuffix}`} aria-current={!platform&&!draftMode?'page':undefined}>{t('基准背景','Baseline')}</a>
    <a href={`./creator.html?scene_preview=north-cape&art_source=platform${actorSuffix}${deviceSuffix}${layeredSuffix}`} aria-current={platform?'page':undefined}>{t('平台背景候选','Platform candidate')}</a>
    <a href="./creator.html?create_art=north-cape">{t('制作背景','Create background')}</a>
   </nav>
   {actorDraftId&&<nav className="cl-art-comparison" aria-label={t('人物候选对照','Actor comparison')}>
    <a href={`./creator.html?scene_preview=north-cape${backgroundSuffix}${deviceSuffix}`}>{t('退回基准人物','Use baseline actor')}</a>
    <a href="./creator.html?create_art=sprite">{t('返回人物准备','Back to sprite preparation')}</a>
   </nav>}
   {actorDraftId&&<details className="cl-background-review cl-actor-map-review"><summary>{t('人物地图检查','Actor map checks')} {actorChecks.length}/{ACTOR_MAP_CHECKS.length}</summary>
    <p>{t('每个方向连续走过至少一个完整步态周期，再停步。到河谷行走后返回北岬，检查列车阻挡；机器只记录执行，比例、透明边缘及左右腿仍需亲眼确认。','Walk at least one full stride cycle in each direction, then stop. Walk in River Valley and return to North Cape; test train collision. Execution is recorded; proportions, alpha edges and alternating legs still need visual review.')}</p>
    {!actorSheetPassed&&<p role="status">{t('图集12项尚未全部通过。可以试走，但不能保存地图通过记录。','The 12 sheet checks have not all passed. Walking is available; map approval cannot be saved.')}</p>}
    <p aria-label={t('尚待执行的人物检查','Remaining actor checks')}>{ACTOR_MAP_CHECKS.filter(c=>!actorChecks.includes(c)).map(c=>actorLabels[c]).join(' · ')||t('试走步骤完成，请确认实际画面。','Trial steps completed. Confirm the actual visuals.')}</p>
    <button disabled={!ready||!actorSheetPassed||actorChecks.length!==ACTOR_MAP_CHECKS.length||reviewBusy||actorSaved} onClick={()=>void saveActorReview()}>{actorSaved?t('人物地图检查已保存','Actor map review saved'):t('确认人物画面并保存检查','Confirm actor visuals and save review')}</button>
    <p>{t('返回人物准备页在线保存，保留此检查版本；保存不自动发布或替换角色。','Save online from sprite preparation to retain this review version. Saving never publishes or replaces a character automatically.')}</p>
   </details>}
   {deviceDraftId&&<>
    <nav className="cl-art-comparison" aria-label={t('设备候选对照','Device comparison')}>
     <a href={`./creator.html?scene_preview=north-cape${backgroundSuffix}${actorSuffix}`}>{t('移除设备候选','Remove device candidate')}</a>
     <a href="./creator.html?create_art=sprite">{t('返回设备准备','Back to device preparation')}</a>
    </nav>
    <div aria-label={t('设备状态','Device state')}>{(device.current?.states??DEVICE_STATES).map((state,i)=><button key={state} aria-pressed={deviceState===state} disabled={!ready||switching} onClick={()=>changeDevice(state)}>{state==='broken'?t('修复前','Before repair'):state==='repaired'?t('修复后','After repair'):[t('关柜','Closed'),t('开柜有物','Open, stocked'),t('开柜空置','Open, empty')][i]}</button>)}</div>
   </>}
   {layer.panel}
   <label>{t('检查场景','Inspect scene')}<select aria-label={t('检查场景','Inspect scene')} disabled={!engineReady||switching} value={requested} onChange={e=>void enterScene(e.target.value)}>{Object.keys(names).map(id=><option key={id} value={id}>{names[id]}</option>)}</select></label>
   <p>{notice||t('点地面行走 · 人物与剧情尚待接入。','Click to walk · Cast and story are not connected yet.')}</p>
   <div>
    {points.map(p=><button disabled={!ready} key={p.label} onClick={()=>walk(p.position)}>{p.label}</button>)}
    <button disabled={!ready} onClick={()=>walk({x:188,y:river?250:130})}>{river?t('检查水面阻挡','Check water collision'):t('检查车体碰撞','Check train collision')}</button>
    <button disabled={!ready} onClick={()=>walk(spawn)}>{t('返回空地','Return to apron')}</button>
   </div>
   {reviewing&&<details className="cl-background-review"><summary>{t('背景检查','Background checks')} {reviewChecks.length}/5</summary><p>{t('先完成四个位置与车体阻挡检查，再确认俯视角度、比例和通道与画面一致。','Visit all four positions and check train collision, then confirm the overhead view, proportions and clear paths match the image.')}</p><button disabled={!ready||reviewChecks.length!==5||reviewBusy} onClick={()=>void saveReview()}>{reviewSaved?t('画面检查已保存','Visual review saved'):t('确认画面并完成检查','Confirm the image and finish review')}</button>{reviewSaved&&<a href="./creator.html?create_art=north-cape">{t('返回制作页发布背景','Return to publish the background')}</a>}</details>}
   {deviceReviewing&&<details className="cl-background-review"><summary>{t('设备检查','Device checks')} {reviewChecks.length}/5</summary><p>{t('看过修复前后，走到柜前和柜后，再检查柜体阻挡。确认铜线圈身份、透明边缘、比例与当前俯视角度一致。','Observe both repair states, walk in front and behind, then check body collision. Confirm the copper-coil identity, alpha edges, scale and overhead angle.')}</p><p>{DEVICE_CHECKS.filter(c=>!reviewChecks.includes(c)).map(c=>({broken:t('修复前','Before repair'),repaired:t('修复后','After repair'),front:t('柜前','Front'),back:t('柜后','Back'),collision:t('阻挡','Collision')}[c])).join(' · ')}</p><button disabled={!ready||!DEVICE_CHECKS.every(c=>reviewChecks.includes(c))||reviewBusy} onClick={()=>void saveDeviceReview()}>{reviewSaved?t('设备检查已保存','Device review saved'):t('确认设备画面并保存检查','Confirm device visuals and save review')}</button>{reviewSaved&&<a href="./creator.html?create_art=sprite">{t('返回制作页发布设备','Return to publish the device')}</a>}</details>}
   <output aria-label={t('运行位置','Runtime position')} data-scene={runtime.current?.renderedScene()??''}>{Math.round(position.x)},{Math.round(position.y)} · {t('画面','Rendered')} {rendered?`${Math.round(rendered.x)},${Math.round(rendered.y)}`:'—'}</output>
  </footer>
  {error&&<aside className="cl-error" role="alert"><p>{error}</p>{(actorDraftId||deviceDraftId||layeredDraftId)&&<a href="./creator.html?create_art=sprite">{t('返回人物准备检查候选','Inspect the candidate in sprite preparation')}</a>}{draftMode&&<a href="./creator.html?create_art=north-cape">{t('返回制作页选择候选','Choose a candidate in the creator')}</a>}<button onClick={()=>engineReady&&!reloadRequired?void enterScene(requested):location.reload()}>{engineReady&&!reloadRequired?t('重试','Retry'):t('重新载入','Reload')}</button></aside>}
 </main>
}
