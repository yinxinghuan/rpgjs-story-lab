import type {RpgPlayer} from '@rpgjs/server'
import {Direction} from '@rpgjs/common'
import {oldStreetTalkTopics} from './old-street-conversation'
import {OldStreetPhotoView} from './old-street-photo-view'
import {oldStreetActionNames as actionNames} from './old-street-action-input'
import {oldStreetPerson} from './old-street-characters'
import {oldStreetSession,oldStreetSessionHttp} from './old-street-session'
import type {OldStreetHead} from './old-street-head'
import {Assets} from 'pixi.js'
import React, {useEffect, useRef, useState} from 'react'
import {createRpgRenderer, type RpgRendererRuntime} from './rpg-renderer'
import {actorSheet,standingActorSheet} from './actor-sheet'
import lanStandingUrl from '../doc/oldstreet-lan-candidate/standing.png'
import {actorArt} from './art-catalog'
import {oldStreetCartridge, oldStreetRooms, oldStreetOutcome, type OldStreetRoom} from './old-street-cartridge'
import {oldStreetBody, oldStreetHeroScale, oldStreetStride, bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetObstacleBodies, oldStreetProjectedProps, oldStreetPath, oldStreetWalkable} from './old-street-space'
import {OldStreetFloor} from './old-street-floor'
import {oldStreetPropState} from './old-street-prop-state'
import {createInitialSave} from './vendor/original-train/engine/reducer'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import './old-street-dev.css'

