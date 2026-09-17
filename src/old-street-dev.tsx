import {OldStreetRoomWalls,OldStreetRoomForeground} from './old-street-room-walls-view'
import {OldStreetObjectPreview} from './old-street-object-preview'
import {needsRecoveredNegative,negativeSourceReady} from './old-street-negative-source'
import {archiveRackDescription} from './old-street-archive'
import {stableInteraction} from './nearby-interaction'
import {oldStreetInteractionDistance} from './old-street-space'
import {OldStreetConversationChoices} from './old-street-conversation-choices'
import './old-street-content.css'
import {useCommittedStreetPhoto} from './use-committed-street-photo'
import {photoDisplayed} from './old-street-photo-display'
import {OldStreetLeaveView} from './old-street-leave-view'
import {useOldStreetPreparations} from './use-old-street-preparations'
import {OldStreetRoofRecovery} from './old-street-roof-recovery-view'
import {roofRecoveryObstacles,roofSpareBoard,roofSpareVisible} from './old-street-roof-recovery'
import {archiveLoanAt,archiveLoanPaperSheet} from './old-street-archive-loan'
import {oldStreetCurrentPurpose} from './old-street-journal'
import {fieldChoices,fieldSites,fieldHandling} from './old-street-field-inquiry'
import {evidenceChoices} from './old-street-shared-evidence'
import {archivePaperPose,type ArchiveReadingAction} from './old-street-archive-reading'
import {campaignOpening} from './old-street-campaign-story'
import {OldStreetArchiveView} from './old-street-archive-view'
import {archiveFurnitureSheets} from './old-street-archive-art'
import {archiveEventSlots,archiveRackLabel,type ArchiveCardId} from './old-street-archive'
import {OldStreetCampaignView} from './old-street-campaign-view'
import {campaignAnchor,campaignComplete} from './old-street-campaign'
import {campaignPropTitle} from './old-street-campaign-interaction'
import {OldStreetToolIcon} from './old-street-tool-icon'
import {OldStreetEndingView} from './old-street-ending-view'
import {oldStreetDialogueBeats} from './old-street-dialogue-pages'
import {oldStreetRecordBookPose,oldStreetRecordBookSheets} from './old-street-record-book'
import {oldStreetPhotoPuzzle} from './old-street-photo-puzzle'
import {decodeSpatialArt} from './spatial-art-decode'
import shedBenchUrl from '../doc/oldstreet-shed-bench/cutout.png'
import {oldStreetFurniture,oldStreetFurnitureSheet} from './old-street-furniture'
import OldStreetJoystick from './old-street-joystick'
import {OldStreetAudio,StreetFootsteps} from './old-street-audio'
import {OldStreetExpansionView} from './old-street-expansion-view'
import {OldStreetExpansionPhotoView} from './old-street-expansion-photo-view'
import {OldStreetBuildingEdges} from './old-street-boundaries'
import {OldStreetGroundDetail} from './old-street-ground-detail'
import {oldStreetRecoveryMessage,oldStreetActionFailureMessage,oldStreetRecoveryCode} from './old-street-recovery-message'
import cratesUrl from '../doc/oldstreet-crates/threshold-redesign/cutout.png'
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
import {oldStreetCompartmentPose,oldStreetPixelLayeredSheets} from './old-street-prop-art'
import {oldStreetCamera} from './old-street-camera'
import {oldStreetContextAction} from './old-street-context-action'
import {OldStreetDoorways} from './old-street-door-view'
import {OLD_STREET_PREVIEW_VERSION,oldStreetNewJourneyOptions} from './old-street-runtime-contract'
import drawerStatesUrl from '../doc/oldstreet-drawer-guided/states.png'
import {oldStreetDrawerPose,oldStreetDrawerSheet} from './old-street-prop-art'
import {OldStreetJourneysView} from './old-street-journeys-view'
import {oldStreetTurn,oldStreetRecoveredTurn} from './old-street-turn'
import {oldStreetRequiredInspection} from './old-street-inspection'
import {OldStreetClockView} from './old-street-clock-view'
import type {RpgPlayer} from '@rpgjs/server'
import {Direction} from '@rpgjs/common'
import {oldStreetTalkTopics} from './old-street-conversation'
import {OldStreetJournalView} from './old-street-journal-view'
import {OldStreetMapView} from './old-street-map-view'
import {OldStreetPhotoView} from './old-street-photo-view'
import {oldStreetActionNames as actionNames,resolveOldStreetInput} from './old-street-action-input'
import {oldStreetPerson,usesCurrentLaundryCast,usesCurrentPhotographerCast,oldStreetCastArtVersion} from './old-street-characters'
import {laundryActorUrl,laundryActorSheet} from './old-street-laundry-art'
import {photographerActorUrl,photographerActorSheet} from './old-street-photographer-art'
import {oldStreetSession,oldStreetSessionHttp} from './old-street-session'
import type {OldStreetHead} from './old-street-head'
import {loadSpatialArtTexture} from './spatial-art-texture'
import React, {useEffect, useMemo, useRef, useState} from 'react'
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
import './old-street-interface.css'

import type {LanVideoTrial} from './dev/lan-video-trial'

