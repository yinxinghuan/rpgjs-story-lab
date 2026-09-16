/** Real game / renderer / SessionAuthority with synthetic paper production.
 * Local-only and excluded from production inputs. Run with Node22 --import tsx.
 * No live model/media requests. No save injection or auto-completed objectives. */
import {createServer,type ConfigEnv,type UserConfig} from 'vite'
import {createServer as createPortProbe} from 'node:net'
import baseConfig from '../vite.config'
import {oldStreetDevPlugin} from '../server/old-street-dev-plugin'

process.env.OLDSTREET_MODEL_TEST_BUDGET='0'
process.env.OLDSTREET_DEV_DATA='.data/campaign-map-playtest-20260917'
const config=await (baseConfig as (env:ConfigEnv)=>UserConfig)({command:'serve',mode:'oldstreet-dev'})
config.plugins=(config.plugins??[]).map(plugin=>plugin&&typeof plugin==='object'&&'name' in plugin&&plugin.name==='oldstreet-loopback-session'?oldStreetDevPlugin(async(context,signal)=>{
 await new Promise<void>((resolve,reject)=>{
  const timer=setTimeout(resolve,1500)
  signal.addEventListener('abort',()=>{clearTimeout(timer);reject(Error('SYNTHETIC_CANCELLED'))},{once:true})
 })
 if(context.stage==='trace')return context.locale==='zh'?{
  title:'寄存记录',clue:{mark:'两道刻痕',wrapping:'麻绳'},records:[
   {label:'工坊维修',mark:'两道刻痕',wrapping:'折叠封口'},
   {label:'屋顶测量',mark:'一道刻痕',wrapping:'麻绳'},
   {label:'街道修缮',mark:'两道刻痕',wrapping:'麻绳'},
  ],
 }:{title:'Filing records',clue:{mark:'two notches',wrapping:'linen cord'},records:[
  {label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'},
  {label:'Roof measurements',mark:'one notch',wrapping:'linen cord'},
  {label:'Street repairs',mark:'two notches',wrapping:'linen cord'},
 ]}
 return context.locale==='zh'?{title:'修好的小桥',fragment:`「${context.previous.label}」纸袋里保存着一张维修便条。便条记着：洪水过后，邻居们换掉了河边小桥上的三块旧木板，恢复了通向工坊的道路。`}:{title:'The repaired footbridge',fragment:`The packet labelled “${context.previous.label}” holds a repair note. After the flood, neighbours replaced three boards on the footbridge, restoring the path to the workshops.`}
}):plugin)
// Vite treats port 0 as its default. Ask the OS for an unused port instead so a
// prior local run's browser cache is not mistaken for this isolated database.
const probe=createPortProbe()
await new Promise<void>(resolve=>probe.listen(0,'127.0.0.1',resolve))
const port=(probe.address() as {port:number}).port
await new Promise<void>((resolve,reject)=>probe.close(error=>error?reject(error):resolve()))
const server=await createServer({...config,configFile:false,mode:'oldstreet-dev',server:{host:'127.0.0.1',port,strictPort:true}})
await server.listen()
console.log('Synthetic campaign map playtest: '+server.resolvedUrls?.local[0]+'?debug=1 — no remote model/media; isolated local database')
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void server.close().then(()=>process.exit(0))})
