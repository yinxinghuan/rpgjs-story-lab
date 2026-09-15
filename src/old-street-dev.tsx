import {oldStreetRecoveryMessage} from './old-street-recovery-message'
import cratesUrl from '../doc/oldstreet-crates/cutout.png'
import {oldStreetCratesSheet} from './old-street-crates'
import mantelClockUrl from '../doc/oldstreet-mantel-clock/cutout.png'
import {oldStreetClockDisplayPose,oldStreetClockDisplaySheets} from './old-street-clock-display'
import {oldStreetPhotoTablePose,oldStreetPhotoTableSheets} from './old-street-photo-table'
import photoTableUrl from '../doc/oldstreet-photo-table/cutout.png'
import {oldStreetEnvironmentArt,oldStreetEnvironmentDownloads} from './old-street-environment-art'
import {createStartupGuard} from './startup-guard'
import photoShelfUrl from '../doc/oldstreet-photo-shelf/cutout.png'
import {oldStreetPhotoShelfPose,oldStreetPhotoShelfSheets} from './old-street-photo-shelf'
import OldStreetLoading from './old-street-loading'
import {downloadSpatialArt} from './spatial-art-download'
import {OldStreetResidentMotion} from './old-street-resident-motion'
import {findGridPath} from './grid-path'
import pixelDrawerUrl from '../doc/oldstreet-pixel-study/drawer/cutout.png'
import pixelPropsUrl from '../doc/oldstreet-pixel-study/props/orthogonal/cutout.png'
import {oldStreetCompartmentPose,oldStreetPixelPropSheet,oldStreetPixelLayeredSheets} from './old-street-prop-art'
import {oldStreetCamera} from './old-street-camera'
import {oldStreetContextAction} from './old-street-context-action'
import {OldStreetDoorways} from './old-street-door-view'
import {OLD_STREET_PREVIEW_VERSION} from './old-street-runtime-contract'
import drawerStatesUrl from '../doc/oldstreet-drawer-guided/states.png'
import {oldStreetDrawerPose,oldStreetDrawerSheet} from './old-street-prop-art'
import {OldStreetJourneysView} from './old-street-journeys-view'
import {oldStreetTurn} from './old-street-turn'
import {oldStreetRequiredInspection} from './old-street-inspection'
import {OldStreetClockView} from './old-street-clock-view'
import type {RpgPlayer} from '@rpgjs/server'
import {Direction} from '@rpgjs/common'
import {oldStreetTalkTopics} from './old-street-conversation'
import {OldStreetJournalView} from './old-street-journal-view'
import {OldStreetMapView} from './old-street-map-view'
import {OldStreetPhotoView} from './old-street-photo-view'
import {oldStreetActionNames as actionNames,resolveOldStreetInput} from './old-street-action-input'
import {oldStreetPerson} from './old-street-characters'
import {oldStreetSession,oldStreetSessionHttp} from './old-street-session'
import type {OldStreetHead} from './old-street-head'
import {loadSpatialArtTexture} from './spatial-art-texture'
import React, {useEffect, useRef, useState} from 'react'
import {createRpgRenderer, type RpgRendererRuntime} from './rpg-renderer'
import {actorSheet,standingActorSheet} from './actor-sheet'
import {oldStreetTrolleyPose,oldStreetTrolleySheet} from './old-street-prop-art'
import trolleyUrl from '../doc/oldstreet-trolley-candidate/cutout.png'
import lanStandingUrl from '../doc/oldstreet-lan-candidate/standing.png'
import xuStandingUrl from '../doc/oldstreet-xu-candidate/standing.png'
import {actorArt} from './art-catalog'
import {oldStreetCartridge, oldStreetRooms, oldStreetOutcome, type OldStreetRoom} from './old-street-cartridge'
import {oldStreetBody, oldStreetHeroScale, oldStreetStride, bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetObstacleBodies, oldStreetProjectedProps, oldStreetWalkable} from './old-street-space'
import {OldStreetFloor} from './old-street-floor'
import {oldStreetPropState} from './old-street-prop-state'
import {createInitialSave} from './vendor/original-train/engine/reducer'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import './old-street-dev.css'

