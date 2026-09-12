import {createServer} from 'node:http'
import {readFileSync,statSync,mkdtempSync} from 'node:fs'
import {resolve,join,extname,relative} from 'node:path'
import {PreflightStorage} from '../server/preflight-storage'
import {GAME_ID} from '../src/game-id'
const dir=resolve(process.argv[2]??'dist'),port=Number(process.argv[3]??5349)
// Optional retained-image response for isolated creator contract QA. No remote
// media request is made; all other production behavior uses the compiled Worker.
const retainedBackground=process.argv.includes('--retained-background-fixture')?async()=>new Uint8Array(readFileSync('doc/platform-art-candidates/20260911/environment-edit-02/candidate.png')):undefined
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('QA_PORT')
// Exact compiled Worker, fresh disposable SQL, no cookies or external requests.
globalThis.fetch=async()=>{throw Error('QA_EXTERNAL_NETWORK_DISABLED')}
const worker=await import('data:text/javascript;base64,'+readFileSync('worker/index.js').toString('base64'))
const storage=new PreflightStorage(mkdtempSync('/private/tmp/original-production-')),objects=new Map<string,any>()
const env={CARRIAGE_JOURNEYS:{idFromName:(id:string)=>id,get:(key:unknown)=>({fetch:(request:Request)=>{const id=String(key);let object=objects.get(id);if(!object){object=new worker.CarriageJourneyAuthority(storage.context(id),env,undefined,undefined,undefined,undefined,undefined,retainedBackground);objects.set(id,object)}return object.fetch(request)}})}}
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.tmx':'application/xml','.tsx':'application/xml','.svg':'image/svg+xml','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'}
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url??'/','http://127.0.0.1:'+port)
 if(url.pathname.startsWith('/'+GAME_ID+'/api/')){
  url.pathname=url.pathname.slice(GAME_ID.length+1);let size=0;const chunks:Buffer[]=[];for await(const part of req){size+=part.length;if(size>70000)throw Error('QA_BODY_LIMIT');chunks.push(Buffer.from(part))}
  const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const r=await worker.handleApi(new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method!)?undefined:Buffer.concat(chunks)}),env)
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return
 }
 const path=resolve(dir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname))
 if(relative(dir,path).startsWith('..')||!statSync(path).isFile())throw Error('QA_NOT_FOUND')
 res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(path))
}catch{res.writeHead(404);res.end('Not found')}})
server.listen(port,'127.0.0.1',()=>console.log('Compiled production frontend and Worker at http://127.0.0.1:'+port))
process.on('SIGINT',()=>server.close(()=>{storage.close();process.exit(0)}))
