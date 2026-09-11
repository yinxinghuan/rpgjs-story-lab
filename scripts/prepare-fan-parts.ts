import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!=='8fdd576bd4bc1982436e99a93c04ef1e545ec890d046a75cb5a99e05304dc16a')throw Error('FAN_SOURCE_CHANGED')
const input=PNG.sync.read(source)
for(const [name,column,anchor,foot]of [['housing',0,{x:160,y:486},{x:160,y:544}],['rotor',1,{x:153,y:340},{x:160,y:320}]]as const){
 const rgba=new Uint8ClampedArray(320*640*4)
 for(let y=0;y<640;y++)rgba.set(input.data.subarray((y*640+column*320)*4,(y*640+column*320+320)*4),y*320*4)
 // The reviewed rotor has a real hub aperture. Flood only its near-white
 // interior background, seeded at the shaft center; never flood metal/blades.
 let apertureRemoved=0
 if(name==='rotor'){
  const stack=[340*320+153],seen=new Set<number>()
  while(stack.length){const p=stack.pop()!;if(seen.has(p))continue;seen.add(p);const x=p%320,y=Math.floor(p/320),i=p*4;if(x<134||x>173||y<316||y>365)continue;const rgb=[rgba[i],rgba[i+1],rgba[i+2]];if(Math.min(...rgb)<200||Math.max(...rgb)-Math.min(...rgb)>20)continue;rgba.fill(0,i,i+4);apertureRemoved++;stack.push(p-1,p+1,p-320,p+320)}
  if(apertureRemoved<400||apertureRemoved>1500)throw Error('FAN_APERTURE_CHANGED')
 }
 const spec={columns:1,rows:1,cellWidth:320,cellHeight:640,foot,kind:'states' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20,sourceAnchors:[anchor]}
 const prepared=prepareSpritePixels({width:320,height:640,rgba},spec),bytes=PNG.sync.write({width:320,height:640,data:Buffer.from(prepared.raster.rgba)}),path=`public/art/fan-${name}-v1.png`
 if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('FAN_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
 console.log(JSON.stringify({name,path,sha256:hash(bytes),bytes:bytes.length,spec,frame:prepared.frames[0],apertureRemoved,sourceRetained:true}))
}
