import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetRecordBookPose,oldStreetRecordBookSheets} from '../src/old-street-record-book'
import {oldStreetPropState} from '../src/old-street-prop-state'

test('possession or consent alone never publishes a record; withdrawal removes only that entry',()=>{
 const facts:Record<string,boolean>={'photos-returned':true,'photo-consent':true,'clock-recorded':true}
 assert.equal(oldStreetRecordBookPose({facts}),'stand')
 facts['photo-recorded']=true
 assert.equal(oldStreetRecordBookPose({facts}),'photo')
 assert.equal(oldStreetPropState('record-book',{facts})?.[1],'Record book · photograph')
 facts['clock-consent']=true
 assert.equal(oldStreetRecordBookPose({facts}),'both')
 facts['photo-recorded']=false
 assert.equal(oldStreetRecordBookPose({facts}),'clock')
 facts['clock-recorded']=false
 assert.equal(oldStreetRecordBookPose({facts}),'stand')
})

test('all states keep the same book body and explicitly restore each illustration opacity',()=>{
 const [base,photo,clock]=oldStreetRecordBookSheets('book','photo','clock')
 const frame=(sheet:typeof photo,state:string)=>sheet.textures[state].animations()[0][0]
 for(const state of ['stand','photo','clock','both']){
  assert.deepEqual(base.textures[state].animations(),base.textures.stand.animations())
  assert.equal(frame(photo,state).opacity,Number(state==='photo'||state==='both'))
  assert.equal(frame(clock,state).opacity,Number(state==='clock'||state==='both'))
 }
 // Paper bounds measured from the admitted source, in the book event's units.
 for(const [sheet,minX,maxX] of [[photo,2.875,14.625],[clock,17.625,29.125]] as const){
  const f=frame(sheet,'both'),width=sheet.width*f.scale[0],height=sheet.height*f.scale[1]
  // Clock's transparent source margins extend beyond its small visible print.
  if(sheet===photo){assert.ok(f.x-width/2>=minX);assert.ok(f.x+width/2<=maxX)}
  assert.ok(f.y-height/2>=-7.75);assert.ok(f.y+height/2<=7.75)
 }
})
