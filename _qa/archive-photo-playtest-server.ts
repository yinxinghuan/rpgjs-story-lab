/** Local renderer + normal authority. Historical text is replayed; only photo media is live. */
import {createServer,type ConfigEnv,type UserConfig} from 'vite'
import {createServer as portProbe} from 'node:net'
import {mkdirSync,appendFileSync,writeFileSync} from 'node:fs'
import base from '../vite.config'
import {oldStreetDevPlugin} from '../server/old-street-dev-plugin'
import {expansionPhotoProducer} from '../server/old-street-expansion-media'
import {photoCampaignFixture,photoPlanReplay} from './archive-photo-fixture'
if(!process.argv.includes('--live-media'))throw Error('Explicit --live-media required for this authorized synthetic photo test')
process.env.OLDSTREET_MODEL_TEST_BUDGET='0'
process.env.OLDSTREET_DEV_DATA='.data/archive-photo-playtest-20260917'
const out='doc/archive-photo-media-20260917';mkdirSync(out,{recursive:true})
const produce=expansionPhotoProducer()
const config=await (base as (e:ConfigEnv)=>UserConfig)({command:'serve',mode:'oldstreet-dev'})
config.plugins=(config.plugins??[]).map(p=>p&&typeof p==='object'&&'name' in p&&p.name==='oldstreet-loopback-session'?oldStreetDevPlugin(photoCampaignFixture,{plan:photoPlanReplay,photo:async(job,onTask)=>{
 appendFileSync(out+'/requests.jsonl',JSON.stringify({requestId:job.requestId,taskId:job.taskId??null,prompt:job.prompt,startedAt:new Date().toISOString()})+'\n')
 const bytes=await produce(job,id=>{appendFileSync(out+'/requests.jsonl',JSON.stringify({requestId:job.requestId,taskId:id})+'\n');onTask(id)})
 writeFileSync(out+'/candidate.png',bytes)
 return bytes
}}):p)
const probe=portProbe();await new Promise<void>(r=>probe.listen(Number(process.env.ARCHIVE_PHOTO_QA_PORT??0),'127.0.0.1',r));const port=(probe.address() as {port:number}).port;await new Promise<void>((r,j)=>probe.close(e=>e?j(e):r()))
const server=await createServer({...config,configFile:false,mode:'oldstreet-dev',server:{host:'127.0.0.1',port,strictPort:true}})
await server.listen();console.log(server.resolvedUrls?.local[0])
for(const s of ['SIGINT','SIGTERM'] as const)process.once(s,()=>{void server.close().then(()=>process.exit(0))})
