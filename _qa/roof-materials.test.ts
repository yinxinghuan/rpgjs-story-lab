import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import catalog from '../src/material-library/roof-catalog.json'
import {getRoofMaterial,roofMaterialSampling,type RoofMaterialId} from '../src/material-library/roof-materials'
import {oldStreetRoofSections} from '../src/old-street-roof-materials'
import {oldStreetEnvironmentKeys} from '../src/old-street-environment-dependencies'
test('roof inventory retains source identity, in-bounds crops and a common effective pixel density',()=>{
 assert.equal(new Set(catalog.materials.map(m=>m.id)).size,4)
 for(const m of catalog.materials){const bytes=readFileSync(new URL(m.source,new URL('../src/material-library/roof-catalog.json',import.meta.url))),sample=roofMaterialSampling(m.id as RoofMaterialId)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256)
  assert.equal(bytes.readUInt32BE(16),m.image.width);assert.equal(bytes.readUInt32BE(20),m.image.height)
  assert.ok(m.crop.x>=0&&m.crop.y>=0&&m.crop.x+m.crop.width<=m.image.width&&m.crop.y+m.crop.height<=m.image.height)
  assert.equal(sample.width/sample.worldWidth,2);assert.ok(Math.abs(sample.height/sample.worldHeight-2)<.02)
  assert.throws(()=>getRoofMaterial(m.id as RoofMaterialId),/NOT_ADMITTED/)
 }
})
test('front/back of watch shop share material; courtyard buildings differ and all images preload',()=>{
 const yard=oldStreetRoofSections('yard','W',48,480),street=oldStreetRoofSections('street','W',32,512)
 assert.equal(yard[1].material,street[0].material);assert.notEqual(yard[0].material,yard[1].material)
 assert.equal(yard[0].y+yard[0].height,yard[1].y);assert.equal(yard[1].y+yard[1].height,528)
 assert.equal(oldStreetRoofSections('yard','E',48,480)[0].material,'roof-asphalt-grey-01')
 assert.ok(oldStreetEnvironmentKeys('yard',true,true).includes('roofVariants'));assert.ok(!oldStreetEnvironmentKeys('street',true,true).includes('roofVariants'))
})
