import { DatabaseSync } from 'node:sqlite'
import { createHash, randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { initialStory, runRule, upgradePowerFacts, tr, type StorySave, type Locale } from '../src/story'
import { validActionTarget, safePosition, entities, MAP_VERSION, currentScene, type Position, type EntityId } from '../src/contract'
import { propose } from './model'
import { portalArrivals } from '../src/scene-layout'
import { cartridge,journeyObjective } from '../src/story'
import {upgradeAttendantFacts} from '../src/attendant'
import {upgradeContactFacts} from '../src/contacts'
import { GAME_ID } from '../src/game-id'

import {prepareAction,LabError,type Head} from '../src/journey-runtime'
export {LabError,type Head} from '../src/journey-runtime'
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
export class Service {
 db:DatabaseSync
 constructor(file:string){if(file!==':memory:')mkdirSync(dirname(file),{recursive:true});this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,owner TEXT NOT NULL,enrollment TEXT NOT NULL,data TEXT NOT NULL, UNIQUE(owner,enrollment));
 CREATE TABLE IF NOT EXISTS actions(owner TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,response TEXT NOT NULL, PRIMARY KEY(owner,id));
 CREATE TABLE IF NOT EXISTS events(session TEXT,version INTEGER,action TEXT,kind TEXT, PRIMARY KEY(session,version));`)}
 create(owner:string,enrollment:string,locale:Locale){const old=this.db.prepare('SELECT data FROM sessions WHERE owner=? AND enrollment=?').get(owner,enrollment) as any;if(old)return this.get(owner,(JSON.parse(old.data) as Head).id);
 const h:Head={id:randomUUID(),version:0,save:initialStory(locale),position:safePosition(null),mapVersion:MAP_VERSION};this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(h.id,owner,enrollment,JSON.stringify(h));return h}
 get(owner:string,id:string){const row=this.db.prepare('SELECT data FROM sessions WHERE owner=? AND id=?').get(owner,id) as any;if(!row)throw new LabError('SESSION_NOT_FOUND',404);const h=JSON.parse(row.data) as Head;if(h.mapVersion!==MAP_VERSION){for(const node of cartridge(h.save.locale).initialMap??[])if(!h.save.map.some(m=>m.id===node.id))h.save.map.push({...node,current:false});for(const key of ['supply_open','battery_taken','record_read','battery_installed','rescue_sent'])h.save.facts[key]??=false;h.position=safePosition(['carriage-ortho-1','carriage-ortho-2','carriage-narrow-1','train-scenes-1'].includes(h.mapVersion)?h.position:null,currentScene(h.save));h.mapVersion=MAP_VERSION;if(h.save.facts.finished)h.save.objective=journeyObjective(h.save);this.write(owner,h)}if(upgradePowerFacts(h.save)){if(h.save.facts.finished&&!h.save.facts.rescue_sent)h.save.objective=journeyObjective(h.save);this.write(owner,h)}if(upgradeContactFacts(h.save))this.write(owner,h);if(upgradeAttendantFacts(h.save))this.write(owner,h);return h}
 checkpoint(owner:string,id:string,position:unknown,sceneId='carriage',expectedVersion?:number){this.db.exec('BEGIN IMMEDIATE');try{const h=this.get(owner,id);if(sceneId!==currentScene(h.save)||expectedVersion!==undefined&&expectedVersion!==h.version)throw new LabError('STALE_POSITION',409);h.position=safePosition(position,currentScene(h.save));this.write(owner,h);this.db.exec('COMMIT');return h.position}catch(e){this.db.exec('ROLLBACK');throw e}}
 write(owner:string,h:Head){this.db.prepare('UPDATE sessions SET data=? WHERE owner=? AND id=?').run(JSON.stringify(h),owner,h.id)}
 replay(owner:string,id:string,digest:string){const r=this.db.prepare('SELECT hash,response FROM actions WHERE owner=? AND id=?').get(owner,id) as any;if(!r)return null;if(r.hash!==digest)throw new LabError('ACTION_ID_CONFLICT',409);return JSON.parse(r.response)}
 async action(owner:string,id:string,body:any){
  if(!body||typeof body.action_id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.action_id)||!Number.isSafeInteger(body.expected_version))throw new LabError('INVALID_ACTION')
  const digest=hash({id,...body});const cached=this.replay(owner,body.action_id,digest);if(cached)return cached
  const h=this.get(owner,id);if(h.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
  const response=await prepareAction(h,body,propose)
  this.db.exec('BEGIN IMMEDIATE')
  try {
   const raced=this.replay(owner,body.action_id,digest);if(raced){this.db.exec('COMMIT');return raced}
   const current=this.get(owner,id);if(current.version!==h.version)throw new LabError('VERSION_CONFLICT',409)
   const {head:next,kind}=response
   this.write(owner,next);this.db.prepare('INSERT INTO actions VALUES(?,?,?,?)').run(owner,body.action_id,digest,JSON.stringify(response));this.db.prepare('INSERT INTO events VALUES(?,?,?,?)').run(id,next.version,body.action_id,kind);this.db.exec('COMMIT');return response
  }catch(e){this.db.exec('ROLLBACK');throw e}
 }
}

export function labPlugin(){let service:Service|undefined
 const middleware=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const url=new URL(req.url??'/', 'http://localhost');const prefix='/'+GAME_ID+'/api/lab'
  if(!url.pathname.startsWith(prefix))return next()
  void (async()=>{
   const send=(code:number,v:unknown)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(v))}
   try{
    if(url.pathname===prefix+'/health')return send(200,{ok:true,runtime:'local-sqlite',liveModelAvailable:true,production:false})
    const token=req.headers.authorization?.replace(/^Bearer /,'')??'';if(!/^[a-zA-Z0-9-]{32,100}$/.test(token))throw new LabError('AUTH_REQUIRED',401)
    const owner=hash(token);service??=new Service(process.env.CARRIAGE_LAB_DB || '.data/story.sqlite')
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>6000)throw new LabError('BODY_TOO_LARGE',413)}const body=raw?JSON.parse(raw):{}
    if(url.pathname===prefix+'/sessions'&&req.method==='POST'){if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.enrollment_id))throw new LabError('INVALID_ENROLLMENT');return send(200,service.create(owner,body.enrollment_id,body.locale==='en'?'en':'zh'))}
    const match=url.pathname.slice(prefix.length).match(/^\/sessions\/([\w-]+)(?:\/(actions|position))?$/);if(!match)throw new LabError('NOT_FOUND',404)
    if(req.method==='GET'&&!match[2])return send(200,service.get(owner,match[1]))
    if(req.method==='POST'&&match[2]==='position')return send(200,{position:service.checkpoint(owner,match[1],body.position,body.sceneId,body.expected_version)})
    if(req.method==='POST'&&match[2]==='actions')return send(200,await service.action(owner,match[1],body))
    throw new LabError('METHOD_NOT_ALLOWED',405)
   }catch(e){send(e instanceof LabError?e.status:500,{error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'})}
  })()
 }
 return {name:'carriage-story-service',configureServer(server:any){server.middlewares.use(middleware)},configurePreviewServer(server:any){server.middlewares.use(middleware)}}
}
