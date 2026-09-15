import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import catalog from '../src/material-library/catalog.json'
import {getMaterial,reusableMaterials} from '../src/material-library'

test('material inventory resolves retained source files and measured dimensions',()=>{
 const ids=new Set<string>()
 for(const m of catalog.materials){
  assert.ok(!ids.has(m.id));ids.add(m.id)
  const bytes=readFileSync(new URL(m.source,new URL('../src/material-library/catalog.json',import.meta.url)))
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256)
  assert.equal(bytes.readUInt32BE(16),m.image.width)
  assert.equal(bytes.readUInt32BE(20),m.image.height)
 }
})
test('rejected art cannot be selected even by a candidate experiment',()=>{
 for(const m of catalog.materials.filter(m=>m.status==='rejected')){
  assert.throws(()=>getMaterial(m.id,{allowCandidate:true}),/MATERIAL_NOT_ADMITTED/)
 }
 assert.throws(()=>getMaterial('wood-narrow-01'),/MATERIAL_NOT_ADMITTED/)
 assert.equal(getMaterial('wood-narrow-01',{allowCandidate:true}).status,'candidate')
 assert.ok(reusableMaterials().every(m=>m.status==='approved'))
 assert.throws(()=>getMaterial('missing'),/MATERIAL_NOT_FOUND/)
})
