import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge,oldStreetRooms} from '../src/old-street-cartridge'
import {oldStreetKnownMap,oldStreetKnownRoute} from '../src/old-street-map'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
test('map reveals neither future places nor routes through unseen shortcuts',()=>{
 const s=createInitialSave(oldStreetCartridge('zh'))
 assert.deepEqual(oldStreetKnownMap(s).rooms.map(r=>r.id),['street'])
 assert.equal(oldStreetKnownMap(s).connections.length,0)
 assert.equal(oldStreetKnownRoute(s,'street','shed'),null)
 for(const id of ['shop','yard','laundry'])s.map.find(n=>n.id===id)!.visited=true
 assert.deepEqual(oldStreetKnownRoute(s,'shop','laundry'),['shop','yard','laundry'])
 assert.equal(oldStreetKnownMap(s).rooms.some(r=>r.id==='shed'),false)
 assert.equal(oldStreetKnownRoute(s,'laundry','shed'),null)
})
test('route advice respects blockers, unlocks and persisted visits without writing save',()=>{
 const s=createInitialSave(oldStreetCartridge('en'))
 for(const n of s.map)n.visited=true
 const frozen=JSON.stringify(s)
 assert.deepEqual(oldStreetKnownRoute(s,'yard','shed'),['yard','street','photo','roof','shed'])
 assert.equal(JSON.stringify(s),frozen)
 s.facts['crates-cleared']=true
 assert.deepEqual(oldStreetKnownRoute(s,'yard','shed'),['yard','cellar','shed'])
 s.facts['yard-unlatched']=true
 assert.deepEqual(oldStreetKnownRoute(JSON.parse(JSON.stringify(s)),'yard','shed'),['yard','shed'])
 assert.equal(oldStreetKnownMap(s).rooms.length,Object.keys(oldStreetRooms).length)
})
