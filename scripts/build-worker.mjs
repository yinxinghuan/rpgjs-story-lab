import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
// The frozen cartridge includes Vite-only cover/audio URL initializers. The
// authority never renders these fields; keep all narrative/rules unchanged and
// omit only those five presentation URLs from the Worker compilation.
const mediaNames=['coverImage','entryImage','audioThemeUrl','audioAmbienceUrl','audioFeatureUrl']
await build({entryPoints:['worker/source.ts'],outfile:'worker/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',legalComments:'inline',sourcemap:false,plugins:[{
 name:'authority-cartridge-without-browser-media',setup(b){b.onLoad({filter:/[/\\]vendor[/\\]original-train[/\\]cartridges[/\\]lastTrainToDawn\.ts$/},async({path})=>{
  let contents=await readFile(path,'utf8')
  for(const name of mediaNames){const expression=new RegExp(`const ${name} = new URL\\('[^']+', import\\.meta\\.url\\)\\.href`);if(!expression.test(contents))throw Error('WORKER_CARTRIDGE_MEDIA_CONTRACT_CHANGED:'+name);contents=contents.replace(expression,`const ${name} = ''`)}
  return {contents,loader:'ts'}
 })}
}]})
// An opaque module URL reproduces the non-filesystem Worker startup boundary.
// Loading Node source files alone misses invalid import.meta-relative URLs.
const bundled=await readFile('worker/index.js','utf8')
const worker=await import('data:text/javascript;base64,'+Buffer.from(bundled).toString('base64'))
const health=await worker.handleApi(new Request('https://authority.invalid/api/creator/health'),{})
if(health.status!==200)throw Error('WORKER_STARTUP_HEALTH_FAILED')
console.log('Worker opaque-module startup and creator health passed')
