import {isBrowserEdition,isCloudEdition} from './runtime-mode'
import {SessionClient,type SessionLock} from './session-client'
import {cloudTransport} from './cloud-session'
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
const key=(s:string)=>(isCloudEdition?'carriage-cloud-1-':isBrowserEdition?'carriage-pages-1-':isArtDemo?'carriage-art-demo-1-':isUiDemo?'carriage-ui-demo-1-':'carriage-')+s
export function readLocal<T>(name:string,fallback:T):T{try{return JSON.parse(storage().getItem(key(name))??'null')??fallback}catch{return fallback}}
export function writeLocal(name:string,value:unknown){storage().setItem(key(name),JSON.stringify(value))}
const token=()=>{let t=readLocal('owner','');if(!t){t=randomId()+randomId();writeLocal('owner',t)}return t}
const prefix=getGameApiBase()+'/api/lab'
let browserApi:Promise<import('./browser-journey').BrowserJourney>|undefined
const lock:SessionLock=async(name,work)=>{if(navigator.locks)return navigator.locks.request(name,work);if(isCloudEdition)throw Error('CLOUD_LOCKS_UNAVAILABLE');return work()}
let cloudApi:ReturnType<typeof cloudTransport>|undefined
export async function api(path:string,body?:unknown){if(isCloudEdition){cloudApi??=cloudTransport(storage(),key(''),prefix,lock);return cloudApi(path,body)}if(isBrowserEdition){browserApi??=import('./browser-journey').then(({BrowserJourney})=>new BrowserJourney(browserStorageName(location.hostname,location.pathname)));return (await browserApi).api(path,body)}const r=await fetch(prefix+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok)throw new Error(data.error??'NETWORK_ERROR');return data}
let client:SessionClient|undefined
const sessionClient=()=>client??=new SessionClient(storage(),key(''),api,lock)
export const hasPending=()=>sessionClient().hasPending()
export async function enroll(locale:Locale,restart=false):Promise<Head>{const fresh=restart||!readLocal('session','');const h=await sessionClient().enroll(locale,restart);if(isArtDemo&&fresh&&!isCloudEdition){const checkpoint=await api('/sessions/'+h.id+'/position',{position:{x:188,y:184},sceneId:currentScene(h.save),expected_version:h.version});h.position=checkpoint.position}return h}
export const sendAction=(head:Head,body:Record<string,unknown>)=>sessionClient().send(head,body)
export const recover=()=>sessionClient().recover()
