// Same game UI, client and SQLite authority; synthetic replies and one-shot
// transport failures only. Run with Node 22 --import tsx. Never shipped by Vite.
import {createServer} from 'vite'
import {DatabaseSync} from 'node:sqlite'
import {OldStreetAuthority} from '../server/old-street-runtime.ts'
import {LabError} from '../src/journey-runtime.ts'
import {GAME_ID} from '../src/game-id.ts'

process.env.OLDSTREET_MODEL_TEST_BUDGET='0'
const raw=new DatabaseSync(':memory:')
const db={all:(sql,...args)=>raw.prepare(sql).all(...args),run:(sql,...args)=>{raw.prepare(sql).run(...args)},transaction:fn=>{raw.exec('BEGIN IMMEDIATE');try{const result=fn();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}
const prefix=`/${GAME_ID}/api/oldstreet-dev`
const qaPort=Number(process.env.OLDSTREET_RECOVERY_QA_PORT??5463)
const evidence={attemptCalls:0,actions:[],droppedCommittedReply:false,droppedRefusalRead:false}
const authority=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,async(input)=>{
 evidence.attemptCalls++
 if(input==='摸摸抽屉边缘')throw new LabError('OLD_STREET_DIALOGUE_REJECTED',409)
 return {kind:'attempt',outcome:'inconclusive',text:'你轻敲抽屉，里面的东西还无法确认。',discoveryIds:[]}
})
let failNextRead=false,sessionId
const server=await createServer({mode:'oldstreet-dev',server:{host:'127.0.0.1',port:qaPort,strictPort:true},plugins:[{
 name:'oldstreet-recovery-ui-fixture',enforce:'pre',configureServer(server){
  server.middlewares.use((req,res,next)=>{void (async()=>{
   const url=new URL(req.url??'/', `http://127.0.0.1:${qaPort}`)
   const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))}
   if(url.pathname==='/_qa/recovery-evidence'){
    const head=sessionId?authority.get('synthetic-ui',sessionId):undefined
    return send(200,{...evidence,version:head?.version,scene:head?.sceneId,inventory:head?.save.inventory,eventCount:sessionId?authority.events('synthetic-ui',sessionId,0).length:0})
   }
   if(!url.pathname.startsWith(prefix+'/'))return next()
   try{
    const path=url.pathname.slice(prefix.length)
    let data='';for await(const chunk of req)data+=chunk
    const body=data?JSON.parse(data):undefined
    if(path==='/sessions'&&req.method==='POST'){const h=authority.create('synthetic-ui',body.enrollment_id,body.locale);sessionId=h.id;return send(200,h)}
    if(path==='/sessions'&&req.method==='GET')return send(200,{sessions:authority.directory('synthetic-ui')})
    const match=/^\/sessions\/([a-zA-Z0-9-]+)(?:\/(actions|position|expansion-capabilities))?$/.exec(path)
    if(!match)return send(404,{error:'NOT_FOUND'})
    const [,id,operation]=match
    if(operation==='expansion-capabilities')return send(200,{planning:false,media:false})
    if(operation==='position')return send(200,authority.checkpoint('synthetic-ui',id,body))
    if(operation==='actions'){
     evidence.actions.push({id:body.action_id,type:body.type,input:body.text,action:body.action,version:body.expected_version})
     try{
      const result=await authority.action('synthetic-ui',id,body)
      if(body.type==='free-input'&&!evidence.droppedCommittedReply){evidence.droppedCommittedReply=true;return send(503,{error:'SYNTHETIC_RESPONSE_LOST'})}
      return send(200,result)
     }catch(e){
      if(e.message==='OLD_STREET_DIALOGUE_REJECTED'&&!evidence.droppedRefusalRead){evidence.droppedRefusalRead=true;failNextRead=true}
      throw e
     }
    }
    if(!operation&&req.method==='GET'){
     if(failNextRead){failNextRead=false;return send(503,{error:'SYNTHETIC_READ_LOST'})}
     return send(200,authority.get('synthetic-ui',id))
    }
    return send(405,{error:'METHOD_NOT_ALLOWED'})
   }catch(e){return send(e.status??400,{error:e.message})}
  })().catch(e=>{console.error(e);res.destroy()})})
 }
}]})
await server.listen()
console.log(`Recovery UI fixture: http://127.0.0.1:${qaPort}/?debug=1&camera=overview`)