const pixelShop=new URLSearchParams(location.search).get('shop_art')==='pixel'
const environmentDownloads=oldStreetEnvironmentDownloads(pixelShop)
const renderedProps=['watchmaker','laundry-owner','photographer','trolley','drawer',...(pixelShop?['letter-compartment','record-book','photo-folder','viewing-table','clock-display','crates']:[])]
const plan = oldStreetSpatialPlan()
const propNames: Record<string, [string, string]> = {
  drawer: ['抽屉', 'Drawer'], 'letter-compartment': ['小格', 'Compartment'], 'record-book': ['记录册', 'Record book'],
  trolley: ['推车', 'Trolley'], crates: ['旧箱', 'Crates'],
  'photo-folder': ['照片夹', 'Photo folder'],
  'viewing-table': ['放大台', 'Viewing table'], 'street-exit': ['回家', 'Home'],
}
export default function OldStreetDev() {
  const locale = navigator.language.startsWith('zh') ? 'zh' : 'en'
  const text = (pair: readonly [string, string]) => pair[locale === 'zh' ? 0 : 1]
  const [cartridge] = useState(() => oldStreetCartridge(locale))
  const [head, setHead] = useState(() => ({save: createInitialSave(cartridge), scene: 'street', position: plan.scenes.find(s => s.id === 'street')!.spawn}))
  const debug = new URLSearchParams(location.search).get('debug') === '1'
  const workerPreview = import.meta.env.MODE !== 'oldstreet-dev' || new URLSearchParams(location.search).get('session') === 'worker'
  const [connection] = useState(() => (workerPreview?oldStreetSessionHttp:oldStreetSession)(window.alteruLocalStorage, async(name, work) => navigator.locks.request(name, work)))
  const serverHead = useRef<OldStreetHead>()
  const current = useRef(head); current.current = head
  const position = useRef(head.position)
  const runtime = useRef<RpgRendererRuntime>()
  const engine = useRef<any>()
  const resident=useRef(new OldStreetResidentMotion(oldStreetProjectedProps({facts:{}}).find(p=>p.id==='watchmaker')!.position))
  const [,setResidentPosition]=useState({...resident.current.position})
  const residentControls=useRef({paused:true,selected:false})
  const residentPositions=()=>({watchmaker:resident.current.position})
  const localWalkable=(p:{x:number;y:number},room:string)=>oldStreetWalkable(room,p,current.current.save,oldStreetBody,residentPositions())
  const npcEvents=useRef<Record<string,RpgPlayer>>({})
  const trolleyEvent=useRef<RpgPlayer>(),drawerEvent=useRef<RpgPlayer>(),compartmentEvent=useRef<RpgPlayer>(),photoShelfEvent=useRef<RpgPlayer>(),photoTableEvent=useRef<RpgPlayer>(),clockDisplayEvent=useRef<RpgPlayer>(),cratesEvent=useRef<RpgPlayer>()
  useEffect(()=>{if(cratesEvent.current){const p=oldStreetProjectedProps(head.save).find(p=>p.id==='crates')!;void cratesEvent.current.teleport({x:p.body.x,y:p.body.y});cratesEvent.current.syncChanges()}if(clockDisplayEvent.current){clockDisplayEvent.current.animationName.set(oldStreetClockDisplayPose(head.save));clockDisplayEvent.current.syncChanges()}if(photoTableEvent.current){photoTableEvent.current.animationName.set(oldStreetPhotoTablePose(head.save));photoTableEvent.current.syncChanges()}if(photoShelfEvent.current){photoShelfEvent.current.animationName.set(oldStreetPhotoShelfPose(head.save));photoShelfEvent.current.syncChanges()}if(compartmentEvent.current){compartmentEvent.current.animationName.set(oldStreetCompartmentPose(head.save));compartmentEvent.current.syncChanges()}if(drawerEvent.current){drawerEvent.current.animationName.set(oldStreetDrawerPose(head.save));drawerEvent.current.syncChanges()}if(trolleyEvent.current){trolleyEvent.current.animationName.set(oldStreetTrolleyPose(head.save));trolleyEvent.current.syncChanges()}},[head])
  const [environmentArt,setEnvironmentArt]=useState(oldStreetEnvironmentArt)
  const [loading,setLoading]=useState({stage:'journey',done:0,total:(pixelShop?11:6)+environmentDownloads.length})
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), busyRef = useRef(false)
  const [notice, updateNotice] = useState(cartridge.opening.blocks[0].text), [error, setError] = useState('')
  const [turn,setTurn]=useState<ReturnType<typeof oldStreetTurn>>([])
  const visibleTurn=useRef(turn);visibleTurn.current=turn
  const actionPanel=useRef<HTMLElement>(null)
  useEffect(()=>{if(actionPanel.current)actionPanel.current.scrollTop=0},[turn,notice,error])
  const setNotice=(value:string)=>{updateNotice(value);setTurn([])}
  const [journeysOpen,setJourneysOpen]=useState(false)
  const [journalOpen,setJournalOpen]=useState(false),journalButton=useRef<HTMLButtonElement>(null)
  const [mapOpen,setMapOpen]=useState(false),mapButton=useRef<HTMLButtonElement>(null)
  const [clockOpen,setClockOpen]=useState(false),[clockMessage,setClockMessage]=useState('')
  const [photoOpen,setPhotoOpen]=useState(false),[photoMessage,setPhotoMessage]=useState('')
  useEffect(()=>{if(error){setPhotoOpen(false);setClockOpen(false);runtime.current?.pause(true)}},[error])
  const [typed, setTyped] = useState('')
  const [selected, setSelected] = useState<string | null>(null), [leaving, setLeaving] = useState(false)
  const [feet, setFeet] = useState(head.position), [destination, setDestination] = useState<{x: number; y: number} | null>(null)
  const stage = useRef<HTMLDivElement>(null), world=useRef<HTMLDivElement>(null)
  const [viewport,setViewport]=useState({width:390,height:844}),[actionHeight,setActionHeight]=useState(160)
  const overview=debug&&new URLSearchParams(location.search).get('camera')==='overview'
  const camera=oldStreetCamera(viewport,feet,actionHeight,overview)
  useEffect(()=>{const node=world.current;if(!node)return;const observer=new ResizeObserver(([entry])=>{setViewport({width:entry.contentRect.width,height:entry.contentRect.height}) });observer.observe(node);return()=>observer.disconnect()},[])
  useEffect(()=>{const node=actionPanel.current;if(!node)return;const observer=new ResizeObserver(([entry])=>setActionHeight(entry.contentRect.height+24));observer.observe(node);return()=>observer.disconnect()},[])
  residentControls.current={paused:busy||!!error||journalOpen||mapOpen||journeysOpen||clockOpen||photoOpen||leaving||!!head.save.facts.departed,selected:selected==='watchmaker'}
  const [diagnostic, setDiagnostic] = useState('')
  useEffect(() => {if(!debug)return;const timer = setInterval(() => setDiagnostic(JSON.stringify({sheets:engine.current?.getCurrentPlayer()?.graphicsSignals().map((g:any)=>({keys:Object.keys(g),width:g.width,height:g.height,textures:Object.keys(g.textures??{})})),players:Object.keys(engine.current?.sceneMap.players() ?? {}).length,motion:runtime.current?.motion?.(),render:runtime.current?.diagnostics?.()})), 2000); return () => clearInterval(timer)}, [])
  useEffect(() => {
    const hero = actorArt.balanced.hero
    let mounted = true
    const downloads=new AbortController()
    const boot=createStartupGuard(code=>{downloads.abort();if(mounted)setError(code)})
    let environmentBlobs:string[]=[]
    let heroBlob: string | undefined
    let watchmakerBlob: string | undefined
    let cratesBlob: string | undefined
    let lanBlob: string | undefined
    let xuBlob: string | undefined
    let drawerBlob: string | undefined
    let mantelClockBlob:string|undefined
    let photoTableBlob:string|undefined
    let photoShelfBlob:string|undefined
    let pixelPropsBlob:string|undefined
    let trolleyBlob: string | undefined
    void (async () => {try {
      let restored = await connection.client.enroll(locale)
      const recovered = await connection.client.recover()
      if (recovered) restored = recovered.head
      if (!mounted||!boot.pending()) return
      serverHead.current = restored
      const restoredView = {save:restored.save,scene:restored.sceneId,position:restored.position}
      current.current = restoredView; setHead(restoredView); position.current = restored.position; setFeet(restored.position)
      resident.current=new OldStreetResidentMotion(oldStreetProjectedProps(restored.save).find(p=>p.id==='watchmaker')!.position,restored.position)
      setNotice(restored.version===0?cartridge.opening.blocks[0].text:text(['已恢复旅程。', 'Journey restored.']))
      const npcArt=actorArt.balanced.mechanic
      const sources=[...environmentDownloads,{id:'hero',url:new URL(hero.path,document.baseURI).href},{id:'watchmaker',url:new URL(npcArt.path,document.baseURI).href},{id:'lan',url:lanStandingUrl},{id:'xu',url:xuStandingUrl},{id:'drawer',url:pixelShop?pixelDrawerUrl:drawerStatesUrl},{id:'trolley',url:trolleyUrl},...(pixelShop?[{id:'props',url:pixelPropsUrl},{id:'photoShelf',url:photoShelfUrl},{id:'photoTable',url:photoTableUrl},{id:'mantelClock',url:mantelClockUrl},{id:'crates',url:cratesUrl}]:[])]
      const urls=await downloadSpatialArt(sources,{signal:downloads.signal,progress:(done,total)=>{if(mounted)setLoading({stage:'art',done,total})}})
      cratesBlob=urls.crates;mantelClockBlob=urls.mantelClock;photoTableBlob=urls.photoTable;photoShelfBlob=urls.photoShelf;heroBlob=urls.hero;watchmakerBlob=urls.watchmaker;lanBlob=urls.lan;xuBlob=urls.xu;drawerBlob=urls.drawer;trolleyBlob=urls.trolley;pixelPropsBlob=urls.props
      if(!mounted||!boot.pending()){Object.values(urls).forEach(url=>URL.revokeObjectURL(url));return}
      environmentBlobs=environmentDownloads.map(e=>urls[e.id])
      setLoading({stage:'textures',done:sources.length,total:sources.length})
      await Promise.all(Object.entries(urls).map(async([id,url])=>{
        if(id.startsWith('environment-')){const image=new Image();image.src=url;await image.decode()}
        else await loadSpatialArtTexture(url,pixelShop?'nearest':'linear')
      }))
      if(mounted&&boot.pending())setEnvironmentArt({...oldStreetEnvironmentArt,...Object.fromEntries(environmentDownloads.map(e=>[e.id.slice('environment-'.length),urls[e.id]]))})
      if(!mounted||!boot.pending())return
      const preview=new Image();preview.src=heroBlob;await preview.decode()
      if(mounted&&boot.pending())setLoading({stage:'map',done:sources.length,total:sources.length})
      if (!mounted||!boot.pending()) return
      createRpgRenderer({host: document.getElementById('rpg')!, width: 384, height: 576,
        sceneIds: plan.scenes.map(s => s.id), mapIds: Object.fromEntries(plan.scenes.map(s => [s.id, `oldstreet-${s.id}`])),
        initialScene: restored.sceneId, initialPosition: restored.position, heroGraphic: 'hero', heroBody:oldStreetBody, strideLength:oldStreetStride,
        spritesheets: [actorSheet('hero', preview.src, hero.width, hero.height, hero.baselines, oldStreetHeroScale, hero.centers, {x:oldStreetBody.w/2,y:oldStreetBody.h}),actorSheet('oldstreet-watchmaker',watchmakerBlob,npcArt.width,npcArt.height,npcArt.baselines,.22,npcArt.centers,{x:16,y:28}),standingActorSheet('oldstreet-lan',lanBlob,256,352,{x:128,y:328},.22,{x:16,y:28}),standingActorSheet('oldstreet-xu',xuBlob,256,352,{x:128,y:328},.22,{x:16,y:28}),...(pixelShop?oldStreetPixelLayeredSheets(drawerBlob,'drawer'):[oldStreetDrawerSheet(drawerBlob)]),oldStreetTrolleySheet(trolleyBlob),...(cratesBlob?[oldStreetCratesSheet(cratesBlob)]:[]),...(mantelClockBlob&&photoShelfBlob?oldStreetClockDisplaySheets(photoShelfBlob,mantelClockBlob):[]),...(photoTableBlob&&photoShelfBlob?oldStreetPhotoTableSheets(photoTableBlob,photoShelfBlob):[]),...(photoShelfBlob?oldStreetPhotoShelfSheets(photoShelfBlob):[]),...(pixelPropsBlob?[...oldStreetPixelLayeredSheets(pixelPropsBlob,'letter-compartment'),oldStreetPixelPropSheet(pixelPropsBlob,'record-book')]:[])], mapEvents: room => {resident.current=new OldStreetResidentMotion(oldStreetProjectedProps(current.current.save).find(p=>p.id==='watchmaker')!.position,current.current.position);setResidentPosition({...resident.current.position});npcEvents.current={};trolleyEvent.current=undefined;drawerEvent.current=undefined;compartmentEvent.current=undefined;photoShelfEvent.current=undefined;photoTableEvent.current=undefined;clockDisplayEvent.current=undefined;cratesEvent.current=undefined;return oldStreetProjectedProps(current.current.save,residentPositions()).filter(p=>p.room===room&&renderedProps.includes(p.id)).map(p=>({id:'oldstreet-'+p.id,x:p.body.x,y:p.body.y,event:{onInit(this:RpgPlayer){this.setHitbox(p.body.w,p.body.h);this.through=true;this.animationFixed=true;this.setGraphic(p.id==='crates'?'oldstreet-crates':p.id==='clock-display'?['oldstreet-clock-counter','oldstreet-returned-clock']:p.id==='viewing-table'?['oldstreet-viewing-table','oldstreet-returned-photos']:p.id==='photo-folder'?['oldstreet-photo-folder-shelf','oldstreet-photo-folder-top']:pixelShop&&['drawer','letter-compartment'].includes(p.id)?['oldstreet-'+p.id+'-top','oldstreet-'+p.id+'-front']:['letter-compartment','record-book'].includes(p.id)?'oldstreet-'+p.id:p.id==='drawer'?'oldstreet-drawer':p.id==='watchmaker'?'oldstreet-watchmaker':p.id==='trolley'?'oldstreet-trolley':p.id==='photographer'?'oldstreet-xu':'oldstreet-lan');this.animationName.set(p.id==='clock-display'?oldStreetClockDisplayPose(current.current.save):p.id==='viewing-table'?oldStreetPhotoTablePose(current.current.save):p.id==='photo-folder'?oldStreetPhotoShelfPose(current.current.save):p.id==='letter-compartment'?oldStreetCompartmentPose(current.current.save):p.id==='drawer'?oldStreetDrawerPose(current.current.save):p.id==='trolley'?oldStreetTrolleyPose(current.current.save):'stand');this.direction.set(Direction.Down);if(p.id==='crates')cratesEvent.current=this;else if(p.id==='clock-display')clockDisplayEvent.current=this;else if(p.id==='viewing-table')photoTableEvent.current=this;else if(p.id==='photo-folder')photoShelfEvent.current=this;else if(p.id==='letter-compartment')compartmentEvent.current=this;else if(p.id==='record-book'){}else if(p.id==='drawer')drawerEvent.current=this;else if(p.id==='trolley')trolleyEvent.current=this;else npcEvents.current[p.id]=this;this.syncChanges()}}}))},
        walkable: localWalkable,
        safePosition: (p, room) => oldStreetWalkable(room, p, current.current.save) ? p : plan.scenes.find(s => s.id === room)!.spawn,
        findPath: (a, b, room) => findGridPath(a,b,p=>localWalkable(p,room)),
        onPosition: p => {const moved=Math.hypot(p.x-position.current.x,p.y-position.current.y)>.01;position.current = p; if (mounted) {setFeet(p);if(moved&&!busyRef.current)setSelected(null);if(moved&&!busyRef.current&&visibleTurn.current.length){visibleTurn.current=[];setNotice('');setSelected(null)}}}, onDestination: p => {if (mounted) {setDestination(p);if(p){visibleTurn.current=[];setNotice('');if(!busyRef.current)setSelected(null)}}},
        onFrame:(dt,hero,room,paused)=>{
          for(const [id,event] of Object.entries(npcEvents.current)){
            const prop=oldStreetProjectedProps(current.current.save,residentPositions()).find(p=>p.id===id&&p.room===room);if(!prop)continue
            if(id==='watchmaker'){
              const m=resident.current,before={...m.position}
              m.update(dt,hero,paused||residentControls.current.paused,residentControls.current.selected,p=>{
                const body={x:p.x-12,y:p.y-12,w:32,h:28}
                return oldStreetWalkable(room,body,current.current.save,{w:32,h:28})&&!(body.x<hero.x+oldStreetBody.w&&body.x+body.w>hero.x&&body.y<hero.y+oldStreetBody.h&&body.y+body.h>hero.y)
              })
              if(before.x!==m.position.x||before.y!==m.position.y){void event.teleport({x:m.position.x-12,y:m.position.y-12});setResidentPosition({...m.position})}
              event.direction.set(m.direction as Direction);event.animationName.set(m.pose);event.syncChanges()
            }else if(!paused){const dx=hero.x-prop.position.x,dy=hero.y-prop.position.y;if(Math.hypot(dx,dy)<96){event.direction.set(Math.abs(dx)>Math.abs(dy)?(dx>0?Direction.Right:Direction.Left):(dy>0?Direction.Down:Direction.Up));event.syncChanges()}}
          }
        },
        onEngine: e => {engine.current = e},
        onReady: async r => {
          r.pause(true)
          if(!await boot.acceptWhenReady(r,()=>r.restore(restored.position,restored.sceneId)))return
          runtime.current = r; r.pause(Boolean(restored.save.facts.departed)); if (mounted) setReady(true)
        },
        onFailure: code => {if(boot.pending())boot.fail(code);else if(mounted)setError(code)},
      })
    } catch (e) {boot.fail(String(e))}})()
    return () => {mounted = false; environmentBlobs.forEach(url=>URL.revokeObjectURL(url)); boot.cancel(); downloads.abort(); runtime.current?.destroy(); if(mantelClockBlob) URL.revokeObjectURL(mantelClockBlob);if(photoTableBlob) URL.revokeObjectURL(photoTableBlob); if(photoShelfBlob) URL.revokeObjectURL(photoShelfBlob)
      if(cratesBlob)URL.revokeObjectURL(cratesBlob);if (heroBlob) URL.revokeObjectURL(heroBlob);if(watchmakerBlob)URL.revokeObjectURL(watchmakerBlob);if(lanBlob)URL.revokeObjectURL(lanBlob);if(xuBlob)URL.revokeObjectURL(xuBlob);if(drawerBlob)URL.revokeObjectURL(drawerBlob);if(pixelPropsBlob)URL.revokeObjectURL(pixelPropsBlob);if(trolleyBlob)URL.revokeObjectURL(trolleyBlob)}
  }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      const h = serverHead.current
      if (!h || !ready || busyRef.current || error || h.save.facts.departed || connection.client.hasPending()) return
      const p = {...position.current}
      if(p.x===h.position.x&&p.y===h.position.y)return
      void navigator.locks.request('oldstreet-checkpoint', async () => {
        if (busyRef.current || serverHead.current !== h) return
        try {const saved=await connection.api('/sessions/'+h.id+'/position',{sceneId:h.sceneId,expected_version:h.version,position:p});if(serverHead.current===h)serverHead.current={...h,position:saved.position}}
        catch (e) {if ((e as Error).message !== 'STALE_POSITION') {setError(String(e)); runtime.current?.pause(true)}}
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [ready,error])
  async function selectJourney(id:string){
    if(busyRef.current||!ready)return
    busyRef.current=true;setBusy(true);runtime.current!.pause(true)
    try{
      const h=await connection.client.selectSession(id)
      serverHead.current=h
      const next={save:h.save,scene:h.sceneId,position:h.position};current.current=next
      await runtime.current!.restore(h.position,h.sceneId)
      setHead(next);position.current=h.position;setFeet(h.position);setSelected(null);setError('');setNotice(text(['已继续这段旅程。','Journey resumed.']));setJourneysOpen(false)
      runtime.current!.pause(Boolean(h.save.facts.departed))
    }catch(e){setJourneysOpen(false);setError(String(e))}finally{busyRef.current=false;setBusy(false)}
  }
  async function restart(){
    if(busyRef.current||!ready)return
    busyRef.current=true;setBusy(true);runtime.current!.pause(true)
    try{
      const h=await connection.client.enroll(locale,true)
      serverHead.current=h
      const next={save:h.save,scene:h.sceneId,position:h.position}
      current.current=next
      await runtime.current!.restore(h.position,h.sceneId)
      current.current=next;setHead(next);position.current=h.position;setFeet(h.position);setSelected(null);setError('');setNotice(cartridge.opening.blocks[0].text)
      runtime.current!.pause(false)
    }catch(e){setJourneysOpen(false);setError(String(e))}finally{busyRef.current=false;setBusy(false)}
  }
  function ruleFor(id: string) {return resolveDomainAction(current.current.save, cartridge, id)}
  async function execute(id: string, target: string, input?:string, photoMatch?:unknown, dialogue=false,clockInspection?:unknown) {
    try {
      const h = serverHead.current!
      runtime.current!.pause(true)
      const arrivedPosition={...position.current}
      // Flush arrival after any older periodic checkpoint. A refused action
      // restores this location without committing a story turn.
      await navigator.locks.request('oldstreet-checkpoint',async()=>{
        try{await connection.api('/sessions/'+h.id+'/position',{sceneId:h.sceneId,expected_version:h.version,position:arrivedPosition})}
        catch(e){if(!(e instanceof Error)||e.message!=='STALE_POSITION')throw e}
      })
      // A stale checkpoint falls through to the session conflict/recovery path;
      // never overwrite a newer scene with this tab's arrival position.
      const result = await connection.client.send(h,{...(input===undefined?{type:'action',action:id}:{type:dialogue?'dialogue':'free-input',text:input,mode:new URLSearchParams(location.search).get('interpret')==='live'?'live':'local'}),target,position:arrivedPosition,...(photoMatch?{photoMatch}:{}),...(clockInspection?{clockInspection}:{})})
      const nextHead = result.head as OldStreetHead
      serverHead.current = nextHead
      const next = {save:nextHead.save,scene:nextHead.sceneId,position:nextHead.position}
      current.current = next
      await runtime.current!.restore(nextHead.position,nextHead.sceneId)
      current.current = next; setHead(next); position.current = next.position; setSelected(result.accepted===false && next.scene===h.sceneId ? target : null)
      const attemptedAction=id||(input?resolveOldStreetInput(input,locale,oldStreetSpatialPlan(next.save).entities.find(e=>e.id===target)?.actions??[]):undefined)
      const blockedReason=attemptedAction?[...new Set(resolveDomainAction(next.save,cartridge,attemptedAction)?.reasons??[])].join(' '):undefined
      setNotice(result.text ?? (result.rejectionCode==='OLD_STREET_CLOCK_INSPECTION_REQUIRED'?text(['先用放大镜找到并辨认刻记。','Find and identify the mark with the lens first.']):result.rejectionCode==='OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'?text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']):result.rejectionCode==='OLD_STREET_ACTION_UNAVAILABLE'?(blockedReason||text(['这一步现在还不能做，看看手边的物品和已发现的线索。','That step is not available yet. Check your items and discoveries.'])):result.rejectionCode==='OLD_STREET_INPUT_UNSUPPORTED'?text(['没有理解这一步。可以选择上面的行动，或换个说法。','I did not understand that action. Choose an action above or rephrase.']):result.rejectionCode) ?? '')
      setTurn(oldStreetTurn(h,nextHead,result.accepted===true))
      const requiredInspection=oldStreetRequiredInspection(next.save,next.scene,target,result.rejectionCode)
      if(requiredInspection==='clock'){setClockOpen(true);setClockMessage('');if(input!==undefined)setNotice(text(['拿近看看钟底。','Bring the clock closer to inspect its underside.']))}
      if(requiredInspection==='photo'){setPhotoOpen(true);setPhotoMessage('');if(input!==undefined)setNotice(text(['把照片放到放大台上比对。','Place the photographs on the viewing table.']))}
      if(id==='oldstreet:inspect-clock'){if(result.accepted)setClockOpen(false);else setClockMessage(text(['再仔细看看刻记，也可以换一处观察。','Look more closely at the mark, or examine another area.']))}
      if(id==='oldstreet:match-photos'){if(result.accepted)setPhotoOpen(false);else setPhotoMessage(text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']))}
      runtime.current!.pause(Boolean(nextHead.save.facts.departed)||Boolean(requiredInspection)||((photoOpen||clockOpen)&&!result.accepted))
    } catch (e) {setError(String(e)); runtime.current?.pause(true)}
    finally {busyRef.current = false; setBusy(false)}
  }
  function request(id: string, confirmed = false) {
    if (!ready || busyRef.current || error || current.current.save.facts.departed) return
    const binding = bindOldStreet(locale, current.current.save), target = binding.targetFor(id, current.current.scene)
    const entity = liveEntities().find(e => e.id === target)
    if (!entity || !runtime.current) return
    if (id === 'oldstreet:leave' && !confirmed) {setLeaving(true); return}
    busyRef.current = true; setBusy(true)
    const started = runtime.current.walkTo(entity.approach, () => {if(id==='oldstreet:inspect-clock'){setClockOpen(true);setClockMessage('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)}else if(id==='oldstreet:match-photos'){setPhotoOpen(true);setPhotoMessage('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)}else void execute(id, entity.id)})
    if (!started) {busyRef.current = false; setBusy(false); setNotice(text(['这里暂时走不过去。', 'There is no clear path.']))}
  }
  function sendInput(dialogue=false,provided?:string){
    if(!chosen||!(provided??typed).trim()||!ready||busyRef.current||error||leaving||head.save.facts.departed)return
    const input=(provided??typed).trim(),target=chosen.id
    busyRef.current=true;setBusy(true)
    if(!runtime.current!.walkTo(chosen.approach,()=>{void execute('',target,input,undefined,dialogue)})){busyRef.current=false;setBusy(false)}
    else setTyped('')
  }
  function liveEntities(){const props=oldStreetProjectedProps(current.current.save,residentPositions());return oldStreetSpatialPlan(current.current.save).entities.map(e=>{const p=props.find(p=>p.id===e.id);return p?{...e,position:p.position,approach:p.approach}:e})}
  const entities = liveEntities().filter(e => e.scene === head.scene)
  const nearest = [...entities].filter(e => Math.hypot(e.position.x - feet.x, e.position.y - feet.y) < 54)
    .sort((a, b) => Math.hypot(a.position.x - feet.x, a.position.y - feet.y) - Math.hypot(b.position.x - feet.x, b.position.y - feet.y))[0]
  const chosen = entities.find(e => e.id === selected) ?? nearest
  const knownSpeaker=chosen&&oldStreetPerson(chosen.id)&&head.save.characters.some(c=>c.id===oldStreetPerson(chosen.id)?.id)
  const talkTopics=chosen?oldStreetTalkTopics(head.save,chosen.id):[]
  const actions = chosen?oldStreetContextAction(head.save,chosen).actions:[]
  const nearbyAction=nearest?oldStreetContextAction(head.save,nearest):undefined
  function useNearby(){
    if(!nearest||!nearbyAction)return
    setSelected(nearest.id)
    if(nearbyAction.primary.kind==='action')request(nearbyAction.primary.id)
    else if(nearbyAction.primary.kind==='inspect')setNotice(nearbyAction.reason)
    else {setNotice('');requestAnimationFrame(()=>actionPanel.current?.querySelector<HTMLButtonElement>('button')?.focus())}
  }
  const label = (id: string) => {
    const door = oldStreetDoors().find(d => d.actionId === id)
    return door ? text(oldStreetRooms[door.destination.room]) : text(actionNames[id.replace('oldstreet:', '')] ?? [id, id])
  }
  const outcome = oldStreetOutcome(head.save)
  const borrowedItems=head.save.inventory.filter(i=>i.count>0&&['letter-key','trolley','clock','photos'].includes(i.id))
  return <main className={"os-dev os-dev--immersive"+(overview?" os-dev--overview":"")} data-release={OLD_STREET_PREVIEW_VERSION}>
    <header><h1>{text(oldStreetRooms[head.scene as OldStreetRoom])}<span className="os-preview-label">{text(['试玩','Preview'])}</span></h1><nav className="os-tools"><button ref={mapButton} disabled={!ready||busy||!!error||!!outcome} onClick={()=>{runtime.current?.pause(true);setMapOpen(true)}}>{text(['街区','Neighbourhood'])}</button><button ref={journalButton} disabled={!ready||busy||!!error||!!outcome} onClick={()=>{runtime.current?.pause(true);setJournalOpen(true)}}>{text(['随身与发现','Items & discoveries'])}</button><button disabled={!ready||busy||!!error} onClick={()=>{runtime.current?.pause(true);setJourneysOpen(true)}}>{text(['旅程','Journeys'])}</button></nav></header>
    <div className="os-world" ref={world}><div className="os-stage" style={{width:camera.width,height:camera.height,transform:`translate(${camera.x}px,${camera.y}px)`}} ref={stage} onPointerDown={e => {
      if ((e.target as HTMLElement).closest('button') || !ready || busyRef.current || leaving || error || outcome || journalOpen || mapOpen || journeysOpen || clockOpen || photoOpen) return
      const r = e.currentTarget.getBoundingClientRect()
      runtime.current?.walkTo({x: (e.clientX - r.left) * 384 / r.width, y: (e.clientY - r.top) * 576 / r.height})
      setSelected(null)
    }}>
      <svg className="os-layout" viewBox="0 0 384 576" aria-hidden="true">
        <OldStreetFloor room={head.scene as OldStreetRoom} pixelShop={pixelShop} art={environmentArt}/><OldStreetDoorways room={head.scene as OldStreetRoom} facts={head.save.facts}/>
        {head.scene==='laundry'&&(()=>{const p=oldStreetProjectedProps(head.save).find(p=>p.id==='trolley')!;return <rect x={p.body.x-3} y={p.body.y-3} width={p.body.w+6} height={p.body.h+6} fill='none' stroke='#8d7853' strokeDasharray='4 3' strokeWidth='1'/>})()}
        {oldStreetObstacleBodies(head.scene as OldStreetRoom, head.save).filter(b=>!oldStreetProjectedProps(head.save).some(p=>p.room===head.scene&&renderedProps.includes(p.id)&&b.x===p.body.x&&b.y===p.body.y)).map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#70665b" stroke="#443e36"/>)}
        {destination && <circle cx={destination.x + oldStreetBody.w/2} cy={destination.y + oldStreetBody.h} r="5" fill="none" stroke="#345c4e" strokeWidth="2"/>}
      </svg>
      <div id="rpg"/>
      {entities.map(e => {
        const door = oldStreetDoors().find(d => d.id === e.id)
        const known = head.save.characters.find(c=>c.id===oldStreetPerson(e.id)?.id)
        const title = known?.name ?? (door ? text(oldStreetRooms[door.destination.room]) : text(oldStreetPerson(e.id)?.appearance ?? oldStreetPropState(e.id,head.save) ?? propNames[e.id] ?? [e.id, e.id]))
        return <button className={'os-target' + (door ? ' os-target--door' : '')+(renderedProps.includes(e.id)?' os-target--actor':'')} key={e.id} data-side={door?.side} data-closed={door?.gate&&!head.save.facts[door.gate]?'true':undefined} style={{left: `${e.position.x / 384 * 100}%`, top: `${e.position.y / 576 * 100}%`}}
          disabled={!ready || busy || !!outcome || !!error} onClick={() => {if(selected!==e.id)setNotice('');setSelected(e.id); if (door) {const rule=ruleFor(door.actionId); if(rule?.status==='accepted')request(door.actionId);else setNotice(rule?.reasons.join(' ')??'')}}}><span className={door?'os-door-label':undefined}>{title}{door?.gate && !head.save.facts[door.gate] ? text([' · 关闭', ' · closed']) : ''}</span></button>
      })}
    </div>
    </div>
    <section className="os-actions" ref={actionPanel} aria-label={text(['当前行动', 'Current actions'])}>
      {turn.length&&!error?<section className="os-turn" role="log" aria-label={text(['交谈','Conversation'])}>{turn.map(block=><div key={block.id} className={block.kind==='dialogue'?'os-turn__speech':'os-turn__scene'}>{block.speaker&&<strong>{block.speaker}</strong>}<p>{block.text}</p></div>)}</section>:<p role="status">{error?oldStreetRecoveryMessage(error,locale):notice || (!ready ? text(['载入角色与地图…', 'Loading character and maps…']) : text(['点击地面行走，或走近物件。', 'Click the floor or approach an object.']))}</p>}
      <div>{actions.map(id => <button key={id} disabled={!ready || busy || !!outcome || !!error} onClick={() => request(id)}>{label(id)}</button>)}</div>
      {talkTopics.length>0&&<div>{talkTopics.map(topic=><button key={topic.id} disabled={busy||!ready||!!error||!!outcome} onClick={()=>sendInput(true,topic.text)}>{topic.text}</button>)}</div>}
      {chosen && !oldStreetDoors().some(d=>d.id===chosen.id) && <form onSubmit={e=>{e.preventDefault();sendInput(Boolean(knownSpeaker))}}><input disabled={!ready||busy||!!error||!!outcome} aria-label={text(knownSpeaker?['交谈内容','Message']:['输入行动','Describe an action'])} maxLength={500} value={typed} onChange={e=>setTyped(e.target.value)} placeholder={text(knownSpeaker?['想聊些什么？','What would you like to say?']:['也可以说说你想做什么','Or describe what you want to do'])}/><button disabled={!typed.trim()||busy||!ready||!!error||!!outcome}>{text(knownSpeaker?['交谈','Talk']:['发送','Send'])}</button>{knownSpeaker&&<button type="button" disabled={!typed.trim()||busy||!ready||!!error||!!outcome} onClick={()=>sendInput(false)}>{text(['作为行动','Act'])}</button>}</form>}
      <small>{text(['随身：', 'Carrying: '])}{head.save.inventory.map(i => i.label).join(' · ') || text(['无', 'Nothing'])}</small>
    </section>
    <footer>
      <div className="os-stick" role="group" aria-label={text(['移动摇杆', 'Movement joystick'])} onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId); stick(e)}} onPointerMove={e => {if (e.currentTarget.hasPointerCapture(e.pointerId)) stick(e)}} onPointerUp={() => runtime.current?.move(0, 0)} onPointerCancel={() => runtime.current?.move(0, 0)} onLostPointerCapture={() => runtime.current?.move(0, 0)}><span/></div>
      <button disabled={!ready || busy || !nearest || !!outcome || !!error} onPointerDown={useNearby}>{busy ? text(['正在走近…', 'Approaching…']) : nearbyAction?.primary.kind==='action'?label(nearbyAction.primary.id):nearbyAction?.primary.kind==='talk'?text(['交谈','Talk']):nearbyAction?text(['查看','Examine']):text(['走近物件','Move closer'])}</button>
    </footer>
    {!ready&&<OldStreetLoading locale={locale} {...loading} failed={Boolean(error)} failureMessage={error?oldStreetRecoveryMessage(error,locale):undefined} onRetry={()=>location.reload()}/>}
    {error && ready && <button onClick={() => location.reload()}>{text(['重新连接并恢复', 'Reconnect and recover'])}</button>}
    {debug&&<details><summary>Renderer diagnostics</summary><pre style={{maxWidth:'90vw',whiteSpace:'pre-wrap'}}>{error?JSON.stringify({error,renderer:diagnostic}):diagnostic}</pre></details>}
    {journeysOpen&&<OldStreetJourneysView locale={locale} current={serverHead.current?.id??''} api={connection.api} busy={busy} select={id=>{void selectJourney(id)}} close={()=>{setJourneysOpen(false);runtime.current?.pause(Boolean(error||outcome))}}/>}
    {clockOpen&&<OldStreetClockView locale={locale} busy={busy} feedback={clockMessage} submit={proof=>{busyRef.current=true;setBusy(true);void execute('oldstreet:inspect-clock','drawer',undefined,undefined,false,proof)}} close={()=>{setClockOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current))}}/>}
    {journalOpen&&<OldStreetJournalView save={head.save} onClose={()=>{setJournalOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current));journalButton.current?.focus()}}/>}
    {mapOpen&&<OldStreetMapView save={head.save} room={head.scene as OldStreetRoom} locale={locale} onClose={()=>{setMapOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current));mapButton.current?.focus()}}/>}
    {photoOpen && <OldStreetPhotoView locale={locale} busy={busy} feedback={photoMessage} submit={proof=>{busyRef.current=true;setBusy(true);void execute('oldstreet:match-photos','viewing-table',undefined,proof)}} close={()=>{setPhotoOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current))}}/>}
    {leaving && <div className="os-modal" role="dialog" aria-modal="true"><section><p>{text(['带着信回家？离开后这次探索结束。', 'Take the letter home? This ends the exploration.'])}</p>{borrowedItems.length>0&&<p>{text(['还带着待归还的物品：','You still have items to return: '])}{borrowedItems.map(i=>i.label).join(' · ')}{text(['。可以再逛逛，先把它们送回去。','. You can stay and return them first.'])}</p>}<button onClick={() => {setLeaving(false); request('oldstreet:leave', true)}}>{text(['回家', 'Go home'])}</button><button onClick={() => setLeaving(false)}>{text(['再逛逛', 'Stay'])}</button></section></div>}
    {outcome && <div className="os-modal" role="dialog" aria-label={text(['旅程结果','Journey result'])}><section><h2>{head.save.finale.ending?.title ?? text(['信已送到','Letter delivered'])}</h2><p>{head.save.finale.ending?.thesis}</p>{head.save.finale.ending?.preserved.map((line,i)=><p key={'p'+i}>{line}</p>)}{head.save.finale.ending?.unresolved.map((line,i)=><p key={'u'+i}>{line}</p>)}<button disabled={busy||!ready} onClick={()=>{void restart()}}>{text(['重新探索','Explore again'])}</button><button disabled={busy||!ready} onClick={()=>setJourneysOpen(true)}>{text(['查看旅程','View journeys'])}</button></section></div>}
  </main>
  function stick(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || busyRef.current || leaving || error || outcome) return
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / 28, y = (e.clientY - r.top - r.height / 2) / 28
    runtime.current?.move(x, y)
  }
}
