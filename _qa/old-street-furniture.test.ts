import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {oldStreetWalkable,oldStreetSpatialPlan} from '../src/old-street-space'
import {assertOldStreetHead} from '../src/old-street-head'
test('legacy floor position under new bench recovers nearby without rewriting story',()=>{
 const runtime=oldStreetRuntime(()=>true),head=runtime.initial('zh','furniture-test-journey')
 head.mapVersion='oldstreet-blockout-2';head.sceneId='shed';head.position={x:248,y:360}
 head.save.map.forEach(m=>m.current=m.id==='shed');head.save.location='河边工作棚'
 const before=structuredClone(head.save)
 assertOldStreetHead(head)
 const recovered=runtime.upgrade(head)
 assert.equal(recovered.mapVersion,oldStreetSpatialPlan().mapVersion)
 assert.ok(oldStreetWalkable('shed',recovered.position,recovered.save))
 assert.ok(Math.hypot(recovered.position.x-248,recovered.position.y-360)<=64)
 assert.deepEqual(recovered.save,before)
 assert.equal(recovered.version,head.version)
 assertOldStreetHead(recovered)
 assert.equal(oldStreetWalkable('shed',{x:248,y:360},recovered.save),false)
})
