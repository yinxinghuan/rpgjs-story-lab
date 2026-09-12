import {createServer} from 'node:http'
import {readFileSync} from 'node:fs'
const files={
 '/candidate-alpha.png':['image/png',new URL('../doc/platform-art-candidates/20260913/hero-leg-layer-08/candidate-alpha.png',import.meta.url)],
 '/hero.png':['image/png',new URL('../public/art/overhead/hero-gait-v2.png',import.meta.url)],
 '/':['text/html; charset=utf-8',new URL('./leg-layer-review.html',import.meta.url)],
 '/candidate.png':['image/png',new URL('../doc/platform-art-candidates/20260913/hero-leg-layer-08/candidate.png',import.meta.url)],
}
const port=Number(process.argv[2]??5400)
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('QA_PORT')
const server=createServer((req,res)=>{
 const file=files[new URL(req.url,'http://127.0.0.1').pathname]
 if(req.method!=='GET'||!file){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':file[0],'Cache-Control':'no-store'});res.end(readFileSync(file[1]))
})
server.listen(port,'127.0.0.1',()=>console.log('Read-only leg-layer comparison at http://127.0.0.1:'+port))
process.on('SIGINT',()=>server.close(()=>process.exit(0)))
