import {introduceJournalPerson} from '../src/old-street-mediated-cast'
/** Explicit loopback-only synthetic journey. Never reads the player's journey DB. */
import {createServer} from 'vite'
import {DatabaseSync} from 'node:sqlite'
import {mkdirSync} from 'node:fs'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetJournalMedia,journalArtProducer} from '../server/old-street-journal-media'
import {handleOldStreetSession} from '../server/old-street-http'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract'
import type {AuthorityStorage} from '../server/session-authority'
if(!process.argv.includes('--live'))throw Error('Pass --live to authorize the two synthetic platform image tasks')
mkdirSync('.data/dynamic-journal-review',{recursive:true})
const raw=new DatabaseSync('.data/dynamic-journal-review/synthetic-v2.sqlite')
const db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
const owner='synthetic-journal-review',authority=new OldStreetAuthority(db,()=>true)
const head=authority.create(owner,'synthetic-journal-enrollment-v2-20260917','en')
if(!head.save.inventory.some(i=>i.id==='brass-compass')){
 head.save.inventory.push({id:'brass-compass',label:'Brass compass',count:1,detail:'A small worn brass pocket compass, with a cracked dark green leather case and a red needle. Useful for reading the direction of the river.'})
 introduceJournalPerson(head.save,{id:'eli-courier',name:'Eli',role:'Retired mail carrier',origin:'generated',status:'known',detail:'Older American man with short gray hair, a blue knit cap, brown work jacket and round glasses. He has a narrow face and a short gray beard.',vitality:100,stress:0,skills:[],updatedAtScene:0},'record-book',{id:'synthetic-introduction-eli',text:'A letter beside the record book includes a sketch of an older man with round glasses and a blue cap. He signs himself Eli, a retired mail carrier offering directions to the river.'})
 raw.prepare('UPDATE journeys SET data=? WHERE id=? AND owner=?').run(JSON.stringify(head),head.id,owner)
}
const media=new OldStreetJournalMedia(db,(o,id)=>authority.get(o,id)),background=(p:Promise<unknown>)=>{void p.catch(e=>console.error('QA background failed',e.message))}
const server=await createServer({configFile:false,base:'./',server:{host:'127.0.0.1',port:55679,strictPort:true},plugins:[{name:'synthetic-journal-only',configureServer(s){s.middlewares.use(async(req,res,next)=>{
 const u=new URL(req.url??'/','http://127.0.0.1:55679');if(!u.pathname.startsWith('/qa-journal/'))return next()
 if(req.headers.origin&&req.headers.origin!==u.origin){res.writeHead(403);res.end();return}
 try{
  if(u.pathname==='/qa-journal/head'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(authority.get(owner,head.id)));return}
  if(!new RegExp('^/qa-journal/sessions/'+head.id+'/(journal-art|journal-art-file)$').test(u.pathname)){res.writeHead(404);res.end();return}
  let text='';for await(const b of req){text+=b;if(text.length>3000)throw Error('BODY_TOO_LARGE')}
  const request=new Request('http://qa'+OLD_STREET_API_PATH+u.pathname.slice('/qa-journal'.length)+u.search,{method:req.method,headers:{[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,'Content-Type':'application/json'},...(req.method==='POST'?{body:text}:{})})
  const result=await handleOldStreetSession(request,owner,authority,r=>r.json(),undefined,undefined,{media,produce:journalArtProducer(),background})
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()))
 }catch(e){res.writeHead(500);res.end(JSON.stringify({error:e instanceof Error?e.message:'QA_FAILED'}))}
})}}]})
await server.listen();console.log('Synthetic dynamic backpack: http://127.0.0.1:55679/_qa/dynamic-journal-review.html')
