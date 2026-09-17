import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import catalog from '../src/material-library/door-catalog.json'
import {getDoorMaterial} from '../src/material-library/door-materials'
test('rejected projection remains traceable and cannot enter the admitted door library',()=>{
 const m=catalog.materials[0],bytes=readFileSync(new URL(m.source,new URL('../src/material-library/door-catalog.json',import.meta.url)))
 assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256)
 assert.equal(bytes.readUInt32BE(16),m.image.width);assert.equal(bytes.readUInt32BE(20),m.image.height)
 assert.equal(catalog.contract.includesWall,false);assert.equal(m.includesWall,false)
 for(const state of Object.values(m.states)){assert.ok((state.column+1)*m.cell.width<=m.image.width);assert.ok((state.row+1)*m.cell.height<=m.image.height)}
 assert.notEqual(m.states.open.column,m.states.closed.column)
 assert.ok(m.foot.x<m.cell.width&&m.foot.y<m.cell.height)
 assert.equal(m.status,'rejected-projection')
 assert.throws(()=>getDoorMaterial('door-wood-olive-simple-01','N'),/NOT_ADMITTED/)
 assert.throws(()=>getDoorMaterial('door-wood-olive-simple-01','E'),/NOT_ADMITTED/)
})

test('preferred platform door assets retain source identity, frames and orientation boundaries',async()=>{
 const {getPreferredDoorMaterial}=await import('../src/material-library/door-materials')
 for(const pose of ['inset-oblique','open-90'] as const){
  const m=getPreferredDoorMaterial(pose,'N'),bytes=readFileSync(new URL(m.source,new URL('../src/material-library/door-catalog.json',import.meta.url)))
  assert.equal(m.provider,'alteru-media');assert.match(m.taskId!,/^mt_/)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256)
  assert.equal(bytes.readUInt32BE(16),m.cell.width*2);assert.equal(bytes.readUInt32BE(20),m.cell.height)
  assert.equal(m.states.closed.column,0);assert.equal(m.states.open.column,1)
  assert.equal(getPreferredDoorMaterial(pose,'S').id,m.id)
  assert.throws(()=>getPreferredDoorMaterial(pose,'W'),/ORIENTATION_NOT_SUPPORTED/)
  assert.ok(catalog.materials.some(r=>r.id===m.referenceMaterialId&&r.provider==='codex-imagegen'&&r.status==='admitted-local'))
 }
})

test('rejected side composition stays excluded while the home atlas remains intact',()=>{
 for(const id of ['door-wood-side-sliding-platform-01','door-home-teal-platform-01'] as const){
  const m=catalog.materials.find(m=>m.id===id)!,bytes=readFileSync(new URL(m.source,new URL('../src/material-library/door-catalog.json',import.meta.url)))
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256)
  assert.equal(bytes.readUInt32BE(16),768);assert.equal(bytes.readUInt32BE(20),512)
  assert.equal(bytes[25],6,'prepared atlas retains real alpha')
 }
 assert.throws(()=>getDoorMaterial('door-wood-side-sliding-platform-01','W'),/NOT_ADMITTED/)
 assert.equal(getDoorMaterial('door-home-teal-platform-01','S').status,'admitted-local')
 assert.throws(()=>getDoorMaterial('door-home-teal-platform-01','E'),/ORIENTATION_NOT_SUPPORTED/)
})
