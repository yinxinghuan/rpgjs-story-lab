import {oldStreetSession} from './old-street-session'
import type {OldStreetHead} from './old-street-head'
import {Assets} from 'pixi.js'
import React, {useEffect, useRef, useState} from 'react'
import {createRpgRenderer, type RpgRendererRuntime} from './rpg-renderer'
import {actorSheet} from './actor-sheet'
import {actorArt} from './art-catalog'
import {oldStreetCartridge, oldStreetRooms, oldStreetOutcome, type OldStreetRoom} from './old-street-cartridge'
import {bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetFloors, oldStreetObstacleBodies, oldStreetPath, oldStreetWalkable} from './old-street-space'
import {createInitialSave} from './vendor/original-train/engine/reducer'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import './old-street-dev.css'

const plan = oldStreetSpatialPlan()
const actionNames: Record<string, [string, string]> = {
  'move-box': ['移开空盒', 'Move box'], 'take-lens': ['拿放大镜', 'Take lens'], 'borrow-trolley': ['借推车', 'Borrow trolley'],
  'clear-crates': ['移开旧箱', 'Move crates'], 'return-trolley': ['归还推车', 'Return trolley'], 'borrow-key': ['问候并借钥匙', 'Ask for key'],
  'return-key': ['归还钥匙', 'Return key'], 'lift-latch': ['抬起插销', 'Lift bolt'], 'unlock-letter': ['打开小格', 'Unlock compartment'],
  'take-letter': ['拿信', 'Take letter'], 'take-clock': ['帮忙送钟', 'Take clock'], 'inspect-clock': ['检查钟底', 'Inspect clock'],
  'return-clock': ['交还旧钟', 'Return clock'], 'take-photos': ['拿照片夹', 'Take photo folder'], 'match-photos': ['比对照片', 'Compare photos'],
  'return-photos': ['交还照片', 'Return photos'], 'consent-clock': ['询问是否留下钟的故事', 'Ask to record clock history'],
  'consent-photo': ['询问可留下哪张照片', 'Ask which photo may be shared'], 'record-clock': ['收录旧钟', 'Record clock'],
  'record-photo': ['收录照片', 'Record photo'], 'withdraw-clock': ['撤下旧钟记录', 'Withdraw clock entry'],
  'withdraw-photo': ['撤下照片记录', 'Withdraw photo entry'], 'leave': ['带信回家', 'Take the letter home'],
}
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
  const [connection] = useState(() => oldStreetSession(window.alteruLocalStorage, async(name, work) => navigator.locks.request(name, work)))
  const serverHead = useRef<OldStreetHead>()
  const current = useRef(head); current.current = head
  const position = useRef(head.position)
  const runtime = useRef<RpgRendererRuntime>()
  const engine = useRef<any>()
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), busyRef = useRef(false)
  const [notice, setNotice] = useState(cartridge.opening.blocks[0].text), [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null), [leaving, setLeaving] = useState(false)
  const [feet, setFeet] = useState(head.position), [destination, setDestination] = useState<{x: number; y: number} | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [diagnostic, setDiagnostic] = useState('')
  useEffect(() => {const timer = setInterval(() => setDiagnostic(JSON.stringify({sheets:engine.current?.getCurrentPlayer()?.graphicsSignals().map((g:any)=>({keys:Object.keys(g),width:g.width,height:g.height,textures:Object.keys(g.textures??{})})),players:Object.keys(engine.current?.sceneMap.players() ?? {}).length,motion:runtime.current?.motion?.(),render:runtime.current?.diagnostics?.()})), 2000); return () => clearInterval(timer)}, [])
  useEffect(() => {
    const hero = actorArt.balanced.hero
    let mounted = true
    let heroBlob: string | undefined
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
      if (!mounted) return
      createRpgRenderer({host: document.getElementById('rpg')!, width: 384, height: 576,
        sceneIds: plan.scenes.map(s => s.id), mapIds: Object.fromEntries(plan.scenes.map(s => [s.id, `oldstreet-${s.id}`])),
        initialScene: restored.sceneId, initialPosition: restored.position, heroGraphic: 'hero',
        spritesheets: [actorSheet('hero', preview.src, hero.width, hero.height, hero.baselines, hero.scale, hero.centers)], mapEvents: () => [],
        walkable: (p, room) => oldStreetWalkable(room, p, current.current.save),
        safePosition: (p, room) => oldStreetWalkable(room, p, current.current.save) ? p : plan.scenes.find(s => s.id === room)!.spawn,
        findPath: (a, b, room) => oldStreetPath(room, a, b, current.current.save),
        onPosition: p => {position.current = p; if (mounted) setFeet(p)}, onDestination: p => {if (mounted) setDestination(p)},
        onEngine: e => {engine.current = e},
        onReady: r => {runtime.current = r; r.pause(Boolean(restored.save.facts.departed)); if (mounted) setReady(true)},
        onFailure: code => {if (mounted) setError(code)},
      })
    } catch (e) {if (mounted) setError(String(e))}})()
    return () => {mounted = false; runtime.current?.destroy(); if (heroBlob) URL.revokeObjectURL(heroBlob)}
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
  function ruleFor(id: string) {return resolveDomainAction(current.current.save, cartridge, id)}
  async function execute(id: string, target: string) {
    try {
      const h = serverHead.current!
      runtime.current!.pause(true)
      const result = await connection.client.send(h,{type:'action',action:id,target,position:{...position.current}})
      const nextHead = result.head as OldStreetHead
      serverHead.current = nextHead
      await runtime.current!.restore(nextHead.position,nextHead.sceneId)
      const next = {save:nextHead.save,scene:nextHead.sceneId,position:nextHead.position}
      current.current = next; setHead(next); position.current = next.position; setSelected(null)
      setNotice(result.text ?? result.rejectionCode ?? '')
      runtime.current!.pause(Boolean(nextHead.save.facts.departed))
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
    const started = runtime.current.walkTo(entity.approach, () => {void execute(id, entity.id)})
    if (!started) {busyRef.current = false; setBusy(false); setNotice(text(['这里暂时走不过去。', 'There is no clear path.']))}
  }
  const entities = oldStreetSpatialPlan(head.save).entities.filter(e => e.scene === head.scene)
  const nearest = [...entities].filter(e => Math.hypot(e.position.x - feet.x, e.position.y - feet.y) < 54)
    .sort((a, b) => Math.hypot(a.position.x - feet.x, a.position.y - feet.y) - Math.hypot(b.position.x - feet.x, b.position.y - feet.y))[0]
  const chosen = entities.find(e => e.id === selected) ?? nearest
  const actions = chosen?.actions.filter(id => ruleFor(id)?.status === 'accepted') ?? []
  const label = (id: string) => {
    const door = oldStreetDoors().find(d => d.actionId === id)
    return door ? text(oldStreetRooms[door.destination.room]) : text(actionNames[id.replace('oldstreet:', '')] ?? [id, id])
  }
  const floor = oldStreetFloors[head.scene as OldStreetRoom]
  const outcome = oldStreetOutcome(head.save)
  return <main className="os-dev">
    <header><small>{text(['开发白盒 · 本机服务存档', 'Development blockout · Local server save'])}</small><h1>{text(oldStreetRooms[head.scene as OldStreetRoom])}</h1></header>
    <div className="os-stage" ref={stage} onPointerDown={e => {
      if ((e.target as HTMLElement).closest('button') || !ready || busyRef.current || leaving) return
      const r = e.currentTarget.getBoundingClientRect()
      runtime.current?.walkTo({x: (e.clientX - r.left) * 384 / r.width, y: (e.clientY - r.top) * 576 / r.height})
      setSelected(null)
    }}>
      <svg className="os-layout" viewBox="0 0 384 576" aria-hidden="true">
        <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#c2bbab" stroke="#81786c" strokeWidth="6"/>
        {oldStreetObstacleBodies(head.scene as OldStreetRoom, head.save).map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#70665b" stroke="#443e36"/>)}
        {destination && <circle cx={destination.x + 4.5} cy={destination.y + 15} r="5" fill="none" stroke="#345c4e" strokeWidth="2"/>}
      </svg>
      <div id="rpg"/>
      {entities.map(e => {
        const door = oldStreetDoors().find(d => d.id === e.id)
        const title = door ? text(oldStreetRooms[door.destination.room]) : text(propNames[e.id] ?? [e.id, e.id])
        return <button className={'os-target' + (door ? ' os-target--door' : '')} key={e.id} style={{left: `${e.position.x / 384 * 100}%`, top: `${e.position.y / 576 * 100}%`}}
          disabled={!ready || busy || !!outcome || !!error} onClick={() => {setSelected(e.id); if (door) request(door.actionId)}}>{title}{door?.gate && !head.save.facts[door.gate] ? text([' · 关闭', ' · closed']) : ''}</button>
      })}
    </div>
    <section className="os-actions" aria-label={text(['当前行动', 'Current actions'])}>
      <p role="status">{error || notice || (!ready ? text(['载入角色与地图…', 'Loading character and maps…']) : text(['点击地面行走，或走近物件。', 'Click the floor or approach an object.']))}</p>
      <div>{actions.map(id => <button key={id} disabled={!ready || busy || !!outcome || !!error} onClick={() => request(id)}>{label(id)}</button>)}</div>
      <small>{text(['随身：', 'Carrying: '])}{head.save.inventory.map(i => i.label).join(' · ') || text(['无', 'Nothing'])}</small>
    </section>
    <footer>
      <div className="os-stick" role="group" aria-label={text(['移动摇杆', 'Movement joystick'])} onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId); stick(e)}} onPointerMove={e => {if (e.currentTarget.hasPointerCapture(e.pointerId)) stick(e)}} onPointerUp={() => runtime.current?.move(0, 0)} onPointerCancel={() => runtime.current?.move(0, 0)} onLostPointerCapture={() => runtime.current?.move(0, 0)}><span/></div>
      <button disabled={!ready || busy || !nearest || !!outcome || !!error} onPointerDown={() => {if (nearest) {setSelected(nearest.id); const id = nearest.actions.find(a => ruleFor(a)?.status === 'accepted'); if (id) request(id)}}}>{busy ? text(['正在走近…', 'Approaching…']) : nearest?.actions.find(a => ruleFor(a)?.status === 'accepted') ? label(nearest.actions.find(a => ruleFor(a)?.status === 'accepted')!) : text(['走近物件', 'Move closer'])}</button>
    </footer>
    {error && <button onClick={() => location.reload()}>{text(['重新连接并恢复', 'Reconnect and recover'])}</button>}
    <details><summary>Renderer diagnostics</summary><pre style={{maxWidth:'90vw',whiteSpace:'pre-wrap'}}>{diagnostic}</pre></details>
    {leaving && <div className="os-modal" role="dialog" aria-modal="true"><section><p>{text(['带着信回家？离开后这次探索结束。', 'Take the letter home? This ends the exploration.'])}</p><button onClick={() => {setLeaving(false); request('oldstreet:leave', true)}}>{text(['回家', 'Go home'])}</button><button onClick={() => setLeaving(false)}>{text(['再逛逛', 'Stay'])}</button></section></div>}
    {outcome && <div className="os-modal" role="dialog"><section><h2>{text(['信已送到', 'Letter delivered'])}</h2><p>{notice}</p><p>{outcome.clockReturned ? text(['旧钟已归还。', 'The clock was returned.']) : ''}{outcome.photosReturned ? text(['照片已归还。', 'The photos were returned.']) : ''}</p></section></div>}
  </main>
  function stick(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || busyRef.current || leaving || error || outcome) return
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / 28, y = (e.clientY - r.top - r.height / 2) / 28
    runtime.current?.move(x, y)
  }
}
