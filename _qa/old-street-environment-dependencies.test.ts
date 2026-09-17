import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetEnvironmentKeys} from '../src/old-street-environment-dependencies'
test('initial street does not wait for indoor environments and shared layers are reused',()=>{
 const street=oldStreetEnvironmentKeys('street',true,true),shed=oldStreetEnvironmentKeys('shed',true,true),cellar=oldStreetEnvironmentKeys('cellar',true,true)
 for(const key of ['entranceShopClock','entranceShopPhoto','entranceShortPassage','entranceHome','debris','streetGround','streetEdges'])assert.ok(street.includes(key),`missing visible street layer: ${key}`)
 assert.ok(!street.includes('entranceSide'),'rejected side composition is not preloaded')
 // The recovery plank in the shed uses the shared wood sheet, also consumed
 // by the roof crossing; it is deliberately not loaded on the initial street.
 assert.deepEqual(shed.filter(k=>!street.includes(k)),['shedWall','shedFloor','wood'])
 assert.deepEqual(cellar.filter(k=>!shed.includes(k)),['cellarFloor'])
 assert.ok(!street.includes('shopComposite'));assert.ok(!street.includes('photoFloor'))
})
test('alternate presentation and darkroom keep their actual required surfaces',()=>{
 assert.ok(oldStreetEnvironmentKeys('shop',true,true).includes('shopComposite'))
 assert.ok(!oldStreetEnvironmentKeys('shop',true,true).includes('wood'))
 assert.ok(oldStreetEnvironmentKeys('shop',true,false).includes('wood'))
 assert.ok(oldStreetEnvironmentKeys('laundry',false,false).includes('laundry'))
 assert.ok(oldStreetEnvironmentKeys('darkroom',false,false).includes('photoFloor'))
 assert.throws(()=>oldStreetEnvironmentKeys('missing',true,true),/ROOM_UNKNOWN/)
})
