import {originalGameEntities} from '../src/original-game-projection'
import {originalEquipmentBodies} from '../src/original-equipment-art'
import test from 'node:test'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalCompanionContext} from '../src/original-companion-context'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalWorldWalkable} from '../src/original-world-space'
const fixture=()=>{
 const h=originalTrainRuntime(()=>true).initial('zh','12345678-1234-1234-1234-123456789012')
 h.save.partyMemberIds=['ada-mechanic'];h.save.characters.find(c=>c.id==='ada-mechanic')!.status='companion'
 return h
}
test('moving actor body and interaction entity use the same foot-center transform in this scene only',()=>{
 const h=fixture(),before=structuredClone(h),poses={'ada-mechanic':{x:220,y:430}},context=originalCompanionContext(h,poses)
 const body=originalCharacterBodies(context).find(b=>b.id==='ada-mechanic')!
 assert.equal(body.x,220);assert.equal(body.y,430)
 const base=originalBoundWorldPlan(h.assets),moved=originalBoundWorldPlan(h.assets,context.companionPositions,h.sceneId)
 const actor=base.characters.find(c=>c.id==='ada-mechanic')!
 for(const e of moved.entities){
  const old=base.entities.find(b=>b.id===e.id)!
  if(e.scene===h.sceneId&&actor.entities.includes(e.id))assert.deepEqual(e.position,{x:224.5,y:445})
  else assert.deepEqual(e,old)
 }
 assert.equal(originalWorldWalkable(context,{x:220,y:430}),false)
 assert.deepEqual(h,before);poses['ada-mechanic'].x=0;assert.equal(context.companionPositions!['ada-mechanic'].x,220)
})
test('legacy positioning remains unchanged when no snapshot is supplied',()=>{
 const h=fixture();assert.equal(originalCompanionContext(h,undefined),h)
 assert.deepEqual(originalCharacterBodies(h),originalCharacterBodies(originalCompanionContext(h,{})))
})
test('a position snapshot cannot introduce a future character, recruit someone or move a device',()=>{
 const h=fixture()
 for(const id of ['ren-medic','starter','unknown'])assert.throws(()=>originalCompanionContext(h,{[id]:{x:220,y:430}}),/COMPANION_NOT_FOLLOWING/)
 h.save.partyMemberIds=[];assert.throws(()=>originalCompanionContext(h,{'ada-mechanic':{x:220,y:430}}),/COMPANION_NOT_FOLLOWING/)
})
test('malformed positions and occupied ground are rejected rather than corrected silently',()=>{
 const h=fixture()
 for(const value of [null,[],{'ada-mechanic':{x:Infinity,y:430}},{'ada-mechanic':{x:220,y:430,scene:'elsewhere'}},{'ada-mechanic':{x:-100,y:-100}}])assert.throws(()=>originalCompanionContext(h,value),/INVALID_COMPANION_POSITION/)
})
test('conversation approach moves to a free side when another follower occupies the usual spot',()=>{
 const h=fixture(),poses={'ada-mechanic':{x:220,y:430},'mara-raider':{x:220,y:450}},world=originalBoundWorldPlan(h.assets,poses,h.sceneId),actor=world.characters.find(c=>c.id==='ada-mechanic')!,e=world.entities.find(e=>e.scene===h.sceneId&&actor.entities.includes(e.id))!,other=poses['mara-raider']
 assert.notDeepEqual(e.approach,{x:220,y:458})
 assert.equal(e.approach.x+9>other.x&&e.approach.x<other.x+9&&e.approach.y+15>other.y&&e.approach.y<other.y+15,false)
})

test('a follower beside the starter offers an approach outside the equipment footprint',()=>{
 const h=fixture(),context=originalCompanionContext(h,{'ada-mechanic':{x:242,y:100}})
 const blocked={x:242,y:128}
 assert.ok(originalEquipmentBodies(h.sceneId,h.assets).some(b=>blocked.x+9>b.x&&blocked.x<b.x+b.w&&blocked.y+15>b.y&&blocked.y<b.y+b.h))
 const entity=originalGameEntities(context).find(e=>e.id.endsWith('-ada-mechanic'))!
 assert.notDeepEqual(entity.approach,blocked)
 assert.ok(originalWorldWalkable(context,entity.approach))
})
