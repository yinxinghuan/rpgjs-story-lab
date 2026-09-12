import test from 'node:test'
import assert from 'node:assert/strict'
import {replaceActorFrame} from '../src/sprite-composition'
const sheet=()=>({width:12,height:20,rgba:Uint8ClampedArray.from({length:12*20*4},(_,i)=>i%251)})
const frame=()=>({width:4,height:5,rgba:new Uint8ClampedArray(4*5*4).fill(187)})
test('all twelve cell selections replace exactly one frame and preserve both source inputs',()=>{
 for(let row=0;row<4;row++)for(let column=0;column<3;column++){
  const original=sheet(),replacement=frame(),before=original.rgba.slice(),frameBefore=replacement.rgba.slice()
  const result=replaceActorFrame(original,replacement,row,column)
  for(let y=0;y<20;y++)for(let x=0;x<12;x++){
   const target=x>=column*4&&x<(column+1)*4&&y>=row*5&&y<(row+1)*5
   for(let channel=0;channel<4;channel++){const offset=(y*12+x)*4+channel;assert.equal(result.rgba[offset],target?187:before[offset])}
  }
  assert.deepEqual(original.rgba,before);assert.deepEqual(replacement.rgba,frameBefore)
 }
})
test('replacement never rescales an incompatible frame or accepts a partial raster',()=>{
 assert.throws(()=>replaceActorFrame(sheet(),{...frame(),width:5,rgba:new Uint8ClampedArray(100)},0,0),/SIZE_MISMATCH/)
 assert.throws(()=>replaceActorFrame({...sheet(),rgba:new Uint8ClampedArray(4)},frame(),0,0),/GRID/)
 for(const row of [-1,4,0.5,NaN])assert.throws(()=>replaceActorFrame(sheet(),frame(),row,0),/SELECTION/)
 for(const column of [-1,3,0.5,NaN])assert.throws(()=>replaceActorFrame(sheet(),frame(),0,column),/SELECTION/)
})
