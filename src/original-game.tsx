import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRpgRenderer,type RpgRendererRuntime,type RendererPoint} from './rpg-renderer'
import {heroSheet} from './sprite-config'
import {findGridPath} from './grid-path'
import {originalTrainChapterSpatialPlan,originalTrainPlanWalkable} from './original-train-spatial-plan'
import {SceneReadiness,loadBrowserSceneResource,type SceneResourceManifest} from './scene-readiness'
import {originalSessionHttp} from './original-session-http'
import {originalGameEntities,originalReadingBlocks,originalGameObjective} from './original-game-projection'
import {originalPlaceLabel} from './original-place-presentation'
import type {OriginalHead} from '../server/original-train-runtime'
import './original-game.css'
declare const __ORIGINAL_STORY_PREVIEW__:SceneResourceManifest|null
const world=originalTrainChapterSpatialPlan()
type Entity=ReturnType<typeof originalGameEntities>[number]
type Panel='nearby'|'log'|'bag'|'people'|'ending'|'action'|null
/** Same game, explicitly loopback-only until every asset category is admitted. */
export default function OriginalGame(){
 const [connection]=useState(()=>originalSessionHttp(window.alteruLocalStorage,async(name,work)=>{if(!navigator.locks)throw Error('CLOUD_LOCKS_UNAVAILABLE');return navigator.locks.request(name,work)}))
 const [loader]=useState(()=>new SceneReadiness(__ORIGINAL_STORY_PREVIEW__!,loadBrowserSceneResource))
 const [head,setHead]=useState<OriginalHead|null>(null),headRef=useRef(head);headRef.current=head
 const [position,setPosition]=useState<RendererPoint>({x:192,y:430}),pos=useRef(position);pos.current=position
 const [background,setBackground]=useState(''),[destination,setDestination]=useState<RendererPoint|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[input,setInput]=useState(''),[panel,setPanel]=useState<Panel>(null),[selected,setSelected]=useState<string|null>(null)
 const runtime=useRef<RpgRendererRuntime|null>(null),frame=useRef<HTMLDivElement>(null),hud=useRef<HTMLElement>(null),footer=useRef<HTMLElement>(null),busyRef=useRef(true),mounted=useRef(true)
 const scene=head?.sceneId,locale=head?.save.locale??(navigator.language.startsWith('zh')?'zh':'en'),t=(zh:string,en:string)=>locale==='zh'?zh:en
 const entities=head?originalGameEntities(head):[],entity=entities.find(e=>e.id===selected),save=head?.save
 const setWorking=(v:boolean)=>{busyRef.current=v;setBusy(v)}
 function camera(){const f=frame.current;if(!f)return;const box=f.parentElement!,scale=f.clientWidth/384,top=hud.current?.offsetHeight??100,bottom=footer.current?.offsetHeight??90,space=Math.max(120,box.clientHeight-top-bottom);f.style.setProperty('--camera-y',Math.min(top,Math.max(box.clientHeight-bottom-f.clientHeight,top+space*.55-(pos.current.y+15)*scale))+'px');f.style.setProperty('--camera-x',Math.min(0,Math.max(box.clientWidth-f.clientWidth,box.clientWidth/2-(pos.current.x+4.5)*scale))+'px')}
 useLayoutEffect(camera,[position.x,position.y,scene,head?.version])
 useEffect(()=>{const o=new ResizeObserver(camera);for(const el of [frame.current,frame.current?.parentElement,hud.current,footer.current])if(el)o.observe(el);return()=>o.disconnect()},[])
 async function restore(next:OriginalHead){
  runtime.current?.pause(true);setReady(false);headRef.current=next;setHead(next)
  const prepared=await loader.prepare(next.sceneId,true);if(!mounted.current)return
  if(!runtime.current)await new Promise<void>((resolve,reject)=>{try{createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:world.scenes.map(s=>s.id),initialScene:next.sceneId,initialPosition:next.position,heroGraphic:'hero',spritesheets:[heroSheet],mapEvents:()=>[],walkable:(p,s)=>originalTrainPlanWalkable(s,p),safePosition:(p,s)=>originalTrainPlanWalkable(s,p)?p:world.scenes.find(r=>r.id===s)!.spawn,findPath:(a,b,s)=>findGridPath(a,b,p=>originalTrainPlanWalkable(s,p)),onPosition:p=>{pos.current=p;setPosition(p)},onDestination:setDestination,onReady:r=>{runtime.current=r;resolve()}})}catch(e){reject(e)}})
  await runtime.current!.restore(next.position,next.sceneId);if(!mounted.current)return
  loader.activate(next.sceneId);setBackground(prepared.background);setPosition(runtime.current!.position());setReady(true)
 }
 async function init(){setWorking(true);setError('');runtime.current?.pause(true);try{const h=await connection.client.enroll(locale);const recovered=await connection.client.recover();const next=recovered?.head??h;await restore(next);setPanel(next.version===0?'log':next.save.finale.status==='complete'?'ending':null)}catch(e){setError(e instanceof Error?e.message:'NETWORK_ERROR')}finally{setWorking(false)}}
 useEffect(()=>{mounted.current=true;void init();return()=>{mounted.current=false;runtime.current?.destroy();for(const s of world.scenes){const blob=loader.background(s.id);if(blob)URL.revokeObjectURL(blob)}}},[])
 useEffect(()=>{runtime.current?.pause(busy||!ready||Boolean(panel)||Boolean(error))},[busy,ready,panel,error])
 useEffect(()=>{const checkpoint=()=>{const h=headRef.current;if(h&&runtime.current&&!busyRef.current&&runtime.current.renderedScene()===h.sceneId)void connection.api('/sessions/'+h.id+'/position',{position:pos.current,sceneId:h.sceneId,expected_version:h.version}).catch(()=>{})};const timer=setInterval(checkpoint,2000);const hide=()=>{if(document.hidden){runtime.current?.move(0,0);checkpoint()}};document.addEventListener('visibilitychange',hide);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hide)}},[])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busyRef.current)setPanel(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
 useEffect(()=>{if(!panel)return;const box=document.querySelector<HTMLElement>('.og-sheet'),previous=document.activeElement as HTMLElement;const items=()=>Array.from(box?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')??[]);items()[0]?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const all=items(),i=all.indexOf(document.activeElement as HTMLElement);if(!all.length)return;if(e.shiftKey&&i<=0){e.preventDefault();all.at(-1)!.focus()}else if(!e.shiftKey&&(i===all.length-1||i<0)){e.preventDefault();all[0].focus()}};window.addEventListener('keydown',trap);return()=>{window.removeEventListener('keydown',trap);previous?.focus()}},[panel])
 useLayoutEffect(()=>{if(panel==='log'){const scroll=document.querySelector<HTMLElement>('.og-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight}},[panel,head?.version])
 function open(e:Entity){if(busyRef.current||!ready)return;setNotice(t('正在走近…','Walking closer…'));const h=headRef.current!;const arrive=()=>{if(headRef.current?.version!==h.version)return;setSelected(e.id);setInput('');setNotice('');setPanel('action')};if(Math.hypot(pos.current.x-e.approach.x,pos.current.y-e.approach.y)<8)arrive();else if(!runtime.current?.walkTo(e.approach,arrive))setNotice(t('这里暂时无法到达。','This point cannot be reached.'))}
 async function submit(choice?:{id:string;label:string}){const h=headRef.current,e=entity;if(!h||!e||busyRef.current)return;setWorking(true);setError('');runtime.current?.pause(true);try{
  for(const portal of world.portals.filter(p=>p.fromScene===h.sceneId&&world.entities.find(x=>x.id===e.id)?.actions.includes(p.actionId)))await loader.prepare(portal.scene,true)
  const r=await connection.client.send(h,{target:e.id,position:pos.current,...(choice?{type:'action',action:choice.id}:{type:'free-input',text:input})});await restore(r.head);setPanel('log');setInput('');setNotice(r.accepted===false?t('这项行动当前未能执行。','This action could not be performed.'):t('进度已保存','Progress saved'))
 }catch(err){setError(err instanceof Error?err.message:'NETWORK_ERROR')}finally{setWorking(false)}}
 async function finish(){const h=headRef.current;if(!h||busyRef.current)return;setWorking(true);setError('');try{const r=await connection.client.sendEnding(h);await restore(r.head);setPanel('ending')}catch(e){setError(e instanceof Error?e.message:'NETWORK_ERROR')}finally{setWorking(false)}}
 function ground(e:React.MouseEvent){if(busyRef.current||!ready||panel)return;const r=frame.current!.getBoundingClientRect();setNotice('');runtime.current?.walkTo({x:(e.clientX-r.left)*384/r.width-4.5,y:(e.clientY-r.top)*576/r.height-15})}
 const latest=save?originalReadingBlocks(save).at(-1):undefined
 return <main className="og-game" data-scene={scene??''} data-version={head?.version??-1}>
  <section className="og-world" aria-label={t('原作地图','Original map')}><div ref={frame} className="og-map" onClick={ground}>
   {background&&<img className="og-background" src={background} alt="" draggable={false}/>}<div id="rpg"/>
   {ready&&entities.map((e,i)=><button className="og-marker" key={e.id} aria-label={e.person?.name??e.actions[0]?.label} style={{left:e.position.x/384*100+'%',top:e.position.y/576*100+'%'}} onClick={ev=>{ev.stopPropagation();open(e)}} disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M7 12h10"/></svg><span>{e.person?.name??String(i+1)}</span></button>)}
   {destination&&<svg className="og-destination" viewBox="0 0 24 24" style={{left:(destination.x+4.5)/384*100+'%',top:(destination.y+15)/576*100+'%'}}><circle cx="12" cy="12" r="9"/></svg>}
  </div></section>
  <header className="og-hud" ref={hud}><small>{t('原作流程开发版 · 美术未完成','Original story development · Draft art')}</small><h1>{head?originalPlaceLabel(head.sceneId,head.save):t('正在连接旅程','Connecting journey')}</h1><div className="og-stats">{save&&Object.entries(save.stats).map(([id,value])=><span key={id}>{({fuel:t('燃料','Fuel'),condition:t('车况','Condition'),morale:t('人心','Morale')} as Record<string,string>)[id]??id} <b>{value}</b></span>)}</div></header>
  <footer className="og-footer" ref={footer}><p>{notice||(head?originalGameObjective(head):t('正在读取进度…','Reading progress…'))}</p><nav>{(['log','bag','people'] as const).map((p,i)=><button key={p} disabled={!head||busy} onClick={()=>setPanel(p)}>{[t('记录','Journal'),t('行囊','Inventory'),t('人物','People')][i]}</button>)}<button disabled={!ready||busy} onClick={()=>setPanel('nearby')}>{t('附近','Nearby')}</button></nav>{save?.finale.status==='ready'&&<button className="og-primary" onClick={()=>void finish()} disabled={busy}>{t('展开结局','Continue to the ending')}</button>}{save?.finale.status==='complete'&&<button onClick={()=>setPanel('ending')}>{t('查看结局','View ending')}</button>}</footer>
  {(!ready||busy)&&!error&&<div className="og-loading" role="status">{t('正在准备，请稍候…','Preparing, please wait…')}</div>}
  {panel&&save&&<div className="og-scrim"><section className="og-sheet" role="dialog" aria-modal="true" aria-label={t('旅程面板','Journey panel')}><header><h2>{panel==='action'?(entity?.person?.name??t('附近物件','Nearby object')):({nearby:t('附近可前往的位置','Places to approach'),log:t('旅程记录','Journey journal'),bag:t('行囊','Inventory'),people:t('认识的人','People met'),ending:t('旅程结局','Journey ending')} as Record<string,string>)[panel]}</h2><button onClick={()=>setPanel(null)} disabled={busy} aria-label={t('关闭面板','Close panel')}><svg viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></svg></button></header><div className="og-scroll">
   {panel==='nearby'&&entities.map(e=><button className="og-choice" key={e.id} onClick={()=>{setPanel(null);runtime.current?.pause(false);open(e)}}>{e.person?.name??e.actions[0]?.label}</button>)}
   {panel==='action'&&entity&&<><p>{entity.person?.detail??t('请选择当前可做的行动。','Choose an available action.')}</p>{entity.actions.map(a=><button className="og-choice" key={a.id} disabled={busy} onClick={()=>void submit(a)}>{a.label}</button>)}<form onSubmit={e=>{e.preventDefault();void submit()}}><label htmlFor="og-input">{t('输入行动（当前支持目录中的完整句）','Enter an action (currently supports listed full phrases)')}</label><input id="og-input" value={input} maxLength={500} onChange={e=>setInput(e.target.value)} disabled={busy}/><button disabled={busy||!input.trim()} type="submit">{t('执行','Act')}</button></form></>}
   {panel==='log'&&<>{originalReadingBlocks(save).map(b=><p key={b.id} data-kind={b.kind} data-latest={b.id===latest?.id?'true':undefined}>{b.speaker&&<strong>{b.speaker} · </strong>}{b.text}</p>)}</>}
   {panel==='bag'&&<>{save.inventory.length?save.inventory.map(i=><article key={i.id}><h3>{i.label} × {i.count}</h3><p>{i.lore}</p></article>):<p>{t('行囊暂时为空。','Your inventory is empty.')}</p>}</>}
   {panel==='people'&&save.characters.map(c=><article key={c.id}><h3>{c.name}{save.partyMemberIds.includes(c.id)?t(' · 同行',' · Traveling'):''}</h3><p>{c.detail}</p>{save.relationships.filter(r=>r.characterId===c.id).map((r,i)=><p key={i}>{r.source} {r.delta>0?'+':''}{r.delta}</p>)}</article>)}
   {panel==='ending'&&save.finale.ending&&<><h3>{save.finale.ending.title}</h3><p>{save.finale.ending.thesis}</p>{save.finale.ending.finaleScenes.map((s,i)=><p key={i}>{s}</p>)}<h3>{t('承担的代价','Costs accepted')}</h3>{save.finale.ending.irreversibleCosts.map((s,i)=><p key={i}>{s}</p>)}{save.finale.ending.characterEpilogues.map(e=><article key={e.characterId}><h3>{save.characters.find(c=>c.id===e.characterId)?.name}</h3><p>{e.text}</p></article>)}{save.finale.ending.regionalEpilogues.map(e=><article key={e.regionId}><h3>{save.map.find(m=>m.id===e.regionId)?.label}</h3><p>{e.text}</p></article>)}</>}
  </div></section></div>}
  {error&&<aside className="og-error" role="alert"><p>{t('操作尚未确认，进度与待确认请求会保留。','The operation is not confirmed. Progress and pending requests are preserved.')}</p><small>{error}</small><button disabled={busy} onClick={()=>void init()}>{t('重新连接并恢复','Reconnect and recover')}</button></aside>}
 </main>
}
