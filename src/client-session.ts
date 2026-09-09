import {isBrowserEdition} from './runtime-mode'
import {browserStorageName} from './browser-storage-name'
import { randomId } from './random-id'
import { currentScene } from './contract'
import { getGameApiBase } from './game-id'
import { isArtDemo } from './art-variant'
import type { Locale } from './story'
import type { Head } from './journey-runtime'
export type { Head }
declare global {interface Window{alteruLocalStorage:Storage;alteruSessionStorage:Storage}}
const storage=()=>window.alteruLocalStorage
export const isUiDemo=new URLSearchParams(window.location.search).get('ui_demo')==='1'
const key=(s:string)=>(isBrowserEdition?'carriage-pages-1-':isArtDemo?'carriage-art-demo-1-':isUiDemo?'carriage-ui-demo-1-':'carriage-')+s
export function readLocal<T>(name:string,fallback:T):T{try{return JSON.parse(storage().getItem(key(name))??'null')??fallback}catch{return fallback}}
export function writeLocal(name:string,value:unknown){storage().setItem(key(name),JSON.stringify(value))}
const token=()=>{let t=readLocal('owner','');if(!t){t=randomId()+randomId();writeLocal('owner',t)}return t}
const prefix=getGameApiBase()+'/api/lab'
let browserApi:Promise<import('./browser-journey').BrowserJourney>|undefined
export async function api(path:string,body?:unknown){if(isBrowserEdition){browserApi??=import('./browser-journey').then(({BrowserJourney})=>new BrowserJourney(browserStorageName(location.hostname,location.pathname)));return (await browserApi).api(path,body)}const r=await fetch(prefix+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw new Error(data.error??'NETWORK_ERROR');return data}
export async function enroll(locale:Locale,restart=false):Promise<Head>{let id=readLocal('enrollment','');const fresh=restart||!id;if(fresh){id=randomId();writeLocal('enrollment',id)}const h=await api('/sessions',{enrollment_id:id,locale});writeLocal('session',h.id);if(isArtDemo&&fresh){const checkpoint=await api('/sessions/'+h.id+'/position',{position:{x:188,y:184},sceneId:currentScene(h.save),expected_version:h.version});h.position=checkpoint.position}return h}
export async function sendAction(head:Head,body:Record<string,unknown>){if(readLocal('pending',null))throw new Error('PENDING_ACTION');const pending={id:head.id,body:{...body,sceneId:currentScene(head.save),action_id:randomId(),expected_version:head.version}};writeLocal('pending',pending);const result=await api('/sessions/'+pending.id+'/actions',pending.body);writeLocal('pending',null);return result}
export async function recover(){const p=readLocal<any>('pending',null);if(!p)return null;try{const r=await api('/sessions/'+p.id+'/actions',p.body);const current=await api('/sessions/'+p.id);writeLocal('pending',null);return {...r,head:current}}catch(e){if(e instanceof Error&&['VERSION_CONFLICT','OFF_SCENE_ENTITY','INVALID_ACTION','UNKNOWN_ENTITY','INVALID_POSITION','TOO_FAR','UNSUPPORTED_ACTION','INVALID_TEXT','INVALID_ACTION_TYPE','ACTION_ID_CONFLICT'].includes(e.message)){const h=await api('/sessions/'+p.id);writeLocal('pending',null);return {head:h,text:null,kind:'recovered'}}throw e}}
