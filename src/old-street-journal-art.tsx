import {useEffect,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {usesCurrentLaundryCast,usesCurrentPhotographerCast} from './old-street-characters'
import {laundryActorUrl} from './old-street-laundry-art'
import {photographerActorUrl} from './old-street-photographer-art'
import legacyLaundry from '../doc/oldstreet-lan-candidate/standing.png'
import legacyPhotographer from '../doc/oldstreet-xu-candidate/standing.png'
import clock from '../doc/oldstreet-mantel-clock/cutout.png'
import trolley from '../doc/oldstreet-trolley-candidate/cutout.png'
import {actorArt} from './art-catalog'
import {oldStreetPhotoPuzzle} from './old-street-photo-puzzle'

type Kind='lens'|'key'|'letter'|'paper'|'film'|'plank'|'photo'|'person'|'goal'|'bag'|'clock'|'trolley'
const paths:Record<Kind,string>={
 clock:'M10 24L32 7L54 24V56H10ZM32 24a12 12 0 1 0 0 24a12 12 0 1 0 0-24M32 29V36L39 39',
 trolley:'M9 7H18V49H53M18 25H45V45H18M21 51a4 4 0 1 0 0 8a4 4 0 1 0 0-8M47 51a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
 lens:'M27 8a18 18 0 1 0 0 36a18 18 0 1 0 0-36M40 40L57 57M18 25a9 9 0 0 1 9-9',
 key:'M21 10a12 12 0 1 0 0 24a12 12 0 1 0 0-24M30 31L53 54M44 45L50 39M50 51L56 45M18 20H22',
 letter:'M7 15H57V49H7ZM7 15L32 34L57 15M7 49L25 30M57 49L39 30',
 paper:'M15 6H39L51 18V58H15ZM39 6V18H51M23 29H43M23 38H43M23 47H36',
 film:'M9 9H55V55H9ZM17 9V55M47 9V55M17 30H47M9 18H17M9 40H17M47 18H55M47 40H55',
 plank:'M6 42L47 7L59 22L18 57ZM18 41L43 20M25 44L47 26',
 photo:'M8 9H56V55H8ZM13 42L24 28L36 41L44 33L51 43M37 20H39',
 person:'M32 8a11 11 0 1 0 0 22a11 11 0 1 0 0-22M10 57V48a22 22 0 0 1 44 0V57',
 goal:'M32 8a24 24 0 1 0 0 48a24 24 0 1 0 0-48M32 19a13 13 0 1 0 0 26a13 13 0 1 0 0-26M32 32L56 8M46 8H56V18',
 bag:'M13 21H51L55 56H9ZM23 21V15a9 9 0 0 1 18 0V21M22 34H42V47H22Z',
}
export function JournalSymbol({kind}:{kind:Kind}){return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>}
/** Display-only registry. Eligibility comes from oldStreetJournal, never this catalog. */
export function OldStreetJournalArt({id,category,save,photoImage}:{id:string;category:'items'|'notes'|'people';save:Pick<StorySave,'facts'>;photoImage?:string}){
 let src='',crop='',width=0,height=0,kind:Kind='paper'
 if(category==='people'){
  kind='person'
  if(id==='zhou-watchmaker'){src=actorArt.balanced.mechanic.path;width=1086;height=1448;crop='462 48 172 185'}
  if(id==='lan-laundry'||id==='xu-photographer'){
   const laundry=id==='lan-laundry',current=laundry?usesCurrentLaundryCast(save):usesCurrentPhotographerCast(save)
   src=current?(laundry?laundryActorUrl:photographerActorUrl):(laundry?legacyLaundry:legacyPhotographer)
   width=current?960:1024;height=current?1408:352;crop=current?'400 48 160 175':'48 40 160 175'
  }
 }else if(id==='clock'||id.startsWith('clock-')){kind='clock';src=clock;width=512;height=512;crop='116 128 280 328'}
 else if(id==='trolley'){kind='trolley';src=trolley;width=512;height=640;crop='40 30 432 580'}
 else if(id==='lens')kind='lens'
 else if(id==='letter-key')kind='key'
 else if(id==='letter'||id==='campaign-commission')kind='letter'
 else if(id.includes('plank')||id==='roof-bridge-laid')kind='plank'
 else if(id.includes('negative')||id==='roof-index-read')kind='film'
 else if((id==='photos'||id==='photos-matched'||id==='photos-returned')){src=save.facts['photos-matched']===true?oldStreetPhotoPuzzle.image:'';kind='photo'}
 else if(id==='darkroom-print'||id.startsWith('darkroom-photo')){src=photoImage??'';kind='photo'}
 const [failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[src])
 return <span className={'os-journal__thumb'+(category==='people'?' is-person':'')} aria-hidden="true">
  {src&&!failed?(crop?<svg viewBox={crop}><image href={src} width={width} height={height} onError={()=>setFailed(true)}/></svg>:<img src={src} alt="" draggable={false} onError={()=>setFailed(true)}/>):<JournalSymbol kind={kind}/>}
 </span>
}
