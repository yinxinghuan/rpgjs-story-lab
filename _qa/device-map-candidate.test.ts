import test from 'node:test'
import assert from 'node:assert/strict'
import {inspectDeviceMapCandidate,deviceCandidateSheet,deviceCandidateBlocks,deviceCandidatePlacement,DEVICE_STATES} from '../src/device-map-candidate'
import {inspectSpritePng,newSpriteSource,type SpriteDraft} from '../src/sprite-draft'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {originalTrainRoom,originalTrainPlanWalkable} from '../src/original-train-spatial-plan'
import {findGridPath} from '../src/grid-path'
async function fixture(){
 const w=240,h=128,bytes=new Uint8Array(45);bytes.set([137,80,78,71,13,10,26,10]);const v=new DataView(bytes.buffer);v.setUint32(8,13);bytes.set([73,72,68,82],12);v.setUint32(16,w);v.setUint32(20,h)
 const png=await inspectSpritePng(bytes),rgba=new Uint8ClampedArray(w*h*4)
 for(let y=30;y<=110;y++)for(let x=0;x<w;x++){const col=Math.floor(x/80),lx=x%80;if(lx>=24&&lx<56||col>0&&lx>=10&&lx<24&&y>55)rgba.set(col===0?[180,110,60,255]:col===1?[60,160,100,255]:[70,100,200,255],(y*w+x)*4)}
 const spec={columns:3,rows:1,cellWidth:80,cellHeight:128,foot:{x:40,y:110},kind:'states' as const,backgroundMode:'alpha' as const,neutralMin:200,chromaMax:20,sourceAnchors:Array.from({length:3},()=>({x:40,y:110}))}
 const result=prepareSpritePixels({width:w,height:h,rgba},spec),draft:SpriteDraft={...newSpriteSource(png,'synthetic-device','states'),state:'candidate',spec,result:{png,frames:result.frames,metrics:result.metrics,algorithm:result.algorithm}}
 return {draft,pixels:result.raster}
}
test('device states retain one whole-sheet scale, ground anchor and stable graphic identity',async()=>{
 const {draft,pixels}=await fixture(),c=await inspectDeviceMapCandidate(draft,draft.id,async()=>pixels),sheet=deviceCandidateSheet(c,'blob:synthetic')
 assert.equal(c.scale,50/80);assert.equal(c.bounds.length,3);assert.deepEqual(c.foot,{x:40,y:110});assert.equal(sheet.id,c.id)
 for(const [i,state] of DEVICE_STATES.entries()){
  const frame=(sheet.textures as any)[state].animations()[0][0]
  assert.deepEqual(frame.anchor,[.5,110/128]);assert.deepEqual(frame.scale,[c.scale,c.scale]);assert.equal(frame.frameX,i);assert.equal(frame.y,1)
 }
 assert.ok(c.footprint.width>=38,'door swing reserves width even when closed')
})
test('wrong category, stale identity, corrupt bytes and shifted state anchors cannot enter a map',async()=>{
 const {draft,pixels}=await fixture(),reject=(d:SpriteDraft,id=d.id)=>assert.rejects(inspectDeviceMapCandidate(d,id,async()=>pixels))
 await reject(draft,'another-id');await reject({...draft,state:'processing'});await reject({...draft,spec:{...draft.spec!,kind:'actor'}})
 const moved=structuredClone(draft);moved.result!.frames[1].offset.x++;await reject(moved)
 const missing=structuredClone(draft);missing.result!.frames.pop();await reject(missing)
 const bad=structuredClone(draft);bad.result!.png.sha256='0'.repeat(64);await reject(bad)
})
test('opaque matte, empty states, clipped cells and unsupported footprints are rejected',async()=>{
 const {draft,pixels}=await fixture(),reject=(p:typeof pixels)=>assert.rejects(inspectDeviceMapCandidate(draft,draft.id,async()=>p))
 const opaque=structuredClone(pixels);for(let i=3;i<opaque.rgba.length;i+=4)opaque.rgba[i]=255;await reject(opaque)
 const empty=structuredClone(pixels);for(let y=0;y<128;y++)empty.rgba.fill(0,(y*240+80)*4,(y*240+160)*4);await reject(empty)
 const edge=structuredClone(pixels);edge.rgba[(60*240)*4+3]=255;await reject(edge)
 const floating=structuredClone(pixels);for(let y=107;y<111;y++)floating.rgba.fill(0,y*240*4,(y+1)*240*4);await reject(floating)
 const wide=structuredClone(pixels);for(let col=0;col<3;col++){for(let y=30;y<106;y++)wide.rgba.fill(0,(y*240+col*80)*4,(y*240+(col+1)*80)*4)}await reject(wide)
})
test('both admitted maps allow front/back approach, reserve every state footprint and reject a path through it',async()=>{
 const {draft,pixels}=await fixture(),c=await inspectDeviceMapCandidate(draft,draft.id,async()=>pixels)
 for(const scene of [originalTrainRoom('dead-station'),originalTrainRoom('river-valley')]){
  const a=deviceCandidatePlacement(scene),walkable=(p:{x:number;y:number})=>originalTrainPlanWalkable(scene,p)&&!deviceCandidateBlocks(c,scene,p)
  const front={x:a.x-4.5,y:a.y+2},back={x:a.x-4.5,y:a.y-c.footprint.depth-20},inside={x:a.x-4.5,y:a.y-12}
  assert.equal(walkable(front),true);assert.equal(walkable(back),true);assert.equal(walkable(inside),false)
  assert.ok(findGridPath({x:192,y:430},front,walkable).length);assert.ok(findGridPath(front,back,walkable).length)
  assert.equal(findGridPath(front,inside,walkable).length,0)
 }
 assert.throws(()=>deviceCandidatePlacement('unknown-room'),/DEVICE_MAP_SCENE_UNAVAILABLE/)
})