const compositeShop=new URLSearchParams(location.search).get('shop_environment')!=='layered'
const pixelShop=compositeShop||new URLSearchParams(location.search).get('shop_art')!=='legacy'
const newJourneyOptions=oldStreetNewJourneyOptions(import.meta.env.MODE,import.meta.env.DEV,import.meta.env.VITE_OLDSTREET_CAMPAIGN_PREVIEW)
const environmentDownloads=oldStreetEnvironmentDownloads(pixelShop,compositeShop)
const renderedProps=['watchmaker','laundry-owner','photographer','trolley','drawer',...(pixelShop?['letter-compartment','record-book','photo-folder','viewing-table','clock-display','crates']:[])]
const plan = oldStreetSpatialPlan()
const propNames: Record<string, [string, string]> = {
 'developing-bench':['显影台','Developing bench'],
  drawer: ['抽屉', 'Drawer'], 'letter-compartment': ['小格', 'Compartment'], 'record-book': ['记录册', 'Record book'],
  trolley: ['推车', 'Trolley'], crates: ['旧箱', 'Crates'],
  'photo-folder': ['照片夹', 'Photo folder'],
  'viewing-table': ['放大台', 'Viewing table'], 'street-exit': ['回家', 'Home'],
}
export default function OldStreetDev() {
  const initialLocale = navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [head, setHead] = useState(() => ({save: createInitialSave(oldStreetCartridge(initialLocale)), scene: 'street', position: plan.scenes.find(s => s.id === 'street')!.spawn}))
  // A restored journey owns its language, including HUD and action reasons.
  const locale = head.save.locale
  const cartridge = useMemo(() => oldStreetCartridge(locale), [locale])
  const text = (pair: readonly [string, string]) => pair[locale === 'zh' ? 0 : 1]
  const audio=useRef<OldStreetAudio>(),footsteps=useRef(new StreetFootsteps())
  const [soundEnabled,setSoundEnabled]=useState(()=>{try{return window.alteruLocalStorage.getItem('oldstreet-sound')!=='off'}catch{return true}})
  const soundPreference=useRef(soundEnabled);soundPreference.current=soundEnabled
  useEffect(()=>{
    const sound=new OldStreetAudio();sound.setEnabled(soundEnabled);audio.current=sound
    const unlock=()=>sound.unlock(),quiet=()=>{if(document.hidden)sound.setEnabled(false);else sound.setEnabled(soundPreference.current)}
    window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',quiet)
    return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',quiet);sound.dispose()}
  },[])
  const toggleSound=()=>setSoundEnabled(value=>{audio.current?.setEnabled(!value);if(!value)audio.current?.unlock();try{window.alteruLocalStorage.setItem('oldstreet-sound',value?'off':'on')}catch{};return !value})
  const debug = new URLSearchParams(location.search).get('debug') === '1'
  const lanTrialKind=new URLSearchParams(location.search).get('npc_gait_trial')||''
  const lanTrialEnabled=import.meta.env.DEV&&import.meta.env.MODE==='oldstreet-dev'&&debug&&['lan-left','lan-four','lan-platform'].includes(lanTrialKind)
  const lanTrial=useRef<LanVideoTrial>()
  const workerPreview = import.meta.env.MODE !== 'oldstreet-dev' || new URLSearchParams(location.search).get('session') === 'worker'
  const [connection] = useState(() => (workerPreview?oldStreetSessionHttp:oldStreetSession)(window.alteruLocalStorage, async(name, work) => navigator.locks.request(name, work)))
  const serverHead = useRef<OldStreetHead>()
  const [expansionCapabilities,setExpansionCapabilities]=useState({planning:false,media:false,campaign:false})
  const expansionJourney=serverHead.current?.id
  useEffect(()=>{
    let active=true;setExpansionCapabilities({planning:false,media:false,campaign:false})
    if(expansionJourney)void connection.api('/sessions/'+expansionJourney+'/expansion-capabilities').then(c=>{if(active)setExpansionCapabilities({planning:c.planning===true,media:c.media===true,campaign:c.campaign===true})}).catch(()=>{})
    return()=>{active=false}
  },[connection,expansionJourney])
  const current = useRef(head); current.current = head
  const position = useRef(head.position)
  const runtime = useRef<RpgRendererRuntime>()
  const engine = useRef<any>()
  const resident=useRef(new OldStreetResidentMotion(oldStreetProjectedProps({facts:{}}).find(p=>p.id==='watchmaker')!.position))
  const laundryResident=useRef<OldStreetResidentMotion>()
  const photographerResident=useRef<OldStreetResidentMotion>()
  const [,setResidentPosition]=useState({...resident.current.position})
  const residentControls=useRef({paused:true,selected:false,laundrySelected:false,photographerSelected:false})
  const residentPositions=()=>({watchmaker:resident.current.position,...(lanTrial.current?{'laundry-owner':lanTrial.current.position}:laundryResident.current?{'laundry-owner':laundryResident.current.position}:{}),...(photographerResident.current?{photographer:photographerResident.current.position}:{})})
  const localWalkable=(p:{x:number;y:number},room:string)=>oldStreetWalkable(room,p,current.current.save,oldStreetBody,residentPositions())
  const npcEvents=useRef<Record<string,RpgPlayer>>({})
  const archivePaperEvents=useRef<Record<string,RpgPlayer>>({})
  const archiveRackEvent=useRef<RpgPlayer>()
  const roofNegativeEvent=useRef<RpgPlayer>()
  const trolleyEvent=useRef<RpgPlayer>(),drawerEvent=useRef<RpgPlayer>(),compartmentEvent=useRef<RpgPlayer>(),photoShelfEvent=useRef<RpgPlayer>(),photoTableEvent=useRef<RpgPlayer>(),clockDisplayEvent=useRef<RpgPlayer>(),cratesEvent=useRef<RpgPlayer>(),recordBookEvent=useRef<RpgPlayer>()
  useEffect(()=>{if(roofNegativeEvent.current){roofNegativeEvent.current.animationName.set(head.save.facts['roof-negative-returned']?'returned':'stand');roofNegativeEvent.current.syncChanges()}for(const [id,event] of Object.entries(archivePaperEvents.current)){event.animationName.set(archivePaperPose(id,head.save.facts));event.syncChanges()}if(archiveRackEvent.current){const p=oldStreetProjectedProps(head.save).find(p=>p.id==='archive-rack');if(p){void archiveRackEvent.current.teleport({x:p.body.x,y:p.body.y});archiveRackEvent.current.syncChanges()}}if(recordBookEvent.current){recordBookEvent.current.animationName.set(oldStreetRecordBookPose(head.save));recordBookEvent.current.syncChanges()}if(cratesEvent.current){const p=oldStreetProjectedProps(head.save).find(p=>p.id==='crates')!;void cratesEvent.current.teleport({x:p.body.x,y:p.body.y});cratesEvent.current.syncChanges()}if(clockDisplayEvent.current){clockDisplayEvent.current.animationName.set(oldStreetClockDisplayPose(head.save));clockDisplayEvent.current.syncChanges()}if(photoTableEvent.current){photoTableEvent.current.animationName.set(oldStreetPhotoTablePose(head.save));photoTableEvent.current.syncChanges()}if(photoShelfEvent.current){photoShelfEvent.current.animationName.set(oldStreetPhotoShelfPose(head.save,serverHead.current?.campaign));photoShelfEvent.current.syncChanges()}if(compartmentEvent.current){compartmentEvent.current.animationName.set(oldStreetCompartmentPose(head.save));compartmentEvent.current.syncChanges()}if(drawerEvent.current){drawerEvent.current.animationName.set(oldStreetDrawerPose(head.save));drawerEvent.current.syncChanges()}if(trolleyEvent.current){trolleyEvent.current.animationName.set(oldStreetTrolleyPose(head.save));trolleyEvent.current.syncChanges()}},[head])
  const prepareEnvironment=useRef<(room:string)=>Promise<void>>(async()=>{})
  const [environmentArt,setEnvironmentArt]=useState(oldStreetEnvironmentArt)
  const [doorCratesArt,setDoorCratesArt]=useState<string>()
  const [loading,setLoading]=useState({stage:'journey',done:0,total:(pixelShop?11:6)+environmentDownloads.length})
  const [pendingSpeech,setPendingSpeech]=useState<string|null>(null)
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), busyRef = useRef(false)
  const [busyActivity,setBusyActivity]=useState<'approach'|'action'|'reply'|'area'|'journey'>('action')
  const approachCancellation=useRef<(()=>void)|undefined>()
  const busyLabel=text(({approach:['正在走近…','Approaching…'],action:['正在行动…','Taking action…'],reply:['等候回应…','Waiting for a reply…'],area:['正在进入…','Entering…'],journey:['正在恢复…','Resuming…']} as const)[busyActivity])
  const [slowOperation,setSlowOperation]=useState(false)
  useEffect(()=>{setSlowOperation(false);if(!busy||busyActivity==='approach')return;const timer=setTimeout(()=>setSlowOperation(true),3000);return()=>clearTimeout(timer)},[busy,busyActivity])
  const [notice, updateNotice] = useState(''), [error, setError] = useState('')
  const [openingOpen,setOpeningOpen]=useState(false)
  const [turn,setTurn]=useState<ReturnType<typeof oldStreetTurn>>([])
  const visibleTurn=useRef(turn);visibleTurn.current=turn
  const visibleNotice=useRef(notice);visibleNotice.current=notice
  const [turnPage,setTurnPage]=useState(0)
  const [revealedReply,setRevealedReply]=useState('')
  useEffect(()=>setTurnPage(0),[turn])
  useEffect(()=>{if(!turn.length&&/^(已恢复旅程。|已继续这段旅程。|Journey restored\.|Journey resumed\.)$/.test(notice)){const timer=setTimeout(()=>updateNotice(''),3200);return()=>clearTimeout(timer)}},[notice,turn.length])
  const actionPanel=useRef<HTMLElement>(null)
  const setNotice=(value:string)=>{updateNotice(value);setTurn([])}
  const [journeysOpen,setJourneysOpen]=useState(false)
  const [archiveOpen,setArchiveOpen]=useState<string|null>(null)
  const [campaignOpen,setCampaignOpen]=useState<'trace'|'parcel'|null>(null),[campaignMessage,setCampaignMessage]=useState('')
  const [journalOpen,setJournalOpen]=useState(false),journalButton=useRef<HTMLButtonElement>(null)
  const [mapOpen,setMapOpen]=useState(false),mapButton=useRef<HTMLButtonElement>(null)
  const [clockOpen,setClockOpen]=useState(false),[clockMessage,setClockMessage]=useState('')
  const [expansionPhotoRequest,setExpansionPhotoRequest]=useState(0)
  const [expansionPhotoOpen,setExpansionPhotoOpen]=useState(false)
  const modalControls=useRef(false)
  const [photoOpen,setPhotoOpen]=useState(false),[photoMessage,setPhotoMessage]=useState('')
  useEffect(()=>{if(error){setPhotoOpen(false);setClockOpen(false);setCampaignOpen(null);setArchiveOpen(null);runtime.current?.pause(true)}},[error])
  const [typed, setTyped] = useState('')
  const [inputOpen,setInputOpen]=useState(false)
  const [selected, setSelected] = useState<string | null>(null), [leaving, setLeaving] = useState(false)
  useEffect(()=>{actionPanel.current?.querySelectorAll('.os-actions__content,.os-actions__body,.os-actions__options').forEach(content=>{content.scrollTop=0})},[turn,turnPage,notice,error,selected])
  const [feet, setFeet] = useState(head.position), [destination, setDestination] = useState<{x: number; y: number} | null>(null)
  const stage = useRef<HTMLDivElement>(null), world=useRef<HTMLDivElement>(null)
  const [viewport,setViewport]=useState({width:390,height:844})
  const overview=debug&&new URLSearchParams(location.search).get('camera')==='overview'
  const camera=oldStreetCamera(viewport,feet,overview)
  useEffect(()=>{const node=world.current;if(!node)return;const observer=new ResizeObserver(([entry])=>{setViewport({width:entry.contentRect.width,height:entry.contentRect.height}) });observer.observe(node);return()=>observer.disconnect()},[])
  const modalOpen=journalOpen||mapOpen||journeysOpen||clockOpen||photoOpen||expansionPhotoOpen||!!campaignOpen||!!archiveOpen||leaving
  modalControls.current=modalOpen
  residentControls.current={paused:busy||!!error||modalOpen||!!head.save.facts.departed,selected:selected==='watchmaker',laundrySelected:selected==='laundry-owner',photographerSelected:selected==='photographer'}
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
    let recordPhotoBlob:string|undefined
    let shedBenchBlob: string | undefined
    let trolleyBlob: string | undefined
    void (async () => {try {
      let restored = await connection.client.enroll(locale,false,newJourneyOptions)
      const pendingInteraction=connection.client.pending().filter(p=>p.id===restored.id).at(-1)
      const recovered = await connection.client.recover()
      if (recovered) restored = recovered.head
      if (!mounted||!boot.pending()) return
      serverHead.current = restored
      const restoredView = {save:restored.save,scene:restored.sceneId,position:restored.position}
      current.current = restoredView; setHead(restoredView); position.current = restored.position; setFeet(restored.position)
      resident.current=new OldStreetResidentMotion(oldStreetProjectedProps(restored.save).find(p=>p.id==='watchmaker')!.position,restored.position)
      setOpeningOpen(restored.version===0)
      setNotice(restored.version===0?campaignOpening(restored.save,oldStreetCartridge(restored.save.locale).opening.blocks[0].text):(restored.save.locale==='zh'?'已恢复旅程。':'Journey restored.'))
      if(recovered?.rejectionCode){
        setNotice(oldStreetActionFailureMessage(recovered.rejectionCode,restored.save.locale))
        const body=pendingInteraction?.body
        if(body&&['free-input','dialogue'].includes(body.type)&&typeof body.text==='string'&&body.sceneId===restored.sceneId){
          setTyped(body.text);setSelected(body.target)
        }
      }else if(recovered)setTurn(oldStreetRecoveredTurn(pendingInteraction,restored,recovered.accepted===true))
      const trialModule=lanTrialEnabled?(lanTrialKind==='lan-platform'?await import('./dev/laundry-platform-trial'):await import('./dev/lan-video-trial')):null
      if(trialModule)lanTrial.current=new trialModule.LanVideoTrial(oldStreetProjectedProps(restored.save).find(p=>p.id==='laundry-owner')!.position)
      const currentLaundry=usesCurrentLaundryCast(restored.save),currentPhotographer=usesCurrentPhotographerCast(restored.save)
      const npcArt=actorArt.balanced.mechanic
      const initialEnvironment=oldStreetEnvironmentDownloads(pixelShop,compositeShop,restored.sceneId)
      const sources=[...initialEnvironment,{id:'shedBench',url:shedBenchUrl},{id:'hero',url:new URL(hero.path,document.baseURI).href},{id:'watchmaker',url:new URL(npcArt.path,document.baseURI).href},{id:'lan',url:trialModule?.atlasUrl??(currentLaundry?laundryActorUrl:lanStandingUrl)},{id:'xu',url:currentPhotographer?photographerActorUrl:xuStandingUrl},{id:'drawer',url:pixelShop?pixelDrawerUrl:drawerStatesUrl},{id:'trolley',url:trolleyUrl},...(pixelShop?[{id:'props',url:pixelPropsUrl},{id:'recordPhoto',url:oldStreetPhotoPuzzle.image},{id:'photoShelf',url:photoShelfUrl},{id:'photoTable',url:photoTableUrl},{id:'mantelClock',url:mantelClockUrl},{id:'crates',url:cratesUrl}]:[])]
      const urls=await downloadSpatialArt(sources,{signal:downloads.signal,progress:(done,total)=>{if(mounted)setLoading({stage:'art',done,total})}})
      shedBenchBlob=urls.shedBench;cratesBlob=urls.crates;mantelClockBlob=urls.mantelClock;photoTableBlob=urls.photoTable;photoShelfBlob=urls.photoShelf;heroBlob=urls.hero;watchmakerBlob=urls.watchmaker;lanBlob=urls.lan;xuBlob=urls.xu;drawerBlob=urls.drawer;trolleyBlob=urls.trolley;pixelPropsBlob=urls.props;recordPhotoBlob=urls.recordPhoto
      if(!mounted||!boot.pending()){Object.values(urls).forEach(url=>URL.revokeObjectURL(url));return}
      environmentBlobs=initialEnvironment.map(e=>urls[e.id])
      setLoading({stage:'textures',done:sources.length,total:sources.length})
      await Promise.all(Object.entries(urls).map(async([id,url])=>{
        if(id.startsWith('environment-')){await decodeSpatialArt(url,{signal:downloads.signal})}
        else await loadSpatialArtTexture(url,pixelShop?'nearest':'linear')
      }))
      if(mounted&&boot.pending())setDoorCratesArt(cratesBlob)
      if(mounted&&boot.pending())setEnvironmentArt({...oldStreetEnvironmentArt,...Object.fromEntries(initialEnvironment.map(e=>[e.id.slice('environment-'.length),urls[e.id]]))})
      const loadedEnvironment=new Set(initialEnvironment.map(e=>e.id))
      const pendingEnvironment=new Map<string,Promise<void>>()
      prepareEnvironment.current=async room=>{
        const missing=oldStreetEnvironmentDownloads(pixelShop,compositeShop,room).filter(e=>!loadedEnvironment.has(e.id))
        if(missing.length){setBusyActivity('area');setNotice(current.current.save.locale==='zh'?'正在展开前方的场景…':'Preparing the next area…')}
        await Promise.all(missing.map(entry=>{
          const existing=pendingEnvironment.get(entry.id);if(existing)return existing
          const task=(async()=>{
            const downloaded=await downloadSpatialArt([entry],{signal:downloads.signal})
            const url=downloaded[entry.id]
            try{
              await decodeSpatialArt(url,{signal:downloads.signal})
              if(!mounted)throw Error('ART_DOWNLOAD_CANCELLED')
              environmentBlobs.push(url);loadedEnvironment.add(entry.id)
              setEnvironmentArt(previous=>({...previous,[entry.id.slice('environment-'.length)]:url}))
            }catch(error){URL.revokeObjectURL(url);throw error}
          })().finally(()=>pendingEnvironment.delete(entry.id))
          pendingEnvironment.set(entry.id,task);return task
        }))
      }
      if(!mounted||!boot.pending())return
      const preview=await decodeSpatialArt(heroBlob!,{signal:downloads.signal})
      if(mounted&&boot.pending())setLoading({stage:'map',done:sources.length,total:sources.length})
      if (!mounted||!boot.pending()) return
      createRpgRenderer({host: document.getElementById('rpg')!, width: 384, height: 576, controlsBlocked:()=>modalControls.current,
        sceneIds: plan.scenes.map(s => s.id), mapIds: Object.fromEntries(plan.scenes.map(s => [s.id, `oldstreet-${s.id}`])),
        initialScene: restored.sceneId, initialPosition: restored.position, heroGraphic: 'hero', heroBody:oldStreetBody, strideLength:oldStreetStride,
        spritesheets: [...(photoShelfBlob?[archiveLoanPaperSheet(photoShelfBlob)]:[]),...(photoTableBlob&&photoShelfBlob?archiveFurnitureSheets(photoTableBlob,photoShelfBlob):[]),oldStreetFurnitureSheet(shedBenchBlob),actorSheet('hero', preview.src, hero.width, hero.height, hero.baselines, oldStreetHeroScale, hero.centers, {x:oldStreetBody.w/2,y:oldStreetBody.h}),actorSheet('oldstreet-watchmaker',watchmakerBlob,npcArt.width,npcArt.height,npcArt.baselines,.22,npcArt.centers,{x:16,y:28}),(trialModule?trialModule.sheet(lanBlob!):currentLaundry?laundryActorSheet(lanBlob!):standingActorSheet('oldstreet-lan',lanBlob,256,352,{x:128,y:328},.22,{x:16,y:28})),(currentPhotographer?photographerActorSheet(xuBlob!):standingActorSheet('oldstreet-xu',xuBlob,256,352,{x:128,y:328},.22,{x:16,y:28})),...(pixelShop?oldStreetPixelLayeredSheets(drawerBlob,'drawer'):[oldStreetDrawerSheet(drawerBlob)]),oldStreetTrolleySheet(trolleyBlob),...(cratesBlob?[oldStreetCratesSheet(cratesBlob)]:[]),...(mantelClockBlob&&photoShelfBlob?oldStreetClockDisplaySheets(photoShelfBlob,mantelClockBlob):[]),...(photoTableBlob&&photoShelfBlob?oldStreetPhotoTableSheets(photoTableBlob,photoShelfBlob):[]),...(photoShelfBlob?oldStreetPhotoShelfSheets(photoShelfBlob):[]),...(pixelPropsBlob&&recordPhotoBlob&&mantelClockBlob?[...oldStreetPixelLayeredSheets(pixelPropsBlob,'letter-compartment'),...oldStreetRecordBookSheets(pixelPropsBlob,recordPhotoBlob,mantelClockBlob,photoShelfBlob)]:[])], mapEvents: room => {photographerResident.current=currentPhotographer?new OldStreetResidentMotion(oldStreetProjectedProps(current.current.save).find(p=>p.id==='photographer')!.position,current.current.position,'x',24):undefined;laundryResident.current=currentLaundry&&!trialModule?new OldStreetResidentMotion(oldStreetProjectedProps(current.current.save).find(p=>p.id==='laundry-owner')!.position,current.current.position,'y',9):undefined;resident.current=new OldStreetResidentMotion(oldStreetProjectedProps(current.current.save).find(p=>p.id==='watchmaker')!.position,current.current.position);setResidentPosition({...resident.current.position});npcEvents.current={};roofNegativeEvent.current=undefined;archivePaperEvents.current={};archiveRackEvent.current=undefined;trolleyEvent.current=undefined;drawerEvent.current=undefined;compartmentEvent.current=undefined;photoShelfEvent.current=undefined;photoTableEvent.current=undefined;clockDisplayEvent.current=undefined;cratesEvent.current=undefined;recordBookEvent.current=undefined;return (room==='archive'?archiveEventSlots():oldStreetProjectedProps(current.current.save,residentPositions())).filter(p=>p.room===room&&(renderedProps.includes(p.id)||p.id.startsWith('archive-'))).map(p=>({id:'oldstreet-'+p.id,x:p.body.x,y:p.body.y,event:{onInit(this:RpgPlayer){if(p.id.startsWith('archive-')){const placed=oldStreetProjectedProps(current.current.save).find(prop=>prop.id===p.id);if(placed)void this.teleport({x:placed.body.x,y:placed.body.y})}this.setHitbox(p.body.w,p.body.h);this.through=true;this.animationFixed=true;this.setGraphic((p.id==='archive-rack'||p.id.startsWith('archive-storage-'))?['oldstreet-'+p.id]:p.id.startsWith('archive-')?['oldstreet-'+p.id,'oldstreet-'+p.id+'-papers']:p.id==='record-book'?['oldstreet-record-book','oldstreet-record-photo','oldstreet-record-clock',...(photoShelfBlob?['oldstreet-record-summary']:[])]:p.id==='crates'?'oldstreet-crates':p.id==='clock-display'?['oldstreet-clock-counter','oldstreet-returned-clock',...(current.current.save.facts['archive-ledger-site']==='laundry'?['oldstreet-loaned-log']:[])]:p.id==='viewing-table'?['oldstreet-viewing-table','oldstreet-returned-photos',...(current.current.save.facts['archive-ledger-site']==='photo'?['oldstreet-loaned-log']:[])]:p.id==='photo-folder'?['oldstreet-photo-folder-shelf','oldstreet-photo-folder-top','oldstreet-archived-papers']:pixelShop&&['drawer','letter-compartment'].includes(p.id)?['oldstreet-'+p.id+'-top','oldstreet-'+p.id+'-front']:['letter-compartment','record-book'].includes(p.id)?'oldstreet-'+p.id:p.id==='drawer'?'oldstreet-drawer':p.id==='watchmaker'?'oldstreet-watchmaker':p.id==='trolley'?'oldstreet-trolley':p.id==='photographer'?'oldstreet-xu':'oldstreet-lan');this.animationName.set((p.id==='archive-rack'||p.id.startsWith('archive-storage-'))&&!oldStreetProjectedProps(current.current.save).some(prop=>prop.id===p.id)?'hidden':p.id==='record-book'?oldStreetRecordBookPose(current.current.save):p.id==='clock-display'?oldStreetClockDisplayPose(current.current.save):p.id==='viewing-table'?oldStreetPhotoTablePose(current.current.save):p.id==='photo-folder'?oldStreetPhotoShelfPose(current.current.save,serverHead.current?.campaign):p.id==='letter-compartment'?oldStreetCompartmentPose(current.current.save):p.id==='drawer'?oldStreetDrawerPose(current.current.save):p.id==='trolley'?oldStreetTrolleyPose(current.current.save):'stand');this.direction.set(Direction.Down);if(['archive-index','archive-ledger','archive-desk'].includes(p.id)){archivePaperEvents.current[p.id]=this;this.animationName.set(archivePaperPose(p.id,current.current.save.facts))}if(p.id==='archive-rack')archiveRackEvent.current=this;else if(p.id==='crates')cratesEvent.current=this;else if(p.id==='clock-display')clockDisplayEvent.current=this;else if(p.id==='viewing-table')photoTableEvent.current=this;else if(p.id==='photo-folder')photoShelfEvent.current=this;else if(p.id==='letter-compartment')compartmentEvent.current=this;else if(p.id==='record-book')recordBookEvent.current=this;else if(p.id==='drawer')drawerEvent.current=this;else if(p.id==='trolley')trolleyEvent.current=this;else if(['watchmaker','laundry-owner','photographer'].includes(p.id))npcEvents.current[p.id]=this;this.syncChanges()}}})).concat(room==='photo'&&pixelShop&&current.current.save.facts['roof-recovery']?[{id:'oldstreet-roof-negative',x:oldStreetProjectedProps(current.current.save).find(p=>p.id==='viewing-table')!.body.x,y:oldStreetProjectedProps(current.current.save).find(p=>p.id==='viewing-table')!.body.y,event:{onInit(this:RpgPlayer){this.setHitbox(32,28);this.through=true;this.animationFixed=true;this.setGraphic('oldstreet-returned-negative');this.animationName.set(current.current.save.facts['roof-negative-returned']?'returned':'stand');roofNegativeEvent.current=this;this.syncChanges()}}}]:[]).concat(oldStreetFurniture.filter(p=>p.room===room).map(p=>({id:'oldstreet-'+p.id,x:p.body.x,y:p.body.y,event:{onInit(this:RpgPlayer){this.setHitbox(p.body.w,p.body.h);this.through=true;this.animationFixed=true;this.setGraphic('oldstreet-'+p.id);this.animationName.set('stand');this.direction.set(Direction.Down);this.syncChanges()}}})))},
        walkable: localWalkable, replanBlockedRoute:true,
        onRouteBlocked:()=>{if(mounted)setNotice(text(['通路暂时被挡住了，可以重新选择落点。','The path is blocked. Choose another destination.']))},
        safePosition: (p, room) => oldStreetWalkable(room, p, current.current.save) ? p : plan.scenes.find(s => s.id === room)!.spawn,
        findPath: (a, b, room) => findGridPath(a,b,p=>localWalkable(p,room)),
        onPosition: p => {const moved=Math.hypot(p.x-position.current.x,p.y-position.current.y)>.01;position.current = p; if (mounted) {setFeet(p);if(moved&&!busyRef.current){setSelected(null);setOpeningOpen(false)};if(moved&&!busyRef.current&&(visibleTurn.current.length||visibleNotice.current)){visibleTurn.current=[];visibleNotice.current='';setNotice('');setSelected(null)}}}, onDestination: p => {if (mounted) {setDestination(p);if(p){visibleTurn.current=[];setNotice('');if(!busyRef.current)setSelected(null)}}},
        onRouteCancelled:()=>{const cancel=approachCancellation.current;approachCancellation.current=undefined;if(mounted)cancel?.()},
        onFrame:(dt,hero,room,paused)=>{
          const step=footsteps.current.update(dt,hero,room,paused);if(step)audio.current?.play(step)
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
            }else if(id==='laundry-owner'&&lanTrial.current){
              const m=lanTrial.current,before={...m.position}
              const dx=hero.x-m.position.x,dy=hero.y-m.position.y,near=Math.hypot(dx,dy)<54
              m.update(dt,paused||residentControls.current.paused||near,p=>{
                const body={x:p.x-12,y:p.y-12,w:32,h:28}
                return oldStreetWalkable(room,body,current.current.save,{w:32,h:28},residentPositions(),true,'laundry-owner')&&!(body.x<hero.x+oldStreetBody.w&&body.x+body.w>hero.x&&body.y<hero.y+oldStreetBody.h&&body.y+body.h>hero.y)
              })
              if(before.x!==m.position.x||before.y!==m.position.y)void event.teleport({x:m.position.x-12,y:m.position.y-12})
              event.direction.set(m.pose==='stand'&&Math.hypot(dx,dy)<96?(Math.abs(dx)>Math.abs(dy)?dx>0?Direction.Right:Direction.Left:dy>0?Direction.Down:Direction.Up):m.direction as Direction);event.animationName.set(m.pose);event.syncChanges()
              if(before.x!==m.position.x||before.y!==m.position.y)setResidentPosition({...resident.current.position})
            }else if((id==='laundry-owner'&&laundryResident.current)||(id==='photographer'&&photographerResident.current)){
              const m=(id==='laundry-owner'?laundryResident.current:photographerResident.current)!,before={...m.position}
              m.update(dt,hero,paused||residentControls.current.paused,id==='laundry-owner'?residentControls.current.laundrySelected:residentControls.current.photographerSelected,p=>{
                const body={x:p.x-12,y:p.y-12,w:32,h:28}
                return oldStreetWalkable(room,body,current.current.save,{w:32,h:28},residentPositions(),true,id as 'laundry-owner'|'photographer')&&!(body.x<hero.x+oldStreetBody.w&&body.x+body.w>hero.x&&body.y<hero.y+oldStreetBody.h&&body.y+body.h>hero.y)
              })
              if(before.x!==m.position.x||before.y!==m.position.y){void event.teleport({x:m.position.x-12,y:m.position.y-12});setResidentPosition({...resident.current.position})}
              event.direction.set(m.direction as Direction);event.animationName.set(m.pose);event.syncChanges()
            }else {const dx=hero.x-prop.position.x,dy=hero.y-prop.position.y;if(Math.hypot(dx,dy)>1&&Math.hypot(dx,dy)<96){event.direction.set(Math.abs(dx)>Math.abs(dy)?(dx>0?Direction.Right:Direction.Left):(dy>0?Direction.Down:Direction.Up));event.syncChanges()}}
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
    return () => {mounted = false; environmentBlobs.forEach(url=>URL.revokeObjectURL(url)); boot.cancel(); downloads.abort(); runtime.current?.destroy(); if(recordPhotoBlob) URL.revokeObjectURL(recordPhotoBlob);if(mantelClockBlob) URL.revokeObjectURL(mantelClockBlob);if(photoTableBlob) URL.revokeObjectURL(photoTableBlob); if(photoShelfBlob) URL.revokeObjectURL(photoShelfBlob)
      if(shedBenchBlob)URL.revokeObjectURL(shedBenchBlob);if(cratesBlob)URL.revokeObjectURL(cratesBlob);if (heroBlob) URL.revokeObjectURL(heroBlob);if(watchmakerBlob)URL.revokeObjectURL(watchmakerBlob);if(lanBlob)URL.revokeObjectURL(lanBlob);if(xuBlob)URL.revokeObjectURL(xuBlob);if(drawerBlob)URL.revokeObjectURL(drawerBlob);if(pixelPropsBlob)URL.revokeObjectURL(pixelPropsBlob);if(trolleyBlob)URL.revokeObjectURL(trolleyBlob)}
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
    setBusyActivity('journey')
    busyRef.current=true;setBusy(true);runtime.current!.pause(true)
    try{
      const h=await connection.client.selectSession(id)
      // The atlas is chosen at renderer boot. A journey with another cast
      // must rebuild it instead of keeping the previous journey's texture.
      if(oldStreetCastArtVersion(h.save)!==oldStreetCastArtVersion(current.current.save)||h.save.facts['archive-layout']!==current.current.save.facts['archive-layout']||h.save.facts['archive-room']!==current.current.save.facts['archive-room']){location.reload();return}
      serverHead.current=h
      const next={save:h.save,scene:h.sceneId,position:h.position};current.current=next
      await prepareEnvironment.current(h.sceneId)
      await runtime.current!.restore(h.position,h.sceneId)
      setHead(next);position.current=h.position;setFeet(h.position);setSelected(null);setOpeningOpen(false);setError('');setNotice(h.save.locale==='zh'?'已继续这段旅程。':'Journey resumed.');setJourneysOpen(false)
      runtime.current!.pause(Boolean(h.save.facts.departed))
    }catch(e){setJourneysOpen(false);setError(String(e))}finally{busyRef.current=false;setBusy(false)}
  }
  async function restart(campaign=false){
    if(busyRef.current||!ready)return
    setBusyActivity('journey')
    busyRef.current=true;setBusy(true);runtime.current!.pause(true)
    try{
      const h=await connection.client.enroll(locale,true,campaign?{campaign:'letter-trail-v4'}:newJourneyOptions)
      if(oldStreetCastArtVersion(h.save)!==oldStreetCastArtVersion(current.current.save)||h.save.facts['archive-layout']!==current.current.save.facts['archive-layout']||h.save.facts['archive-room']!==current.current.save.facts['archive-room']){location.reload();return}
      serverHead.current=h
      const next={save:h.save,scene:h.sceneId,position:h.position}
      current.current=next
      await prepareEnvironment.current(h.sceneId)
      await runtime.current!.restore(h.position,h.sceneId)
      current.current=next;setHead(next);position.current=h.position;setFeet(h.position);setSelected(null);setError('');setOpeningOpen(true);setNotice(campaignOpening(h.save,cartridge.opening.blocks[0].text));setJourneysOpen(false)
      runtime.current!.pause(false)
    }catch(e){setJourneysOpen(false);setError(String(e))}finally{busyRef.current=false;setBusy(false)}
  }
  function ruleFor(id: string) {return resolveDomainAction(current.current.save, cartridge, id)}
  async function requestExpansion(input:string,activate=false,photoMatch?:unknown,decision?:string,followArchive=false){
    const h=serverHead.current
    if(!h||!ready||busyRef.current||error||outcome)throw Error('NOT_READY')
    if(h.expansions?.length&&!activate&&!photoMatch&&!decision)return
    setBusyActivity('action')
    busyRef.current=true;setBusy(true);runtime.current?.pause(true)
    try{
      const result=await connection.client.send(h,{type:decision?'expansion-photo-decision':photoMatch?'expansion-photo-match':activate?'expansion-activate':'expansion-request',...(photoMatch?{photoMatch}:{}),...(decision?{decision}:{}),template:'photo-darkroom-v1',text:input,...(followArchive?{followArchive:true}:{}),position:{...position.current}})
      const nextHead=result.head as OldStreetHead
      if(!nextHead.expansions?.length)throw Error('EXPANSION_NOT_SAVED')
      if(photoMatch||decision){setNotice('');setTurn([]);setPendingSpeech(null)}
      serverHead.current=nextHead
      const next={save:nextHead.save,scene:nextHead.sceneId,position:nextHead.position}
      current.current=next;setHead(next)
      // RecoverableSessionClient settles a definite refusal with the current
      // head. It is not a successful puzzle submission and must keep the view
      // open for correction instead of closing it as if the photograph cleared.
      if(result.rejectionCode)throw Error(result.rejectionCode)
      if(activate){setSelected(null);setNotice(text(['暗房门已可以通行。从照相馆后门进入。','The darkroom door is ready. Enter through the studio’s back door.']))}
    }catch(e){if(connection.client.hasPending())setError(e instanceof Error?e.message:'SESSION_REQUEST_FAILED');throw e}
    finally{busyRef.current=false;setBusy(false);runtime.current?.pause(connection.client.hasPending())}
  }
  async function execute(id: string, target: string, input?:string, photoMatch?:unknown, dialogue=false,clockInspection?:unknown,campaignMove?:'slide'|'restore') {
    approachCancellation.current=undefined
    setBusyActivity(dialogue?'reply':'action')
    if(input!==undefined)setNotice(text(dialogue?['等候回应…','Waiting for a reply…']:['正在行动…','Taking action…']))
    try {
      const h = serverHead.current!
      runtime.current!.pause(true)
      const interactionTarget=liveEntities().find(entity=>entity.id===target&&entity.scene===h.sceneId)
      if(interactionTarget)runtime.current!.face?.(interactionTarget.position)
      const arrivedPosition={...position.current}
      // Flush arrival after any older periodic checkpoint. A refused action
      // restores this location without committing a story turn.
      await navigator.locks.request('oldstreet-checkpoint',async()=>{
        try{await connection.api('/sessions/'+h.id+'/position',{sceneId:h.sceneId,expected_version:h.version,position:arrivedPosition})}
        catch(e){if(!(e instanceof Error)||e.message!=='STALE_POSITION')throw e}
      })
      // A stale checkpoint falls through to the session conflict/recovery path;
      // never overwrite a newer scene with this tab's arrival position.
      const result = await connection.client.send(h,{...(campaignMove?{type:'campaign-decide',stage:'archive',selection:campaignMove}:input===undefined?{type:'action',action:id}:{type:dialogue?'dialogue':'free-input',text:input,...(new URLSearchParams(location.search).get('interpret')==='live'?{mode:'live'}:new URLSearchParams(location.search).get('interpret')==='local'?{mode:'local'}:{})}),target,position:arrivedPosition,...(photoMatch?{photoMatch}:{}),...(clockInspection?{clockInspection}:{})})
      if(input!==undefined&&result.accepted!==true)setTyped(input)
      const nextHead = result.head as OldStreetHead
      if(result.accepted&&nextHead.version>h.version&&!dialogue){
        const gained=nextHead.save.inventory.some(item=>item.count>(h.save.inventory.find(old=>old.id===item.id)?.count??0))
        if(nextHead.save.facts.departed&&!h.save.facts.departed)audio.current?.play('ending')
        else if(gained)audio.current?.play('pickup')
        else if(target!=='watchmaker'&&target!=='laundry-owner'&&target!=='photographer'&&nextHead.sceneId===h.sceneId&&JSON.stringify(h.save.facts)!==JSON.stringify(nextHead.save.facts))audio.current?.play('handle')
      }
      serverHead.current = nextHead
      const next = {save:nextHead.save,scene:nextHead.sceneId,position:nextHead.position}
      current.current = next
      await prepareEnvironment.current(nextHead.sceneId)
      await runtime.current!.restore(nextHead.position,nextHead.sceneId)
      current.current = next; setHead(next); position.current = next.position; setSelected(next.scene===h.sceneId?target:null)
      const attemptedAction=id||(input?resolveOldStreetInput(input,locale,oldStreetSpatialPlan(next.save).entities.find(e=>e.id===target)?.actions??[]):undefined)
      const blockedReason=attemptedAction?[...new Set(resolveDomainAction(next.save,cartridge,attemptedAction)?.reasons??[])].join(' '):undefined
      setNotice(result.text ?? (result.rejectionCode==='OLD_STREET_CLOCK_INSPECTION_REQUIRED'?text(['先用放大镜找到并辨认刻记。','Find and identify the mark with the lens first.']):result.rejectionCode==='OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'?text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']):result.rejectionCode==='OLD_STREET_ACTION_UNAVAILABLE'?(blockedReason||text(['这一步现在还不能做，看看手边的物品和已发现的线索。','That step is not available yet. Check your items and discoveries.'])):result.rejectionCode==='OLD_STREET_INPUT_UNSUPPORTED'?text(['没有理解这一步。可以选择上面的行动，或换个说法。','I did not understand that action. Choose an action above or rephrase.']):result.rejectionCode?oldStreetActionFailureMessage(result.rejectionCode,locale):undefined) ?? '')
      setTurn(oldStreetTurn(h,nextHead,result.accepted===true))
      if(input!==undefined&&result.accepted&&((next.scene==='archive'&&target!=='archive-rack'&&target.startsWith('archive-'))||(nextHead.campaign?.archive&&archiveLoanAt(nextHead.campaign.archive.content,target)&&!h.campaign?.archive?.examined.includes('ledger')&&nextHead.campaign.archive.examined.includes('ledger')))){setArchiveOpen(target);setCampaignMessage('');setTurn([]);setNotice('');runtime.current!.pause(true)}
      const expansionInspection=next.scene==='darkroom'&&target==='developing-bench'&&result.rejectionCode==='OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'
      if(expansionInspection)setExpansionPhotoRequest(n=>n+1)
      const requiredInspection=oldStreetRequiredInspection(next.save,next.scene,target,result.rejectionCode)
      if(requiredInspection==='clock'){setClockOpen(true);setClockMessage('');if(input!==undefined)setNotice(text(['拿近看看钟底。','Bring the clock closer to inspect its underside.']))}
      if(requiredInspection==='photo'){setPhotoOpen(true);setPhotoMessage('');if(input!==undefined)setNotice(text(['把照片放到放大台上比对。','Place the photographs on the viewing table.']))}
      if(id==='oldstreet:inspect-clock'){if(result.accepted)setClockOpen(false);else setClockMessage(text(['再仔细看看刻记，也可以换一处观察。','Look more closely at the mark, or examine another area.']))}
      if(id==='oldstreet:match-photos'){if(result.accepted)setPhotoOpen(false);else setPhotoMessage(text(['边缘还没有接上，再试试另一片或方向。','The edges do not match. Try another piece or orientation.']))}
      runtime.current!.pause(Boolean(nextHead.save.facts.departed)||Boolean(requiredInspection)||expansionInspection||((photoOpen||clockOpen)&&!result.accepted))
    } catch (e) {if(input!==undefined)setTyped(input);setError(String(e)); runtime.current?.pause(true)}
    finally {setPendingSpeech(null);busyRef.current = false; setBusy(false)}
  }
  function request(id: string, confirmed = false) {
    if (!ready || busyRef.current || error || current.current.save.facts.departed) return
    const binding = bindOldStreet(locale, current.current.save), target = binding.targetFor(id, current.current.scene)
    const entity = liveEntities().find(e => e.id === target)
    if (!entity || !runtime.current) return
    if(id==='oldstreet:leave'&&serverHead.current?.campaign&&!campaignComplete(serverHead.current.campaign,serverHead.current.save.facts)){setNotice(oldStreetCurrentPurpose(serverHead.current.save,serverHead.current.campaign));return}
    if (id === 'oldstreet:leave' && !confirmed) {setLeaving(true); return}
    setBusyActivity('approach')
    busyRef.current = true; setBusy(true)
    prepareApproachCancellation()
    const started = runtime.current.walkTo(entity.approach, () => {approachCancellation.current=undefined;if(id==='oldstreet:inspect-clock'){setClockOpen(true);setClockMessage('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)}else if(id==='oldstreet:match-photos'){setPhotoOpen(true);setPhotoMessage('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)}else void execute(id, entity.id)})
    if (!started) {approachCancellation.current=undefined;busyRef.current = false; setBusy(false); setNotice(text(['这里暂时走不过去。', 'There is no clear path.']))}
  }
  function prepareApproachCancellation(input?:string){
    approachCancellation.current=()=>{busyRef.current=false;setBusy(false);setPendingSpeech(null);if(input!==undefined){setTyped(input);setInputOpen(true)}setNotice(text(['已停下。','Stopped.']))}
  }
  function stopApproaching(){
    if(!approachCancellation.current)return
    runtime.current?.pause(true);runtime.current?.pause(Boolean(error||outcome))
  }
  function openArchive(target:string){
    if(!ready||busyRef.current||error||(serverHead.current?.campaign?.version??0)<2)return
    const entity=liveEntities().find(e=>e.id===target&&e.scene===current.current.scene);if(!entity)return
    setCampaignOpen(null);runtime.current?.pause(false);setBusyActivity('approach');busyRef.current=true;setBusy(true);prepareApproachCancellation()
    if(!runtime.current!.walkTo(entity.approach,()=>{approachCancellation.current=undefined;if(target==='archive-rack'){void execute('',target,undefined,undefined,false,undefined,current.current.save.facts['archive-rack-shifted']===true?'restore':'slide');return}setArchiveOpen(target);setCampaignMessage('');setNotice('');runtime.current!.pause(true);busyRef.current=false;setBusy(false);const source=target==='archive-index'?'index':target==='archive-ledger'||serverHead.current?.campaign?.archive&&archiveLoanAt(serverHead.current.campaign.archive.content,target)?'ledger':undefined;if(source&&serverHead.current?.campaign?.archive?.content.denseSource!==source&&!serverHead.current?.campaign?.archive?.examined.includes(source))void archiveAct('observe',undefined,target)})){approachCancellation.current=undefined;busyRef.current=false;setBusy(false);setNotice(text(['这里暂时走不过去。','There is no clear path.']))}
  }
  async function archiveAct(type:'plan'|'observe'|'decide',order?:ArchiveCardId[],target=archiveOpen,selection?:ArchiveReadingAction,stage:'archive'|'field'='archive'){
    const h=serverHead.current;if(!h||!target||busyRef.current)return
    setBusyActivity('action');busyRef.current=true;setBusy(true);setCampaignMessage('')
    try{
      const result=await connection.client.send(h,{type:'campaign-'+type,stage,target,order,selection,position:{...position.current}})
      const updated=result.head as OldStreetHead;serverHead.current=updated
      const next={save:updated.save,scene:updated.sceneId,position:updated.position};current.current=next;setHead(next)
      if(!result.accepted)setCampaignMessage(oldStreetActionFailureMessage(result.rejectionCode??'',locale))
      else if(type==='decide'){audio.current?.play('handle');if(selection)setCampaignMessage((result.text??'').split('\n')[0])}
    }catch(e){if(connection.client.hasPending())setError(String(e));else setCampaignMessage(oldStreetActionFailureMessage(e instanceof Error?e.message:'',locale))}
    finally{busyRef.current=false;setBusy(false)}
  }
  function openCampaign(stage:'trace'|'parcel'){
    if(!ready||busyRef.current||error||!serverHead.current?.campaign)return
    const entity=liveEntities().find(e=>e.id===campaignAnchor[stage].target&&e.scene===current.current.scene)
    if(!entity)return
    setBusyActivity('approach')
    busyRef.current=true;setBusy(true)
    prepareApproachCancellation()
    if(!runtime.current!.walkTo(entity.approach,()=>{approachCancellation.current=undefined;setCampaignOpen(stage);setCampaignMessage('');setNotice('');runtime.current!.pause(true);busyRef.current=false;setBusy(false)})){approachCancellation.current=undefined;busyRef.current=false;setBusy(false);setNotice(text(['这里暂时走不过去。','There is no clear path.']))}
  }
  async function campaignAct(type:'read'|'observe'|'decide',selection?:number|string){
    const h=serverHead.current,stage=campaignOpen
    if(!h||!stage||busyRef.current)return
    setBusyActivity('action')
    busyRef.current=true;setBusy(true);setCampaignMessage('')
    try{
      const result=await connection.client.send(h,{type:'campaign-'+type,stage,target:campaignAnchor[stage].target,selection,position:{...position.current}})
      const updated=result.head as OldStreetHead;serverHead.current=updated
      const next={save:updated.save,scene:updated.sceneId,position:updated.position};current.current=next;setHead(next)
      if(result.accepted){if(selection==='take')audio.current?.play('pickup');else if(type==='decide')audio.current?.play('handle')}
      else setCampaignMessage(oldStreetActionFailureMessage(result.rejectionCode??'',locale))
    }catch(e){if(connection.client.hasPending())setError(String(e));else setCampaignMessage(text(['暂时没能展开，可以稍后再试。','The papers could not open. Try again later.']))}
    finally{busyRef.current=false;setBusy(false)}
  }
  function sendInput(dialogue=false,provided?:string){
    if(!chosen||!(provided??typed).trim()||!ready||busyRef.current||error||leaving||head.save.facts.departed)return
    const input=(provided??typed).trim(),target=chosen.id
    setInputOpen(false)
    setBusyActivity('approach')
    busyRef.current=true;setBusy(true);setTurn([]);setPendingSpeech(input);setNotice(text(['正在走近…','Walking closer…']))
    prepareApproachCancellation(input)
    if(!runtime.current!.walkTo(chosen.approach,()=>{void execute('',target,input,undefined,dialogue)})){approachCancellation.current=undefined;setPendingSpeech(null);busyRef.current=false;setBusy(false);setNotice(text(['这里暂时走不过去。','There is no clear path.']))}
    else setTyped('')
  }
  function liveEntities(){const props=oldStreetProjectedProps(current.current.save,residentPositions());return oldStreetSpatialPlan(current.current.save).entities.map(e=>{const p=props.find(p=>p.id===e.id);return p?{...e,position:p.position,approach:p.approach}:e})}
  const entities = liveEntities().filter(e => e.scene === head.scene && (!e.id.includes('studio-darkroom')||head.save.facts['darkroom-ready'])&&(!e.id.includes('cellar-archive')||head.save.facts['archive-ready']))
  const nearbyFocus=useRef<{scene:string;previous?:string;preferred?:string}>({scene:head.scene})
  if(nearbyFocus.current.scene!==head.scene)nearbyFocus.current={scene:head.scene}
  if(nearbyFocus.current.preferred&&!entities.some(e=>e.id===nearbyFocus.current.preferred))nearbyFocus.current.preferred=undefined
  const nearest=stableInteraction(entities,feet,oldStreetInteractionDistance,nearbyFocus.current.previous,nearbyFocus.current.preferred)
  if(nearbyFocus.current.previous===nearbyFocus.current.preferred&&nearest?.id!==nearbyFocus.current.preferred)nearbyFocus.current.preferred=undefined
  nearbyFocus.current.previous=nearest?.id
  const chosen = entities.find(e => e.id === selected) ?? nearest
  const knownSpeaker=chosen&&oldStreetPerson(chosen.id)&&head.save.characters.some(c=>c.id===oldStreetPerson(chosen.id)?.id)
  const shareChoices=chosen&&serverHead.current?evidenceChoices(serverHead.current,chosen.id):[]
  const fieldOptions=chosen&&serverHead.current?fieldChoices(serverHead.current,chosen.id):[]
  const field=serverHead.current?.campaign?.field
  const fieldProp=field&&fieldSites[field.content.target].room===head.scene&&field.disposition!=='take'&&(field.content.target!=='drawer'||head.save.facts['drawer-open'])?oldStreetProjectedProps(head.save).find(p=>p.id===field.content.target):undefined
  const talkTopics=chosen?oldStreetTalkTopics(head.save,chosen.id):[]
  const campaign=serverHead.current?.campaign
  const loanTarget=!!campaign?.archive&&!!chosen&&archiveLoanAt(campaign.archive.content,chosen.id)
  const campaignTarget=campaign&&head.save.facts['letter-taken']&&chosen?(chosen.id==='record-book'?'trace':chosen.id==='photo-folder'&&campaign.trace?.selected!==undefined?'parcel':null):null
  const expansionTarget=chosen?.id==='viewing-table'&&expansionCapabilities.planning&&!head.save.facts['darkroom-ready']
  const chosenAction = chosen?oldStreetContextAction(head.save,chosen):undefined
  const actions = chosenAction?.actions??[]
  const pages=oldStreetDialogueBeats(turn,head.save.locale)
  const page=pages[Math.min(turnPage,pages.length-1)]
  const morePages=turnPage<pages.length-1
  const inspectionOpen=Boolean(selected)
  const conversationOpen=Boolean(knownSpeaker&&inspectionOpen)
  const replyKey=page?.map(block=>block.id).join('|')??''
  // A response is first a reading beat, then a choice. Never delay the request
  // or recovery controls; only reveal ordinary conversation choices later.
  const awaitingChoices=conversationOpen&&(busy||Boolean(replyKey&&revealedReply!==replyKey))
  useEffect(()=>{
    setRevealedReply('')
    if(!conversationOpen||busy||morePages||!replyKey||error)return
    const timer=setTimeout(()=>setRevealedReply(replyKey),900)
    return()=>clearTimeout(timer)
  },[conversationOpen,busy,morePages,replyKey,error])
  useEffect(()=>{
    const panel=actionPanel.current
    for(const region of panel?.querySelectorAll('.os-actions__content,.os-actions__body')??[])region.scrollTop=0
  },[replyKey,busy])
  const secondaryActions=chosen?.id==='developing-bench'&&expansionCapabilities.media?[]:actions
  useEffect(()=>{setInputOpen(false);setTyped('')},[chosen?.id])
  function closeInteraction(){
    setSelected(null);setOpeningOpen(false);setNotice('');setTurn([]);setInputOpen(false);setExpansionPhotoRequest(0)
    runtime.current?.pause(Boolean(error||outcome||busyRef.current))
  }
  // Targeting and movement never open UI or execute a story action.
  function approachObject(entity:typeof entities[number]){
    if(!ready||busyRef.current||error||outcome)return
    closeInteraction()
    nearbyFocus.current.preferred=entity.id
    if(!runtime.current?.walkTo(entity.approach)){nearbyFocus.current.preferred=undefined;setNotice(text(['这里暂时走不过去。','There is no clear path.']))}
  }
  useEffect(()=>{
    if(!notice||selected||openingOpen||error)return
    const timer=setTimeout(()=>updateNotice(''),4000);return()=>clearTimeout(timer)
  },[notice,selected,openingOpen,error])
  function useNearby(){
    if(selected){closeInteraction();return}
    if(!chosen||!chosenAction||!ready||busyRef.current||error||outcome)return
    setOpeningOpen(false);setNotice('');setTurn([]);setInputOpen(false)
    runtime.current?.pause(true);runtime.current?.pause(false)
    const door=oldStreetDoors().find(d=>d.id===chosen.id)
    if(door){request(door.actionId);return}
    setSelected(chosen.id)
    if(loanTarget&&!campaign?.archive?.examined.includes('ledger')){openArchive(chosen.id);return}
    if(chosen.id.startsWith('archive-')){if(chosen.id!=='archive-rack')openArchive(chosen.id);return}
    if(campaignTarget){openCampaign(campaignTarget);return}
    if(oldStreetPerson(chosen.id)&&!knownSpeaker&&chosenAction.primary.kind==='action')request(chosenAction.primary.id)
    else if(chosenAction.primary.kind==='inspect'&&!loanTarget&&!expansionTarget)setNotice(chosenAction.reason)
  }
  const label = (id: string) => {
    const door = oldStreetDoors().find(d => d.actionId === id)
    return door ? text(oldStreetRooms[door.destination.room]) : text(actionNames[id.replace('oldstreet:', '')] ?? [id, id])
  }
  function targetTitle(entity:typeof entities[number]){
    const campaignTitle=serverHead.current&&campaignPropTitle(serverHead.current,entity.id)
    if(campaignTitle)return text(campaignTitle)
    if(entity.id==='archive-rack')return text(oldStreetPropState(entity.id,head.save)!)
    if(entity.id.startsWith('archive-'))return text(entity.id==='archive-index'?['施工索引','Work index']:entity.id==='archive-ledger'?['工作日志','Work log']:['整理桌','Sorting table'])
    const door=oldStreetDoors().find(d=>d.id===entity.id)
    const known=head.save.characters.find(c=>c.id===oldStreetPerson(entity.id)?.id)
    const clockAvailable=entity.id==='drawer'&&oldStreetContextAction(head.save,entity).actions.includes('oldstreet:inspect-clock')
    return clockAvailable?text(['抽屉旁 · 检查钟底','By the drawer · inspect clock']):known?.name??(door?text(oldStreetRooms[door.destination.room]):text(oldStreetPerson(entity.id,head.save)?.appearance??oldStreetPropState(entity.id,head.save)??propNames[entity.id]??[entity.id,entity.id]))
  }
  const inspectionHint=inspectionOpen&&chosen?.id==='archive-rack'?archiveRackDescription(head.save.facts,locale):inspectionOpen&&!loanTarget&&!expansionTarget&&fieldOptions.length===0&&!campaignTarget&&!chosen?.id.startsWith('archive-')&&chosenAction?.primary.kind==='inspect'?chosenAction.reason:''
  const nearbyDarkroom=head.scene==='darkroom'&&bindOldStreet(locale,head.save).canInteract('developing-bench',head.scene,feet)
  const showExpansionPhoto=expansionCapabilities.media&&head.scene==='darkroom'
  const displayedPhoto=useCommittedStreetPhoto(connection.api,serverHead.current?.id,head.save.facts['darkroom-photo-matched'],journalOpen||(head.scene==='shop'&&photoDisplayed(head.save)))
  const displayBook=head.scene==='shop'&&photoDisplayed(head.save)?oldStreetProjectedProps(head.save).find(p=>p.id==='record-book'):undefined
  const {preparations,announcement}=useOldStreetPreparations(serverHead.current,expansionCapabilities,connection.api,`${head.scene}:${serverHead.current?.version}:${selected}:${campaignOpen}:${archiveOpen}:${journalOpen}`)
  const outcome = oldStreetOutcome(head.save)
  const borrowedItems=head.save.inventory.filter(i=>i.count>0&&['letter-key','trolley','clock','photos'].includes(i.id))
  return <main className={"os-dev os-dev--immersive"+(overview?" os-dev--overview":"")} data-release={OLD_STREET_PREVIEW_VERSION}>
    <header><h1>{text(oldStreetRooms[head.scene as OldStreetRoom])}<span className="os-preview-label">{text(['试玩','Preview'])}</span></h1><nav className="os-tools"><button aria-label={text(['地图','Map'])} ref={mapButton} disabled={!ready||busy||!!error||!!outcome} onClick={()=>{closeInteraction();runtime.current?.pause(true);setMapOpen(true)}}><OldStreetToolIcon kind="map"/><span>{text(['地图','Map'])}</span></button><button aria-label={text(['背包','Backpack'])} ref={journalButton} disabled={!ready||busy||!!error||!!outcome} onClick={()=>{closeInteraction();runtime.current?.pause(true);setJournalOpen(true)}}><OldStreetToolIcon kind="items"/><span>{text(['背包','Backpack'])}</span></button><button aria-label={text(['菜单','Menu'])} disabled={!ready||busy||!!error} onClick={()=>{closeInteraction();runtime.current?.pause(true);setJourneysOpen(true)}}><OldStreetToolIcon kind="journeys"/><span>{text(['菜单','Menu'])}</span></button></nav></header>
    <div className="os-world" ref={world}><div className="os-stage" style={{width:camera.width,height:camera.height,transform:`translate(${camera.x}px,${camera.y}px)`}} ref={stage} onPointerDown={e => {
      if ((e.target as HTMLElement).closest('button') || !ready || busyRef.current || leaving || error || outcome || modalOpen) return
      nearbyFocus.current.preferred=undefined
      const r = e.currentTarget.getBoundingClientRect()
      runtime.current?.walkTo({x: (e.clientX - r.left) * 384 / r.width, y: (e.clientY - r.top) * 576 / r.height})
      closeInteraction()
    }}>
      <svg className="os-layout" viewBox="0 0 384 576" aria-hidden="true">
        {pixelShop&&head.scene==='street'&&<OldStreetBuildingEdges image={environmentArt.streetEdges}/>}<OldStreetFloor room={head.scene as OldStreetRoom} pixelShop={pixelShop} compositeShop={compositeShop} art={environmentArt}/>{pixelShop&&<OldStreetGroundDetail room={head.scene as OldStreetRoom} image={environmentArt.debris}/>}<OldStreetRoomWalls room={head.scene as OldStreetRoom} facts={head.save.facts} art={environmentArt} compositeShop={compositeShop}/><OldStreetRoofRecovery room={head.scene} save={head.save} wood={environmentArt.wood} cabinet={pixelPropsUrl}/><OldStreetDoorways room={head.scene as OldStreetRoom} facts={head.save.facts} cratesImage={doorCratesArt} stoneImage={pixelShop?environmentArt.stoneStair:undefined} woodImage={pixelShop?environmentArt.doorWood:undefined}/>
        {head.scene==='darkroom'&&<image href={photoTableUrl} x="136" y="104" width="112" height="112"/>}
        {head.scene==='laundry'&&(()=>{const p=oldStreetProjectedProps(head.save).find(p=>p.id==='trolley')!;return <rect x={p.body.x-3} y={p.body.y-3} width={p.body.w+6} height={p.body.h+6} fill='none' stroke='#8d7853' strokeDasharray='4 3' strokeWidth='1'/>})()}
        {oldStreetObstacleBodies(head.scene as OldStreetRoom, head.save).filter(b=>!(head.scene==='shed'&&roofSpareVisible(head.save)&&b.x===roofSpareBoard.x&&b.y===roofSpareBoard.y)&&!(head.scene==='roof'&&head.save.facts['roof-recovery']&&[...roofRecoveryObstacles(head.save),...oldStreetProjectedProps(head.save).filter(p=>p.id.startsWith('roof-')).map(p=>p.body)].some(r=>r.x===b.x&&r.y===b.y&&r.w===b.w&&r.h===b.h))&&!oldStreetFurniture.some(p=>p.room===head.scene&&b.x===p.body.x&&b.y===p.body.y)&&!(head.scene==='darkroom'&&b.x===136)&&!oldStreetProjectedProps(head.save).some(p=>p.room===head.scene&&(renderedProps.includes(p.id)||p.id.startsWith('archive-'))&&b.x===p.body.x&&b.y===p.body.y)).map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#70665b" stroke="#443e36"/>)}
        {destination && <circle cx={destination.x + oldStreetBody.w/2} cy={destination.y + oldStreetBody.h} r="5" fill="none" stroke="#345c4e" strokeWidth="2"/>}
      </svg>
      <div id="rpg"/>
      <svg className="os-room-foreground" viewBox="0 0 384 576" aria-hidden="true"><OldStreetRoomForeground room={head.scene as OldStreetRoom} facts={head.save.facts} art={environmentArt}/></svg>
      {displayBook&&<div aria-hidden="true" className="os-displayed-photo" style={{left:`${(displayBook.body.x+displayBook.body.w*.75)/384*100}%`,top:`${(displayBook.body.y-6)/576*100}%`}}>{displayedPhoto&&<img src={displayedPhoto} alt="" draggable={false}/>}</div>}
      {fieldProp&&<div aria-hidden="true" className="os-field-note" style={{left:`${fieldProp.body.x+fieldProp.body.w*.7}px`,top:`${fieldProp.body.y}px`,backgroundImage:`url(${photoShelfUrl})`}}/>}
      {entities.map(e => {
        const door = oldStreetDoors().find(d => d.id === e.id)
        const title = targetTitle(e)
        return <button className={'os-target' + (door ? ' os-target--door' : '')+(renderedProps.includes(e.id)||e.id.startsWith('roof-')||e.id.startsWith('archive-')||e.id==='developing-bench'?' os-target--actor':'')} key={e.id} data-targeted={chosen?.id===e.id?'true':undefined} data-side={door?.side} data-closed={door?.gate&&!head.save.facts[door.gate]?'true':undefined} style={{left: `${e.position.x / 384 * 100}%`, top: `${e.position.y / 576 * 100}%`}}
          disabled={!ready || busy || !!outcome || !!error} onClick={() => approachObject(e)}><span className={door?'os-door-label':undefined}>{title}{door?.gate && !head.save.facts[door.gate] ? text([' · 关闭', ' · closed']) : ''}</span></button>
      })}
    </div>
    </div>
    <section className={'os-actions'+(conversationOpen?' os-actions--conversation':'')+(inputOpen?' os-actions--composing':'')} ref={actionPanel} aria-label={text(conversationOpen?['交谈','Conversation']:['当前行动','Current actions'])} hidden={!ready||(!selected&&!openingOpen&&!error)||!!archiveOpen||!!campaignOpen||clockOpen||photoOpen}>
      <div className="os-actions__heading"><strong>{error?text(['恢复连接','Reconnect']):openingOpen?text(['这次委托','Your errand']):chosen?targetTitle(chosen):text(['互动','Interaction'])}</strong>{!error&&<button disabled={busy} onClick={closeInteraction}>{text(openingOpen?['开始探索','Start exploring']:['继续探索','Back to exploring'])}</button>}</div>
      <div className="os-actions__content">
      <div className="os-actions__body">
        {pixelShop&&selected&&!error&&!inputOpen&&<OldStreetObjectPreview key={selected} target={selected} save={head.save} drawer={pixelDrawerUrl} cabinet={pixelPropsUrl}/>}
        {busy&&!error?<section className="os-turn os-turn--waiting" aria-label={text(['互动回应','Interaction'])} aria-busy="true">{pendingSpeech&&<div className="os-turn__speech os-turn__speech--player"><strong>{text(['你','You'])}</strong><p>{pendingSpeech}</p></div>}<p className="os-turn__waiting" role="status">{busyLabel}</p>{slowOperation&&<p>{text(['还在等待确认，请稍候，不必重复操作。','Still waiting for confirmation. There is no need to repeat the action.'])}</p>}</section>:page&&!error?<section key={replyKey} className="os-turn os-turn--arrived" aria-live="polite" aria-label={text(['互动回应','Interaction'])}>{page.map(block=><div key={block.id} className={block.kind==='dialogue'?'os-turn__speech':'os-turn__scene'}>{block.speaker&&<strong>{block.speaker}</strong>}<p>{block.text}</p></div>)}</section>:(error||notice||inspectionHint)&&<p role="status">{error?oldStreetRecoveryMessage(error,locale):notice||inspectionHint}</p>}
      </div>
      <div className={'os-actions__options'+(conversationOpen&&!morePages?' os-actions__options--reply':'')} data-awaiting={!error&&conversationOpen&&(busy||(!morePages&&awaitingChoices))?'true':undefined} aria-hidden={!error&&conversationOpen&&(busy||(!morePages&&awaitingChoices))||undefined}>
      {conversationOpen&&!morePages&&!error&&<span className="os-response-label">{text(['你的回应','Your response'])}</span>}
      {expansionCapabilities.planning&&head.scene==='photo'&&!head.save.facts['darkroom-ready']&&serverHead.current&&<div hidden={!!error||selected!=='viewing-table'}><OldStreetExpansionView key={serverHead.current.id} locale={locale} sessionId={serverHead.current.id} requested={!!serverHead.current.expansions?.length} disabled={!ready||busy||!!error||!!outcome} api={connection.api} commission={serverHead.current.campaign?.version===3} sourcePending={!!serverHead.current.campaign?.archive?.order&&!negativeSourceReady(head.save,serverHead.current.campaign)} sourceRecovered={needsRecoveredNegative(serverHead.current.campaign)&&negativeSourceReady(head.save,serverHead.current.campaign)} archiveTitle={serverHead.current.campaign?.archive?.order?serverHead.current.campaign.archive.content.title:undefined} submit={(input,follow)=>requestExpansion(input,false,undefined,undefined,follow)} activate={()=>requestExpansion('',true)}/></div>}
      {showExpansionPhoto&&serverHead.current&&<div hidden={!!error||selected!=='developing-bench'}><OldStreetExpansionPhotoView exhibited={photoDisplayed(head.save)} interrupted={!!error} onClose={closeInteraction} photoMethod={serverHead.current.expansions?.[0]?.photoMethod} nearby={nearbyDarkroom} requestOpen={expansionPhotoRequest} allowRegenerate={debug} key={serverHead.current.id} locale={locale} sessionId={serverHead.current.id} api={connection.api} disabled={!ready||busy||!!error||!!outcome} discovery={typeof head.save.facts['darkroom-photo-discovery']==='string'?head.save.facts['darkroom-photo-discovery']:undefined} matched={!!head.save.facts['darkroom-photo-matched']} choice={String(head.save.facts['darkroom-photo-choice']??'')} decide={choice=>requestExpansion('',false,undefined,choice)} submit={proof=>requestExpansion('',false,proof)} onOpenChange={open=>{setExpansionPhotoOpen(open);runtime.current?.pause(open||!!error||!!head.save.facts.departed||busyRef.current)}}/></div>}
      {openingOpen&&!error&&<p className="os-controls-help">{text(['点击地面或拖动摇杆行走。走近物件后，按右下按钮互动；目标和线索可以在上方“背包”中查看。','Tap the ground or use the stick to move. Approach an object, then use the lower-right button. Your objective and clues are in Backpack.'])}</p>}
      {error && ready && <button onClick={() => location.reload()}>{text(['重新连接并恢复', 'Reconnect and recover'])}</button>}
      {!error&&(morePages?<button className="os-dialogue-continue" disabled={busy} onClick={()=>setTurnPage(n=>n+1)}>{text(['继续','Continue'])}</button>:<>
        {inspectionOpen&&loanTarget&&chosen&&<div className="os-choices"><button disabled={!ready||busy||!!error||!!outcome} onClick={()=>openArchive(chosen.id)}>{text(['查阅借放的工作日志','Read the work log on loan'])}</button></div>}
        {inspectionOpen&&chosen?.id==='archive-rack'&&<div className="os-choices"><button disabled={busy} onClick={()=>openArchive('archive-rack')}>{text(head.save.facts['archive-rack-shifted']?['移回原位','Move the shelf back']:['移开储物架','Slide the shelf aside'])}</button></div>}
        {inspectionOpen&&fieldOptions.length>0&&<p>{serverHead.current&&fieldHandling(serverHead.current)}</p>}
        {inspectionOpen&&fieldOptions.length>0&&<div className="os-choices">{fieldOptions.map(choice=><button key={choice.id} disabled={!ready||busy||!!error||!!outcome} onClick={()=>sendInput(false,choice.label)}>{choice.label}</button>)}</div>}
        {inspectionOpen&&secondaryActions.length>0&&<div className="os-choices">{secondaryActions.map(id => <button key={id} disabled={!ready || busy || !!outcome || !!error} onClick={() => request(id)}>{label(id)}</button>)}</div>}
        {conversationOpen&&chosen&&<OldStreetConversationChoices key={chosen.id} locale={locale} topics={talkTopics} sharing={shareChoices} disabled={busy||!ready||!!error||!!outcome} onTalk={value=>sendInput(true,value)} onShare={value=>sendInput(false,value)}/>}
        {inspectionOpen&&chosen&&<div className="os-compose">
          <button className="os-compose__toggle" aria-expanded={inputOpen} disabled={busy} onClick={()=>setInputOpen(open=>!open)}>{text(knownSpeaker?['聊点别的…','Say something else…']:['尝试别的办法…','Try something else…'])}</button>
          {inputOpen&&<form onSubmit={e=>{e.preventDefault();sendInput(Boolean(knownSpeaker))}}><input autoFocus disabled={!ready||busy||!!error||!!outcome} aria-label={text(knownSpeaker?['交谈内容','Message']:['输入行动','Describe an action'])} maxLength={500} value={typed} onChange={e=>setTyped(e.target.value)} placeholder={text(knownSpeaker?['想聊些什么？','What would you like to say?']:['也可以尝试别的办法','Try another approach'])}/><button disabled={!typed.trim()||busy||!ready||!!error||!!outcome}>{text(knownSpeaker?['交谈','Talk']:['发送','Send'])}</button>{knownSpeaker&&<button type="button" disabled={!typed.trim()||busy||!ready||!!error||!!outcome} onClick={()=>sendInput(false)}>{text(['作为行动','Act'])}</button>}</form>}
        </div>}
      </>)}
      </div>
      </div>
    </section>
    {ready&&(notice||announcement)&&!busy&&!selected&&!openingOpen&&!error&&!outcome&&!journalOpen&&!mapOpen&&!journeysOpen&&<p className="os-feedback" role="status">{notice||announcement}</p>}
    <footer>
      <OldStreetJoystick label={text(['移动摇杆','Movement joystick'])} disabled={!ready||busy||leaving||!!error||!!outcome||modalOpen} move={(x,y)=>runtime.current?.move(x,y)}/>
      <button className="os-primary" data-idle={!chosen&&!selected&&!busy?true:undefined} aria-busy={busy} disabled={!ready||(busy&&busyActivity!=='approach')||(!chosen&&!selected)||!!outcome||!!error} onPointerDown={busy?stopApproaching:useNearby} onClick={e=>{if(e.detail===0)(busy?stopApproaching:useNearby)()}}>
        <span className="os-primary__target">{chosen?targetTitle(chosen):text(['附近没有物件','Nothing nearby'])}</span>
        <strong>{busy?busyActivity==='approach'?text(['停下','Stop walking']):busyLabel:selected?text(['继续探索','Explore']):chosen&&oldStreetDoors().some(d=>d.id===chosen.id)?text(['前往','Enter']):chosen&&oldStreetPerson(chosen.id)?text(['交谈','Talk']):chosen?text(['查看','Examine']):text(['走近后互动','Move closer'])}</strong>
      </button>
    </footer>
    {!ready&&<OldStreetLoading locale={locale} {...loading} failed={Boolean(error)} failureMessage={error?oldStreetRecoveryMessage(error,locale):undefined} failureCode={error?oldStreetRecoveryCode(error):undefined} onRetry={()=>location.reload()}/>}
    {lanTrialEnabled&&ready&&head.scene==='laundry'&&<div style={{position:'fixed',right:8,top:410,zIndex:40,background:'#202624',padding:8}}>{(['left','right','up','down'] as const).map((direction,i)=><button key={direction} style={{minHeight:44,minWidth:44}} disabled={busy||!!error||lanTrial.current?.running} onClick={()=>{lanTrial.current?.start(direction);setResidentPosition({...resident.current.position})}}>{text(['试走：'+['左','右','上','下'][i],'Test: '+direction])}</button>)}<output style={{display:'block'}}>{lanTrial.current?.pose} · {lanTrial.current?.distance.toFixed(1)}/24</output></div>}
    {debug&&<details><summary>Renderer diagnostics</summary><pre style={{maxWidth:'90vw',whiteSpace:'pre-wrap'}}>{error?JSON.stringify({error,renderer:diagnostic}):diagnostic}</pre></details>}
    {journeysOpen&&<OldStreetJourneysView initialSection={outcome?'journeys':'game'} createCampaign={import.meta.env.DEV&&debug&&expansionCapabilities.campaign&&expansionCapabilities.planning&&expansionCapabilities.media?()=>{void restart(true)}:undefined} soundEnabled={soundEnabled} toggleSound={toggleSound} locale={locale} current={serverHead.current?.id??''} create={()=>{void restart()}} api={connection.api} busy={busy} select={id=>{void selectJourney(id)}} close={()=>{setJourneysOpen(false);runtime.current?.pause(Boolean(error||outcome))}}/>}
    {archiveOpen&&campaign&&serverHead.current&&<OldStreetArchiveView nextPurpose={campaign.version===3&&campaign.archive?.order?oldStreetCurrentPurpose(head.save,campaign):undefined} field={campaign.field} fieldAdmit={()=>archiveAct('plan',undefined,'archive-desk',undefined,'field')} save={head.save} readingAct={selection=>archiveAct('decide',undefined,archiveOpen,selection)} archive={campaign.archive} target={archiveOpen} question={campaign.parcel?.observed?campaign.parcel.content.question:undefined} locale={locale} sessionId={serverHead.current.id} api={connection.api} busy={busy} feedback={campaignMessage} act={archiveAct} tryAnother={()=>{const target=archiveOpen;setArchiveOpen(null);setSelected(target);setNotice('');runtime.current?.pause(false);requestAnimationFrame(()=>setInputOpen(true))}} close={()=>{setArchiveOpen(null);closeInteraction()}}/>}
    {campaignOpen&&campaign&&serverHead.current&&<OldStreetCampaignView nextPurpose={campaign.version===3?oldStreetCurrentPurpose(head.save,campaign):undefined} campaign={campaign} save={head.save} photoImage={displayedPhoto} published={head.save.facts['archive-published']===true} stage={campaignOpen} locale={locale} sessionId={serverHead.current.id} api={connection.api} busy={busy} feedback={campaignMessage} act={campaignAct} archive={campaign.version>=2&&campaign.parcel?.observed?()=>openArchive('photo-folder'):undefined} close={()=>{setCampaignOpen(null);closeInteraction()}}/>}
    {clockOpen&&<OldStreetClockView locale={locale} busy={busy} feedback={clockMessage} submit={proof=>{busyRef.current=true;setBusy(true);void execute('oldstreet:inspect-clock','drawer',undefined,undefined,false,proof)}} close={()=>{setClockOpen(false);closeInteraction()}}/>}
    {journalOpen&&<OldStreetJournalView api={connection.api} sessionId={serverHead.current?.id} photoImage={displayedPhoto} preparations={preparations} save={head.save} campaign={campaign} onClose={()=>{setJournalOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current));journalButton.current?.focus()}}/>}
    {mapOpen&&<OldStreetMapView save={head.save} room={head.scene as OldStreetRoom} locale={locale} onClose={()=>{setMapOpen(false);runtime.current?.pause(Boolean(error||outcome||busyRef.current));mapButton.current?.focus()}}/>}
    {photoOpen && <OldStreetPhotoView locale={locale} busy={busy} feedback={photoMessage} submit={proof=>{busyRef.current=true;setBusy(true);void execute('oldstreet:match-photos','viewing-table',undefined,proof)}} close={()=>{setPhotoOpen(false);closeInteraction()}}/>}
    {leaving&&<OldStreetLeaveView locale={locale} borrowed={borrowedItems.map(i=>i.label)} close={()=>setLeaving(false)} confirm={()=>{setLeaving(false);request('oldstreet:leave',true)}}/>}
    {outcome && <OldStreetEndingView key={serverHead.current?.id} sessionId={serverHead.current?.id} api={connection.api} save={head.save} busy={busy||!ready} onRestart={()=>{void restart()}} onJourneys={()=>setJourneysOpen(true)} onReplay={()=>audio.current?.play('ending')}/>}
  </main>
}