const plan = oldStreetSpatialPlan()
const propNames: Record<string, [string, string]> = {
  drawer: ['抽屉', 'Drawer'], 'letter-compartment': ['小格', 'Compartment'], 'record-book': ['记录册', 'Record book'],
  trolley: ['推车', 'Trolley'], 'laundry-owner': ['店主位置', 'Shopkeeper position'], crates: ['旧箱', 'Crates'],
  watchmaker: ['修表师位置', 'Watchmaker position'], 'photo-folder': ['照片夹', 'Photo folder'],
  'viewing-table': ['放大台', 'Viewing table'], photographer: ['摄影师位置', 'Photographer position'], 'street-exit': ['回家', 'Home'],
}
export default function OldStreetDev() {
  const locale = navigator.language.startsWith('zh') ? 'zh' : 'en'
  const text = (pair: readonly [string, string]) => pair[locale === 'zh' ? 0 : 1]
  const [cartridge] = useState(() => oldStreetCartridge(locale))
  const [head, setHead] = useState(() => ({save: createInitialSave(cartridge), scene: 'street', position: plan.scenes.find(s => s.id === 'street')!.spawn}))
  const workerPreview = new URLSearchParams(location.search).get('session') === 'worker'
  const [connection] = useState(() => (workerPreview?oldStreetSessionHttp:oldStreetSession)(window.alteruLocalStorage, async(name, work) => navigator.locks.request(name, work)))
  const serverHead = useRef<OldStreetHead>()
  const current = useRef(head); current.current = head
  const position = useRef(head.position)
  const runtime = useRef<RpgRendererRuntime>()
  const engine = useRef<any>()
  const npcEvents=useRef<Record<string,RpgPlayer>>({})
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), busyRef = useRef(false)
  const [notice, setNotice] = useState(cartridge.opening.blocks[0].text), [error, setError] = useState('')
  const [photoOpen,setPhotoOpen]=useState(false),[photoMessage,setPhotoMessage]=useState('')
  const [typed, setTyped] = useState('')
  const [selected, setSelected] = useState<string | null>(null), [leaving, setLeaving] = useState(false)
  const [feet, setFeet] = useState(head.position), [destination, setDestination] = useState<{x: number; y: number} | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [diagnostic, setDiagnostic] = useState('')
  useEffect(() => {const timer = setInterval(() => setDiagnostic(JSON.stringify({sheets:engine.current?.getCurrentPlayer()?.graphicsSignals().map((g:any)=>({keys:Object.keys(g),width:g.width,height:g.height,textures:Object.keys(g.textures??{})})),players:Object.keys(engine.current?.sceneMap.players() ?? {}).length,motion:runtime.current?.motion?.(),render:runtime.current?.diagnostics?.()})), 2000); return () => clearInterval(timer)}, [])
  useEffect(() => {
    const hero = actorArt.balanced.hero
    let mounted = true
    let heroBlob: string | undefined
    let watchmakerBlob: string | undefined
    let lanBlob: string | undefined
    void (async () => {try {
      let restored = await connection.client.enroll(locale)
      const recovered = await connection.client.recover()
      if (recovered) restored = recovered.head
      if (!mounted) return
      serverHead.current = restored
      const restoredView = {save:restored.save,scene:restored.sceneId,position:restored.position}
      current.current = restoredView; setHead(restoredView); position.current = restored.position; setFeet(restored.position)
      setNotice(text(['已恢复旅程。', 'Journey restored.']))
      const preview = new Image()
      const response = await fetch(new URL(hero.path, document.baseURI))
      if (!response.ok) throw Error('HERO_LOAD_FAILED')
      heroBlob = URL.createObjectURL(await response.blob())
      preview.src = heroBlob
      await preview.decode()
      await Assets.load({src: heroBlob, parser: 'loadTextures'})
      const npcArt=actorArt.balanced.mechanic
      const npcResponse=await fetch(new URL(npcArt.path,document.baseURI));if(!npcResponse.ok)throw Error('WATCHMAKER_LOAD_FAILED')
      watchmakerBlob=URL.createObjectURL(await npcResponse.blob());await Assets.load({src:watchmakerBlob,parser:'loadTextures'})
      const lanResponse=await fetch(lanStandingUrl);if(!lanResponse.ok)throw Error('LAN_LOAD_FAILED')
      lanBlob=URL.createObjectURL(await lanResponse.blob());await Assets.load({src:lanBlob,parser:'loadTextures'})
      if (!mounted) return
      createRpgRenderer({host: document.getElementById('rpg')!, width: 384, height: 576,
        sceneIds: plan.scenes.map(s => s.id), mapIds: Object.fromEntries(plan.scenes.map(s => [s.id, `oldstreet-${s.id}`])),
        initialScene: restored.sceneId, initialPosition: restored.position, heroGraphic: 'hero', heroBody:oldStreetBody, strideLength:oldStreetStride,
        spritesheets: [actorSheet('hero', preview.src, hero.width, hero.height, hero.baselines, oldStreetHeroScale, hero.centers, {x:oldStreetBody.w/2,y:oldStreetBody.h}),actorSheet('oldstreet-watchmaker',watchmakerBlob,npcArt.width,npcArt.height,npcArt.baselines,.22,npcArt.centers,{x:16,y:28}),standingActorSheet('oldstreet-lan',lanBlob,256,352,{x:128,y:328},.22,{x:16,y:28})], mapEvents: room => {npcEvents.current={};return oldStreetProjectedProps(current.current.save).filter(p=>p.room===room&&['watchmaker','laundry-owner'].includes(p.id)).map(p=>({id:'oldstreet-'+p.id,x:p.body.x,y:p.body.y,event:{onInit(this:RpgPlayer){this.setHitbox(p.body.w,p.body.h);this.through=true;this.animationFixed=true;this.setGraphic(p.id==='watchmaker'?'oldstreet-watchmaker':'oldstreet-lan');this.animationName.set('stand');this.direction.set(Direction.Down);npcEvents.current[p.id]=this;this.syncChanges()}}}))},
        walkable: (p, room) => oldStreetWalkable(room, p, current.current.save),
        safePosition: (p, room) => oldStreetWalkable(room, p, current.current.save) ? p : plan.scenes.find(s => s.id === room)!.spawn,
        findPath: (a, b, room) => oldStreetPath(room, a, b, current.current.save),
        onPosition: p => {position.current = p; if (mounted) setFeet(p);for(const [id,event] of Object.entries(npcEvents.current)){const prop=oldStreetProjectedProps(current.current.save).find(e=>e.id===id);if(!prop||prop.room!==runtime.current?.scene())continue;const dx=p.x-prop.position.x,dy=p.y-prop.position.y;if(Math.hypot(dx,dy)<96){event.direction.set(Math.abs(dx)>Math.abs(dy)?(dx>0?Direction.Right:Direction.Left):(dy>0?Direction.Down:Direction.Up));event.syncChanges()}}}, onDestination: p => {if (mounted) setDestination(p)},
        onEngine: e => {engine.current = e},
        onReady: r => {runtime.current = r; r.pause(Boolean(restored.save.facts.departed)); if (mounted) setReady(true)},
        onFailure: code => {if (mounted) setError(code)},
      })
    } catch (e) {if (mounted) setError(String(e))}})()
    return () => {mounted = false; runtime.current?.destroy(); if (heroBlob) URL.revokeObjectURL(heroBlob);if(watchmakerBlob)URL.revokeObjectURL(watchmakerBlob);if(lanBlob)URL.revokeObjectURL(lanBlob)}
  }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      const h = serverHead.current
      if (!h || !ready || busyRef.current || error || connection.client.hasPending()) return
      const p = {...position.current}
      void navigator.locks.request('oldstreet-checkpoint', async () => {
        if (busyRef.current || serverHead.current !== h) return
        try {await connection.api('/sessions/'+h.id+'/position',{sceneId:h.sceneId,expected_version:h.version,position:p})}
        catch (e) {if ((e as Error).message !== 'STALE_POSITION') {setError(String(e)); runtime.current?.pause(true)}}
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [ready,error])
  async function restart(){
    if(busyRef.current||!ready)return
    busyRef.current=true;setBusy(true);runtime.current!.pause(true)
    try{
      const h=await connection.client.enroll(locale,true)
      serverHead.current=h
      await runtime.current!.restore(h.position,h.sceneId)
      const next={save:h.save,scene:h.sceneId,position:h.position}
      current.current=next;setHead(next);position.current=h.position;setFeet(h.position);setSelected(null);setError('');setNotice(cartridge.opening.blocks[0].text)
      runtime.current!.pause(false)
    }catch(e){setError(String(e))}finally{busyRef.current=false;setBusy(false)}
  }
  function ruleFor(id: string) {return resolveDomainAction(current.current.save, cartridge, id)}
  async function execute(id: string, target: string, input?:string, photoMatch?:unknown, dialogue=false) {
    try {
      const h = serverHead.current!
      runtime.current!.pause(true)
      const result = await connection.client.send(h,{...(input===undefined?{type:'action',action:id}:{type:dialogue?'dialogue':'free-input',text:input,mode:new URLSearchParams(location.search).get('interpret')==='live'?'live':'local'}),target,position:{...position.current},...(photoMatch?{photoMatch}:{})})
      const nextHead = result.head as OldStreetHead
      serverHead.current = nextHead
      await runtime.current!.restore(nextHead.position,nextHead.sceneId)
      const next = {save:nextHead.save,scene:nextHead.sceneId,position:nextHead.position}
      current.current = next; setHead(next); position.current = next.position; setSelected(result.accepted===false && next.scene===h.sceneId ? target : null)
      setNotice(result.text ?? (result.rejectionCode==='OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'?text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']):result.rejectionCode==='OLD_STREET_INPUT_UNSUPPORTED'?text(['没有理解这一步。可以选择上面的行动，或换个说法。','I did not understand that action. Choose an action above or rephrase.']):result.rejectionCode) ?? '')
      if(id==='oldstreet:match-photos'){if(result.accepted)setPhotoOpen(false);else setPhotoMessage(text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']))}
      runtime.current!.pause(Boolean(nextHead.save.facts.departed)||(photoOpen&&!result.accepted))
    } catch (e) {setError(String(e)); runtime.current?.pause(true)}
    finally {busyRef.current = false; setBusy(false)}
  }
  function request(id: string, confirmed = false) {
    if (!ready || busyRef.current || error || current.current.save.facts.departed) return
    const binding = bindOldStreet(locale, current.current.save), target = binding.targetFor(id, current.current.scene)
    const entity = oldStreetSpatialPlan(current.current.save).entities.find(e => e.id === target)
    if (!entity || !runtime.current) return
    if (id === 'oldstreet:leave' && !confirmed) {setLeaving(true); return}
    busyRef.current = true; setBusy(true)
    const started = runtime.current.walkTo(entity.approach, () => {if(id==='oldstreet:match-photos'){setPhotoOpen(true);setPhotoMessage('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)}else void execute(id, entity.id)})
    if (!started) {busyRef.current = false; setBusy(false); setNotice(text(['这里暂时走不过去。', 'There is no clear path.']))}
  }
  function sendInput(dialogue=false,provided?:string){
    if(!chosen||!(provided??typed).trim()||!ready||busyRef.current||error||leaving||head.save.facts.departed)return
    const input=(provided??typed).trim(),target=chosen.id
    busyRef.current=true;setBusy(true)
    if(!runtime.current!.walkTo(chosen.approach,()=>{void execute('',target,input,undefined,dialogue)})){busyRef.current=false;setBusy(false)}
    else setTyped('')
  }
  const entities = oldStreetSpatialPlan(head.save).entities.filter(e => e.scene === head.scene)
  const nearest = [...entities].filter(e => Math.hypot(e.position.x - feet.x, e.position.y - feet.y) < 54)
    .sort((a, b) => Math.hypot(a.position.x - feet.x, a.position.y - feet.y) - Math.hypot(b.position.x - feet.x, b.position.y - feet.y))[0]
  const chosen = entities.find(e => e.id === selected) ?? nearest
  const knownSpeaker=chosen&&oldStreetPerson(chosen.id)&&head.save.characters.some(c=>c.id===oldStreetPerson(chosen.id)?.id)
  const talkTopics=chosen?oldStreetTalkTopics(head.save,chosen.id):[]
  const actions = chosen?.actions.filter(id => ruleFor(id)?.status === 'accepted') ?? []
  const label = (id: string) => {
    const door = oldStreetDoors().find(d => d.actionId === id)
    return door ? text(oldStreetRooms[door.destination.room]) : text(actionNames[id.replace('oldstreet:', '')] ?? [id, id])
  }
  const outcome = oldStreetOutcome(head.save)
  return <main className="os-dev">
    <header><small>{text(workerPreview?['开发白盒 · Worker 本机预检','Development blockout · Local Worker preflight']:['开发白盒 · 本机服务存档', 'Development blockout · Local server save'])}</small><h1>{text(oldStreetRooms[head.scene as OldStreetRoom])}</h1></header>
    <div className="os-stage" ref={stage} onPointerDown={e => {
      if ((e.target as HTMLElement).closest('button') || !ready || busyRef.current || leaving) return
      const r = e.currentTarget.getBoundingClientRect()
      runtime.current?.walkTo({x: (e.clientX - r.left) * 384 / r.width, y: (e.clientY - r.top) * 576 / r.height})
      setSelected(null)
    }}>
      <svg className="os-layout" viewBox="0 0 384 576" aria-hidden="true">
        <OldStreetFloor room={head.scene as OldStreetRoom}/>
        {oldStreetObstacleBodies(head.scene as OldStreetRoom, head.save).filter(b=>!oldStreetProjectedProps(head.save).some(p=>p.room===head.scene&&['watchmaker','laundry-owner'].includes(p.id)&&b.x===p.body.x&&b.y===p.body.y)).map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#70665b" stroke="#443e36"/>)}
        {destination && <circle cx={destination.x + oldStreetBody.w/2} cy={destination.y + oldStreetBody.h} r="5" fill="none" stroke="#345c4e" strokeWidth="2"/>}
      </svg>
      <div id="rpg"/>
      {entities.map(e => {
        const door = oldStreetDoors().find(d => d.id === e.id)
        const known = head.save.characters.find(c=>c.id===oldStreetPerson(e.id)?.id)
        const title = known?.name ?? (door ? text(oldStreetRooms[door.destination.room]) : text(oldStreetPropState(e.id,head.save) ?? propNames[e.id] ?? [e.id, e.id]))
        return <button className={'os-target' + (door ? ' os-target--door' : '')+(['watchmaker','laundry-owner'].includes(e.id)?' os-target--actor':'')} key={e.id} style={{left: `${e.position.x / 384 * 100}%`, top: `${e.position.y / 576 * 100}%`}}
          disabled={!ready || busy || !!outcome || !!error} onClick={() => {setSelected(e.id); if (door) {const rule=ruleFor(door.actionId); if(rule?.status==='accepted')request(door.actionId);else setNotice(rule?.reasons.join(' ')??'')}}}>{title}{door?.gate && !head.save.facts[door.gate] ? text([' · 关闭', ' · closed']) : ''}</button>
      })}
    </div>
    <section className="os-actions" aria-label={text(['当前行动', 'Current actions'])}>
      <p role="status">{error || notice || (!ready ? text(['载入角色与地图…', 'Loading character and maps…']) : text(['点击地面行走，或走近物件。', 'Click the floor or approach an object.']))}</p>
      <div>{actions.map(id => <button key={id} disabled={!ready || busy || !!outcome || !!error} onClick={() => request(id)}>{label(id)}</button>)}</div>
      {talkTopics.length>0&&<div>{talkTopics.map(topic=><button key={topic.id} disabled={busy||!ready||!!error||!!outcome} onClick={()=>sendInput(true,topic.text)}>{topic.text}</button>)}</div>}
      {chosen && !oldStreetDoors().some(d=>d.id===chosen.id) && <form onSubmit={e=>{e.preventDefault();sendInput(Boolean(knownSpeaker))}}><input aria-label={text(knownSpeaker?['交谈内容','Message']:['输入行动','Describe an action'])} maxLength={500} value={typed} onChange={e=>setTyped(e.target.value)} placeholder={text(knownSpeaker?['想聊些什么？','What would you like to say?']:['也可以说说你想做什么','Or describe what you want to do'])}/><button disabled={!typed.trim()||busy||!ready||!!error||!!outcome}>{text(knownSpeaker?['交谈','Talk']:['发送','Send'])}</button>{knownSpeaker&&<button type="button" disabled={!typed.trim()||busy||!ready||!!error||!!outcome} onClick={()=>sendInput(false)}>{text(['作为行动','Act'])}</button>}</form>}
      <small>{text(['随身：', 'Carrying: '])}{head.save.inventory.map(i => i.label).join(' · ') || text(['无', 'Nothing'])}</small>
    </section>
    <footer>
      <div className="os-stick" role="group" aria-label={text(['移动摇杆', 'Movement joystick'])} onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId); stick(e)}} onPointerMove={e => {if (e.currentTarget.hasPointerCapture(e.pointerId)) stick(e)}} onPointerUp={() => runtime.current?.move(0, 0)} onPointerCancel={() => runtime.current?.move(0, 0)} onLostPointerCapture={() => runtime.current?.move(0, 0)}><span/></div>
      <button disabled={!ready || busy || !nearest || !!outcome || !!error} onPointerDown={() => {if (nearest) {setSelected(nearest.id); const id = nearest.actions.find(a => ruleFor(a)?.status === 'accepted'); if (id) request(id)}}}>{busy ? text(['正在走近…', 'Approaching…']) : nearest?.actions.find(a => ruleFor(a)?.status === 'accepted') ? label(nearest.actions.find(a => ruleFor(a)?.status === 'accepted')!) : text(['走近物件', 'Move closer'])}</button>
    </footer>
    {error && <button onClick={() => location.reload()}>{text(['重新连接并恢复', 'Reconnect and recover'])}</button>}
    <details><summary>Renderer diagnostics</summary><pre style={{maxWidth:'90vw',whiteSpace:'pre-wrap'}}>{diagnostic}</pre></details>
    {photoOpen && <OldStreetPhotoView locale={locale} busy={busy} feedback={photoMessage} submit={proof=>{busyRef.current=true;setBusy(true);void execute('oldstreet:match-photos','viewing-table',undefined,proof)}} close={()=>{setPhotoOpen(false);runtime.current?.pause(false)}}/>}
    {leaving && <div className="os-modal" role="dialog" aria-modal="true"><section><p>{text(['带着信回家？离开后这次探索结束。', 'Take the letter home? This ends the exploration.'])}</p><button onClick={() => {setLeaving(false); request('oldstreet:leave', true)}}>{text(['回家', 'Go home'])}</button><button onClick={() => setLeaving(false)}>{text(['再逛逛', 'Stay'])}</button></section></div>}
    {outcome && <div className="os-modal" role="dialog" aria-label={text(['旅程结果','Journey result'])}><section><h2>{head.save.finale.ending?.title ?? text(['信已送到','Letter delivered'])}</h2><p>{head.save.finale.ending?.thesis}</p>{head.save.finale.ending?.preserved.map((line,i)=><p key={'p'+i}>{line}</p>)}{head.save.finale.ending?.unresolved.map((line,i)=><p key={'u'+i}>{line}</p>)}<button disabled={busy||!ready} onClick={()=>{void restart()}}>{text(['重新探索','Explore again'])}</button></section></div>}
  </main>
  function stick(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || busyRef.current || leaving || error || outcome) return
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / 28, y = (e.clientY - r.top - r.height / 2) / 28
    runtime.current?.move(x, y)
  }
}
