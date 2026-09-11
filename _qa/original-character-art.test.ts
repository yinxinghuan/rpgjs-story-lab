import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {adaStandingResource,originalStandingArt,originalStandingSheet,originalCharacterArtSlots,originalCharacterArtAnimation} from '../src/original-character-art'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('standing admission contains only the checked source frame, with true alpha and immutable source',()=>{
 const source=readFileSync('doc/platform-art-candidates/20260911/actor-edit-03/candidate.png'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
 assert.equal(hash(source),'43ba101c2bc5903ae6df9efef0067c1a753c44df2079285a74e7d3a3fb6144dd')
 const raw=PNG.sync.read(source),rgba=new Uint8ClampedArray(raw.data)
 const result=prepareSpritePixels({width:960,height:1280,rgba},{columns:3,rows:4,cellWidth:320,cellHeight:320,foot:originalStandingArt.foot,kind:'actor',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20})
 assert.deepEqual(rgba,new Uint8ClampedArray(raw.data))
 const bytes=readFileSync('public/'+adaStandingResource.path.slice(2)),output=PNG.sync.read(bytes)
 assert.equal(hash(bytes),adaStandingResource.sha256);assert.equal(bytes.length,adaStandingResource.bytes)
 assert.equal(output.width,320);assert.equal(output.height,320)
 for(let y=0;y<320;y++)assert.deepEqual(new Uint8Array(output.data.subarray(y*1280,(y+1)*1280)),new Uint8Array(result.raster.rgba.subarray((y*960+320)*4,(y*960+640)*4)))
 assert.equal(output.data[3],0);assert.ok(output.data.some((v:number,i:number)=>i%4===3&&v===255))
 assert.deepEqual(Object.keys(originalStandingSheet('checked.png').textures),['stand','hidden'])
})
test('physical art follows the same present character and foot depth as collision, without introducing cast',()=>{
 const head=originalTrainRuntime(()=>true).initial('zh',randomUUID()),before=JSON.stringify(head)
 const slot=originalCharacterArtSlots(head.sceneId)[0],body=originalCharacterBodies(head)[0]
 assert.equal(slot.characterId,body.id);assert.equal(slot.x,body.x+4.5);assert.equal(slot.y+1,body.y+15)
 assert.equal(originalCharacterArtAnimation(head.save,slot.characterId),'stand')
 assert.equal(originalCharacterArtAnimation(head.save,'ren-medic'),'hidden')
 assert.equal(JSON.stringify(head),before)
 for(const room of originalTrainChapterSpatialPlan().scenes)assert.equal(originalCharacterArtSlots(room.id).length,1)
 head.save.characters[0].status='departed'
 assert.equal(originalCharacterArtAnimation(head.save,slot.characterId),'hidden');assert.equal(originalCharacterBodies(head).length,0)
 head.save.characters=[]
 assert.equal(originalCharacterArtAnimation(head.save,slot.characterId),'hidden')
})
